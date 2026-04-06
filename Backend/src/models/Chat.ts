import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  citations?: {
    docId: mongoose.Types.ObjectId;
    docName: string;
    pageNumber?: number;
    snippet: string;
  }[];
}

export interface IChat extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  citations: [{
    docId: { type: Schema.Types.ObjectId, ref: 'Document' },
    docName: { type: String },
    pageNumber: { type: Number },
    snippet: { type: String }
  }]
});

const ChatSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, default: 'New Conversation' },
  messages: [MessageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model<IChat>('Chat', ChatSchema);
