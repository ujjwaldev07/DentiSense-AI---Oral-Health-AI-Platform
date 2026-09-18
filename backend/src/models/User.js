import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, LANGUAGES } from '../config/constants.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER
    },
    preferredLanguage: {
      type: String,
      enum: Object.values(LANGUAGES),
      default: LANGUAGES.EN
    },
    oralHealthProfile: {
      ageGroup: {
        type: String,
        enum: ['child', 'teen', 'adult', 'senior', 'unspecified'],
        default: 'unspecified'
      },
      brushingFrequencyPerDay: {
        type: Number,
        default: 2
      },
      flossingHabit: {
        type: String,
        enum: ['daily', 'weekly', 'rarely', 'never'],
        default: 'rarely'
      },
      lastDentalVisit: {
        type: String,
        enum: ['less_than_6_months', '6_to_12_months', 'over_1_year', 'never'],
        default: '6_to_12_months'
      },
      hasDenturesOrBraces: {
        type: Boolean,
        default: false
      },
      tobaccoOrBetelNutUse: {
        type: Boolean,
        default: false
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLoginAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model('User', userSchema);
