import { Request, Response } from 'express';
import Document from '../models/Document.js';
import { processDocument } from '../services/processing.service.js';
import * as fs from 'fs';
import * as path from 'path';

export const uploadDocument = async (req: any, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) return res.status(400).json({ message: 'No files uploaded' });

  const userId = req.user.id;
  const createdDocs = [];

  try {
    for (const file of files) {
        const { originalname, mimetype, size, path: filePath } = file;
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
        createdDocs.push(doc);
    }

    res.status(201).json(createdDocs);
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
