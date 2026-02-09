import mongoose from "mongoose";

const MilestoneSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: { type: String },
  deadline: { type: Date },
  steps: [{ 
    title: String, 
    isCompleted: { type: Boolean, default: false } 
  }],
  isCompleted: { type: Boolean, default: false },
  xpReward: { type: Number, default: 1000 }, // مكافأة ضخمة
}, { timestamps: true });

export default mongoose.models.Milestone || mongoose.model("Milestone", MilestoneSchema);