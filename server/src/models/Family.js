const mongoose = require('mongoose');

const familySchema = new mongoose.Schema({
    familyName: { type: String, required: true }, // Usually derived from Head of Family
    headOfFamily: { type: mongoose.Schema.Types.ObjectId, ref: 'Citizen' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Citizen' }],
    removedMembers: [{
        citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'Citizen' },
        reason: { type: String, enum: ['Death', 'Marriage', 'Family Change', 'Other'] },
        removedAt: { type: Date, default: Date.now }
    }],
    village: { type: String, required: true },
    wardNumber: { type: String },
    totalAnnualIncome: { type: Number, default: 0 }, // Calculated aggregation
    rationCardNumber: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Family', familySchema);
