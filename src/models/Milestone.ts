import mongoose from "mongoose";

const StepSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  // ✅ هذا السطر كان ناقصاً، وهو المسؤول عن حفظ نقاط الخبرة لكل مهمة
  xp: {
    type: Number,
    default: 100
  }
});

const MilestoneSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    steps: [StepSchema], // استخدام المخطط الفرعي
    isCompleted: {
      type: Boolean,
      default: false,
    },
    xpReward: {
      type: Number,
      default: 1000, // مكافأة إنهاء المايلستون كاملاً (بجانب نقاط المهام)
    },
  },
  { timestamps: true }
);

// منع إعادة تجميع المودل عند التحديث السريع في Next.js
const Milestone = mongoose.models.Milestone || mongoose.model("Milestone", MilestoneSchema);

export default Milestone;