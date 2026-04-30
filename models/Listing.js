import mongoose from 'mongoose';
import slugify from 'slugify';
import { localizedStringSchema } from '@/lib/i18n';
import { SUPPORTED_CURRENCIES } from '@/lib/currencies';

const ListingSchema = new mongoose.Schema(
  {
    // ─── Champs multilingues ��────────────────────────────────
    title: localizedStringSchema(true),       // fr required
    description: localizedStringSchema(true),  // fr required
    rules: localizedStringSchema(false),       // optionnel

    slug: {
      type: String,
      unique: true,
    },
    type: {
      type: String,
      enum: [
        'apartment', 'villa', 'studio', 'gite', 'house', 'space',
        'chambre_hotes', 'chalet', 'camping', 'ferme', 'bungalow',
        'hotel', 'rare', 'village', 'bateau',
      ],
      required: [true, 'Le type de bien est requis'],
    },
    images: {
      type: [String],
      default: [],
    },
    location: {
      address: { type: String, required: [true, "L'adresse est requise"] },
      city: { type: String, required: [true, 'La ville est requise'] },
      region: String,
      country: { type: String, default: 'France' },
      zipCode: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    capacity: {
      type: Number,
      required: [true, 'La capacite est requise'],
      min: 1,
    },
    bedrooms: {
      type: Number,
      required: [true, 'Le nombre de chambres est requis'],
      min: 0,
    },
    bathrooms: {
      type: Number,
      default: 1,
      min: 1,
    },
    beds: {
      type: Number,
      default: 1,
      min: 1,
    },
    // Montant en centimes (de la devise du listing)
    pricePerNight: {
      type: Number,
      required: [true, 'Le prix par nuit est requis'],
      min: 0,
    },
    cleaningFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Devise du listing
    currency: {
      type: String,
      enum: SUPPORTED_CURRENCIES,
      default: 'EUR',
    },
    // Sejour minimum / maximum (en nuits)
    minNights: {
      type: Number,
      default: 1,
      min: 1,
    },
    maxNights: {
      type: Number,
      default: 90,
      min: 1,
    },
    // Tarification flexible : surcharge weekend (vendredi + samedi soir)
    weekendPricePerNight: {
      type: Number,
      default: null, // null = meme prix que pricePerNight
      min: 0,
    },
    // Tarification saisonniere
    seasonalPricing: [
      {
        label: localizedStringSchema(false), // multilingue
        start: Date,
        end: Date,
        pricePerNight: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    amenities: {
      type: [String],
      default: [],
    },

    // ─── Champs enrichis ─────────────────────────────────────────
    // Surface habitable
    surface: { type: Number, default: null },   // m²
    // Nb de WC (peut différer de bathrooms)
    toilets: { type: Number, default: null },
    // Nb d'étages
    floors: { type: Number, default: null },

    // Label / certification (Gîtes de France, Clévacances, Meublé de tourisme…)
    label: { type: String, default: null },  // texte libre, ex: "Gîtes de France 3 épis"
    stars: { type: Number, min: 1, max: 5, default: null }, // étoiles ou épis du label

    // Thèmes / ambiance (libre, non enuméré)
    themes: { type: [String], default: [] },      // ex: 'famille', 'romantique', 'nature', 'luxe'
    // Activités à proximité (libre)
    activities: { type: [String], default: [] },  // ex: 'surf', 'randonnee', 'velo', 'ski', 'peche'
    // Environnement (libre)
    environment: { type: [String], default: [] }, // ex: 'mer', 'montagne', 'campagne', 'foret', 'lac'

    // Politique d'annulation
    cancellationPolicy: { type: String, default: null }, // 'flexible' | 'moderate' | 'strict' | 'non_refundable'

    // Dépôt de garantie (centimes)
    deposit: { type: Number, default: null },

    // Taxe de séjour (centimes/personne/nuit)
    taxeSejour: { type: Number, default: null },

    // Infos hébergeur
    host: {
      name:      { type: String, default: null },
      languages: { type: [String], default: [] }, // ex: ['fr', 'en']
    },

    // Données libres extraites par l'IA (tout ce qui ne rentre pas dans les autres champs)
    extras: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Distances en metres (null = non renseignee)
    distances: {
      transport: { type: Number, default: null }, // transports en commun
      beach:     { type: Number, default: null }, // plage
      center:    { type: Number, default: null }, // centre-ville/village
      coast:     { type: Number, default: null }, // cote / bord de mer
      lake:      { type: Number, default: null }, // lac
      ski:       { type: Number, default: null }, // domaine skiable
    },
    checkInTime: { type: String, default: '15:00' },
    checkOutTime: { type: String, default: '11:00' },
    instantBooking: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    blockedDates: [
      {
        start: Date,
        end: Date,
      },
    ],
  },
  { timestamps: true }
);

// Genere le slug depuis title.fr avant sauvegarde
ListingSchema.pre('save', async function () {
  // Supporter l'ancien format (title string) et le nouveau (title.fr)
  const titleFr = typeof this.title === 'string' ? this.title : this.title?.fr;
  if (!titleFr) return;

  const titleChanged =
    typeof this.title === 'string'
      ? this.isModified('title')
      : this.isModified('title.fr');

  if (!titleChanged) return;

  let base = slugify(titleFr, { lower: true, strict: true });
  let slug = base;
  let count = 1;

  while (await mongoose.models.Listing.findOne({ slug, _id: { $ne: this._id } })) {
    slug = `${base}-${count++}`;
  }

  this.slug = slug;
});

// Index pour la recherche
ListingSchema.index({ 'location.city': 1, pricePerNight: 1 });
ListingSchema.index({ type: 1 });
ListingSchema.index({ isPublished: 1, isFeatured: 1 });
ListingSchema.index({ owner: 1 });
ListingSchema.index({ 'title.fr': 'text' });

export default mongoose.models.Listing || mongoose.model('Listing', ListingSchema);
