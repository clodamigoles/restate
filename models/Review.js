import mongoose from 'mongoose';

const SubRatingsSchema = new mongoose.Schema({
  cleanliness:    { type: Number, min: 0, max: 10, default: null },
  communication:  { type: Number, min: 0, max: 10, default: null },
  equipment:      { type: Number, min: 0, max: 10, default: null },
  valueForMoney:  { type: Number, min: 0, max: 10, default: null },
}, { _id: false });

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
      default: null,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    // Pour les avis importés depuis des sources externes
    reviewerName: { type: String, default: null },
    title:        { type: String, maxlength: 200, default: null },
    isImported:   { type: Boolean, default: false },
    source:       { type: String, default: null },

    rating: {
      type: Number,
      required: [true, 'La note est requise'],
      min: 1,
      max: 10,
    },
    subRatings: { type: SubRatingsSchema, default: null },

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

// Un seul avis par user par annonce (uniquement pour les vrais users)
ReviewSchema.index(
  { user: 1, listing: 1 },
  { unique: true, partialFilterExpression: { user: { $ne: null } } }
);
ReviewSchema.index({ listing: 1, createdAt: -1 });

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);
