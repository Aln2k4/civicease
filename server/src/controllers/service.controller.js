const ServiceRecord = require('../models/ServiceRecord');
const Citizen = require('../models/Citizen');
const { generateVerificationChecklist } = require('../utils/verificationEngine');

// @desc    Get all service records
// @route   GET /api/services
// @access  Private
// @desc    Get all service records
// @route   GET /api/services
// @access  Private
const getServices = async (req, res) => {
    try {
        const { status, search, serviceName } = req.query;
        const villageId = req.villageId;

        // STRICT JURISDICTION CHECK
        const isAdmin = req.user && (req.user.role === 'Admin' || req.user.role === 'admin');
        if (!villageId && !isAdmin) {
            return res.status(403).json({ message: "Jurisdiction context missing." });
        }

        // 1. Base Query with Village ID
        let serviceQuery = isAdmin ? {} : { villageId };

        // 2. Search Logic (if needed, populate or regex)
        if (search) {
            // For advanced search we might still need to look up citizens or aggregate
            // But for now, let's keep it simple or use the population match if supported.
            // Mongo doesn't easily regex on populated fields in a simple find() without aggregate.
            // Reverting to the logic of finding citizens first IF search is present, 
            // BUT strictly constraining those citizens to the village.

            // ... actually the previous logic did "Find Citizens in Village matching search", then "Find Services for those".
            // We can keep that for Search, but use direct villageId for general list.

            const Citizen = require('../models/Citizen');
            const searchRegex = new RegExp(search, 'i');

            const citizenSearchQuery = {
                $or: [{ name: searchRegex }, { ward: searchRegex }, { houseName: searchRegex }]
            };
            if (!isAdmin) {
                citizenSearchQuery.villageOfficeId = villageId;
            }

            const citizens = await Citizen.find(citizenSearchQuery).select('_id');

            const citizenIds = citizens.map(c => c._id);
            serviceQuery.applicant = { $in: citizenIds };
        }

        if (req.query.applicantId) {
            serviceQuery.applicant = req.query.applicantId;
        }

        if (status && status !== 'All') {
            serviceQuery.status = status;
        }

        if (serviceName) {
            serviceQuery.serviceName = serviceName;
        }

        const services = await ServiceRecord.find(serviceQuery)
            .populate('applicant', 'name ward houseName')
            .populate('officialId', 'name')
            .sort({ createdAt: -1 });

        res.json(services);
    } catch (error) {
        console.error("Error fetching services:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Validate applicant for a certificate request
// @route   POST /api/services/validate-applicant
// @access  Private
const validateApplicant = async (req, res) => {
    try {
        const { serviceName, citizenId, uniqueId, rationCardNumber, name, dob, ward, ...formData } = req.body;
        const villageId = req.villageId;
        const isAdmin = req.user && (req.user.role === 'Admin' || req.user.role === 'admin');

        // Non-admins must have villageId context.
        if (!villageId && !isAdmin) {
            return res.status(403).json({ message: "Jurisdiction context missing." });
        }

        let citizen = null;
        let matchPriority = 0; // 1 = Exact ID, 2 = Name/DOB/Ward

        // Base query constraints
        const baseQuery = isAdmin ? {} : { villageOfficeId: villageId };

        // Priority 1: Exact Match using unique IDs
        if (citizenId) {
            citizen = await Citizen.findOne({ _id: citizenId, ...baseQuery }).populate('familyId');
            matchPriority = 1;
        } else if (uniqueId) {
            citizen = await Citizen.findOne({ uniqueId, ...baseQuery }).populate('familyId');
            matchPriority = 1;
        } else if (rationCardNumber) {
            citizen = await Citizen.findOne({ rationCardNumber, ...baseQuery }).populate('familyId');
            matchPriority = 1;
        }

        // Priority 2: Name + DOB + Ward
        if (!citizen && name && dob && ward) {
            const dobDate = new Date(dob);
            const startOfDay = new Date(dobDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(dobDate.setHours(23, 59, 59, 999));

            const reqQuery = {
                name: new RegExp(`^${name}$`, 'i'),
                ward,
                dob: { $gte: startOfDay, $lte: endOfDay },
                ...baseQuery
            };

            const potentialMatches = await Citizen.find(reqQuery).populate('familyId');

            if (potentialMatches.length === 1) {
                citizen = potentialMatches[0];
                matchPriority = 2;
            } else if (potentialMatches.length > 1) {
                return res.status(409).json({
                    message: "Multiple records found matching these details. Please provide Aadhaar or Ration Card number.",
                    conflict: true
                });
            }
        }

        if (!citizen) {
            return res.status(404).json({
                message: "Citizen record not found in database. Manual verification required.",
                manualVerificationRequired: true
            });
        }

        // Duplicate Detection
        const existingService = await ServiceRecord.findOne({
            applicant: citizen._id,
            serviceName: serviceName,
            status: { $in: ['Applied', 'Verified', 'Under Review', 'Approved'] }
        });

        if (existingService) {
            return res.status(409).json({
                message: `An application for ${serviceName} is already ${existingService.status} for this citizen.`,
                duplicate: true,
                existingRecordId: existingService._id
            });
        }

        // Dynamic Verification Engine
        const checklist = generateVerificationChecklist(serviceName, { uniqueId, rationCardNumber, name, dob, ward, ...formData }, citizen);

        res.json({
            message: "Citizen matched successfully.",
            citizenId: citizen._id,
            matchPriority,
            profileData: {
                name: citizen.name,
                dob: citizen.dob,
                ward: citizen.ward,
                houseName: citizen.houseName,
                familyIncome: citizen.familyAnnualIncome,
                occupation: citizen.occupation
            },
            verificationChecklist: checklist
        });

    } catch (error) {
        console.error("Validation error:", error);
        res.status(500).json({ message: "Server error during validation" });
    }
};

// @desc    Create a service record
// @route   POST /api/services
// @access  Private
const createService = async (req, res) => {
    const { serviceName, applicant, familyId, remarks, status, verificationDetails } = req.body;

    try {
        if (!req.villageId) {
            return res.status(403).json({ message: "Jurisdiction context missing." });
        }

        const service = await ServiceRecord.create({
            serviceName,
            applicant,
            familyId,
            officialId: req.user._id,
            villageId: req.villageId, // Save the village context
            remarks,
            status: status || 'Applied',
            verificationDetails,
            statusHistory: [{
                status: status || 'Applied',
                officerId: req.user._id,
                note: 'Application submitted'
            }]
        });

        res.status(201).json(service);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update verification status (Clerk)
// @route   PUT /api/services/:id/verify
// @access  Private
const updateVerificationStatus = async (req, res) => {
    try {
        const service = await ServiceRecord.findById(req.params.id);
        if (!service) return res.status(404).json({ message: "Service record not found." });

        if (service.status !== 'Applied') {
            return res.status(400).json({ message: `Can only verify applications that are 'Applied', but this is ${service.status}.` });
        }

        service.status = 'Verified';
        service.verificationDate = new Date();
        service.statusHistory.push({
            status: 'Verified',
            officerId: req.user._id,
            note: req.body.note || 'Verification completed by Clerk'
        });

        await service.save();
        res.json(service);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve certificate (Revenue Officer)
// @route   PUT /api/services/:id/approve
// @access  Private
const approveCertificate = async (req, res) => {
    try {
        const service = await ServiceRecord.findById(req.params.id);
        if (!service) return res.status(404).json({ message: "Service record not found." });

        if (service.status !== 'Verified' && service.status !== 'Under Review') {
            return res.status(400).json({ message: "Can only approve applications that are 'Verified' or 'Under Review'." });
        }

        service.status = 'Approved';
        service.approvalDate = new Date();
        service.approvingOfficer = req.user._id;
        service.statusHistory.push({
            status: 'Approved',
            officerId: req.user._id,
            note: req.body.note || 'Approved by Revenue Officer'
        });

        await service.save();
        res.json(service);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reject certificate (Revenue Officer)
// @route   PUT /api/services/:id/reject
// @access  Private
const rejectCertificate = async (req, res) => {
    try {
        const { reason } = req.body;
        if (!reason) return res.status(400).json({ message: "Rejection reason is required." });

        const service = await ServiceRecord.findById(req.params.id);
        if (!service) return res.status(404).json({ message: "Service record not found." });

        if (service.status !== 'Applied' && service.status !== 'Verified' && service.status !== 'Under Review') {
            return res.status(400).json({ message: "Invalid status for rejection." });
        }

        service.status = 'Rejected';
        service.rejectionReason = reason;
        service.statusHistory.push({
            status: 'Rejected',
            officerId: req.user._id,
            note: reason
        });

        await service.save();
        res.json(service);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Issue certificate (Revenue Officer)
// @route   PUT /api/services/:id/issue
// @access  Private
const issueCertificate = async (req, res) => {
    try {
        const service = await ServiceRecord.findById(req.params.id);
        if (!service) return res.status(404).json({ message: "Service record not found." });

        if (service.status !== 'Approved') {
            return res.status(400).json({ message: "Record must be 'Approved' before issuing." });
        }

        service.status = 'Issued';
        service.issuedDate = new Date();
        service.issueDate = new Date(); // keeping for backward compatibility if any
        service.statusHistory.push({
            status: 'Issued',
            officerId: req.user._id,
            note: req.body.note || 'Certificate digitally issued'
        });

        await service.save();
        res.json(service);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload proof document for certificate
// @route   POST /api/services/:id/upload-proof
// @access  Private
const uploadProof = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded." });
        }

        const service = await ServiceRecord.findById(req.params.id);
        if (!service) return res.status(404).json({ message: "Service record not found." });

        // Update document fields
        service.proofUploaded = true;
        service.documentType = req.body.documentType || 'General Proof';
        // Convert local path to web-accessible URL assuming server routes /uploads to the directory
        service.documentURL = `/uploads/certificates/${req.file.filename}`;

        // Push the new document to the array just in case as well
        if (!service.documents) service.documents = [];
        service.documents.push(service.documentURL);

        await service.save();
        res.json({ message: "Proof uploaded successfully", service });
    } catch (error) {
        console.error("Upload proof error:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getServices, createService, validateApplicant, updateVerificationStatus, approveCertificate, rejectCertificate, issueCertificate, uploadProof };

