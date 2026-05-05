import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'global', unique: true },

  // Identité du site
  siteName:        { type: String, default: '' },
  tagline:         { type: String, default: '' },
  siteDescription: { type: String, default: '' },

  // Contact public
  contactEmail:   { type: String, default: '' },
  contactPhone:   { type: String, default: '' },
  contactAddress: { type: String, default: '' },

  // Email (expéditeur côté serveur)
  emailFrom: { type: String, default: '' },

  // Réseaux sociaux
  socialFacebook:  { type: String, default: '' },
  socialInstagram: { type: String, default: '' },
  socialTwitter:   { type: String, default: '' },
  socialYoutube:   { type: String, default: '' },

  // Coordonnées bancaires
  bankIban:        { type: String, default: '' },
  bankBic:         { type: String, default: '' },
  bankBeneficiary: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
