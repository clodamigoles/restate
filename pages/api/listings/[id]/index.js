import dbConnect from '@/lib/db';
import Listing from '@/models/Listing';
import '@/models/User';
import { withAdminOrAuth } from '@/middleware/withAdminOrAuth';
import { errorHandler } from '@/middleware/errorHandler';
import { createLocalizedField } from '@/lib/i18n';
import mongoose from 'mongoose';

// Normalise les champs i18n : accepte String ou Object { fr, en, ... }
function normalizeI18nField(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return createLocalizedField(value);
  return value;
}

async function handler(req, res) {
  await dbConnect();

  const { id } = req.query;

  if (req.method === 'GET') return getListing(req, res, id);
  if (req.method === 'PUT') return withAdminOrAuth(updateListing)(req, res);
  if (req.method === 'DELETE') return withAdminOrAuth(deleteListing)(req, res);

  return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
}

async function getListing(req, res, id) {
  const filter = mongoose.isValidObjectId(id)
    ? { $or: [{ _id: id }, { slug: id }] }
    : { slug: id };

  const listing = await Listing.findOne(filter).populate('owner', 'name email');
  if (!listing) {
    return res.status(404).json({ success: false, error: 'Annonce non trouvée' });
  }
  return res.status(200).json({ success: true, data: listing });
}

async function updateListing(req, res) {
  const { id } = req.query;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, error: 'ID invalide' });
  }

  const listing = await Listing.findById(id);
  if (!listing) return res.status(404).json({ success: false, error: 'Annonce non trouvée' });

  const { role, id: userId, isAdminCookie } = req.user;
  // Admin cookie = acces total ; sinon verifier owner
  if (!isAdminCookie && role !== 'admin' && listing.owner?.toString() !== userId) {
    return res.status(403).json({ success: false, error: 'Acces refuse' });
  }

  // Normaliser les champs i18n (accepte String ou Object)
  const body = { ...req.body };
  if (body.title) body.title = normalizeI18nField(body.title);
  if (body.description) body.description = normalizeI18nField(body.description);
  if (body.rules) body.rules = normalizeI18nField(body.rules);

  const updated = await Listing.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  });
  return res.status(200).json({ success: true, data: updated });
}

async function deleteListing(req, res) {
  const { id } = req.query;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, error: 'ID invalide' });
  }

  const listing = await Listing.findById(id);
  if (!listing) return res.status(404).json({ success: false, error: 'Annonce non trouvée' });

  const { role, isAdminCookie } = req.user;
  if (!isAdminCookie && role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Reserve aux administrateurs' });
  }

  await listing.deleteOne();
  return res.status(200).json({ success: true, message: 'Annonce supprimée' });
}

export default errorHandler(handler);
