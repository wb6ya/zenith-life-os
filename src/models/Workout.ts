import mongoose, { Schema, model, models } from 'mongoose';

const WorkoutSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  planId: { type: Schema.Types.ObjectId, ref: 'WorkoutPlan' }, // اختياري: لربطه بالخطة
  type: { type: String, default: 'Daily Session' },
  duration: { type: Number }, // بالدقائق (اختياري)
  xpEarned: { type: Number, required: true },
  completedAt: { type: Date, default: Date.now }, // تاريخ الإنجاز
  notes: { type: String } // ملاحظات مستقبلية
}, { timestamps: true });

// لمنع التكرار المفرط (اختياري)
// WorkoutSchema.index({ userId: 1, completedAt: -1 });

const Workout = models.Workout || model('Workout', WorkoutSchema);

export default Workout;