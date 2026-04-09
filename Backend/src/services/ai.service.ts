import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

/**
 * Helper to handle retries for transient errors (e.g., 503 Service Unavailable, 429 Too Many Requests).
 * Implements exponential backoff.
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> {
  let lastError: any;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMessage = error.message || "";
      const isTransient = errorMessage.includes('503') || 
                          errorMessage.includes('429') || 
                          errorMessage.toLowerCase().includes('high demand') ||
                          error.status === 503 || 
                          error.status === 429;
      
      if (!isTransient || i === maxRetries) {
        console.error(`AI Service: Final failure after ${i} retries. Error: ${errorMessage}`);
        throw error;
      }
      
      const delay = initialDelay * Math.pow(2, i);
      console.warn(`AI Service: Transient error encountered (${errorMessage.substring(0, 50)}...). Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const modelName = process.env.AI_EMBEDDING_MODEL || "gemini-embedding-2-preview";
  const model = genAI.getGenerativeModel({ model: modelName });
  
  const result = await withRetry(() => model.embedContent(text));
  const embedding = result.embedding;
  return embedding.values;
}

export async function generateChatResponse(
  query: string, 
  context: string, 
  history: { role: 'user' | 'assistant', content: string }[] = []
): Promise<string> {
  const modelName = process.env.AI_CHAT_MODEL || "gemini-3-flash-preview";
  const model = genAI.getGenerativeModel({ model: modelName });
  
  const prompt = `
    You are a Document Intelligence Assistant. 
    Use the following retrieved context to answer the user's question.
    If the context does not contain enough information, say "I don't have enough information in the uploaded documents to answer that."
    
    Context:
    ${context}
    
    User Question:
    ${query}
    
    Answer clearly and cite the sources if possible.
  `;

  const chat = model.startChat({
    history: history.map(h => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }],
    })),
  });

  const result = await withRetry(() => chat.sendMessage(prompt));
  const response = await result.response;
  return response.text();
}
