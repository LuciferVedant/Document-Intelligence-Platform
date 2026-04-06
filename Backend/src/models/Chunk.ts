import mongoose, { Schema, Document } from 'mongoose';

export interface IChunk extends Document {
  userId: mongoose.Types.ObjectId;
  docId: mongoose.Types.ObjectId;
  content: string;
  embedding: number[];
  metadata: {
    pageNumber?: number;
    chunkIndex: number;
  };
}

const ChunkSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  docId: { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
  content: { type: String, required: true },
  embedding: { type: [Number], required: true }, // For Atlas Vector Search
  metadata: {
    pageNumber: { type: Number },
    chunkIndex: { type: Number, required: true }
  }
});

// Index for vector search (Atlas) will be created in UI, but we can define the schema here
export default mongoose.model<IChunk>('Chunk', ChunkSchema);
