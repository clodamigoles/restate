import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'La note est requise'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 2000,
    },
    response: {
      type: String,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

// Un seul avis par user par annonce
ReviewSchema.index({ user: 1, listing: 1 }, { unique: true });
ReviewSchema.index({ listing: 1, createdAt: -1 });

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);
