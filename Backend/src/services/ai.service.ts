import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

export async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "embedding-001" });
  const result = await model.embedContent(text);
  const embedding = result.embedding;
  return embedding.values;
}

export async function generateChatResponse(
  query: string, 
  context: string, 
  history: { role: 'user' | 'assistant', content: string }[] = []
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
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

  const result = await chat.sendMessage(prompt);
  const response = await result.response;
  return response.text();
}
