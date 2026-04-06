import mongoose, { Schema, Document } from 'mongoose';

export interface IDocument extends Document {
  userId: mongoose.Types.ObjectId;
  fileName: string;
  fileType: string;
  fileUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  metadata: {
    size: number;
    pageCount?: number;
    error?: string;
  };
  createdAt: Date;
}

const DocumentSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  fileUrl: { type: String, required: true },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'error'], default: 'pending' },
  metadata: {
    size: { type: Number },
    pageCount: { type: Number },
    error: { type: String }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IDocument>('Document', DocumentSchema);
