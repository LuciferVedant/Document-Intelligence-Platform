import { Request, Response } from 'express';
import Chat from '../models/Chat';
import { vectorSearch } from '../services/retrieval.service';
import { generateChatResponse } from '../services/ai.service';
import mongoose from 'mongoose';

export const askQuestion = async (req: any, res: Response) => {
  const userId = req.user.id;
  const { query, chatId } = req.body;

  try {
    // 1. Retrieve history
    let chat = await Chat.findOne({ _id: chatId, userId });
    if (!chat) {
      chat = await Chat.create({ userId, title: query.slice(0, 30) });
    }

    const history = chat.messages.map(m => ({ role: m.role, content: m.content }));

    // 2. Vector Search for Context
    const contextChunks = await vectorSearch(userId, query);
    const contextText = contextChunks.map(c => c.content).join('\n\n');

    // 3. Generate Answer
    const answer = await generateChatResponse(query, contextText, history);

    // 4. Update Chat History
    const userMessage = { role: 'user' as const, content: query };
    const assistantMessage = { 
        role: 'assistant' as const, 
        content: answer,
        citations: contextChunks.map(c => ({
            docId: c.docId,
            docName: "Document", // We'd ideally join this, but for now we'll just store basic info
            snippet: c.content.slice(0, 100) + "..."
        }))
    };

    chat.messages.push(userMessage);
    chat.messages.push(assistantMessage);
    await chat.save();

    res.json({ answer, chatId: chat._id, citations: assistantMessage.citations });

  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getChats = async (req: any, res: Response) => {
  const userId = req.user.id;
  try {
    const chats = await Chat.find({ userId }).sort({ updatedAt: -1 });
    res.json(chats);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getChatById = async (req: any, res: Response) => {
    const userId = req.user.id;
    const { id } = req.params;
    try {
      const chat = await Chat.findOne({ _id: id, userId });
      res.json(chat);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  };
