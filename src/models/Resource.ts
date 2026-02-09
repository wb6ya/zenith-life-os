import mongoose, { Schema, model, models } from 'mongoose';

const ResourceSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, default: "" }, 
  image: { type: String, default: "" }, 
  
  // 👇 تأكد أن هذا السطر موجود! بدونه لن يتم حفظ الرابط
  link: { type: String, default: "" },

  type: { type: String, enum: ['book', 'course'], default: 'book' },
  totalUnits: { type: Number, required: true },
  completedUnits: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['idle', 'reading', 'completed'], 
    default: 'idle' 
  },
}, { timestamps: true });

const Resource = models.Resource || model('Resource', ResourceSchema);

export default Resource;