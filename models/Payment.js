import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Montant en centimes
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    method: {
      type: String,
      enum: ['paypal', 'bank_transfer', 'card'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    // PayPal
    paypalOrderId: String,
    paypalCaptureId: String,
    // Virement bancaire
    transferReference: String,
    transferProof: String,
    transferProofs: [String],
    // Validation admin
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    validatedAt: Date,
    notes: String,
  },
  { timestamps: true }
);

PaymentSchema.index({ booking: 1 });
PaymentSchema.index({ user: 1 });
PaymentSchema.index({ status: 1, method: 1 });

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
