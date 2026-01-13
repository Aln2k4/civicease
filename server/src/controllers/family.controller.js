const Family = require('../models/Family');
const Citizen = require('../models/Citizen');

// @desc    Get all families
// @route   GET /api/families
// @access  Private
const getFamilies = async (req, res) => {
    try {
        const families = await Family.find({}).populate('headOfFamily');
        res.json(families);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a family
// @route   POST /api/families
// @access  Private
const createFamily = async (req, res) => {
    const { familyName, headOfFamily, members, village, wardNumber, rationCardNumber } = req.body;

    try {
        const family = await Family.create({
            familyName,
            headOfFamily,
            members,
            village,
            wardNumber,
            rationCardNumber
        });
        res.status(201).json(family);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get family details including members
// @route   GET /api/families/:id
// @access  Private
const getFamilyById = async (req, res) => {
    try {
        const family = await Family.findById(req.params.id)
            .populate('headOfFamily')
            .populate('members')
            .populate('removedMembers.citizen');

        if (family) {
            res.json(family);
        } else {
            res.status(404).json({ message: 'Family not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add member to family
// @route   POST /api/families/:id/members
// @access  Private
const addMemberToFamily = async (req, res) => {
    const { citizenId, relationship } = req.body;
    try {
        const family = await Family.findById(req.params.id);
        const citizen = await Citizen.findById(citizenId);

        if (!family || !citizen) {
            return res.status(404).json({ message: 'Family or Citizen not found' });
        }

        // Check if already a member
        if (family.members.includes(citizenId)) {
            return res.status(400).json({ message: 'Citizen is already a member of this family' });
        }

        family.members.push(citizenId);
        await family.save();

        // Also update the citizen's familyId reference
        citizen.familyId = family._id;
        if (relationship) {
            citizen.relationshipToHead = relationship;
        }
        await citizen.save();

        const updatedFamily = await Family.findById(req.params.id)
            .populate('headOfFamily')
            .populate('members');

        res.json(updatedFamily);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Remove member from family
// @route   POST /api/families/:id/members/remove
// @access  Private
const removeMemberFromFamily = async (req, res) => {
    const { citizenId, reason } = req.body;
    try {
        const family = await Family.findById(req.params.id);
        const citizen = await Citizen.findById(citizenId);

        if (!family || !citizen) {
            return res.status(404).json({ message: 'Family or Citizen not found' });
        }

        // Check if actually a member
        if (!family.members.some(m => m.toString() === citizenId)) {
            return res.status(400).json({ message: 'Citizen is not a member of this family' });
        }

        // Remove from members
        family.members = family.members.filter(id => id.toString() !== citizenId);

        // Add to removedMembers
        family.removedMembers.push({
            citizen: citizenId,
            reason: reason || 'Other'
        });
        await family.save();

        // Update citizen: clear familyId
        citizen.familyId = null;
        // Should we keep relationship? Probably ok to clear it or keep it as history?
        // Let's clear it to show they are no longer related to the current head context in a partial way?
        // Actually, if we clear familyId, relationshipToHead becomes irrelevant.
        citizen.relationshipToHead = null;

        await citizen.save();

        const updatedFamily = await Family.findById(req.params.id)
            .populate('headOfFamily')
            .populate('members')
            .populate('removedMembers.citizen'); // Also populate removed members

        res.json(updatedFamily);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getFamilies, createFamily, getFamilyById, addMemberToFamily, removeMemberFromFamily };
