import mongoose from 'mongoose';

export interface IUser {
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

// Check if the model is already defined to prevent OverwriteModelError
export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema); 