const Citizen = require('../models/Citizen');
const Family = require('../models/Family');
const VillageOffice = require('../models/VillageOffice');

// @desc    Get data for certificate preview
// @route   GET /api/certificates/preview/:type
// @access  Private
const getCertificatePreview = async (req, res) => {
    try {
        const { type } = req.params;
        const { citizenId } = req.query; // Optional: if we want to preview for a specific citizen
        const officialId = req.user.id; // User generating the preview (Official)
        const villageId = req.villageId;

        console.log(`Generating preview for ${type} in village ${villageId}`);

        let data = {};

        // 1. Fetch Official / Office Details
        // Ideally we fetch VillageOffice details. 
        // For now, mocking or deriving from user context if VillageOffice model isn't fully set up or linked
        // If VillageOffice model exists, fetch it.
        // const office = await VillageOffice.findById(villageId);

        const officeName = req.user.villageContext?.villageName
            ? `${req.user.villageContext.villageName} Village Office`
            : "Kerala Village Office";

        // 2. Fetch Citizen Data
        // If citizenId provided, use it. Else find a dummy/latest one for DEMO.
        let citizen = null;
        if (citizenId) {
            citizen = await Citizen.findById(citizenId).populate('familyId');
        } else {
            // Find the most recent citizen in this village for demo purposes
            citizen = await Citizen.findOne({ villageOfficeId: villageId }).sort({ createdAt: -1 }).populate('familyId');
        }

        if (!citizen) {
            // Fallback for empty DB - Send Mock Data that looks real
            data = {
                name: "Ananthu Krishnan",
                fatherName: "Gopalakrishnan",
                motherName: "Sreedevi",
                dob: "1998-05-15",
                address: {
                    houseName: "Thekkethil House",
                    ward: "10",
                    place: "Kottayam",
                    village: officeName.replace(' Village Office', ''),
                    taluk: "Kottayam",
                    district: "Kottayam",
                    pinCode: "686001"
                },
                certificateNumber: "KL/2026/1001/DMO",
                issueDate: new Date().toLocaleDateString('en-GB'),
                issuingOfficer: req.user.name,
                designation: "Village Officer",
                officeName: officeName,
                caste: "Nair",
                religion: "Hinduism",
                annualIncome: 96000,
                purpose: "Education"
            };
        } else {
            // Populate real data
            data = {
                name: citizen.name,
                fatherName: citizen.fatherName,
                motherName: citizen.motherName,
                dob: citizen.dob ? new Date(citizen.dob).toLocaleDateString('en-GB') : "N/A",
                address: {
                    houseName: citizen.houseName || citizen.permanentAddress?.houseName,
                    ward: citizen.ward,
                    place: citizen.place || citizen.permanentAddress?.place,
                    village: citizen.permanentAddress?.village || officeName.replace(' Village Office', ''),
                    taluk: citizen.permanentAddress?.taluk || "Unknown",
                    district: citizen.permanentAddress?.district || "Unknown",
                    pinCode: citizen.pinCode
                },
                certificateNumber: `KL/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}/TMP`,
                issueDate: new Date().toLocaleDateString('en-GB'),
                issuingOfficer: req.user.name,
                designation: "Village Officer", // Defaulting for now
                officeName: officeName,
                caste: citizen.caste || "N/A",
                religion: citizen.religion || "N/A",
                annualIncome: citizen.familyAnnualIncome || citizen.annualIncome || 60000,
                purpose: "General Purpose"
            };
        }

        res.json(data);

    } catch (error) {
        console.error("Preview generation error:", error);
        res.status(500).json({ message: "Failed to generate preview data" });
    }
};

module.exports = {
    getCertificatePreview
};
