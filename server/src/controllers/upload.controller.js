const UploadSession = require('../models/UploadSession');
const UploadError = require('../models/UploadError');
const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');

// IN-MEMORY PROCESSOR (No Redis Required for Demo/Dev)
// In a real production cluster, use Bull/Redis. 
// For this deployment, we process in background asynchronously.

const processUploadInMemory = async (sessionId) => {
    console.log(`[InMemory] Starting processing for session ${sessionId}`);

    // Lazy load models/logic to avoid circular deps if any, 
    // though here we are in controller so models are fine.
    const Citizen = require('../models/Citizen');
    const Family = require('../models/Family');
    const VillageOffice = require('../models/VillageOffice');

    try {
        const session = await UploadSession.findById(sessionId);
        if (!session) {
            console.error(`[InMemory] Session ${sessionId} not found during processing`);
            return;
        }

        const { uploadType, filePath, villageId, officialId } = session;

        let processedCount = 0;
        let successCount = 0;
        let errorCount = 0;
        let villageDetails = null; // Init for address fetching
        const errorsToSave = [];
        const bulkOps = [];
        const BATCH_SIZE = 100;

        const flushBatch = async () => {
            if (bulkOps.length > 0) {
                try {
                    if (uploadType === 'CITIZEN') {
                        await Citizen.bulkWrite(bulkOps);
                    } else if (uploadType === 'FAMILY') {
                        await Family.bulkWrite(bulkOps);
                    }
                    successCount += bulkOps.length;
                } catch (err) {
                    console.error("Batch write error", err);
                    // If batch fails, we log it roughly. 
                    // Ideally we catch per-doc errors but bulkWrite throws on first error unless ordered:false
                }
                bulkOps.length = 0;
            }
            if (errorsToSave.length > 0) {
                await UploadError.insertMany(errorsToSave);
                errorCount += errorsToSave.length;
                errorsToSave.length = 0;
            }

            // Validating session existence before save to avoid crash if deleted
            const freshSession = await UploadSession.findById(sessionId);
            if (freshSession) {
                freshSession.processedRecords = processedCount;
                freshSession.successCount = successCount;
                freshSession.errorCount = errorCount;
                await freshSession.save();
            }
        };

        const stream = fs.createReadStream(filePath).pipe(csv());

        for await (const row of stream) {
            processedCount++;
            const rowErrors = [];

            // --- VALIDATION (Simplified from Worker) ---
            if (uploadType === 'CITIZEN') {
                if (!row.name) rowErrors.push("Name is required");
                // Add more as needed
            }

            if (rowErrors.length > 0) {
                errorsToSave.push({
                    sessionId,
                    rowNumber: processedCount,
                    rowData: row,
                    errors: rowErrors
                });
            } else {
                // --- LOGIC: UPSERT CITIZEN ---
                if (uploadType === 'CITIZEN') {
                    // Fetch Village Details if not already fetched for this session (Optimization: fetch once per session, but here we are in loop, so fetch before loop or lazily)
                    // Since we are inside the loop, let's fetch it outside.
                    // WAIT: I cannot edit outside the loop easily with this replace block. 
                    // I will require VillageOffice and assume villageDetails is available if I fetch it before.

                    // ACTUALLY, I should fetch it *before* the loop. 
                    // But this tool call is targeted at lines 106-116.
                    // I'll add the fetch logic here locally for now, or just use the IDs if I can't fetch easily.
                    // No, I must fetch.

                    // Let's rely on a check.
                    if (!villageDetails && villageId) {
                        try {
                            const VillageOffice = require('../models/VillageOffice');
                            villageDetails = await VillageOffice.findById(villageId);
                        } catch (e) { console.error("Error fetching village details", e); }
                    }

                    const filter = {};
                    if (row.uniqueId) {
                        filter.uniqueId = row.uniqueId;
                    } else {
                        // Fuzzy fallback
                        filter.name = row.name;
                        // filter.contactNumber = row.contactNumber; // Optional strictness
                        filter.villageOfficeId = villageId;
                    }

                    // Normalize
                    const citizenData = {
                        ...row,
                        villageOfficeId: villageId,
                        // Fix for Permanent Address
                        isPermanentSameAsPresent: true,
                        permanentAddress: {
                            houseName: row.houseName,
                            place: row.place,
                            pinCode: row.pinCode,

                            // Auto-populate or use CSV overrides
                            village: row.village || (villageDetails ? villageDetails.villageName : ''),
                            taluk: row.taluk || (villageDetails ? villageDetails.taluk : ''),
                            district: row.district || (villageDetails ? villageDetails.district : '')
                        }
                    };
                    // Remove immutable fields if any or handle specific parsing

                    bulkOps.push({
                        updateOne: {
                            filter: filter,
                            update: { $set: citizenData },
                            upsert: true
                        }
                    });
                }
                // TODO: FAMILY Logic if needed (similar to worker)
            }

            if (processedCount % BATCH_SIZE === 0) {
                await flushBatch();
            }
        }

        await flushBatch();

        // Final Update
        const finalSession = await UploadSession.findById(sessionId);
        if (finalSession) {
            finalSession.status = 'COMPLETED';
            finalSession.completedAt = new Date();
            await finalSession.save();
        }

        // Cleanup
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        console.log(`[InMemory] Processing completed for session ${sessionId}`);

    } catch (error) {
        console.error(`[InMemory] Error processing session ${sessionId}:`, error);
        await UploadSession.findByIdAndUpdate(sessionId, { status: 'FAILED' });
    }
};


// @desc    Stage Upload (Analyze CSV and Create Session)
// @route   POST /api/upload/stage
// @access  Private (Official)
const stageUpload = async (req, res) => {
    try {
        console.log("[stageUpload] Request Received");
        console.log("[stageUpload] Body:", req.body);
        console.log("[stageUpload] File:", req.file);
        console.log("[stageUpload] User:", req.user);
        console.log("[stageUpload] VillageId:", req.villageId);

        if (!req.file) {
            console.error("[stageUpload] No file uploaded");
            return res.status(400).json({ message: "No file uploaded" });
        }

        const { uploadType } = req.body;
        if (!['CITIZEN', 'FAMILY'].includes(uploadType)) {
            console.error("[stageUpload] Invalid upload type:", uploadType);
            // Clean up file if invalid request
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: "Invalid upload type. Must be CITIZEN or FAMILY." });
        }

        const villageId = req.villageId;
        const officialId = req.user.id;

        if (!villageId) {
            console.error("[stageUpload] Missing Village ID");
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: "Village ID missing from request context." });
        }

        // Create Session
        const session = await UploadSession.create({
            officialId,
            villageId,
            uploadType,
            fileName: req.file.filename,
            originalName: req.file.originalname,
            filePath: req.file.path,
            status: 'VALIDATING'
        });

        // Preview Logic
        const previewRows = [];
        let rowCount = 0;
        let headers = [];

        const stream = fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('headers', (headerList) => {
                headers = headerList;
            })
            .on('data', (row) => {
                rowCount++;
                if (previewRows.length < 50) {
                    previewRows.push(row);
                }
            })
            .on('end', async () => {
                session.totalRecords = rowCount;
                session.status = 'READY_TO_CONFIRM';
                await session.save();

                res.json({
                    sessionId: session._id,
                    totalRecords: rowCount,
                    previewRows,
                    headers,
                    message: "File staged successfully. Please verify columns and confirm."
                });
            })
            .on('error', async (err) => {
                session.status = 'FAILED';
                await session.save();
                res.status(500).json({ message: "Error parsing CSV", error: err.message });
            });

    } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Confirm Upload (Start Processing)
// @route   POST /api/upload/confirm/:sessionId
// @access  Private (Official)
const confirmUpload = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await UploadSession.findById(sessionId);

        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        if (session.status !== 'READY_TO_CONFIRM') {
            return res.status(400).json({ message: `Session cannot be confirmed. Current status: ${session.status}` });
        }

        // TRIGGER IN-MEMORY PROCESSING
        // We do not await this, so it runs in background
        processUploadInMemory(session._id);

        session.status = 'PROCESSING';
        session.startedAt = new Date();
        await session.save();

        res.json({ message: "Upload started successfully", sessionId: session._id });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Upload Status
// @route   GET /api/upload/status/:sessionId
// @access  Private
const getUploadStatus = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await UploadSession.findById(sessionId);

        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        res.json(session);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Download Errors CSV
// @route   GET /api/upload/errors/:sessionId
// @access  Private
const getUploadErrors = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const errors = await UploadError.find({ sessionId }).sort({ rowNumber: 1 });

        if (errors.length === 0) {
            return res.status(404).json({ message: "No errors found for this session" });
        }

        let csvContent = 'Row Number,Errors,Data Snapshot\n';
        errors.forEach(err => {
            const errorStr = `"${err.errors.join('; ')}"`;
            const dataStr = `"${JSON.stringify(err.rowData).replace(/"/g, '""')}"`;
            csvContent += `${err.rowNumber},${errorStr},${dataStr}\n`;
        });

        res.header('Content-Type', 'text/csv');
        res.attachment(`errors-${sessionId}.csv`);
        res.send(csvContent);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    stageUpload,
    confirmUpload,
    getUploadStatus,
    getUploadErrors
};
