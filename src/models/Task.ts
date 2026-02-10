import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' }, // نوع المهمة
  category: {
    type: String,
    enum: [
      'fitness', 'project', 'reading', 'learning', 'general',
      'health', 'planning', 'mindset', 'system', 'finance', 'career'
    ],
    default: 'general'
  },
  xpReward: { type: Number, default: 50 },
  isCompleted: { type: Boolean, default: false },
  sourceId: { type: String }, // لربط المهمة بمشروع معين أو كتاب معين
  expiresAt: { type: Date, required: true }, // متى تنتهي المهمة (نهاية اليوم/الاسبوع)
}, { timestamps: true });

export default mongoose.models.Task || mongoose.model("Task", TaskSchema);