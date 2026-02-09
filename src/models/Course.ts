import mongoose, { Schema, model, models } from 'mongoose';

const CourseSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  // بيانات الكورس
  title: { type: String, required: true },
  description: { type: String },
  image: { type: String }, // صورة الكورس
  link: { type: String }, // رابط الكورس التعليمي
  
  // الحالة
  status: { type: String, default: 'idle' }, // idle, in_progress, completed
  
  // بيانات الشهادة (عند الانتهاء)
  certificateTitle: { type: String },
  certificateLink: { type: String },
  certificateImage: { type: String }, // صورة الشهادة

  xpReward: { type: Number, default: 1000 }, // مكافأة دسمة للكورسات
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

const Course = models.Course || model('Course', CourseSchema);
export default Course;