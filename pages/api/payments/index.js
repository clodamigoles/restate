import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import { withAdmin } from '@/middleware/withAdmin';
import { errorHandler } from '@/middleware/errorHandler';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }

  await dbConnect();

  const { status, method, page = 1, limit = 15 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (method) filter.method = method;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('booking', 'checkIn checkOut totalPrice status')
      .populate('user', 'name email'),
    Payment.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: payments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
}

export default errorHandler(withAdmin(handler));
