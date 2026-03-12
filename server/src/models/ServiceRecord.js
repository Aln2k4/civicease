const mongoose = require('mongoose');

const serviceRecordSchema = new mongoose.Schema({
    serviceName: { type: String, required: true }, // e.g., 'Income Certificate'
    applicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Citizen',
        required: true
    },
    familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family' },
    officialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Official' },
    status: {
        type: String,
        enum: [
            "Draft",
            "Applied",
            "Verified",
            "Under Review",
            "Approved",
            "Rejected",
            "Issued"
        ],
        default: "Applied"
    },
    statusHistory: [{
        status: String,
        timestamp: { type: Date, default: Date.now },
        officerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Official' },
        note: String
    }],
    rejectionReason: { type: String },
    approvingOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'Official' },

    // Lifecycle Dates
    appliedDate: { type: Date, default: Date.now },
    verificationDate: { type: Date },
    approvalDate: { type: Date },
    issuedDate: { type: Date },

    // Document Uploads
    proofUploaded: { type: Boolean, default: false },
    documentType: { type: String }, // 'Income proof', 'Identity proof', etc.
    documentURL: { type: String },
    verifiedStatus: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },

    remarks: { type: String },
    documents: [{ type: String }], // Optional: Multiple URLs
    verificationDetails: { type: Object }, // Store the dynamic checklist verification items and statuses
    villageId: { type: mongoose.Schema.Types.ObjectId, ref: 'VillageOffice', required: true }, // Added for Data Isolation
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ServiceRecord', serviceRecordSchema);
