const mongoose = require('mongoose');

const uploadErrorSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UploadSession',
        required: true,
        index: true
    },
    rowNumber: {
        type: Number,
        required: true
    },
    rowData: {
        type: Object, // Snapshot of the row data that failed
        required: true
    },
    errors: [{
        type: String // Array of error messages
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('UploadError', uploadErrorSchema);
