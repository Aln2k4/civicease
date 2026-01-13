const mongoose = require('mongoose');

const citizenSchema = new mongoose.Schema({
    name: { type: String, required: true },
    dob: { type: Date }, // Added based on design
    age: { type: Number }, // Made optional as DOB is preferred
    gender: { type: String, enum: ['Male', 'Female', 'Transgender', 'Other'], required: true }, // Added Transgender
    houseName: { type: String }, // Added
    place: { type: String }, // Added
    locality: { type: String }, // Added
    district: { type: String }, // Added
    address: { type: String }, // Kept for backward compatibility or full address
    contactNumber: { type: String },
    uniqueId: { type: String, unique: true, required: true }, // Aadhaar
    familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family' },
    headOfFamily: { type: Boolean, default: false },
    relationshipToHead: { type: String }, // User added: Relationship to Head of Family
    occupation: { type: String },
    annualIncome: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Citizen', citizenSchema);
