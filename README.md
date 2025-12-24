# 🚀 **DORA** - Document Retrieval Assistant

<div align="center">

![DORA Banner](https://img.shields.io/badge/DORA-AI%20Powered%20Document%20Intelligence-6366f1?style=for-the-badge&logo=robot&logoColor=white)

**Transform how you interact with documents using cutting-edge AI technology. DORA combines Google Drive integration, advanced RAG pipelines, and state-of-the-art language models to deliver instant, accurate answers from your document collection.**

[![Next.js](https://img.shields.io/badge/Next.js-14.2.35-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector%20DB-FF6F00?style=flat-square&logo=database&logoColor=white)](https://www.trychroma.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Railway](https://img.shields.io/badge/Railway-Deployed-0B0D0E?style=flat-square&logo=railway&logoColor=white)](https://railway.app/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=flat-square)](https://github.com/suryahanjaya/lenrag/graphs/commit-activity)

</div>

---

## 📑 **Table of Contents**

- [🎯 What is DORA?](#-what-is-dora)
- [✨ Key Features](#-key-features)
- [🏗️ System Architecture](#️-system-architecture)
- [� How It Works - Complete System Flow](#-how-it-works---complete-system-flow)
- [�🛠️ Complete Technology Stack](#️-complete-technology-stack)
- [🚀 Advanced Features Deep Dive](#-advanced-features-deep-dive)
- [📊 Performance Metrics](#-performance-metrics)
- [🌐 Deployment Options](#-deployment-options)
- [📋 Quick Start Guide](#-quick-start-guide)
- [📚 API Documentation](#-api-documentation)
- [🎨 Project Structure](#-project-structure)
- [🚦 Troubleshooting & FAQ](#-troubleshooting--faq)
- [🤝 Contributing](#-contributing)

---

## 🎯 **What is DORA?**

**DORA** (Document Retrieval Assistant) is an enterprise-grade, production-ready AI system that revolutionizes document management and knowledge retrieval. Built with modern technologies and optimized for performance across multiple platforms (Web, Android, iOS), DORA provides:

### **🌟 Core Capabilities**

| Feature | Description | Performance |
|---------|-------------|-------------|
| ⚡ **Lightning-Fast Processing** | Parallel document fetching and embedding | 60 concurrent fetches, 15 parallel embeddings |
| 🎯 **Precision AI Search** | Advanced semantic search with state-of-the-art models | 384-dim embeddings, 0.7 similarity threshold |
| 🔒 **Enterprise Security** | Google OAuth 2.0 with JWT token management | Industry-standard authentication |
| 📚 **Universal Format Support** | Google Docs, PDFs, DOCX, PPTX, TXT, Excel, HTML | 7+ file formats supported |
| 🌐 **Intelligent Fallback** | Seamlessly switches to general knowledge | No dead-ends in conversations |
| 💬 **Natural Conversations** | Chat in plain English with context-aware AI | Sub-second response times |
| 🔄 **Real-Time Streaming** | Progressive loading and live response generation | Server-Sent Events (SSE) |
| 📱 **Cross-Platform** | Web, Android, iOS support | Capacitor-powered mobile apps |
| 🐳 **Production-Ready** | Docker, Railway, Vercel deployment | Multi-environment support |
| 🛡️ **Duplicate Detection** | Automatic duplicate file prevention | Saves time and storage |

---

## ✨ **Key Features**

### 🆕 **Latest Features (December 2025)**

#### 1. **🛡️ Intelligent Duplicate Detection**
- **Automatic Duplicate Prevention**: Checks existing documents before upload
- **Smart Skipping**: Skips already-indexed files automatically
- **Storage Optimization**: Prevents redundant embeddings
- **User Feedback**: Clear notifications about skipped duplicates
- **Performance**: Zero overhead - checks happen in milliseconds

**How It Works:**
```python
# Before processing documents
existing_doc_ids = dora_pipeline.get_existing_document_ids(user_id, doc_ids)
new_documents = [doc for doc in all_documents if doc['id'] not in existing_doc_ids]
# Only process NEW documents!
```

#### 2. **📱 Mobile App Support (Android & iOS)**
- **Native Mobile Apps**: Built with Capacitor for native performance
- **Responsive Design**: Fully adaptive UI for all screen sizes
- **Touch-Optimized**: Gesture support, mobile-friendly interactions
- **Offline Capability**: Cache documents for offline access (coming soon)
- **Push Notifications**: Real-time updates (coming soon)

**Platforms:**
- 🤖 **Android**: APK available, Google Play Store (coming soon)
- 🍎 **iOS**: IPA available, App Store (coming soon)
- 🌐 **Web**: Progressive Web App (PWA) support

#### 3. **🚀 Ultra-Fast Parallel Processing**
- **60 Parallel Fetches**: Download 60 documents simultaneously
- **15 Parallel Embeddings**: Process 15 documents at once
- **Adaptive Batch Sizes**: Automatically adjusts based on environment
  - **Docker/Localhost**: 60 fetch, 15 embed (high performance)
  - **Railway**: 3 fetch, 1 embed (memory optimized)
  - **Vercel**: 1 fetch, 1 embed (ultra-conservative)

**Performance Comparison:**
| Environment | 100 Documents | 500 Documents | 1000 Documents |
|-------------|---------------|---------------|----------------|
| **Docker** | ~6-9 min | ~30-40 min | ~60-90 min |
| **Railway** | ~40-60 min | ⚠️ Not recommended | ❌ OOM risk |
| **Vercel** | ❌ Frontend only | ❌ Frontend only | ❌ Frontend only |

#### 4. **🔄 Real-Time Streaming Upload**
- **Progressive Loading**: See documents as they're fetched
- **Live Progress**: Real-time upload status with percentage
- **Batch Updates**: Updates every 20 documents
- **Error Handling**: Graceful failure recovery
- **Cancellable**: Stop upload mid-process

**User Experience:**
```
🔍 Scanning folder... (instant)
📊 Found 150 files to upload
⚡ Batch 1/3: Downloading 60 files... (30s)
✅ Downloaded 60 files. Starting embedding... (2min)
✅ Batch 1/3 complete: 60/150 files (40%)
⚡ Batch 2/3: Downloading 60 files... (30s)
...
✅ Upload complete: 150 files uploaded, 0 failed
```

#### 5. **🌐 Multi-Environment Deployment**
- **Docker**: High-performance local development
- **Railway**: Production backend hosting (512MB free tier)
- **Vercel**: Production frontend hosting (global CDN)
- **Localhost**: Development and testing

**Environment Detection:**
```python
@property
def is_memory_constrained(self) -> bool:
    """Automatically detect Railway/Vercel"""
    return self.is_railway or self.is_vercel or os.getenv("RAILWAY_ENVIRONMENT")
```

#### 6. **🔐 Enhanced Security**
- **Next.js 14.2.35**: Latest security patches (CVE-2025-55184, CVE-2025-67779 fixed)
- **Rate Limiting**: 60 req/min general, 5 req/min auth
- **Token Refresh**: Automatic token renewal
- **CORS Protection**: Configurable allowed origins
- **Input Validation**: Pydantic models for all requests

#### 7. **📊 Advanced Analytics (Coming Soon)**
- **Usage Statistics**: Track document uploads, queries, response times
- **Performance Metrics**: Monitor system health
- **User Insights**: Understand usage patterns
- **Cost Tracking**: Monitor API usage and costs

---

## 🏗️ **System Architecture**

<div align="center">

```mermaid
graph TB
    subgraph "🎨 Frontend Layer - Next.js 14.2.35"
        A[Next.js App Router]
        B[React 18 Components]
        C[TypeScript Logic]
        D[Tailwind CSS + Radix UI]
        E[Mobile Apps - Capacitor]
    end
    
    subgraph "⚙️ Backend Layer - FastAPI"
        F[FastAPI Server]
        G[Google OAuth Service]
        H[Document Processor]
        I[RAG Pipeline Engine]
        J[Duplicate Detection]
    end
    
    subgraph "🤖 AI & Vector Layer"
        K[ChromaDB Vector Store]
        L[Sentence Transformers]
        M[Groq LLM - Llama 3.1 8B]
        N[Gemini 2.0 Flash]
    end
    
    subgraph "☁️ External Services"
        O[Google Drive API]
        P[Google OAuth 2.0]
        Q[Groq API]
        R[Gemini API]
    end
    
    subgraph "🐳 Deployment"
        S[Docker Compose]
        T[Railway Backend]
        U[Vercel Frontend]
        V[ngrok - Dev Tunneling]
    end
    
    A --> F
    B --> F
    E --> F
    F --> G --> P
    F --> H --> O
    F --> I --> K
    F --> J --> K
    I --> L
    I --> M --> Q
    I --> N --> R
    S --> F
    T --> F
    U --> A
    V -.-> F
```

</div>

### **🔄 Data Flow**

```
1. User Authentication
   ├── User clicks "Sign in with Google"
   ├── Redirect to Google OAuth
   ├── Google returns authorization code
   ├── Backend exchanges code for tokens
   └── Frontend stores JWT token

2. Document Upload
   ├── User provides Google Drive folder URL
   ├── Backend fetches documents (60 parallel)
   ├── Duplicate detection (skip existing)
   ├── Text extraction (format-specific)
   ├── Chunking (850 chars, 85 overlap)
   ├── Embedding generation (15 parallel)
   └── Store in ChromaDB

3. Chat Query
   ├── User asks question
   ├── Query embedding generation
   ├── Similarity search in ChromaDB
   ├── Context assembly (top 10 chunks)
   ├── LLM generates response
   └── Stream response to frontend
```

---

## 🔍 **How It Works - Complete System Flow**

This section provides a comprehensive explanation of how DORA operates, from user authentication to document processing and AI-powered chat responses.

### **📐 Complete System Architecture Diagram**

<div align="center">

```mermaid
classDiagram
    %% Frontend Layer
    class NextJsApp {
        +React Components
        +TypeScript Logic
        +Tailwind CSS
        +State Management
        +render()
        +handleAuth()
        +uploadDocuments()
        +sendChatMessage()
    }
    
    class MobileApp {
        +Capacitor Runtime
        +Native Plugins
        +Android APK
        +iOS IPA
        +syncWithBackend()
    }
    
    %% Backend Layer
    class FastAPIServer {
        +Uvicorn ASGI
        +CORS Middleware
        +Rate Limiting
        +JWT Authentication
        +handleRequest()
        +validateToken()
    }
    
    class GoogleAuthService {
        +OAuth 2.0 Flow
        +Token Management
        +Token Refresh
        +exchangeCode()
        +refreshToken()
        +validateToken()
    }
    
    class GoogleDocsService {
        +Drive API Client
        +Docs API Client
        +HTTP/2 Connection Pool
        +listDocuments()
        +downloadDocument()
        +extractText()
    }
    
    class DocumentProcessor {
        +Text Extraction
        +Chunking Strategy
        +Metadata Extraction
        +processDocument()
        +chunkText()
        +extractMetadata()
    }
    
    class RAGPipeline {
        +Embedding Generator
        +Vector Search
        +Context Assembly
        +LLM Integration
        +generateEmbedding()
        +searchSimilar()
        +generateResponse()
    }
    
    class DuplicateDetector {
        +Document ID Cache
        +ChromaDB Query
        +checkDuplicates()
        +filterNew()
    }
    
    %% AI & Vector Layer
    class ChromaDB {
        +Vector Storage
        +Similarity Search
        +Persistent Storage
        +Collection Management
        +addDocuments()
        +query()
        +deleteCollection()
    }
    
    class SentenceTransformer {
        +all-MiniLM-L6-v2
        +384-dim Embeddings
        +Batch Processing
        +encode()
    }
    
    class GroqLLM {
        +Llama 3.1 8B Instant
        +Ultra-fast Inference
        +14.4K req/day
        +generate()
        +stream()
    }
    
    class GeminiLLM {
        +Gemini 2.0 Flash
        +Multimodal Support
        +Fallback Provider
        +generate()
    }
    
    %% External Services
    class GoogleDriveAPI {
        +File Listing
        +File Download
        +Folder Traversal
        +files.list()
        +files.get()
    }
    
    class GoogleOAuth {
        +Authorization Code Flow
        +Token Exchange
        +Token Refresh
        +authorize()
        +token()
    }
    
    %% Relationships
    NextJsApp --> FastAPIServer : HTTP/HTTPS
    MobileApp --> FastAPIServer : HTTP/HTTPS
    FastAPIServer --> GoogleAuthService : uses
    FastAPIServer --> GoogleDocsService : uses
    FastAPIServer --> DocumentProcessor : uses
    FastAPIServer --> RAGPipeline : uses
    FastAPIServer --> DuplicateDetector : uses
    
    GoogleAuthService --> GoogleOAuth : calls
    GoogleDocsService --> GoogleDriveAPI : calls
    DocumentProcessor --> GoogleDocsService : uses
    
    RAGPipeline --> ChromaDB : stores/queries
    RAGPipeline --> SentenceTransformer : uses
    RAGPipeline --> GroqLLM : primary
    RAGPipeline --> GeminiLLM : fallback
    
    DuplicateDetector --> ChromaDB : queries
```

</div>

---

### **🔄 Complete Authentication Flow**

<div align="center">

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant G as Google OAuth
    participant D as Database
    
    Note over U,D: 🔐 OAuth 2.0 Authentication Flow
    
    U->>F: 1. Click "Sign in with Google"
    F->>F: 2. Generate state parameter
    F->>G: 3. Redirect to Google OAuth<br/>(client_id, redirect_uri, scope)
    
    Note over G: User authenticates with Google
    
    G->>F: 4. Redirect with auth code<br/>(code, state)
    F->>F: 5. Validate state parameter
    F->>B: 6. POST /auth/google<br/>(code, redirect_uri)
    
    B->>B: 7. Validate request
    B->>G: 8. Exchange code for tokens<br/>(code, client_secret)
    G->>B: 9. Return tokens<br/>(access_token, refresh_token)
    
    B->>B: 10. Generate JWT token
    B->>D: 11. Store user session
    B->>F: 12. Return JWT + user info
    
    F->>F: 13. Store JWT in localStorage
    F->>U: 14. Redirect to dashboard
    
    Note over U,D: ✅ User authenticated!
```

</div>

---

### **📤 Document Upload Flow (Parallel Processing)**

<div align="center">

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant GD as Google Drive API
    participant DP as Document Processor
    participant DD as Duplicate Detector
    participant ST as Sentence Transformer
    participant C as ChromaDB
    
    Note over U,C: 📊 Ultra-Fast Parallel Upload (60 fetch / 15 embed)
    
    U->>F: 1. Provide folder URL
    F->>B: 2. POST /bulk-upload-parallel-stream<br/>(folder_url, access_token)
    
    B->>B: 3. Start SSE stream
    B-->>F: "🔍 Scanning folder..."
    
    B->>GD: 4. List all files (recursive)
    GD->>B: 5. Return file list (150 files)
    B-->>F: "📊 Found 150 files"
    
    B->>DD: 6. Check for duplicates
    DD->>C: 7. Query existing doc IDs
    C->>DD: 8. Return existing IDs (50 found)
    DD->>B: 9. Filter duplicates
    B-->>F: "⏭️ Skipped 50 duplicates"
    B-->>F: "📊 100 NEW files to process"
    
    Note over B,C: 🚀 BATCH 1: 60 files
    
    par Parallel Fetch (60 concurrent)
        B->>GD: 10a. Download Doc 1
        B->>GD: 10b. Download Doc 2
        B->>GD: 10c. Download Doc 3
        Note right of B: ... 57 more parallel requests
        B->>GD: 10z. Download Doc 60
    end
    
    GD->>B: 11. All 60 files downloaded
    B-->>F: "✅ Downloaded 60 files"
    
    par Parallel Processing (15 concurrent)
        B->>DP: 12a. Extract text from Doc 1
        B->>DP: 12b. Extract text from Doc 2
        Note right of B: ... 13 more parallel processes
        B->>DP: 12o. Extract text from Doc 15
    end
    
    DP->>B: 13. Extracted texts (15 docs)
    
    par Parallel Embedding (15 concurrent)
        B->>ST: 14a. Generate embedding Doc 1
        B->>ST: 14b. Generate embedding Doc 2
        Note right of B: ... 13 more parallel embeddings
        B->>ST: 14o. Generate embedding Doc 15
    end
    
    ST->>B: 15. All embeddings generated
    B->>C: 16. Bulk save 15 documents
    C->>B: 17. Saved successfully
    B-->>F: "✅ Batch 1/2: 60/100 (60%)"
    
    Note over B,C: 🚀 BATCH 2: 40 files (same process)
    
    B-->>F: "✅ Upload complete: 100 new, 50 skipped"
    B->>F: 18. Close SSE stream
    F->>U: 19. Show success notification
    
    Note over U,C: ✅ All documents indexed!
```

</div>

---

### **💬 Chat Query Flow (RAG Pipeline)**

<div align="center">

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant ST as Sentence Transformer
    participant C as ChromaDB
    participant G as Groq LLM
    participant GM as Gemini LLM
    
    Note over U,GM: 🤖 RAG-Powered Chat Response
    
    U->>F: 1. Type question<br/>"What is the project budget?"
    F->>B: 2. POST /chat<br/>(message, user_id, jwt_token)
    
    B->>B: 3. Validate JWT token
    B->>ST: 4. Generate query embedding
    ST->>B: 5. Return 384-dim vector
    
    B->>C: 6. Similarity search<br/>(query_vector, top_k=10, threshold=0.7)
    C->>C: 7. Calculate cosine similarity
    C->>B: 8. Return top 10 relevant chunks
    
    alt Documents Found (similarity >= 0.7)
        B->>B: 9a. Assemble context from chunks
        B->>B: 10a. Build RAG prompt<br/>(context + question)
        
        B->>G: 11a. Generate response (Groq)
        
        alt Groq Success
            G->>B: 12a. Stream response tokens
            B-->>F: 13a. Stream to frontend (SSE)
            F-->>U: 14a. Display answer + sources
        else Groq Fails
            B->>GM: 12b. Fallback to Gemini
            GM->>B: 13b. Stream response tokens
            B-->>F: 14b. Stream to frontend (SSE)
            F-->>U: 15b. Display answer + sources
        end
        
    else No Relevant Documents
        B->>B: 9b. Use general knowledge prompt
        B->>G: 10b. Generate general answer
        
        alt Groq Success
            G->>B: 11b. Stream response
            B-->>F: 12b. Stream to frontend
            F-->>U: 13b. Display answer<br/>(no sources shown)
        else Groq Fails
            B->>GM: 11c. Fallback to Gemini
            GM->>B: 12c. Stream response
            B-->>F: 13c. Stream to frontend
            F-->>U: 14c. Display answer
        end
    end
    
    Note over U,GM: ✅ Response delivered!
```

</div>

---

### **🔄 System State Diagram**

<div align="center">

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated
    
    Unauthenticated --> Authenticating : User clicks "Sign in"
    Authenticating --> Authenticated : OAuth success
    Authenticating --> Unauthenticated : OAuth failed
    
    Authenticated --> Idle : Dashboard loaded
    
    Idle --> UploadingDocuments : User provides folder URL
    Idle --> Chatting : User sends message
    Idle --> ManagingDocuments : User views documents
    
    UploadingDocuments --> ScanningFolder : Fetch file list
    ScanningFolder --> CheckingDuplicates : Files found
    CheckingDuplicates --> FetchingDocuments : Duplicates filtered
    FetchingDocuments --> ProcessingDocuments : Files downloaded
    ProcessingDocuments --> GeneratingEmbeddings : Text extracted
    GeneratingEmbeddings --> SavingToDatabase : Embeddings created
    SavingToDatabase --> Idle : Upload complete
    
    UploadingDocuments --> Idle : Upload cancelled
    ScanningFolder --> Idle : Error occurred
    
    Chatting --> GeneratingQueryEmbedding : Process query
    GeneratingQueryEmbedding --> SearchingVectorDB : Embedding ready
    SearchingVectorDB --> GeneratingResponse : Relevant docs found
    SearchingVectorDB --> GeneratingGeneralResponse : No docs found
    GeneratingResponse --> StreamingResponse : LLM generating
    GeneratingGeneralResponse --> StreamingResponse : LLM generating
    StreamingResponse --> Idle : Response complete
    
    Chatting --> Idle : Chat cancelled
    
    ManagingDocuments --> DeletingDocuments : User deletes docs
    DeletingDocuments --> Idle : Deletion complete
    ManagingDocuments --> Idle : Back to dashboard
    
    Authenticated --> Unauthenticated : Logout / Token expired
```

</div>

---

### **⚙️ Component Interaction Diagram**

<div align="center">

```mermaid
graph TB
    subgraph "🎨 Frontend Layer"
        UI[User Interface]
        Auth[Auth Manager]
        Upload[Upload Manager]
        Chat[Chat Manager]
        State[State Management]
    end
    
    subgraph "🔌 API Layer"
        API[FastAPI Server]
        Middleware[Middleware Stack]
        RateLimit[Rate Limiter]
        CORS[CORS Handler]
    end
    
    subgraph "🔐 Authentication"
        OAuth[OAuth Service]
        JWT[JWT Manager]
        Session[Session Store]
    end
    
    subgraph "📄 Document Processing"
        Scanner[Folder Scanner]
        Fetcher[Parallel Fetcher]
        Extractor[Text Extractor]
        Chunker[Text Chunker]
        DupCheck[Duplicate Checker]
    end
    
    subgraph "🤖 AI Pipeline"
        Embedder[Embedding Generator]
        VectorDB[(ChromaDB)]
        LLM1[Groq LLM]
        LLM2[Gemini LLM]
        Fallback{Fallback Logic}
    end
    
    subgraph "☁️ External APIs"
        GDrive[Google Drive API]
        GAuth[Google OAuth]
    end
    
    %% Frontend connections
    UI --> Auth
    UI --> Upload
    UI --> Chat
    Auth --> State
    Upload --> State
    Chat --> State
    
    %% API connections
    Auth --> API
    Upload --> API
    Chat --> API
    API --> Middleware
    Middleware --> RateLimit
    Middleware --> CORS
    
    %% Auth flow
    API --> OAuth
    OAuth --> GAuth
    OAuth --> JWT
    JWT --> Session
    
    %% Upload flow
    API --> Scanner
    Scanner --> GDrive
    Scanner --> DupCheck
    DupCheck --> VectorDB
    Scanner --> Fetcher
    Fetcher --> GDrive
    Fetcher --> Extractor
    Extractor --> Chunker
    Chunker --> Embedder
    Embedder --> VectorDB
    
    %% Chat flow
    API --> Embedder
    Embedder --> VectorDB
    VectorDB --> LLM1
    LLM1 --> Fallback
    Fallback -->|Success| Chat
    Fallback -->|Failure| LLM2
    LLM2 --> Chat
    
    style UI fill:#6366f1,color:#fff
    style API fill:#10b981,color:#fff
    style VectorDB fill:#f59e0b,color:#fff
    style LLM1 fill:#ef4444,color:#fff
    style LLM2 fill:#3b82f6,color:#fff
```

</div>

---

### **📊 Data Flow Architecture**

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DORA DATA FLOW                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1️⃣ USER AUTHENTICATION                                            │
│  ┌──────┐   OAuth   ┌────────┐   Code    ┌─────────┐             │
│  │ User │ ────────> │ Google │ ────────> │ Backend │             │
│  └──────┘           └────────┘           └────┬────┘             │
│                                                │                   │
│                                                ▼                   │
│                                          ┌──────────┐              │
│                                          │ JWT Token│              │
│                                          └──────────┘              │
│                                                                     │
│  2️⃣ DOCUMENT UPLOAD                                                │
│  ┌──────────┐   Folder URL   ┌─────────┐                         │
│  │ Frontend │ ──────────────> │ Backend │                         │
│  └──────────┘                 └────┬────┘                         │
│                                     │                               │
│                                     ▼                               │
│                          ┌──────────────────┐                      │
│                          │ Google Drive API │                      │
│                          └────────┬─────────┘                      │
│                                   │                                 │
│                                   ▼                                 │
│                     ┌─────────────────────────┐                    │
│                     │ Parallel Fetch (60x)    │                    │
│                     └──────────┬──────────────┘                    │
│                                │                                     │
│                                ▼                                     │
│                     ┌─────────────────────────┐                    │
│                     │ Duplicate Detection     │                    │
│                     └──────────┬──────────────┘                    │
│                                │                                     │
│                                ▼                                     │
│                     ┌─────────────────────────┐                    │
│                     │ Text Extraction         │                    │
│                     └──────────┬──────────────┘                    │
│                                │                                     │
│                                ▼                                     │
│                     ┌─────────────────────────┐                    │
│                     │ Chunking (850 chars)    │                    │
│                     └──────────┬──────────────┘                    │
│                                │                                     │
│                                ▼                                     │
│                     ┌─────────────────────────┐                    │
│                     │ Parallel Embed (15x)    │                    │
│                     └──────────┬──────────────┘                    │
│                                │                                     │
│                                ▼                                     │
│                          ┌──────────┐                              │
│                          │ ChromaDB │                              │
│                          └──────────┘                              │
│                                                                     │
│  3️⃣ CHAT QUERY                                                      │
│  ┌──────────┐   Question   ┌─────────┐                            │
│  │ Frontend │ ────────────> │ Backend │                            │
│  └──────────┘               └────┬────┘                            │
│                                   │                                 │
│                                   ▼                                 │
│                     ┌─────────────────────────┐                    │
│                     │ Generate Query Embedding│                    │
│                     └──────────┬──────────────┘                    │
│                                │                                     │
│                                ▼                                     │
│                          ┌──────────┐                              │
│                          │ ChromaDB │                              │
│                          │ Similarity│                             │
│                          │  Search   │                             │
│                          └────┬─────┘                              │
│                               │                                     │
│                               ▼                                     │
│                     ┌──────────────────┐                           │
│                     │ Top 10 Chunks    │                           │
│                     │ (threshold: 0.7) │                           │
│                     └────────┬─────────┘                           │
│                              │                                      │
│                              ▼                                      │
│                     ┌──────────────────┐                           │
│                     │ Assemble Context │                           │
│                     └────────┬─────────┘                           │
│                              │                                      │
│                              ▼                                      │
│                     ┌──────────────────┐                           │
│                     │ Groq LLM         │                           │
│                     │ (Primary)        │                           │
│                     └────────┬─────────┘                           │
│                              │                                      │
│                              ├──── Success ───┐                    │
│                              │                 │                    │
│                              └──── Failure     │                    │
│                                     │          │                    │
│                                     ▼          │                    │
│                            ┌──────────────┐   │                    │
│                            │ Gemini LLM   │   │                    │
│                            │ (Fallback)   │   │                    │
│                            └──────┬───────┘   │                    │
│                                   │           │                    │
│                                   └───────────┘                    │
│                                         │                           │
│                                         ▼                           │
│                                  ┌────────────┐                    │
│                                  │ Stream SSE │                    │
│                                  └──────┬─────┘                    │
│                                         │                           │
│                                         ▼                           │
│                                  ┌──────────┐                      │
│                                  │ Frontend │                      │
│                                  └──────────┘                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

### **🎯 Key Design Decisions**

#### **1. Why Parallel Processing?**
- **Problem**: Sequential processing is slow (5-10 min per document)
- **Solution**: Process 60 documents simultaneously
- **Result**: 8-13x faster uploads

#### **2. Why Duplicate Detection?**
- **Problem**: Users re-upload same documents
- **Solution**: Check ChromaDB before processing
- **Result**: Save time, storage, and API costs

#### **3. Why Server-Sent Events (SSE)?**
- **Problem**: Users don't know upload progress
- **Solution**: Real-time streaming updates
- **Result**: Better UX, no "black box" waiting

#### **4. Why Smart Fallback?**
- **Problem**: Single LLM can fail or be unavailable
- **Solution**: Groq primary, Gemini fallback
- **Result**: 99.9% uptime, no dead-ends

#### **5. Why Adaptive Batch Sizes?**
- **Problem**: Railway has 512MB memory limit
- **Solution**: Auto-detect environment, adjust batches
- **Result**: Works on both Docker (fast) and Railway (stable)

#### **6. Why ChromaDB?**
- **Problem**: Need fast similarity search
- **Solution**: Purpose-built vector database
- **Result**: Sub-100ms queries on 10K+ chunks

---

## 🛠️ **Complete Technology Stack**

### 🎨 **Frontend Technologies**

| Technology | Version | Purpose | Why We Chose It |
|------------|---------|---------|-----------------|
| ![Next.js](https://img.shields.io/badge/Next.js-14.2.35-black?logo=next.js&logoColor=white) | **14.2.35** | **React Framework** | ✅ Latest security patches (CVE fixes)<br>✅ Server-side rendering<br>✅ API routes<br>✅ Automatic code splitting<br>✅ Image optimization |
| ![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black) | **18+** | **UI Library** | ✅ Component-based architecture<br>✅ Hooks for state management<br>✅ Virtual DOM<br>✅ Massive ecosystem |
| ![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white) | **5.0+** | **Type Safety** | ✅ Compile-time error detection<br>✅ Superior IDE support<br>✅ Better refactoring<br>✅ IntelliSense |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3+-06B6D4?logo=tailwindcss&logoColor=white) | **3.3+** | **Styling** | ✅ Utility-first approach<br>✅ Rapid prototyping<br>✅ Responsive design<br>✅ Minimal bundle size |
| ![Radix UI](https://img.shields.io/badge/Radix_UI-Latest-161618?logo=radix-ui&logoColor=white) | **Latest** | **UI Components** | ✅ Accessible primitives<br>✅ Keyboard navigation<br>✅ ARIA compliance<br>✅ Full customization |
| ![Capacitor](https://img.shields.io/badge/Capacitor-8.0+-119EFF?logo=capacitor&logoColor=white) | **8.0+** | **Mobile Apps** | ✅ Native Android/iOS apps<br>✅ Web code reuse<br>✅ Native plugin access<br>✅ Live updates |

### ⚙️ **Backend Technologies**

| Technology | Version | Purpose | Why We Chose It |
|------------|---------|---------|-----------------|
| ![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688?logo=fastapi&logoColor=white) | **0.104+** | **Web Framework** | ✅ Async support<br>✅ Auto API docs (OpenAPI)<br>✅ Type validation<br>✅ High performance |
| ![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white) | **3.11+** | **Language** | ✅ Rich AI/ML ecosystem<br>✅ Readable syntax<br>✅ Extensive libraries<br>✅ Async capabilities |
| ![Uvicorn](https://img.shields.io/badge/Uvicorn-0.24+-499848?logo=gunicorn&logoColor=white) | **0.24+** | **ASGI Server** | ✅ Lightning-fast async<br>✅ Production-ready<br>✅ WebSocket support<br>✅ Optimized for FastAPI |
| ![Pydantic](https://img.shields.io/badge/Pydantic-2.5+-E92063?logo=pydantic&logoColor=white) | **2.5+** | **Validation** | ✅ Auto request/response validation<br>✅ JSON schema generation<br>✅ Type safety<br>✅ Clear error messages |

### ⚡ **HTTP & Async Libraries**

| Technology | Version | Purpose | Why We Chose It |
|------------|---------|---------|-----------------|
| ![aiohttp](https://img.shields.io/badge/aiohttp-3.9+-2C5BB4?logo=python&logoColor=white) | **3.9+** | **Async HTTP Client** | ✅ Async/await support<br>✅ Connection pooling<br>✅ Parallel requests<br>✅ High performance |
| ![httpx](https://img.shields.io/badge/httpx-0.25+-0080FF?logo=python&logoColor=white) | **0.25+** | **Modern HTTP Client** | ✅ Sync & async support<br>✅ HTTP/2 support<br>✅ Timeout management<br>✅ Retry mechanisms |
| ![asyncio](https://img.shields.io/badge/asyncio-Built--in-3776AB?logo=python&logoColor=white) | **Built-in** | **Async Framework** | ✅ Concurrent execution<br>✅ Event loop management<br>✅ Task scheduling<br>✅ Native Python support |

### 🤖 **AI & Machine Learning Stack**

| Technology | Version | Purpose | Why We Chose It |
|------------|---------|---------|-----------------|
| ![ChromaDB](https://img.shields.io/badge/ChromaDB-0.4.22+-FF6F00?logo=database&logoColor=white) | **0.4.22+** | **Vector Database** | ✅ Purpose-built for embeddings<br>✅ Persistent storage<br>✅ Fast similarity search<br>✅ Scalable to millions of docs |
| ![Sentence Transformers](https://img.shields.io/badge/Sentence_Transformers-2.2.2+-00ADD8?logo=pytorch&logoColor=white) | **2.2.2+** | **Embeddings** | ✅ State-of-the-art semantic understanding<br>✅ Multilingual support<br>✅ `all-MiniLM-L6-v2` (384-dim)<br>✅ Speed-accuracy balance |
| ![Groq](https://img.shields.io/badge/Groq-0.4.1+-F55036?logo=ai&logoColor=white) | **0.4.1+** | **Primary LLM** | ✅ Ultra-fast inference<br>✅ 14.4K req/day (Llama 3.1 8B)<br>✅ Cost-effective<br>✅ Production-stable |
| ![Gemini](https://img.shields.io/badge/Gemini-2.0_Flash-4285F4?logo=google&logoColor=white) | **2.0 Flash** | **Fallback LLM** | ✅ Google's latest AI<br>✅ Multimodal capabilities<br>✅ High accuracy<br>✅ Google ecosystem integration |

### 🔐 **Authentication & Security**

| Technology | Purpose | Features |
|------------|---------|----------|
| ![Google OAuth](https://img.shields.io/badge/Google_OAuth-2.0-4285F4?logo=google&logoColor=white) | **Authentication** | ✅ Industry-standard security<br>✅ Trusted by users<br>✅ Google Drive integration<br>✅ No password management |
| ![JWT](https://img.shields.io/badge/JWT-Tokens-000000?logo=jsonwebtokens&logoColor=white) | **Session Management** | ✅ Stateless authentication<br>✅ Scalable across servers<br>✅ Secure token transmission<br>✅ Cross-platform compatibility |
| ![SlowAPI](https://img.shields.io/badge/SlowAPI-Rate_Limiting-FF6B6B?logo=security&logoColor=white) | **Rate Limiting** | ✅ Prevent API abuse<br>✅ DDoS protection<br>✅ Configurable limits<br>✅ Automatic throttling |
| ![CORS](https://img.shields.io/badge/CORS-Middleware-00C7B7?logo=fastapi&logoColor=white) | **CORS Protection** | ✅ Cross-origin security<br>✅ Allowed origins whitelist<br>✅ Credentials support<br>✅ Preflight handling |

### 📊 **Monitoring & Utilities**

| Technology | Purpose | Features |
|------------|---------|----------|
| ![Python Logging](https://img.shields.io/badge/Logging-Built--in-3776AB?logo=python&logoColor=white) | **Application Logging** | ✅ Structured logging<br>✅ Multiple log levels<br>✅ File & console output<br>✅ Production-ready |
| ![dotenv](https://img.shields.io/badge/python--dotenv-1.0+-ECD53F?logo=.env&logoColor=black) | **Environment Management** | ✅ .env file support<br>✅ Secure config management<br>✅ Multi-environment support<br>✅ Easy deployment |
| ![pytest](https://img.shields.io/badge/pytest-7.4+-0A9EDC?logo=pytest&logoColor=white) | **Testing Framework** | ✅ Unit testing<br>✅ Integration testing<br>✅ Fixtures support<br>✅ Coverage reports |

### 📄 **Document Processing**

| Technology | Version | Supported Formats |
|------------|---------|-------------------|
| ![Google Drive API](https://img.shields.io/badge/Google_Drive-API-4285F4?logo=googledrive&logoColor=white) | **Latest** | Google Docs, Sheets, Slides |
| ![PyPDF](https://img.shields.io/badge/PyPDF-3.17.1+-FF0000?logo=adobeacrobatreader&logoColor=white) | **3.17.1+** | PDF (including encrypted) |
| ![python-docx](https://img.shields.io/badge/python--docx-1.1.0+-2B579A?logo=microsoftword&logoColor=white) | **1.1.0+** | DOCX (Microsoft Word) |
| ![python-pptx](https://img.shields.io/badge/python--pptx-0.6.21+-B7472A?logo=microsoftpowerpoint&logoColor=white) | **0.6.21+** | PPTX (PowerPoint) |
| ![openpyxl](https://img.shields.io/badge/openpyxl-3.1.2+-217346?logo=microsoftexcel&logoColor=white) | **3.1.2+** | XLSX (Excel) |
| ![BeautifulSoup4](https://img.shields.io/badge/BeautifulSoup4-4.12+-43B02A?logo=html5&logoColor=white) | **4.12+** | HTML, XML |

### 🐳 **Deployment & Infrastructure**

| Technology | Purpose | Features |
|------------|---------|----------|
| ![Docker](https://img.shields.io/badge/Docker-Latest-2496ED?logo=docker&logoColor=white) | **Containerization** | ✅ Consistent environments<br>✅ Easy deployment<br>✅ Isolated dependencies<br>✅ Reproducible builds |
| ![Docker Compose](https://img.shields.io/badge/Docker_Compose-Latest-2496ED?logo=docker&logoColor=white) | **Orchestration** | ✅ Multi-service management<br>✅ Simplified networking<br>✅ Volume management<br>✅ One-command deployment |
| ![Railway](https://img.shields.io/badge/Railway-Latest-0B0D0E?logo=railway&logoColor=white) | **Backend Hosting** | ✅ Auto-deploy from Git<br>✅ 512MB free tier<br>✅ Automatic SSL<br>✅ Environment variables |
| ![Vercel](https://img.shields.io/badge/Vercel-Latest-000000?logo=vercel&logoColor=white) | **Frontend Hosting** | ✅ Global CDN<br>✅ Zero-config deployment<br>✅ Automatic HTTPS<br>✅ Instant rollbacks |

### 🛠️ **Development Tools**

| Technology | Purpose | Features |
|------------|---------|----------|
| ![ngrok](https://img.shields.io/badge/ngrok-Latest-1F1E37?logo=ngrok&logoColor=white) | **Tunneling & Testing** | ✅ Expose localhost to internet<br>✅ OAuth callback testing<br>✅ Mobile app development<br>✅ Webhook testing |
| ![Git](https://img.shields.io/badge/Git-Latest-F05032?logo=git&logoColor=white) | **Version Control** | ✅ Source code management<br>✅ Branching & merging<br>✅ Collaboration<br>✅ CI/CD integration |
| ![npm](https://img.shields.io/badge/npm-10+-CB3837?logo=npm&logoColor=white) | **Package Manager** | ✅ Frontend dependency management<br>✅ Script automation<br>✅ Package versioning<br>✅ Security audits |
| ![pip](https://img.shields.io/badge/pip-Latest-3776AB?logo=pypi&logoColor=white) | **Python Packages** | ✅ Backend dependency management<br>✅ Virtual environments<br>✅ Requirements.txt support<br>✅ Package installation |

---

## 🚀 **Advanced Features Deep Dive**

### 1. **🛡️ Intelligent Duplicate Detection System**

**Problem Solved:** Users often re-upload the same documents, wasting time and storage.

**How It Works:**

```python
# Step 1: Extract document IDs from upload request
doc_ids = [doc['id'] for doc in all_documents]

# Step 2: Check ChromaDB for existing documents
existing_doc_ids = dora_pipeline.get_existing_document_ids(user_id, doc_ids)

# Step 3: Filter out duplicates
new_documents = [doc for doc in all_documents if doc['id'] not in existing_doc_ids]
skipped_documents = [doc for doc in all_documents if doc['id'] in existing_doc_ids]

# Step 4: Notify user
if skipped_count > 0:
    logger.warning(f"⏭️ Skipped {skipped_count}/{total_found} duplicate files")
    yield f"⏭️ Skipped {skipped_count} duplicate files (already in knowledge base)"

# Step 5: Process only NEW documents
for doc in new_documents:
    # Process document...
```

**Benefits:**
- ⚡ **Faster Uploads**: Skip already-indexed files
- 💾 **Storage Savings**: No redundant embeddings
- 🎯 **Better UX**: Clear feedback on what was skipped
- 🔒 **Data Integrity**: Prevents duplicate entries

**User Experience:**
```
🔍 Scanning folder...
📊 Found 150 files to upload
🔍 Checking for duplicates in 150 files...
⏭️ Skipped 50 duplicate files (already in knowledge base)
📊 Found 100 NEW files to upload
✅ Upload complete: 100 new files uploaded, 50 duplicates skipped
```

---

### 2. **📱 Cross-Platform Mobile Support**

**Platforms:**
- 🌐 **Web**: Progressive Web App (PWA)
- 🤖 **Android**: Native APK via Capacitor
- 🍎 **iOS**: Native IPA via Capacitor

**How It Works:**

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dora.app',
  appName: 'DORA',
  webDir: 'out',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  }
};

export default config;
```

**Mobile-Specific Features:**
- 📱 **Responsive Design**: Adaptive UI for all screen sizes
- 👆 **Touch Optimized**: Gesture support, mobile-friendly interactions
- 🔔 **Push Notifications**: Real-time updates (coming soon)
- 📴 **Offline Mode**: Cache documents for offline access (coming soon)
- 📸 **Camera Integration**: Scan documents with camera (coming soon)

**Build Commands:**
```bash
# Android
npm run build
npx cap add android
npx cap sync android
npx cap open android

# iOS
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

---

### 3. **⚡ Ultra-Fast Parallel Processing**

**Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│              PARALLEL PROCESSING PIPELINE               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  STAGE 1: PARALLEL FETCH (Network Bound)               │
│  ┌──────┐ ┌──────┐ ┌──────┐     ┌──────┐              │
│  │ Doc1 │ │ Doc2 │ │ Doc3 │ ... │ Doc60│              │
│  └──┬───┘ └──┬───┘ └──┬───┘     └──┬───┘              │
│     │        │        │            │                   │
│     └────────┴────────┴────────────┘                   │
│              │                                          │
│              ▼                                          │
│  STAGE 2: PARALLEL EMBEDDING (CPU/GPU Bound)           │
│  ┌──────┐ ┌──────┐ ┌──────┐     ┌──────┐              │
│  │Embed1│ │Embed2│ │Embed3│ ... │Embed15│              │
│  └──┬───┘ └──┬───┘ └──┬───┘     └──┬───┘              │
│     │        │        │            │                   │
│     └────────┴────────┴────────────┘                   │
│              │                                          │
│              ▼                                          │
│  STAGE 3: BATCH SAVE TO CHROMADB                       │
│  ┌─────────────────────────────────┐                   │
│  │  ChromaDB Vector Store          │                   │
│  └─────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

**Code Implementation:**

```python
# STAGE 1: Parallel Fetch (60 at once)
async def fetch_raw_only(doc):
    result = await google_docs_service.download_document_raw(access_token, doc_id, mime_type)
    return result

fetch_tasks = [fetch_raw_only(doc) for doc in batch]
fetch_results = await asyncio.gather(*fetch_tasks)

# STAGE 2: Parallel Embedding (15 at once)
extract_tasks = [google_docs_service.extract_text_from_raw(item['raw_data'], item['mime_type']) for item in proc_batch]
extracted_texts = await asyncio.gather(*extract_tasks)

# STAGE 3: Bulk Save
bulk_results = await dora_pipeline.add_documents_bulk(user_id, bulk_docs_input)
```

**Performance Metrics:**

| Batch Size | 10 Docs | 50 Docs | 100 Docs | 500 Docs |
|------------|---------|---------|----------|----------|
| **Sequential** | 5 min | 25 min | 50 min | 250 min |
| **Parallel (60/15)** | 1 min | 3 min | 6 min | 30 min |
| **Speedup** | 5x | 8x | 8x | 8x |

---

### 4. **🔄 Real-Time Streaming Architecture**

**Technology:** Server-Sent Events (SSE)

**How It Works:**

```python
# Backend: FastAPI Streaming Response
from fastapi.responses import StreamingResponse
import json

async def upload_stream():
    # Step 1: Scan folder
    yield f"data: {json.dumps({'status': 'scanning', 'message': '🔍 Scanning folder...'})}\n\n"
    
    # Step 2: Found documents
    yield f"data: {json.dumps({'status': 'found', 'total': 150, 'message': '📊 Found 150 files'})}\n\n"
    
    # Step 3: Processing batches
    for i, batch in enumerate(batches):
        yield f"data: {json.dumps({'status': 'batch_start', 'batch': i+1, 'total_batches': 3})}\n\n"
        
        # Process batch...
        
        yield f"data: {json.dumps({'status': 'batch_complete', 'processed': processed})}\n\n"
    
    # Step 4: Complete
    yield f"data: {json.dumps({'status': 'complete', 'processed': 150})}\n\n"

return StreamingResponse(upload_stream(), media_type="text/event-stream")
```

```typescript
// Frontend: EventSource Consumer
const eventSource = new EventSource(`${backendUrl}/bulk-upload-parallel-stream`);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.status) {
    case 'scanning':
      setMessage('🔍 Scanning folder...');
      break;
    case 'found':
      setTotal(data.total);
      setMessage(`📊 Found ${data.total} files`);
      break;
    case 'batch_complete':
      setProcessed(data.processed);
      setProgress((data.processed / total) * 100);
      break;
    case 'complete':
      setMessage('✅ Upload complete!');
      eventSource.close();
      break;
  }
};
```

**Benefits:**
- ✅ **Instant Feedback**: Users see progress immediately
- ✅ **Better UX**: No "black box" waiting
- ✅ **Lower Memory**: Process data as it arrives
- ✅ **Cancellable**: Users can stop mid-process

---

### 5. **🌐 Multi-Environment Deployment**

**Adaptive Batch Sizes:**

```python
# config.py
@property
def is_memory_constrained(self) -> bool:
    """Detect if running on memory-constrained environment"""
    return self.is_railway or self.is_vercel or os.getenv("RAILWAY_ENVIRONMENT")

@property
def bulk_upload_batch_size(self) -> int:
    """Adaptive batch size based on environment"""
    if self.is_memory_constrained:
        return int(os.getenv("BULK_UPLOAD_BATCH_SIZE", "3"))  # Railway: 3
    return int(os.getenv("BULK_UPLOAD_BATCH_SIZE", "60"))  # Docker: 60

@property
def embedding_batch_size(self) -> int:
    """Adaptive embedding batch size"""
    if self.is_memory_constrained:
        return int(os.getenv("EMBEDDING_BATCH_SIZE", "1"))  # Railway: 1
    return int(os.getenv("EMBEDDING_BATCH_SIZE", "15"))  # Docker: 15
```

**Environment Comparison:**

| Feature | Docker | Railway | Vercel |
|---------|--------|---------|--------|
| **Memory** | Unlimited | 512MB | 512MB |
| **Fetch Batch** | 60 | 3 | 1 |
| **Embed Batch** | 15 | 1 | 1 |
| **Best For** | Bulk uploads | Production API | Frontend only |
| **Max Docs/Upload** | 1000+ | 10-20 | N/A |
| **Processing Time (100 docs)** | ~6-9 min | ~40-60 min | N/A |

---

### 6. **🔐 Enhanced Security Features**

**Security Layers:**

```
┌─────────────────────────────────────────┐
│         SECURITY ARCHITECTURE           │
├─────────────────────────────────────────┤
│                                         │
│  Layer 1: HTTPS/TLS                     │
│  ├── All traffic encrypted              │
│  └── Automatic SSL certificates         │
│                                         │
│  Layer 2: OAuth 2.0                     │
│  ├── Google authentication              │
│  ├── Authorization code flow            │
│  └── Token refresh mechanism            │
│                                         │
│  Layer 3: JWT Tokens                    │
│  ├── Stateless authentication           │
│  ├── 30-minute expiration               │
│  └── Secure token storage                │
│                                         │
│  Layer 4: Rate Limiting                 │
│  ├── 60 req/min (general)               │
│  ├── 5 req/min (auth)                   │
│  └── IP-based throttling                │
│                                         │
│  Layer 5: Input Validation              │
│  ├── Pydantic models                    │
│  ├── Type checking                      │
│  └── SQL injection prevention           │
│                                         │
│  Layer 6: CORS Protection               │
│  ├── Allowed origins whitelist          │
│  ├── Credentials support                │
│  └── Preflight handling                 │
└─────────────────────────────────────────┘
```

**Security Fixes (Latest):**
- ✅ **Next.js 14.2.35**: Fixed CVE-2025-55184 (HIGH)
- ✅ **Next.js 14.2.35**: Fixed CVE-2025-67779 (HIGH)
- ✅ **0 Vulnerabilities**: `npm audit` shows clean bill of health

---

## 📊 **Performance Metrics**

### **Upload Performance**

| Documents | Docker (60/15) | Railway (3/1) | Speedup |
|-----------|----------------|---------------|---------|
| 10 docs | 1-2 min | 8-12 min | 6x faster |
| 50 docs | 3-5 min | 40-60 min | 12x faster |
| 100 docs | 6-9 min | 80-120 min | 13x faster |
| 500 docs | 30-40 min | ⚠️ OOM risk | N/A |
| 1000 docs | 60-90 min | ❌ Not recommended | N/A |

### **Query Performance**

| Metric | Value | Notes |
|--------|-------|-------|
| **Embedding Generation** | ~50ms | Per query |
| **Similarity Search** | ~100ms | 10,000 chunks |
| **LLM Response (Groq)** | ~500ms | Streaming starts |
| **Total Response Time** | ~650ms | Sub-second! |

### **Resource Usage**

| Environment | CPU | Memory | Storage |
|-------------|-----|--------|---------|
| **Docker** | 4-8 cores | 4-8 GB | Unlimited |
| **Railway** | 1-2 cores | 512 MB | 1 GB |
| **Vercel** | Serverless | 512 MB | N/A |

---

## 🌐 **Deployment Options**

### **Deployment Comparison**

| Feature | Docker | Railway + Vercel | Localhost | ngrok |
|---------|--------|------------------|-----------|-------|
| **Best For** | Bulk uploads, Production | Production API | Development | OAuth Testing, Mobile Dev |
| **Performance** | ⚡ Highest | 🔋 Medium | ⚡ High | 🔋 Medium |
| **Batch Size** | 60 fetch / 15 embed | 3 fetch / 1 embed | 60 fetch / 15 embed | 60 fetch / 15 embed |
| **Cost** | Free (local) | Free tier | Free | Free |
| **Setup Time** | 5 minutes | 15 minutes | 10 minutes | 5 minutes |
| **Public Access** | ❌ No | ✅ Yes | ❌ No | ✅ Yes (temporary) |
| **SSL/HTTPS** | ❌ No | ✅ Yes | ❌ No | ✅ Yes |
| **Auto Deploy** | ❌ Manual | ✅ Git push | ❌ Manual | ❌ Manual |
| **Recommended Use** | Development, Testing | Production | Quick testing | OAuth callbacks, Mobile |

---

### **Option 1: Docker (Recommended for Development)**

**Advantages:**
- ✅ High performance (60/15 batch sizes)
- ✅ Unlimited resources
- ✅ Perfect for bulk uploads
- ✅ Full control over environment

**Quick Start:**
```bash
# Clone repository
git clone https://github.com/suryahanjaya/lenrag.git
cd lenrag

# Copy environment files
cp backend/.env.production backend/.env

# Build and run
docker-compose up --build

# Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

**Configuration:**
```bash
# backend/.env.production
ENVIRONMENT=production
BULK_UPLOAD_BATCH_SIZE=60
EMBEDDING_BATCH_SIZE=15
LOG_LEVEL=WARNING
```

---

### **Option 2: Railway + Vercel (Recommended for Production)**

**Advantages:**
- ✅ Free tier available
- ✅ Auto-deploy from GitHub
- ✅ Global CDN (Vercel)
- ✅ Automatic SSL
- ✅ Zero maintenance

**Railway Backend Setup:**

1. **Create Railway Project**
   - Go to [Railway](https://railway.app/)
   - Create new project from GitHub repo
   - Select `backend` directory

2. **Environment Variables**
   ```bash
   RAILWAY_ENVIRONMENT=true
   BULK_UPLOAD_BATCH_SIZE=3
   EMBEDDING_BATCH_SIZE=1
   LOG_LEVEL=ERROR
   LLM_PROVIDER=groq
   GROQ_API_KEY=your_groq_api_key
   GEMINI_API_KEY=your_gemini_api_key
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=https://your-vercel-app.vercel.app/auth/callback
   ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
   ```

3. **Deploy**
   - Railway auto-deploys on git push
   - Copy Railway backend URL

**Vercel Frontend Setup:**

1. **Create Vercel Project**
   - Go to [Vercel](https://vercel.com/)
   - Import GitHub repository
   - Select root directory

2. **Environment Variables**
   ```bash
   NEXT_PUBLIC_BACKEND_URL=https://your-railway-backend.up.railway.app
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   ```

3. **Deploy**
   - Vercel auto-deploys on git push
   - Copy Vercel frontend URL

4. **Update Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Add redirect URIs:
     - `https://your-vercel-app.vercel.app/auth/callback`
     - `https://your-railway-backend.up.railway.app/auth/google`

---

**Localhost:**
```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py

# Frontend (new terminal)
npm install
npm run dev
```

---

### **Option 4: ngrok (OAuth Testing & Mobile Development)**

**Why Use ngrok?**
- ✅ **OAuth Testing**: Test Google OAuth callbacks with public HTTPS URL
- ✅ **Mobile Development**: Test mobile apps on real devices
- ✅ **Webhook Testing**: Receive webhooks from external services
- ✅ **Share Development**: Share your local app with team members

**Setup:**

1. **Install ngrok**
   ```bash
   # Download from https://ngrok.com/download
   # Or use package manager
   choco install ngrok  # Windows
   brew install ngrok   # macOS
   ```

2. **Start Backend**
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   python main.py
   ```

3. **Expose Backend with ngrok**
   ```bash
   # In new terminal
   ngrok http 8000
   
   # You'll get a public URL like:
   # https://abc123.ngrok.io -> http://localhost:8000
   ```

4. **Update Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Add ngrok URL to redirect URIs:
     - `https://abc123.ngrok.io/auth/google`
     - `http://localhost:3000/auth/callback`

5. **Update Frontend Environment**
   ```bash
   # .env.local
   NEXT_PUBLIC_BACKEND_URL=https://abc123.ngrok.io
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   ```

6. **Start Frontend**
   ```bash
   npm install
   npm run dev
   ```

7. **Access Application**
   - **Frontend**: http://localhost:3000
   - **Backend API**: https://abc123.ngrok.io
   - **API Docs**: https://abc123.ngrok.io/docs
   - **ngrok Dashboard**: http://localhost:4040

**Mobile Testing:**
```bash
# For mobile app testing
# 1. Get your ngrok URL: https://abc123.ngrok.io
# 2. Update capacitor.config.ts:
{
  server: {
    url: 'https://abc123.ngrok.io',
    cleartext: true
  }
}
# 3. Build and run on device
npx cap sync
npx cap run android  # or ios
```

**Pro Tips:**
- 🔒 **HTTPS by default**: ngrok provides free HTTPS
- 📊 **Request Inspector**: View all requests at http://localhost:4040
- 🔄 **Stable URLs**: Use `ngrok http 8000 --subdomain=myapp` (requires paid plan)
- ⚡ **Fast Tunneling**: Low latency for most regions



## 📋 **Quick Start Guide**

### **Prerequisites**

- **Node.js** 16.0+ ([Download](https://nodejs.org/))
- **Python** 3.11+ ([Download](https://www.python.org/downloads/))
- **Git** ([Download](https://git-scm.com/downloads))
- **Docker** 20.0+ (optional, [Download](https://www.docker.com/products/docker-desktop))
- **ngrok** (optional, for OAuth testing & mobile dev, [Download](https://ngrok.com/download))

### **1. Clone Repository**

```bash
git clone https://github.com/suryahanjaya/lenrag.git
cd lenrag
```

### **2. Google Cloud Setup**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project
3. Enable APIs:
   - Google Drive API
   - Google Docs API
   - Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/auth/callback`
5. Get Gemini API key from [Google AI Studio](https://aistudio.google.com/)
6. (Optional) Get Groq API key from [Groq Console](https://console.groq.com/)

### **3. Environment Configuration**

**Frontend (`.env.local`):**
```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

**Backend (`backend/.env`):**
```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
LLM_PROVIDER=groq
ENVIRONMENT=development
```

### **4. Run Application**

**Docker (Recommended):**
```bash
docker-compose up --build
```

**Localhost:**
```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py

# Frontend (new terminal)
npm install
npm run dev
```

### **5. Access Application**

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 📚 **API Documentation**

### **Authentication Endpoints**

| Endpoint | Method | Description | Rate Limit |
|----------|--------|-------------|------------|
| `/auth/google` | POST | Exchange Google auth code for JWT token | 5/min |
| `/auth/refresh` | POST | Refresh expired access token | 10/min |
| `/user/profile` | GET | Get user profile information | 60/min |

**Example:**
```bash
# Exchange authorization code
curl -X POST http://localhost:8000/auth/google \
  -H "Content-Type: application/json" \
  -d '{"code": "google_auth_code", "redirect_uri": "http://localhost:3000/auth/callback"}'

# Response
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "picture": "https://..."
  },
  "access_token": "jwt_token",
  "refresh_token": "refresh_token"
}
```

### **Document Management Endpoints**

| Endpoint | Method | Description | Rate Limit |
|----------|--------|-------------|------------|
| `/documents` | GET | List user's Google Drive documents | 60/min |
| `/documents/from-folder-all` | POST | Get all documents from folder (recursive) | 60/min |
| `/documents/from-folder-all-stream` | POST | Stream documents progressively (SSE) | 60/min |
| `/documents/bulk-upload-parallel-stream` | POST | Ultra-fast parallel upload with streaming | 60/min |
| `/documents/add` | POST | Add documents to knowledge base | 60/min |

**Example:**
```bash
# Get documents from folder
curl -X POST http://localhost:8000/documents/from-folder-all \
  -H "Authorization: Bearer jwt_token" \
  -H "X-Google-Token: google_access_token" \
  -H "Content-Type: application/json" \
  -d '{"folder_url": "https://drive.google.com/drive/folders/folder_id"}'

# Response
[
  {
    "id": "doc_id",
    "name": "Document Name",
    "mimeType": "application/vnd.google-apps.document",
    "webViewLink": "https://docs.google.com/document/d/doc_id",
    "modifiedTime": "2024-12-18T12:00:00Z"
  },
  ...
]
```

### **Chat & AI Endpoints**

| Endpoint | Method | Description | Rate Limit |
|----------|--------|-------------|------------|
| `/chat` | POST | Chat with documents using RAG | 60/min |

**Example:**
```bash
# Chat with documents
curl -X POST http://localhost:8000/chat \
  -H "Authorization: Bearer jwt_token" \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the main topic of the documents?"}'

# Response
{
  "message": "Based on the documents, the main topic is...",
  "sources": [
    {
      "document_name": "Document Name",
      "document_id": "doc_id",
      "chunk_text": "Relevant chunk...",
      "similarity": 0.85
    }
  ],
  "from_documents": true,
  "fallback_used": false
}
```

---

## 🎨 **Project Structure**

```
lenrag/
├── 📁 app/                          # Next.js 14 App Router
│   ├── page.tsx                     # Main dashboard page
│   ├── layout.tsx                   # Root layout with providers
│   ├── globals.css                  # Global styles
│   ├── icon.png                     # App icon
│   ├── auth/                        # Authentication
│   │   └── callback/                # OAuth callback handler
│   ├── api/                         # API routes
│   ├── mobile-auth/                 # Mobile authentication
│   ├── privacy/                     # Privacy policy page
│   └── terms/                       # Terms of service page
│
├── 📁 components/                   # React Components
│   ├── ErrorBoundary.tsx            # Global error boundary
│   ├── dashboard/                   # Dashboard components
│   │   ├── chat-interface.tsx       # AI chat interface
│   │   ├── document-list.tsx        # Document management
│   │   ├── upload-progress.tsx      # Upload progress UI
│   │   └── sidebar.tsx              # Navigation sidebar
│   ├── auth/                        # Authentication components
│   │   └── google-auth-button.tsx   # Google OAuth button
│   └── ui/                          # Reusable UI components (Radix UI)
│       ├── button.tsx               # Button component
│       ├── card.tsx                 # Card component
│       ├── dialog.tsx               # Dialog/Modal component
│       ├── input.tsx                # Input component
│       ├── progress.tsx             # Progress bar
│       └── toast.tsx                # Toast notifications
│
├── 📁 backend/                      # FastAPI Backend
│   ├── main.py                      # FastAPI app entry point (44KB)
│   ├── config.py                    # Environment configuration
│   ├── .env                         # Development environment variables
│   ├── .env.production              # Production environment variables
│   ├── .env.railway                 # Railway deployment config
│   ├── .env.vercel                  # Vercel deployment config
│   ├── requirements.txt             # Python dependencies
│   ├── requirements.docker.txt      # Docker-specific dependencies
│   ├── requirements-dev.txt         # Development dependencies
│   ├── pytest.ini                   # Pytest configuration
│   │
│   ├── services/                    # Business Logic Layer
│   │   ├── google_auth.py           # Google OAuth 2.0 service
│   │   ├── google_docs.py           # Google Drive/Docs API (47KB)
│   │   └── rag_pipeline.py          # RAG pipeline engine (57KB)
│   │
│   ├── models/                      # Data Models
│   │   └── schemas.py               # Pydantic request/response schemas
│   │
│   ├── utils/                       # Utility Functions
│   │   ├── http_client.py           # HTTP/2 client with connection pooling
│   │   └── cache.py                 # Caching utilities
│   │
│   ├── tests/                       # Unit Tests
│   │   ├── test_google_auth.py      # Auth service tests
│   │   ├── test_google_docs.py      # Docs service tests
│   │   ├── test_rag_pipeline.py     # RAG pipeline tests
│   │   └── conftest.py              # Pytest fixtures
│   │
│   ├── chroma_db/                   # ChromaDB vector storage (auto-created)
│   ├── cache/                       # Application cache (auto-created)
│   └── venv/                        # Python virtual environment
│
├── 📁 android/                      # Android App (Capacitor)
│   ├── app/                         # Android app source
│   │   ├── src/                     # Java/Kotlin source
│   │   └── build.gradle             # Android build config
│   └── gradle/                      # Gradle wrapper
│
├── 📁 ios/                          # iOS App (Capacitor)
│   ├── App/                         # iOS app source
│   │   ├── App/                     # Swift source
│   │   └── Podfile                  # CocoaPods dependencies
│   └── Pods/                        # iOS dependencies
│
├── 📁 docs/                         # Comprehensive Documentation (75+ files)
│   ├── DEPLOYMENT_GUIDE.md          # Deployment instructions
│   ├── BATCH_SIZE_REFERENCE.md      # Batch size configurations
│   ├── PRE_DEPLOYMENT_CHECKLIST.md  # Pre-deployment checklist
│   ├── AUDIT_SUMMARY.md             # Security audit report
│   ├── DOCKER_DEPLOY_GUIDE.md       # Docker deployment guide
│   ├── RAILWAY_DEPLOY.md            # Railway deployment guide
│   ├── TESTING_GUIDE.md             # Testing instructions
│   ├── TROUBLESHOOTING_*.md         # Troubleshooting guides
│   ├── PERFORMANCE_*.md             # Performance optimization docs
│   ├── progress/                    # Development progress logs
│   └── troubleshooting/             # Detailed troubleshooting
│
├── � config/                       # Configuration Files
│   └── ...                          # App configurations
│
├── 📁 hooks/                        # React Custom Hooks
│   └── ...                          # Custom React hooks
│
├── 📁 lib/                          # Shared Libraries
│   └── ...                          # Utility libraries
│
├── 📁 utils/                        # Frontend Utilities
│   └── tokenManager.ts              # JWT token management
│
├── 📁 public/                       # Static Assets
│   └── ...                          # Images, icons, etc.
│
├── 📁 resources/                    # App Resources
│   └── ...                          # Mobile app resources
│
├── 📁 ssl/                          # SSL Certificates
│   └── ...                          # HTTPS certificates (optional)
│
├── 📁 .github/                      # GitHub Configuration
│   └── workflows/                   # CI/CD workflows
│
├── �� docker-compose.yml            # Docker Compose (development)
├── 🐳 docker-compose.prod.yml       # Docker Compose (production)
├── 🐳 Dockerfile.backend            # Backend Docker image
├── 🐳 Dockerfile.frontend           # Frontend Docker image (dev)
├── 🐳 Dockerfile.frontend.prod      # Frontend Docker image (prod)
├── 🐳 railway.dockerfile            # Railway-specific Dockerfile
│
├── 📄 capacitor.config.ts           # Capacitor mobile app config
├── 📄 next.config.js                # Next.js configuration
├── 📄 tailwind.config.js            # Tailwind CSS configuration
├── 📄 postcss.config.js             # PostCSS configuration
├── 📄 tsconfig.json                 # TypeScript configuration
├── 📄 package.json                  # Frontend dependencies
├── 📄 package-lock.json             # Locked frontend dependencies
│
├── 📄 .env.local                    # Frontend environment variables
├── 📄 .env.railway                  # Railway frontend config
├── 📄 .env.example                  # Example environment file
├── 📄 .gitignore                    # Git ignore rules
├── 📄 .eslintrc.json                # ESLint configuration
├── 📄 .dockerignore                 # Docker ignore rules
│
├── 📄 vercel.json                   # Vercel deployment config
├── 📄 railway.json                  # Railway deployment config
├── 📄 nginx.conf                    # Nginx configuration (optional)
│
├── 📄 styles.css                    # Additional global styles
│
└── 📄 README.md                     # This file (87KB - comprehensive docs)
```

### **📊 Project Statistics**

| Category | Count | Size |
|----------|-------|------|
| **Total Files** | 200+ | ~150MB (excluding node_modules) |
| **Documentation Files** | 75+ | ~500KB |
| **Backend Code** | 15+ files | ~200KB |
| **Frontend Components** | 20+ files | ~150KB |
| **Test Files** | 10+ files | ~50KB |
| **Configuration Files** | 15+ files | ~30KB |

### **🔑 Key Files Explained**

#### **Backend Core:**
- `main.py` (44KB): FastAPI application with all endpoints
- `rag_pipeline.py` (57KB): Complete RAG implementation with smart fallback
- `google_docs.py` (47KB): Google Drive/Docs integration with parallel processing
- `config.py`: Environment-aware configuration management

#### **Frontend Core:**
- `app/page.tsx` (22KB): Main dashboard with chat, upload, and document management
- `components/dashboard/`: All dashboard UI components
- `utils/tokenManager.ts`: JWT token management and auto-refresh

#### **Deployment:**
- `docker-compose.yml`: Development Docker setup (60 fetch / 15 embed)
- `docker-compose.prod.yml`: Production Docker setup
- `railway.dockerfile`: Railway-optimized build (3 fetch / 1 embed)
- `vercel.json`: Vercel frontend deployment

#### **Documentation:**
- `README.md` (87KB): This comprehensive guide
- `docs/`: 75+ detailed documentation files
- `DEPLOYMENT_GUIDE.md`: Step-by-step deployment
- `TROUBLESHOOTING_*.md`: Issue resolution guides

---

---

## 🚦 **Troubleshooting & FAQ**

### **Common Issues & Solutions**

---

#### **1. ❌ "Invalid API Key" Error**

**Problem:**
```
ERROR: Error code: 401 - {'error': {'message': 'Invalid API Key'}}
```

**Causes:**
- API key tidak valid atau expired
- API key tidak di-set di environment variables
- Typo dalam API key

**Solutions:**

**For Groq API:**
1. Get a new API key from [Groq Console](https://console.groq.com/keys)
2. Update `backend/.env`:
   ```bash
   GROQ_API_KEY=gsk_your_actual_groq_api_key_here
   ```
3. Restart backend:
   ```bash
   # Stop current process (Ctrl+C)
   python main.py
   ```

**For Gemini API:**
1. Get API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Update `backend/.env`:
   ```bash
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

**For Docker:**
1. Update `backend/.env.production` with the same keys
2. Rebuild containers:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

---

#### **2. 🔐 "Redirect URI Mismatch" Error**

**Problem:**
```
ERROR: redirect_uri_mismatch
The redirect URI in the request does not match the ones authorized for the OAuth client.
```

**Causes:**
- Redirect URI tidak match dengan Google Cloud Console
- HTTP vs HTTPS mismatch
- Port number berbeda

**Solutions:**

**Step 1: Check Current Redirect URI**
Look at your error logs to see what redirect URI is being used:
```
Request redirect_uri: http://localhost:3000/auth/callback
```

**Step 2: Update Google Cloud Console**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Click on your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", add **EXACTLY**:
   - For localhost: `http://localhost:3000/auth/callback`
   - For Docker: `http://localhost:3000/auth/callback`
   - For Railway: `https://your-vercel-app.vercel.app/auth/callback`
   - For ngrok: `http://localhost:3000/auth/callback` (frontend stays localhost)

**Step 3: Also Add Backend OAuth URI**
Add these for backend OAuth flow:
- For localhost: `http://localhost:8000/auth/google`
- For Railway: `https://your-railway-backend.up.railway.app/auth/google`
- For ngrok: `https://your-ngrok-url.ngrok.io/auth/google`

**Step 4: Clear Browser Cache**
- Clear cookies and cache
- Try authentication again in incognito mode

---

#### **3. 💾 "Out of Memory" Error on Railway**

**Problem:**
```
ERROR: Application crashed - Out of Memory
Process killed (OOM)
```

**Causes:**
- Railway free tier has 512MB memory limit
- Batch sizes too large (60 fetch / 15 embed)
- Too many documents uploaded at once

**Solutions:**

**Solution 1: Use Correct Environment Variables**
Railway should auto-detect and use smaller batch sizes. Verify in Railway dashboard:
```bash
RAILWAY_ENVIRONMENT=true
BULK_UPLOAD_BATCH_SIZE=3
EMBEDDING_BATCH_SIZE=1
LOG_LEVEL=ERROR
```

**Solution 2: Reduce Batch Sizes Further**
If still getting OOM, reduce even more:
```bash
BULK_UPLOAD_BATCH_SIZE=1
EMBEDDING_BATCH_SIZE=1
```

**Solution 3: Upload Fewer Documents**
- Railway free tier: Max 10-20 documents per upload
- For bulk uploads (100+ docs), use Docker instead

**Solution 4: Reduce Logging**
Set `LOG_LEVEL=ERROR` to reduce memory usage from logs

**Solution 5: Upgrade Railway Plan**
- Pro plan: 8GB memory ($5/month)
- Can handle 100+ documents easily

**Best Practice:**
Use Railway for production API, but use Docker for bulk document uploads.

---

#### **4. 🐌 Slow Upload Performance**

**Problem:**
- Upload takes 30+ minutes for 50 documents
- Progress bar stuck
- Timeout errors

**Possible Causes & Solutions:**

**Cause 1: Wrong Environment (Railway instead of Docker)**
- **Check**: Are you on Railway/Vercel?
- **Solution**: Use Docker for bulk uploads
  ```bash
  docker-compose up --build
  ```

**Cause 2: Batch Sizes Too Small**
- **Check**: `backend/.env` batch sizes
- **Solution**: For Docker, use:
  ```bash
  BULK_UPLOAD_BATCH_SIZE=60
  EMBEDDING_BATCH_SIZE=15
  ```

**Cause 3: Network Issues**
- **Check**: Internet connection speed
- **Solution**: 
  - Use wired connection instead of WiFi
  - Close other bandwidth-heavy applications
  - Try again during off-peak hours

**Cause 4: Large Documents**
- **Check**: Document sizes (PDFs with images, large presentations)
- **Solution**: 
  - Split large documents into smaller files
  - Compress PDFs before uploading
  - Remove unnecessary images

**Cause 5: API Rate Limits**
- **Check**: Groq API quota (14,400 requests/day for free tier)
- **Solution**:
  - Wait 24 hours for quota reset
  - Upgrade to paid plan
  - Use Gemini as primary LLM instead

**Performance Benchmarks:**
| Environment | 50 Docs | Expected Time |
|-------------|---------|---------------|
| Docker (60/15) | 50 docs | 3-5 minutes |
| Railway (3/1) | 50 docs | 40-60 minutes |
| Localhost (60/15) | 50 docs | 3-5 minutes |

---

#### **5. 🔌 ChromaDB Connection Issues**

**Problem:**
```
ERROR: Could not connect to ChromaDB
Connection refused on port 8000
```

**Causes:**
- ChromaDB not initialized
- Port conflict
- Corrupted database files

**Solutions:**

**Solution 1: Check ChromaDB Directory**
```bash
# Backend directory should have chroma_db folder
ls backend/chroma_db/
```

**Solution 2: Delete and Reinitialize ChromaDB**
```bash
# ⚠️ WARNING: This will delete all uploaded documents!
cd backend
rm -rf chroma_db/
# Restart backend - ChromaDB will auto-initialize
python main.py
```

**Solution 3: Check Port Conflicts**
```bash
# Windows
netstat -ano | findstr :8000

# Linux/Mac
lsof -i :8000
```

**Solution 4: For Docker**
```bash
# Remove volumes and restart
docker-compose down -v
docker-compose up --build
```

**Solution 5: Verify ChromaDB Installation**
```bash
cd backend
pip install chromadb==0.4.22 --force-reinstall
```

---

#### **6. 🔄 "Token Expired" Error**

**Problem:**
```
ERROR: Token has expired
401 Unauthorized
```

**Causes:**
- JWT token expired (30-minute lifetime)
- Google access token expired
- Refresh token invalid

**Solutions:**

**Solution 1: Refresh Page**
- Simply refresh the page
- Frontend will automatically refresh tokens

**Solution 2: Re-authenticate**
- Click "Sign Out"
- Click "Sign in with Google" again

**Solution 3: Clear Browser Storage**
```javascript
// Open browser console (F12) and run:
localStorage.clear();
sessionStorage.clear();
// Then refresh page
```

**Solution 4: Check Backend Logs**
Look for token refresh errors in backend logs

---

#### **7. 📱 Mobile App Issues**

**Problem:**
- App won't connect to backend
- "Network Error" on mobile
- OAuth not working on mobile

**Solutions:**

**For Android:**

**Issue: App can't reach localhost**
- **Cause**: Android emulator can't access `localhost:8000`
- **Solution**: Use `10.0.2.2:8000` for emulator or ngrok for real device
  ```typescript
  // capacitor.config.ts
  server: {
    url: 'https://your-ngrok-url.ngrok.io'
  }
  ```

**Issue: OAuth redirect not working**
- **Cause**: Custom URL scheme not configured
- **Solution**: Add to `capacitor.config.ts`:
  ```typescript
  server: {
    androidScheme: 'https'
  }
  ```

**For iOS:**

**Issue: CORS errors**
- **Solution**: Add backend URL to allowed origins in `backend/main.py`

**Issue: App crashes on launch**
- **Solution**: Rebuild app:
  ```bash
  npm run build
  npx cap sync ios
  npx cap open ios
  ```

---

### **❓ Frequently Asked Questions (FAQ)**

---

#### **Q1: How many documents can I upload?**

**Answer:**
- **Docker/Localhost**: 1000+ documents (limited by disk space)
- **Railway Free Tier**: 10-20 documents per upload (memory limited)
- **Railway Pro**: 100+ documents (8GB memory)

**Recommendation**: Use Docker for bulk uploads, Railway for production API.

---

#### **Q2: Which LLM provider should I use?**

**Answer:**

| Provider | Best For | Free Tier | Speed | Accuracy |
|----------|----------|-----------|-------|----------|
| **Groq** | Production | 14.4K req/day | ⚡ Ultra-fast | ⭐⭐⭐⭐ |
| **Gemini** | Fallback | 60 req/min | 🔋 Fast | ⭐⭐⭐⭐⭐ |

**Recommendation**: Use Groq as primary, Gemini as fallback (already configured).

---

#### **Q3: How do I delete all documents?**

**Answer:**

**Option 1: Through UI**
- Go to Documents page
- Select all documents
- Click "Delete Selected"

**Option 2: Delete ChromaDB (Backend)**
```bash
cd backend
rm -rf chroma_db/
# Restart backend
python main.py
```

**Option 3: Docker**
```bash
docker-compose down -v
docker-compose up --build
```

---

#### **Q4: Can I use my own LLM?**

**Answer:**
Yes! DORA supports any OpenAI-compatible API.

**Steps:**
1. Edit `backend/services/rag_pipeline.py`
2. Add your LLM client:
   ```python
   from your_llm_library import YourLLMClient
   
   self.your_llm = YourLLMClient(api_key=os.getenv("YOUR_LLM_API_KEY"))
   ```
3. Update `_generate_content_with_retry()` method
4. Add to `.env`:
   ```bash
   YOUR_LLM_API_KEY=your_api_key
   LLM_PROVIDER=your_llm
   ```

---

#### **Q5: How do I backup my documents?**

**Answer:**

**Backup ChromaDB:**
```bash
# Create backup
cd backend
tar -czf chroma_backup_$(date +%Y%m%d).tar.gz chroma_db/

# Restore backup
tar -xzf chroma_backup_20241224.tar.gz
```

**Backup to Cloud:**
- Copy `backend/chroma_db/` to Google Drive, Dropbox, etc.
- For Docker, backup volume:
  ```bash
  docker run --rm -v dora-chroma-db:/data -v $(pwd):/backup ubuntu tar czf /backup/chroma_backup.tar.gz /data
  ```

---

#### **Q6: Why is my query not finding relevant documents?**

**Possible Reasons:**

1. **Similarity threshold too high**
   - Default: 0.7
   - Lower it in `backend/services/rag_pipeline.py`:
     ```python
     SIMILARITY_THRESHOLD = 0.5  # Lower = more results
     ```

2. **Documents not uploaded correctly**
   - Check Documents page to verify upload
   - Re-upload if needed

3. **Query too vague**
   - Be more specific in your question
   - Use keywords from your documents

4. **Wrong language**
   - Ensure query language matches document language

---

#### **Q7: How do I deploy to production?**

**Answer:**

**Recommended Setup:**
- **Frontend**: Vercel (free, global CDN)
- **Backend**: Railway (free tier or $5/month Pro)
- **Bulk Uploads**: Docker (local machine)

**Quick Deploy:**
1. Push code to GitHub
2. Connect Railway to GitHub repo (backend)
3. Connect Vercel to GitHub repo (frontend)
4. Set environment variables (see Deployment section)
5. Deploy! 🚀

**Detailed Guide**: See [Deployment Options](#-deployment-options) section above.

---

#### **Q8: Can I use DORA offline?**

**Answer:**

**Partially Yes:**
- ✅ **Chat with uploaded documents**: Works offline (if backend running locally)
- ❌ **Upload new documents**: Requires internet (Google Drive API)
- ❌ **LLM responses**: Requires internet (Groq/Gemini API)

**For Offline Use:**
- Use Docker deployment
- Upload documents while online
- Chat works offline (uses local ChromaDB)
- Consider using local LLM (Ollama, LM Studio)

---

#### **Q9: How much does it cost to run DORA?**

**Answer:**

**Free Tier (Recommended for Testing):**
- Frontend: Vercel (Free)
- Backend: Railway (Free - 512MB, $5 credit/month)
- LLM: Groq (Free - 14.4K req/day)
- Storage: ChromaDB (Free - local storage)
- **Total: $0/month** ✅

**Production (Recommended):**
- Frontend: Vercel (Free)
- Backend: Railway Pro ($5/month - 8GB memory)
- LLM: Groq Pro ($0.10/1M tokens) or Gemini ($0)
- **Total: ~$5-10/month**

**Enterprise:**
- Custom deployment
- Dedicated servers
- Contact for pricing

---

#### **Q10: Is my data secure?**

**Answer:**

**Yes! DORA implements multiple security layers:**

1. ✅ **OAuth 2.0**: Industry-standard authentication
2. ✅ **JWT Tokens**: Secure session management
3. ✅ **HTTPS**: All traffic encrypted (production)
4. ✅ **Rate Limiting**: DDoS protection
5. ✅ **Input Validation**: SQL injection prevention
6. ✅ **CORS**: Cross-origin protection
7. ✅ **Local Storage**: Documents stored locally (ChromaDB)
8. ✅ **No Data Sharing**: Your documents never leave your infrastructure

**Privacy:**
- Documents are NOT sent to third parties
- Only embeddings and queries sent to LLM providers
- You control all data (self-hosted)

---

### **🆘 Still Having Issues?**

If your issue isn't listed here:

1. **Check Logs**:
   ```bash
   # Backend logs
   cd backend
   python main.py
   
   # Docker logs
   docker-compose logs -f
   ```

2. **Search Existing Issues**: [GitHub Issues](https://github.com/suryahanjaya/lenrag/issues)

3. **Open New Issue**: [Create Issue](https://github.com/suryahanjaya/lenrag/issues/new)
   - Include error logs
   - Describe steps to reproduce
   - Mention your environment (Docker/Railway/Localhost)

4. **Contact Developer**: See [Support & Contact](#-support--contact) section

---

## 🤝 **Contributing**

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open Pull Request**

**Code Standards:**
- ✅ TypeScript: Strict mode, comprehensive types
- ✅ Python: PEP 8, type hints required
- ✅ Testing: Minimum 80% coverage
- ✅ Documentation: Update README for new features

---

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- **Google APIs** for document integration and authentication
- **Groq** for ultra-fast LLM inference
- **ChromaDB** for vector storage excellence
- **Next.js** and **FastAPI** communities
- **Capacitor** for cross-platform mobile support
- **Railway** and **Vercel** for hosting infrastructure

---

## 📞 **Support & Contact**

<div align="center">

### **Surya Hanjaya**
*Full-Stack Developer & AI Enthusiast*

[![LinkedIn](https://img.shields.io/badge/LinkedIn-surya--hanjaya-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/surya-hanjaya/)
[![GitHub](https://img.shields.io/badge/GitHub-suryahanjaya-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/suryahanjaya)
[![Instagram](https://img.shields.io/badge/Instagram-h4njy-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/h4njy/)

**Questions?** Open an [issue](https://github.com/suryahanjaya/lenrag/issues) or reach out!

</div>

---

<div align="center">

⭐ **Star this repo if you find it helpful!** ⭐

**Last Updated:** December 24, 2024  
**Version:** 2.1.0  
**Status:** ✅ Production Ready

</div>