import mongoose from 'mongoose';

// Durée de validité du code OTP (10 minutes)
const OTP_EXPIRY_MS = 10 * 60 * 1000;

const CardPaymentAttemptSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Montant en centimes
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // --- Informations carte (masquées pour la sécurité) ---
    cardLastFour: {
      type: String,
      required: true,
      match: [/^\d{4}$/, 'Les 4 derniers chiffres doivent être des chiffres'],
    },
    cardBrand: {
      type: String,
      enum: ['visa', 'mastercard', 'amex', 'discover', 'unknown'],
      default: 'unknown',
    },
    cardHolderName: {
      type: String,
      required: true,
      trim: true,
    },
    cardExpiry: {
      type: String,
      required: true,
    },

    // --- Code OTP ---
    otpCode: {
      type: String,
      required: true,
    },
    otpExpiresAt: {
      type: Date,
      required: true,
    },
    otpVerified: {
      type: Boolean,
      default: false,
    },
    otpVerifiedAt: Date,

    // --- Numéro de téléphone pour l'affichage (masqué) ---
    phoneLastFour: {
      type: String,
    },

    // --- Statut du paiement ---
    status: {
      type: String,
      enum: [
        'pending_otp',      // En attente de saisie OTP
        'otp_verified',     // OTP vérifié, en attente validation admin
        'processing',       // En cours de traitement (admin a reçu la demande)
        'approved',         // Paiement approuvé par l'admin
        'rejected',         // Paiement rejeté par l'admin
        'expired',          // OTP expiré ou tentative expirée
        'cancelled',        // Annulé par l'utilisateur
      ],
      default: 'pending_otp',
      index: true,
    },

    // --- Validation admin ---
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    validatedAt: Date,
    rejectionReason: String,

    // --- Tokens pour les liens email admin ---
    approveToken: {
      type: String,
      required: true,
      unique: true,
    },
    rejectToken: {
      type: String,
      required: true,
      unique: true,
    },

    // --- Métadonnées ---
    ipAddress: String,
    userAgent: String,
    attempts: {
      type: Number,
      default: 0,
      max: 3,
    },
  },
  { timestamps: true }
);

// --- Index ---
CardPaymentAttemptSchema.index({ status: 1, createdAt: -1 });
CardPaymentAttemptSchema.index({ approveToken: 1 });
CardPaymentAttemptSchema.index({ rejectToken: 1 });
CardPaymentAttemptSchema.index({ otpExpiresAt: 1 });

// --- Méthodes d'instance ---

/**
 * Vérifie si le code OTP est valide
 */
CardPaymentAttemptSchema.methods.verifyOtp = function (code) {
  if (this.otpVerified) {
    return { valid: false, error: 'OTP déjà vérifié' };
  }
  if (new Date() > this.otpExpiresAt) {
    return { valid: false, error: 'OTP expiré' };
  }
  if (this.attempts >= 3) {
    return { valid: false, error: 'Trop de tentatives' };
  }
  if (this.otpCode !== code) {
    this.attempts += 1;
    return { valid: false, error: 'Code OTP incorrect' };
  }
  return { valid: true };
};

/**
 * Marque l'OTP comme vérifié
 */
CardPaymentAttemptSchema.methods.markOtpVerified = function () {
  this.otpVerified = true;
  this.otpVerifiedAt = new Date();
  this.status = 'otp_verified';
};

/**
 * Approuve le paiement (appelé par l'admin)
 */
CardPaymentAttemptSchema.methods.approve = function (adminId) {
  this.status = 'approved';
  this.validatedBy = adminId;
  this.validatedAt = new Date();
};

/**
 * Rejette le paiement (appelé par l'admin)
 */
CardPaymentAttemptSchema.methods.reject = function (adminId, reason) {
  this.status = 'rejected';
  this.validatedBy = adminId;
  this.validatedAt = new Date();
  this.rejectionReason = reason || 'Paiement refusé';
};

// --- Méthodes statiques ---

/**
 * Génère un code OTP à 6 chiffres
 */
CardPaymentAttemptSchema.statics.generateOtpCode = function () {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Génère un token unique pour les liens email
 */
CardPaymentAttemptSchema.statics.generateToken = function () {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

/**
 * Détecte le réseau de la carte à partir du numéro
 */
CardPaymentAttemptSchema.statics.detectCardBrand = function (cardNumber) {
  const num = cardNumber.replace(/\s/g, '');
  if (/^4/.test(num)) return 'visa';
  if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return 'mastercard';
  if (/^3[47]/.test(num)) return 'amex';
  if (/^6(?:011|5)/.test(num)) return 'discover';
  return 'unknown';
};

/**
 * Trouve une tentative active pour une réservation
 */
CardPaymentAttemptSchema.statics.findActiveAttempt = function (bookingId, userId) {
  return this.findOne({
    booking: bookingId,
    user: userId,
    status: { $in: ['pending_otp', 'otp_verified', 'processing'] },
    otpExpiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
};

/**
 * Trouve une tentative par token d'approbation
 */
CardPaymentAttemptSchema.statics.findByApproveToken = function (token) {
  return this.findOne({ approveToken: token });
};

/**
 * Trouve une tentative par token de rejet
 */
CardPaymentAttemptSchema.statics.findByRejectToken = function (token) {
  return this.findOne({ rejectToken: token });
};

// En dev, on vide le cache pour que les changements de schema soient pris en compte
if (process.env.NODE_ENV !== 'production' && mongoose.models.CardPaymentAttempt) {
  mongoose.deleteModel('CardPaymentAttempt');
}

export default mongoose.models.CardPaymentAttempt || mongoose.model('CardPaymentAttempt', CardPaymentAttemptSchema);
