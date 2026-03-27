const Booking = require('../models/Booking');
const User = require('../models/User');
const Bus = require('../models/Bus');
const Route = require('../models/Route');

// @desc    Get Admin Dashboard Stats
// @route   GET /api/analytics
// @access  Private/Admin
exports.getDashboardStats = async (req, res, next) => {
    try {
        // 1. Basic Counters (Compare with yesterday for growth)
        const totalUsers = await User.countDocuments({ role: 'user' });
        const activeBuses = await Bus.countDocuments({ status: 'Active' });
        const totalBookingsCount = await Booking.countDocuments();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const getStats = async (startDate, endDate = new Date()) => {
            const result = await Booking.aggregate([
                { $match: { createdAt: { $gte: startDate, $lt: endDate }, status: 'Confirmed' } },
                { $group: { _id: null, revenue: { $sum: "$totalPrice" }, bookings: { $sum: 1 } } }
            ]);
            return result[0] || { revenue: 0, bookings: 0 };
        };

        const todayStats = await getStats(today);
        const yesterdayStats = await getStats(yesterday, today);

        // Overall Totals
        const totalRevenueResult = await Booking.aggregate([
            { $match: { status: 'Confirmed' } },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]);
        const totalRevenue = totalRevenueResult[0]?.total || 0;

        const calcGrowth = (curr, prev) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            return Math.round(((curr - prev) / prev) * 100);
        };

        const revenueGrowth = calcGrowth(todayStats.revenue, yesterdayStats.revenue);
        const bookingGrowth = calcGrowth(todayStats.bookings, yesterdayStats.bookings);

        // 2. Recent Bookings (STRICT LIMIT 5)
        const recentBookings = await Booking.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'name email')
            .populate('bus', 'name number type')
            .populate({
                path: 'route',
                populate: [
                    { path: 'origin', select: 'name' },
                    { path: 'destination', select: 'name' }
                ]
            });

        // 3. Popular Routes & Top Buses (Top 5)
        const popularRoutes = await Booking.aggregate([
            { $group: { _id: "$route", count: { $sum: 1 }, revenue: { $sum: "$totalPrice" } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'routes', localField: '_id', foreignField: '_id', as: 'routeDetails' } },
            { $unwind: '$routeDetails' },
            { $lookup: { from: 'destinations', localField: 'routeDetails.origin', foreignField: '_id', as: 'origin' } },
            { $lookup: { from: 'destinations', localField: 'routeDetails.destination', foreignField: '_id', as: 'destination' } },
            {
                $project: {
                    routeName: { $concat: [{ $arrayElemAt: ["$origin.name", 0] }, " → ", { $arrayElemAt: ["$destination.name", 0] }] },
                    bookings: "$count",
                    revenue: "$revenue",
                    occupancy: { $literal: "85%" }
                }
            }
        ]);

        const topBuses = await Booking.aggregate([
            { $group: { _id: "$bus", trips: { $sum: 1 }, revenue: { $sum: "$totalPrice" } } },
            { $sort: { revenue: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'buses', localField: '_id', foreignField: '_id', as: 'busDetails' } },
            { $unwind: '$busDetails' },
            { $project: { name: "$busDetails.name", number: "$busDetails.number", trips: "$trips", revenue: "$revenue" } }
        ]);

        // 4. Fill 0s for missing days in Bar Chart (Last 7 Days)
        const chartData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            chartData.push({
                day: d.getDate(),
                month: d.getMonth() + 1,
                label: `${d.getDate()}/${d.getMonth() + 1}`,
                rev: 0,
                count: 0
            });
        }

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const rawChartData = await Booking.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo }, status: 'Confirmed' } },
            { $group: { _id: { day: { $dayOfMonth: "$createdAt" }, month: { $month: "$createdAt" } }, rev: { $sum: "$totalPrice" }, count: { $sum: 1 } } }
        ]);

        chartData.forEach(item => {
            const match = rawChartData.find(r => r._id.day === item.day && r._id.month === item.month);
            if (match) {
                item.rev = match.rev;
                item.count = match.count;
            }
        });

        res.status(200).json({
            success: true,
            data: {
                stats: { totalRevenue, totalUsers, activeBuses, totalBookings: totalBookingsCount, revenueGrowth, bookingGrowth },
                recentBookings: recentBookings,
                popularRoutes: popularRoutes.map(r => ({ route: r.routeName, bookings: r.bookings, revenue: `Rs. ${r.revenue.toLocaleString()}`, occupancy: '85%' })),
                topBuses: topBuses.map(b => ({ name: b.name, number: b.number, trips: b.trips, revenue: `Rs. ${b.revenue.toLocaleString()}` })),
                charts: {
                    revenue: chartData.map(r => r.rev),
                    sales: chartData.map(r => r.count),
                    labels: chartData.map(r => r.label)
                }
            }
        });
    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
