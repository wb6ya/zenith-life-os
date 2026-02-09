import mongoose, { Schema, model, models } from 'mongoose';

const QuestSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['daily', 'weekly', 'monthly', 'milestone'], required: true },
  
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  xpReward: { type: Number, required: true },
  
  // تتبع التقدم (مثلاً: اقرأ 50 صفحة)
  targetValue: { type: Number, default: 1 }, // الهدف
  currentValue: { type: Number, default: 0 }, // واصل كم
  isCompleted: { type: Boolean, default: false },
  
  expiresAt: { type: Date }, // متى تنتهي المهمة (نهاية اليوم/الأسبوع)
}, { timestamps: true });

const Quest = models.Quest || model('Quest', QuestSchema);
export default Quest;