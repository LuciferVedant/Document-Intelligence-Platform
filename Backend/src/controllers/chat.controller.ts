import Document from '../models/Document.js';
import { Request, Response } from 'express';
import Chat from '../models/Chat.js';
import { vectorSearch, getChunksByDocs } from '../services/retrieval.service.js';
import { generateChatResponse } from '../services/ai.service.js';
import mongoose from 'mongoose';

export const askQuestion = async (req: any, res: Response) => {
  const userId = req.user.id;
  const { query, chatId, selectedDocIds } = req.body;

  try {
    // 1. Retrieve history
    let chat = await Chat.findOne({ _id: chatId, userId });
    if (!chat) {
      chat = await Chat.create({ userId, title: query.slice(0, 30) });
    }

    const history = chat.messages.map(m => ({ role: m.role, content: m.content }));

    // 2. Retrieval Logic
    let contextChunks = [];
    let contextText = '';

    if (selectedDocIds && selectedDocIds.length > 0) {
        // Mode 1: Explicit Filtering (Get all chunks for selected docs)
        contextChunks = await getChunksByDocs(userId, selectedDocIds);
        
        // Fetch filenames for labeling
        const docs = await Document.find({ _id: { $in: selectedDocIds }, userId });
        const docMap = new Map(docs.map(d => [d._id.toString(), d.fileName]));

        contextText = contextChunks.map(c => 
            `[Source: ${docMap.get(c.docId.toString()) || 'Unknown Document'}]\n${c.content}`
        ).join('\n\n');
    } else {
        // Mode 2: Vector Search (Default fallback)
        contextChunks = await vectorSearch(userId, query);
        contextText = contextChunks.map(c => c.content).join('\n\n');
    }

    // 3. Generate Answer
    const answer = await generateChatResponse(query, contextText, history);

    // 4. Update Chat History
    const userMessage = { role: 'user' as const, content: query, timestamp: new Date() };
    
    // For citations, we want to know the doc names too
    const docs = await Document.find({ _id: { $in: contextChunks.map(c => c.docId) }, userId });
    const docMap = new Map(docs.map(d => [d._id.toString(), d.fileName]));

    const assistantMessage = { 
        role: 'assistant' as const, 
        content: answer,
        timestamp: new Date(),
        citations: contextChunks.map(c => ({
            docId: c.docId,
            docName: docMap.get(c.docId.toString()) || "Document",
            snippet: c.content.slice(0, 100) + "..."
        }))
    };

    chat.messages.push(userMessage);
    chat.messages.push(assistantMessage);
    chat.selectedDocIds = selectedDocIds || [];
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

export const deleteChat = async (req: any, res: Response) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const result = await Chat.findOneAndDelete({ _id: id, userId });
    if (!result) {
      return res.status(404).json({ message: "Chat not found" });
    }
    res.json({ message: "Chat deleted successfully" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
