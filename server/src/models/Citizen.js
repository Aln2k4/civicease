const mongoose = require('mongoose');

const citizenSchema = new mongoose.Schema({
    // Section 1: Basic Personal Details
    birthCertificate: { type: String, required: true },
    name: { type: String, required: true },
    dob: { type: Date, required: true },
    age: { type: Number }, // Auto-calculated
    gender: { type: String, enum: ['Male', 'Female', 'Transgender'], required: true },
    maritalStatus: { type: String, enum: ['Single', 'Married', 'Widow', 'Divorced'], required: true },

    // Section 2: Present Address
    houseName: { type: String },
    ward: { type: String },
    place: { type: String },
    villageOfficeId: { type: mongoose.Schema.Types.ObjectId, ref: 'VillageOffice', required: true }, // Jurisdiction

    // Storing purely strictly for display/record if differ from linked VillageObject (though usually same)
    // We will rely on populating villageOfficeId for the official names, but can store snapshots if needed.
    // For now, we mainly rely on the link.

    pinCode: { type: String, required: true },
    // residenceYears removed as per request

    // Permanent Address
    permanentAddress: {
        houseName: String,
        place: String,
        village: String,
        taluk: String,
        district: String,
        pinCode: String
    },
    isPermanentSameAsPresent: { type: Boolean, default: false },

    // Section 3: Family Details
    fatherName: { type: String, required: true },
    motherName: { type: String },
    spouseName: { type: String }, // Required if Married

    // Section 4: Contact Details
    contactNumber: { type: String, required: true }, // Mobile
    alternateMobile: { type: String },
    email: { type: String },

    // Section 5: Identity & Government IDs
    uniqueId: { type: String, unique: true }, // Aadhaar (Optional but recommended)
    rationCardNumber: { type: String },
    electionId: { type: String },
    drivingLicence: { type: String },
    passportNumber: { type: String },

    // Section 6: Community & Religion Details
    religion: { type: String },
    caste: { type: String },
    communityCategory: { type: String, enum: ['General', 'OBC', 'SC', 'ST'] },
    fatherReligion: { type: String },
    fatherCaste: { type: String },
    motherReligion: { type: String },
    motherCaste: { type: String },

    // System Fields
    familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family' },
    headOfFamily: { type: Boolean, default: false },
    relationshipToHead: { type: String },
    occupation: { type: String },
    annualIncome: { type: Number, default: 0 },
    familyAnnualIncome: { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Citizen', citizenSchema);
