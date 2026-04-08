import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const officeParser = require('officeparser');

import * as fs from 'fs';
import { generateEmbedding } from './ai.service.js';
import Chunk from '../models/Chunk.js';
import Document from '../models/Document.js';
import mongoose from 'mongoose';

export async function extractText(filePath: string, fileType: string): Promise<string> {
  const dataBuffer = fs.readFileSync(filePath);
  
  if (fileType === 'application/pdf') {
    const data = await pdf(dataBuffer);
    return data.text;
  } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer: dataBuffer });
    return result.value;
  } else if (fileType.includes('presentation') || fileType.includes('powerpoint')) {
    // officeParser is more flexible for pptx
    return new Promise((resolve, reject) => {
      officeParser.parseOffice(filePath, (data: any, err: any) => {
        if (err) return reject(err);
        resolve(data);
      });
    });
  }
  
  throw new Error('Unsupported file type');
}

export function chunkText(text: string, size: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let index = 0;
  
  while (index < text.length) {
    const chunk = text.slice(index, index + size);
    chunks.push(chunk);
    index += (size - overlap);
  }
  
  return chunks;
}

export async function processDocument(userId: string, docId: string, filePath: string, fileType: string) {
  try {
    const userIdObj = new mongoose.Types.ObjectId(userId);
    const docIdObj = new mongoose.Types.ObjectId(docId);

    // Update status to processing
    await Document.findByIdAndUpdate(docId, { status: 'processing' });

    // 1. Extract
    console.log(`[Processing] Extracting text from ${fileType}...`);
    const text = await extractText(filePath, fileType);
    console.log(`[Processing] Extracted ${text.length} characters.`);
    
    // 2. Chunk
    const chunks = chunkText(text);
    console.log(`[Processing] Split into ${chunks.length} chunks.`);
    
    // 3. Embed & Store
    for (let i = 0; i < chunks.length; i++) {
        console.log(`[Processing] Generating embedding for chunk ${i+1}/${chunks.length}...`);
        const content = chunks[i];
        const embedding = await generateEmbedding(content);
        
        await Chunk.create({
            userId: userIdObj,
            docId: docIdObj,
            content,
            embedding,
            metadata: {
                chunkIndex: i
            }
        });
    }

    console.log(`[Processing] Successfully completed ${docId}`);

    // 4. Update status to completed
    await Document.findByIdAndUpdate(docId, { status: 'completed' });
    
    // Cleanup temporary file
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
    
  } catch (error: any) {
    console.error(`[Processing Error] Document ${docId}:`, error);
    await Document.findByIdAndUpdate(docId, { 
        status: 'error', 
        'metadata.error': error.message 
    });
  }
}
