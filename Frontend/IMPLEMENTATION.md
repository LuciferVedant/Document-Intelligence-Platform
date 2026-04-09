# Frontend Implementation Guide

This document provides a detailed technical overview of the Document Intelligence Platform's frontend implementation.

## 1. Technology Stack
The frontend is a modern web application built with **Next.js 14** using the **App Router** architecture.
- **Core**: React 18, TypeScript, Next.js.
- **Styling**: Tailwind CSS for utility-first design, Framer Motion for premium animations.
- **State Management**: Redux Toolkit.
- **Icons**: Lucide React.
- **Notifications**: Sonner.
- **HTTP Client**: Axios.

---

## 2. Architecture & State Management

### A. Redux Store (`store/`)
We use Redux Toolkit for global state that needs to persist or be shared across remote parts of the app.
- **Auth Slice**: Manages user session, token, and profile.
    - Persists the JWT and user object to `localStorage`.
    - Handles login/logout actions and synchronizes across the app.
- **Sticky Context Persistence**: Document selections (`selectedDocIds`) are persisted within the Chat model in the backend, and synchronized on the frontend during `loadChat` and `startNewChat` operations to maintain a consistent workspace.

### B. Service Layer (`lib/api.ts`)
A centralized Axios instance handles all communication with the Backend.
- **Request Interceptor**: Automatically attaches the `Authorization: Bearer <token>` header to every request if the user is logged in.
- **Response Interceptor**: 
    - Globally handles `401 Unauthorized` errors by clearing local storage and redirecting to the login page.
    - Provides global error toast notifications for API failures using `sonner`.

### C. Custom Hooks
- **`useAuth`**: A convenience hook to access the current authentication state and dispatch auth actions.

---

## 3. Main Features & Implementation

### A. Authentication Flow
- **Registration/Login**: Standard forms that communicate with `/api/auth/register` and `/api/auth/login`. Successful login updates the Redux store and redirects to the dashboard.
- **Google OAuth**: Integrated using the Google Identity Service. The frontend receives a credential from Google and sends it to `/api/auth/google` for backend verification and JWT issuance.

### B. Advanced Chat & Workspace Interface (`app/chat/page.tsx`)
A premium, multi-pane UI for context-aware document interaction.
- **Context Workspace (Left Pane)**: 
    - **Explicit Document Selection**: Users toggle specific documents into the LLM context.
    - **Chunk Threshold Guard**: Real-time progress bar tracking the **50-chunk limit**.
    - **Validation**: Enforces the context limit with toast notifications and dynamic disabling of documents that would exceed the threshold.
- **Sidebar (Analysis History)**: Lists previous chat sessions. Includes search and session deletion.
- **Chat Window**:
    - **Message Rendering**: Differentiates between User and AI bubbles.
    - **Smart Citations**: Interactive pills that group snippets by document name, providing a cleaner "Connected Sources" view.
    - **Auto-scroll**: Smooth scroll to latest messages.
    - **Animations**: Framer Motion transitions for workspace toggle and message flows.

### C. Document Dashboard (`app/dashboard/page.tsx`)
Centralized document management and batch ingestion.
- **Batch File Upload**: Supports selecting up to 10 files (PDF, DOCX, PPTX) simultaneously.
- **Drag-and-Drop**: Interactive drop zone for batch ingestion.
- **Real-time Monitoring**: Polling-based status updates (Wait -> Index -> Ready).

---

## 4. Design Aesthetics
The UI follows a "Rich & Premium" design philosophy:
- **Glassmorphism**: Subtle background blurs on mobile overlays and sidebars.
- **Custom Scrollbars**: Minimalist scroll tracking.
- **Micro-animations**: Hover effects on cards, pulse animations during AI generation, and spring-based drawer transitions.
- **Responsive Layout**: Seamless transition from a multi-pane desktop view to a mobile-optimized drawer-based interface.

---

## 5. Directory Structure
```text
src/
├── app/            # Next.js App Router (Pages & Layouts)
├── components/     # Reusable UI components
├── hooks/          # Custom React hooks
├── lib/            # Utilities & API configuration
└── store/          # Redux Toolkit setup & slices
```
