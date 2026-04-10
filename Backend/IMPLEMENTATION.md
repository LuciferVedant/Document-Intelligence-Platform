# Backend Implementation Guide

This document provides a detailed technical overview of the Document Intelligence Platform's backend implementation.

## 1. System Architecture
The backend is built as a RESTful API service using **Node.js** and **Express**, written entirely in **TypeScript**. It follows a modular architecture:
- **Controllers**: Handle HTTP requests and response orchestration.
- **Services**: Contain core business logic (AI, processing, retrieval).
- **Models**: Mongoose schemas for MongoDB interaction.
- **Middleware**: Authentication, file upload handling, and error processing.

### Tech Stack
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB (with Atlas Vector Search)
- **AI Integration**: Google Generative AI (@google/generative-ai)
- **File Processing**: pdf-parse, mammoth, officeparser
- **Auth**: jsonwebtoken, bcryptjs, google-auth-library

---

## 2. Database Schema (MongoDB)

Our data model is designed for efficient retrieval and support for Retrieval-Augmented Generation (RAG).

### User Model (`User.ts`)
Stores user identity and authentication details.
- `name`: Full name of the user.
- `email`: Primary identifier (unique).
- `password`: Hashed password (for local auth).
- `googleId`: Unique identifier for Google OAuth users.

### Document Model (`Document.ts`)
Tracks metadata and status for uploaded files.
- `userId`: Reference to the owner.
- `fileName`: Original file name.
- `fileType`: MIME type (PDF, DOCX, PPTX supported).
- `status`: Processing state (`pending`, `processing`, `completed`, `error`).
- `chunkCount`: Total number of segments extraction from the file (used for context workspace tracking).
- `metadata`: Stores file size and potential processing errors.

### Chunk Model (`Chunk.ts`)
Stores granular snippets of documents with their high-dimensional embeddings.
- `docId`: Reference to the source document.
- `content`: Plain text snippet.
- `embedding`: Vector representation (768 or 1536 dims).
- `metadata`: Stores chunk index for reconstruction.

### Chat Model (`Chat.ts`)
Persistent storage for conversational history.
- `title`: Auto-generated title from the first query.
- `messages`: Array of message objects:
    - `role`: `user` or `assistant`.
    - `content`: Message text.
    - `citations`: List of document snippets used for the answer.
- `selectedDocIds`: List of documents chosen for this specific conversation to maintain "sticky" context state.

---

## 3. Core Functionalities & Implementation

### A. Document Upload & Processing Pipeline
When a file is uploaded via `POST /api/docs/upload`, the following sequence occurs:
1. **Storage**: Multer saves the file temporarily in the `uploads/` directory.
2. **Persistence**: A Document record is created with `status: pending`.
3. **Extraction**: `extractText()` uses the appropriate library based on MIME type:
   - `pdf-parse` for PDFs.
   - `mammoth` for DOCX.
   - `officeparser` for PPTX.
4. **Chunking**: `chunkText()` splits the text into pieces (default: 1000 chars with 200 overlap) to preserve context.
5. **Embedding**: Each chunk is sent to the AI service to generate a vector using `gemini-embedding-2-preview`.
6. **Vector Storage**: Chunks and embeddings are stored in MongoDB.
7. **Cleanup**: The temporary file is deleted, the document status is set to `completed`, and the total `chunkCount` is saved.

### B. Dual-Mode Retrieval (RAG)
When a user asks a question via `POST /api/chat/ask`:
1. **Explicit Selection Mode (Priority)**: If `selectedDocIds` are provided, the system retrieves *all* chunks belonging to those specific files.
2. **Fuzzy Search Mode (Fallback)**: If no documents are selected, the system falls back to **Atlas Vector Search** to find relevant snippets.
3. **Context Construction**: Relevant chunks are formatted into a context block.
4. **Context Guard**: A strict **50-chunk limit** is enforced to prevent LLM context overflow and optimize performance.
5. **Prompt Engineering**: A prompt is built combining the Context, User Query, and History.
6. **LLM Generation**: **Gemini 3 Flash** (or latest) generates an grounded answer.
7. **Citations**: Sources are returned and grouped by document in the frontend.

---

## 4. API Reference

| Endpoint | Method | Auth | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | POST | No | Create a new local account. |
| `/api/auth/login` | POST | No | Authenticate and receive a JWT. |
| `/api/auth/google` | POST | No | Google OAuth server-side verification. |
| `/api/docs/upload` | POST | Yes | Batch upload PDF/DOCX/PPTX (multipart, up to 10 files). |
| `/api/docs` | GET | Yes | List all uploaded documents for the user. |
| `/api/docs/:id` | DELETE| Yes | Delete a document record. |
| `/api/chat/ask` | POST | Yes | Main AI query endpoint (RAG). |
| `/api/chat` | GET | Yes | List conversation history. |
| `/api/chat/:id` | GET | Yes | Get a specific conversation with messages. |

---

## 5. Security & Error Handling
- **JWT Middleware**: Validates bearer tokens for all protected routes.
- **Retry Logic**: The `withRetry` helper wraps AI service calls to handle transient 503/429 errors from the Gemini API with exponential backoff.
- **Input Validation**: Multer restricts file types, and Express handles basic request sanitization.
