import mongoose from 'mongoose';

// Durée avant expiration d'une réservation pending non payée (30 min)
const PENDING_EXPIRY_MS = 30 * 60 * 1000;

const BookingSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    checkIn: {
      type: Date,
      required: [true, "La date d'arrivée est requise"],
    },
    checkOut: {
      type: Date,
      required: [true, 'La date de départ est requise'],
    },
    guests: {
      type: Number,
      required: [true, 'Le nombre de voyageurs est requis'],
      min: 1,
    },
    nights: {
      type: Number,
      required: true,
      min: 1,
    },

    // --- Snapshot prix au moment de la réservation (centimes) ---
    pricePerNight: {
      type: Number,
      required: true,
      min: 0,
    },
    cleaningFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    serviceFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    // --- Statuts ---
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'pending', 'paid', 'refunded'],
      default: 'unpaid',
    },

    // --- Expiration auto des pending ---
    // Le TTL index supprime le document quand expiresAt est atteint.
    // Mis à null dès que le booking passe à confirmed/paid.
    expiresAt: {
      type: Date,
      default: null,
    },

    // --- Annulation ---
    cancellationReason: String,
    cancelledBy: {
      type: String,
      enum: ['user', 'admin', null],
      default: null,
    },
    cancelledAt: Date,

    specialRequests: String,
  },
  { timestamps: true }
);

// ─── Validations ────────────────────────────────────────────────
BookingSchema.pre('validate', function (next) {
  if (this.checkOut <= this.checkIn) {
    return next(new Error("La date de départ doit être après la date d'arrivée"));
  }

  // Calcul du nombre de nuits
  const msPerDay = 1000 * 60 * 60 * 24;
  this.nights = Math.round((this.checkOut - this.checkIn) / msPerDay);

  if (this.nights < 1) {
    return next(new Error('La réservation doit faire au moins 1 nuit'));
  }

  next();
});

// ─── Auto-set expiresAt pour les nouvelles réservations pending ──
BookingSchema.pre('save', function (next) {
  // Nouveau document en status pending → on fixe l'expiration
  if (this.isNew && this.status === 'pending') {
    this.expiresAt = new Date(Date.now() + PENDING_EXPIRY_MS);
  }

  // Si le statut passe à confirmed/completed → supprimer l'expiration
  if (this.isModified('status') && ['confirmed', 'completed'].includes(this.status)) {
    this.expiresAt = null;
  }

  // Si annulé → enregistrer la date d'annulation
  if (this.isModified('status') && this.status === 'cancelled') {
    this.cancelledAt = new Date();
    this.expiresAt = null;
  }

  next();
});

// ─── Index ──────────────────────────────────────────────────────

// Index principal pour la détection de conflits de disponibilité
// Utilisé par checkAvailability : listing + statut actif + chevauchement dates
BookingSchema.index(
  { listing: 1, status: 1, checkIn: 1, checkOut: 1 },
  { name: 'availability_conflict' }
);

// Index pour les requêtes utilisateur (mes réservations)
BookingSchema.index({ user: 1, status: 1, createdAt: -1 }, { name: 'user_bookings' });

// Index TTL : MongoDB supprime automatiquement les documents expirés
// Les documents avec expiresAt = null ne sont jamais supprimés
BookingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'pending_ttl' });

// Index pour les requêtes admin (filtrage par statut de paiement)
BookingSchema.index({ status: 1, paymentStatus: 1 }, { name: 'admin_filter' });

// ─── Méthodes statiques ─────────────────────────────────────────

/**
 * Trouve les réservations actives (non expirées) qui chevauchent une période.
 * C'est LA requête centrale pour la vérification de disponibilité.
 */
BookingSchema.statics.findConflicts = function (listingId, checkIn, checkOut, excludeId) {
  const now = new Date();
  const query = {
    listing: listingId,
    status: { $in: ['pending', 'confirmed'] },
    checkIn: { $lt: new Date(checkOut) },
    checkOut: { $gt: new Date(checkIn) },
    // Exclure les pending expirés pas encore nettoyés par le TTL
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: now } },
    ],
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return this.find(query).select('checkIn checkOut status');
};

/**
 * Prolonge l'expiration d'une réservation pending (ex: user est en train de payer).
 * Ajoute 15 minutes supplémentaires.
 */
BookingSchema.statics.extendHold = async function (bookingId, userId) {
  const EXTEND_MS = 15 * 60 * 1000;
  return this.findOneAndUpdate(
    {
      _id: bookingId,
      user: userId,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    },
    { expiresAt: new Date(Date.now() + EXTEND_MS) },
    { new: true }
  );
};

export default mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
