const Citizen = require('../models/Citizen');
const Family = require('../models/Family');
const ServiceRecord = require('../models/ServiceRecord');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const villageId = req.villageId;
    const isAdmin = req.user && (req.user.role === 'Admin' || req.user.role === 'admin');

    if (!isAdmin && !villageId) {
      return res.status(400).json({ message: "Jurisdiction context missing." });
    }

    const citizenQuery = isAdmin ? {} : { villageOfficeId: villageId };
    const familyQuery = isAdmin ? {} : { villageId: villageId };

    const citizenCount = await Citizen.countDocuments(citizenQuery);
    const familyCount = await Family.countDocuments(familyQuery);

    // For services today, we filter by createdAt date and village
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const servicesTodayQuery = {
      createdAt: { $gte: today }
    };
    if (!isAdmin) servicesTodayQuery.villageId = villageId;

    const servicesTodayCount = await ServiceRecord.countDocuments(servicesTodayQuery);

    const pendingQuery = { status: 'Pending' };
    if (!isAdmin) pendingQuery.villageId = villageId;

    const pendingCount = await ServiceRecord.countDocuments(pendingQuery);

    res.json({
      citizens: citizenCount,
      families: familyCount,
      servicesToday: servicesTodayCount,
      pending: pendingCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};


module.exports = {
  getDashboardStats
};
