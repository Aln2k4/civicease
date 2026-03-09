const mongoose = require('mongoose');

const villageOfficeSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // Added solely for linkage if needed, though usually implicit by _id
    villageName: { type: String, required: true },
    taluk: { type: String, required: true },
    district: { type: String, required: true },
    stateCode: { type: String, required: true }, // e.g., 'KL'
    districtCode: { type: String, required: true }, // e.g., '01'
    villageCode: { type: String, required: true }, // e.g., 'KARLM'
    createdAt: { type: Date, default: Date.now }
});

// Compound index to ensure uniqueness of codes
villageOfficeSchema.index({ stateCode: 1, districtCode: 1, villageCode: 1 }, { unique: true });

module.exports = mongoose.model('VillageOffice', villageOfficeSchema);
