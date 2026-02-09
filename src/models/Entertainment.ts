import mongoose, { Schema, model, models } from 'mongoose';

const EntertainmentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  type: { type: String, required: true, enum: ['game', 'movie', 'manga'] },
  image: { type: String }, // يقبل رابط URL أو Base64
  description: { type: String },
  rating: { type: String },
  status: { type: String, default: 'pending' }, // active, pending, completed
  apiId: { type: String }, // لمنع التكرار
  createdAt: { type: Date, default: Date.now },
});

const Entertainment = models.Entertainment || model('Entertainment', EntertainmentSchema);
export default Entertainment;