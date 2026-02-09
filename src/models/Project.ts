import mongoose, { Schema, model, models } from 'mongoose';

const ProjectSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  link: { type: String },
  isFocus: { type: Boolean, default: false },
  
  // 👇 الحقل الجديد: مصفوفة نصوص لتخزين التقنيات
  tags: { type: [String], default: [] }, 

  // حقول التسليم
  githubLink: { type: String },
  demoLink: { type: String },
  image: { type: String },
  finalTitle: { type: String },
  finalDescription: { type: String },

  status: { type: String, default: 'active' }, 
  xpReward: { type: Number, default: 500 },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

const Project = models.Project || model('Project', ProjectSchema);
export default Project;