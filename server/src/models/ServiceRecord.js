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
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    issueDate: { type: Date },
    remarks: { type: String },
    documents: [{ type: String }], // URLs to documents
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ServiceRecord', serviceRecordSchema);
