const Citizen = require('../models/Citizen');
const Family = require('../models/Family');
const ServiceRecord = require('../models/ServiceRecord');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const citizenCount = await Citizen.countDocuments();
    const familyCount = await Family.countDocuments();

    // For services today, we filter by createdAt date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const servicesTodayCount = await ServiceRecord.countDocuments({
      createdAt: { $gte: today }
    });

    const pendingCount = await ServiceRecord.countDocuments({ status: 'Pending' });

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
