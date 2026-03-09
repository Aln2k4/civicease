const mongoose = require('mongoose');

const uploadSessionSchema = new mongoose.Schema({
    officialId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Official',
        required: true
    },
    villageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VillageOffice', // Assuming this model exists
        required: true
    },
    uploadType: {
        type: String,
        enum: ['CITIZEN', 'FAMILY'],
        required: true
    },
    status: {
        type: String,
        enum: ['UPLOADED', 'VALIDATING', 'READY_TO_CONFIRM', 'PROCESSING', 'COMPLETED', 'FAILED'],
        default: 'UPLOADED'
    },
    fileName: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    filePath: {
        type: String, // Path to the temporary stored file
        required: true
    },
    totalRecords: {
        type: Number,
        default: 0
    },
    processedRecords: {
        type: Number,
        default: 0
    },
    successCount: {
        type: Number,
        default: 0
    },
    errorCount: {
        type: Number,
        default: 0
    },
    startedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    meta: {
        type: Object, // Verification snapshot, extra metadata
        default: {}
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('UploadSession', uploadSessionSchema);
