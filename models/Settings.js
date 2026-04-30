import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'global', unique: true },
  bankIban: { type: String, default: '' },
  bankBic: { type: String, default: '' },
  bankBeneficiary: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
