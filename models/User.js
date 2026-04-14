import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n';
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from '@/lib/currencies';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom est requis'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email invalide'],
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est requis'],
      minlength: [6, 'Le mot de passe doit contenir au moins 6 caracteres'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'owner'],
      default: 'user',
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifyToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    // ─── Preferences i18n / devise ───────────────────────────
    preferredLocale: {
      type: String,
      enum: SUPPORTED_LOCALES,
      default: DEFAULT_LOCALE,
    },
    preferredCurrency: {
      type: String,
      enum: SUPPORTED_CURRENCIES,
      default: DEFAULT_CURRENCY,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

UserSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

if (process.env.NODE_ENV !== 'production' && mongoose.models.User) {
  mongoose.deleteModel('User');
}

export default mongoose.models.User || mongoose.model('User', UserSchema);
