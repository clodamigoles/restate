import dbConnect from '@/lib/db';
import User from '@/models/User';
import Listing from '@/models/Listing';
import Booking from '@/models/Booking';
import Payment from '@/models/Payment';
import { withAdmin } from '@/middleware/withAdmin';
import { errorHandler } from '@/middleware/errorHandler';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }

  await dbConnect();

  const startOfYear = new Date(new Date().getFullYear(), 0, 1);

  const [users, listings, bookings, paymentsCompleted, recentBookings, monthlyRevenue, monthlyBookings] =
    await Promise.all([
      User.countDocuments(),
      Listing.countDocuments({ isPublished: true }),
      Booking.countDocuments(),
      Payment.countDocuments({ status: 'completed' }),
      Booking.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('listing', 'title')
        .populate('user', 'name')
        .lean(),
      Payment.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: startOfYear } } },
        { $group: { _id: { month: { $month: '$createdAt' } }, total: { $sum: '$amount' } } },
        { $sort: { '_id.month': 1 } },
      ]),
      Booking.aggregate([
        { $match: { createdAt: { $gte: startOfYear } } },
        { $group: { _id: { month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.month': 1 } },
      ]),
    ]);

  const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const revenueMap = Object.fromEntries(monthlyRevenue.map((r) => [r._id.month, r.total]));
  const bookingsMap = Object.fromEntries(monthlyBookings.map((b) => [b._id.month, b.count]));

  const chartData = MONTHS.map((name, i) => ({
    name,
    revenue: Math.round((revenueMap[i + 1] || 0) / 100),
    bookings: bookingsMap[i + 1] || 0,
  }));

  return res.status(200).json({
    success: true,
    data: {
      users,
      listings,
      bookings,
      paymentsCompleted,
      recentBookings: recentBookings.map((b) => ({
        _id: b._id.toString(),
        status: b.status,
        listing: b.listing ? { title: b.listing.title } : null,
        user: b.user ? { name: b.user.name } : null,
        createdAt: b.createdAt,
      })),
      chartData,
    },
  });
}

export default errorHandler(withAdmin(handler));
