import mongoose, { Schema, model, models } from 'mongoose';

const ExerciseSchema = new Schema({
  name: { type: String, required: true },
  mediaUrl: { type: String }, // رابط الفيديو/GIF
  mediaType: { type: String, enum: ['video', 'image', 'gif'], default: 'video' },
  sets: { type: Number, default: 3 }, // عدد التكرارات (Loops)
  durationSeconds: { type: Number }, // مدة التمرين بالثواني (إذا كان بالوقت)
  reps: { type: Number }, // أو بالعدد
  restBetweenSets: { type: Number, default: 30 }, // راحة بين التكرارات
  restAfterExercise: { type: Number, default: 60 }, // راحة بعد التمرين كامل
});

const DaySchema = new Schema({
  dayNumber: { type: Number, required: true }, // اليوم الأول، الثاني...
  title: { type: String, default: "Workout Day" },
  isRestDay: { type: Boolean, default: false }, // هل هو يوم راحة؟
  restImage: { type: String }, // صورة يوم الراحة
  exercises: [ExerciseSchema], // قائمة التمارين لهذا اليوم
});

const WorkoutPlanSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true }, // اسم الجدول (مثلاً: Push Pull Legs)
  description: { type: String },
  isActive: { type: Boolean, default: true }, // الجدول الحالي
  days: [DaySchema], // مصفوفة الأيام
  currentDayIndex: { type: Number, default: 0 }, // وين واصل المستخدم؟ (اليوم 0، 1، 2...)
}, { timestamps: true });

const WorkoutPlan = models.WorkoutPlan || model('WorkoutPlan', WorkoutPlanSchema);
export default WorkoutPlan;