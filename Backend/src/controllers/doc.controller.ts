import { Request, Response } from 'express';
import Document from '../models/Document.js';
import { processDocument } from '../services/processing.service.js';
import * as fs from 'fs';
import * as path from 'path';

export const uploadDocument = async (req: any, res: Response) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const { originalname, mimetype, size, path: filePath } = req.file;
  const userId = req.user.id;

  try {
    const doc = await Document.create({
      userId,
      fileName: originalname,
      fileType: mimetype,
      fileUrl: filePath,
      status: 'pending',
      metadata: { size }
    });

    // Run processing in background
    processDocument(userId, doc._id.toString(), filePath, mimetype);

    res.status(201).json(doc);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getDocuments = async (req: any, res: Response) => {
  const userId = req.user.id;
  try {
    const docs = await Document.find({ userId }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteDocument = async (req: any, res: Response) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    await Document.findOneAndDelete({ _id: id, userId });
    // In a real app, delete chunks and the file as well
    res.json({ message: 'Document deleted' });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
