import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String }, // اختياري في حال استخدام Google Auth مستقبلاً
  name: { type: String, required: true },
  
  // 👇 الحقل الجديد للصورة
  image: { type: String, default: "" },

  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  xpRequired: { type: Number, default: 100 },
  currentStreak: { type: Number, default: 0 },
}, { timestamps: true });

const User = models.User || model('User', UserSchema);

export default User;