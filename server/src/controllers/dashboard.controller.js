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


// @desc    Get report data for current village
// @route   GET /api/dashboard/report
// @access  Private
const getReportData = async (req, res) => {
  try {
    const villageId = req.villageId;
    const isAdmin = req.user && (req.user.role === 'Admin' || req.user.role === 'admin');

    if (!isAdmin && !villageId) {
      return res.status(400).json({ message: "Jurisdiction context missing." });
    }

    const servicesQuery = isAdmin ? {} : { villageId };
    // Fetch last 50 service records
    const services = await ServiceRecord.find(servicesQuery)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('applicantId', 'fullName')
      .lean();

    const citizensQuery = isAdmin ? {} : { villageOfficeId: villageId };
    // Fetch last 50 added citizens
    const citizens = await Citizen.find(citizensQuery)
      .sort({ createdAt: -1 })
      .limit(50)
      .select('fullName createdAt')
      .lean();

    // Map to a common format
    const formattedServices = services.map(s => ({
      type: 'Service Request',
      details: `${s.serviceType || 'Service'} - ${s.applicantId?.fullName || 'Citizen'}`,
      date: s.createdAt,
      status: s.status
    }));

    const formattedCitizens = citizens.map(c => ({
      type: 'New Citizen',
      details: `Added ${c.fullName}`,
      date: c.createdAt,
      status: 'Registered'
    }));

    // Combine and sort by date descending
    const reportData = [...formattedServices, ...formattedCitizens]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 50);

    res.json(reportData);
  } catch (error) {
    console.error("Report generation error:", error);
    res.status(500).json({ message: "Failed to fetch report data" });
  }
};

module.exports = {
  getDashboardStats,
  getReportData
};
