# Document Intelligence Platform

A comprehensive platform for uploading, processing, and interacting with documents using AI (RAG).

## Features
- **Multi-user Isolation**: Secure JWT authentication with **Google OAuth** and email/password sign-in, featuring strict data partitioning.
- **Batch Document Processing**: High-performance pipeline for **PDF, DOCX, and PPTX** extraction with **multi-file batch upload** support.
- **Context Workspace**: Explicitly select specific documents for targeted chat analysis with **sticky per-chat memory**.
- **Intelligent RAG**: Hybrid retrieval logic featuring **Explicit Filter Selection** and fallback MongoDB Atlas Vector Search.
- **Grounded AI Chat**: Conversational interface with **document-grouped source citations** and a **50-chunk context safety threshold**.
- **Premium UI**: Modern, responsive design built with Next.js 15 and Framer Motion.

## High-Level Architecture

```mermaid
graph TD
    User((User))
    UI[Next.js Frontend]
    API[Express Backend]
    DB[(MongoDB Atlas)]
    AI[Gemini AI / Embeddings]

    User -->|Upload/Query| UI
    UI -->|HTTPS| API
    API -->|Auth/CRUD| DB
    
    subgraph "Processing Pipeline"
    API -->|Extract Text| Extractor[Parser: PDF/DOCX/PPTX]
    Extractor -->|Chunking| Chunker[Text Chunker]
    Chunker -->|Embed| AI
    AI -->|Vectors| API
    API -->|Store Chunks| DB
    end

    subgraph "Retrieval Flow (RAG)"
    API -->|1. Query Vector| AI
    AI -->|2. Embedding| API
    UI -->|3. Manual Filter| API
    API -->|4. Get Selected Docs| DB
    API -->|5. Vector Search (Fallback)| DB
    DB -->|6. Chunks| API
    API -->|7. Prompt + Context| AI
    AI -->|8. Grounded Response| API
    end
```

## Setup Instructions

### Backend
1. `cd Backend`
2. `npm install`
3. Create `.env` from `.env.example` and add your keys.
4. `npm run dev`

### Frontend
1. `cd Frontend`
2. `npm install`
3. `npm run dev`

## Tech Stack
- **Frontend**: Next.js 15, Tailwind CSS, Framer Motion, Lucide Icons, Axios.
- **Backend**: Node.js, Express, TypeScript, Mongoose.
- **Database**: MongoDB (Atlas Vector Search enabled).
- **AI**: Google Gemini (2.5 Flash + Embedding-001).
