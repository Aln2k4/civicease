const mongoose = require('mongoose');

const familySchema = new mongoose.Schema({
    familyName: {
        type: String,
        required: true,
        trim: true
    },
    villageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VillageOffice', // Assuming this model exists
        required: true
    },
    wardNumber: {
        type: Number,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    rationCardNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    headCitizenId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Citizen',
        required: true
    },
    removedMembers: [{
        citizen: {
            type: Object, // Storing snapshot of citizen data
            required: true
        },
        reason: {
            type: String,
            required: true
        },
        removedAt: {
            type: Date,
            default: Date.now
        },
        certificatePath: {
            type: String, // Path to the uploaded certificate
            required: false // Optional, or required based on business logic (enforced in controller)
        }
    }],
    members: [{
        citizenId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Citizen',
            required: true
        },
        relationship: {
            type: String,
            required: true // e.g., 'Head', 'Spouse', 'Son', 'Daughter', 'Mother', 'Father'
        },
        isHead: {
            type: Boolean,
            default: false
        }
    }],
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Official',
        // required: true // Can be optional if automated system creation, but strictly should be tracked
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Family', familySchema);
