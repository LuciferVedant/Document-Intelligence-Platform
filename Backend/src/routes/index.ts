import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import * as docController from '../controllers/doc.controller';
import * as chatController from '../controllers/chat.controller';
import { authMiddleware } from '../middleware/auth';
import multer from 'multer';
import path from 'path';

const router = Router();

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Ensure uploads folder exists
import * as fs from 'fs';
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Auth
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// Docs
router.post('/docs/upload', authMiddleware, upload.single('file'), docController.uploadDocument);
router.get('/docs', authMiddleware, docController.getDocuments);
router.delete('/docs/:id', authMiddleware, docController.deleteDocument);

// Chat
router.post('/chat/ask', authMiddleware, chatController.askQuestion);
router.get('/chat', authMiddleware, chatController.getChats);
router.get('/chat/:id', authMiddleware, chatController.getChatById);

export default router;
