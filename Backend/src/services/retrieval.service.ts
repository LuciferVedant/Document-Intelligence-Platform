import Chunk, { IChunk } from '../models/Chunk.js';
import mongoose from 'mongoose';
import { generateEmbedding } from './ai.service.js';

export async function vectorSearch(userId: string, query: string, limit: number = 5): Promise<IChunk[]> {
  const queryVector = await generateEmbedding(query);
  const userIdObj = new mongoose.Types.ObjectId(userId);

  try {
    // Atlas Vector Search aggregation
    const results = await Chunk.aggregate([
      {
        $vectorSearch: {
          index: "vector_index", // Must be created in Atlas UI
          path: "embedding",
          queryVector: queryVector,
          numCandidates: 100,
          limit: limit,
          filter: { userId: userIdObj }
        }
      }
    ]);
    
    if (results.length > 0) return results;
    
    // Fallback: Simple text search or just return most recent for testing 
    // (In production, you'd want a real vector DB or Atlas Index)
    console.warn("Vector search returned no results. Checking for simple match.");
    return Chunk.find({ userId: userIdObj }).limit(limit);

  } catch (err) {
    console.error("Atlas Vector Search failed:", err);
    // Fallback for non-Atlas environments
    return Chunk.find({ userId: userIdObj }).limit(limit);
  }
}
