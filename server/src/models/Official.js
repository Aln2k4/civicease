const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const officialSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true }, // Made sparse/optional given strictly username login might be preferred, but kept for legacy
    username: { type: String, required: true, unique: true }, // Auto-generated
    password: { type: String, required: true },
    role: { type: String, enum: ['Admin', 'Citizen', 'Clerk', 'Revenue Officer'], default: 'Revenue Officer' },
    department: { type: String },
    villageOfficeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VillageOffice',
        required: function () { return this.role !== 'Admin' && this.role !== 'admin'; },
        // unique: true exists but for a single admin, null is fine
    },
    createdAt: { type: Date, default: Date.now }
});

// Match user entered password to hashed password in database
officialSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
officialSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('Official', officialSchema);
