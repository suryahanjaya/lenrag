# RAG Chatbot with Google Docs Integration

A powerful Retrieval-Augmented Generation (RAG) chatbot that integrates with Google Drive, allowing users to query their documents using natural language. Built with FastAPI backend and Next.js frontend.

![RAG Chatbot Demo](https://img.shields.io/badge/Status-Active-brightgreen) ![Python](https://img.shields.io/badge/Python-3.8+-blue) ![Next.js](https://img.shields.io/badge/Next.js-13+-black) ![FastAPI](https://img.shields.io/badge/FastAPI-Latest-green)

## 🚀 Features

### Core Features
- **Google OAuth Authentication** - Secure sign-in with Google accounts
- **Google Drive Integration** - Access and list documents from Google Drive
- **Multi-format Support** - Works with Google Docs, PDFs, DOCX, TXT, and PPTX files
- **RAG Pipeline** - Intelligent document querying using ChromaDB and Gemini AI
- **Smart Fallback** - Falls back to general knowledge when answers aren't found in documents
- **Clean UI** - Modern, responsive interface built with Next.js and Tailwind CSS

### Document Processing
- **Text Extraction** - Advanced content extraction from various file formats
- **Intelligent Chunking** - Smart text splitting for optimal retrieval
- **Vector Embeddings** - Semantic search using sentence transformers
- **Knowledge Base Management** - Add/remove documents from the AI knowledge base

### AI Capabilities
- **Natural Language Queries** - Ask questions in plain English
- **Contextual Responses** - Answers based on your specific documents
- **Clean Formatting** - Well-formatted responses without markdown artifacts
- **Multi-document Support** - Query across multiple documents simultaneously

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **ChromaDB** - Vector database for embeddings
- **Google APIs** - Drive and Docs integration
- **Gemini 2.0 Flash** - Advanced AI model for generation
- **Sentence Transformers** - Text embedding generation

### Frontend
- **Next.js 13+** - React framework with App Router
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn UI** - Modern component library
- **TypeScript** - Type-safe development

### Infrastructure
- **Docker** - Containerized deployment
- **Supabase** - Optional user management
- **Environment Variables** - Secure configuration management

## 📋 Prerequisites

- Python 3.8+
- Node.js 16+
- Google Cloud Console project with APIs enabled
- Gemini API key

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/santoshnaya/codemet-rag-chatbot.git
cd codemet-rag-chatbot
```

### 2. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Google Drive API
   - Google Docs API
   - Google+ API

4. Create OAuth 2.0 credentials:
   - Go to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **OAuth 2.0 Client IDs**
   - Set **Authorized redirect URIs** to: `http://localhost:3000/auth/callback`

### 3. Environment Configuration

#### Backend Environment (.env in backend folder):
```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key

# Supabase Configuration (Optional)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_key

# Development Settings
ENVIRONMENT=development
```

#### Frontend Environment (.env.local in root folder):
```env
# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# Backend Configuration
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Supabase Configuration (Optional)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 5. Frontend Setup

```bash
npm install
```

### 6. Run the Application

#### Start Backend (Terminal 1):
```bash
cd backend
source venv/bin/activate
python main.py
```

#### Start Frontend (Terminal 2):
```bash
npm run dev
```

### 7. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🎯 Usage

1. **Sign In**: Click "Sign in with Google" and authorize the application
2. **Browse Documents**: Navigate to the Documents tab to see your Google Drive files
3. **Add to Knowledge Base**: Select documents and add them to the chatbot's knowledge base
4. **Start Chatting**: Go to the Chat tab and ask questions about your documents
5. **Get Answers**: Receive intelligent responses based on your document content

## 🐳 Docker Deployment

### Build and Run with Docker Compose:
```bash
docker-compose up --build
```

### Individual Container Build:

#### Backend:
```bash
docker build -f Dockerfile.backend -t rag-chatbot-backend .
docker run -p 8000:8000 rag-chatbot-backend
```

#### Frontend:
```bash
docker build -f Dockerfile.frontend -t rag-chatbot-frontend .
docker run -p 3000:3000 rag-chatbot-frontend
```

## 🚀 Deployment

### Render (Backend)
1. Connect your GitHub repository to Render
2. Set the following configuration:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main.py`
   - **Environment Variables**: Add all backend environment variables

### Vercel (Frontend)
1. Connect your GitHub repository to Vercel
2. Set the following configuration:
   - **Framework Preset**: Next.js
   - **Root Directory**: `.` (root)
   - **Build Command**: `npm run build`
   - **Environment Variables**: Add all frontend environment variables

## 📚 API Endpoints

### Authentication
- `POST /auth/google` - Google OAuth authentication
- `GET /health` - Health check

### Documents
- `GET /documents` - List user documents
- `POST /documents/add` - Add documents to knowledge base
- `DELETE /documents/{id}` - Remove document from knowledge base

### Chat
- `POST /chat` - Chat with documents
- `GET /debug/knowledge-base` - Debug knowledge base content

### User
- `GET /user/profile` - Get user profile

## 🔍 Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check Google Cloud Console redirect URI: `http://localhost:3000/auth/callback`
   - Ensure APIs are enabled (Drive, Docs, Google+)
   - Verify client ID and secret in environment variables

2. **Documents Not Loading**
   - Check Google Drive API permissions
   - Verify access token is valid
   - Ensure proper scopes are requested

3. **Chat Not Working**
   - Check Gemini API key
   - Verify documents are added to knowledge base
   - Check backend logs for errors

### Debug Pages
- `/debug` - OAuth configuration debug
- `/debug-auth` - Authentication status and token testing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google APIs for document integration
- Gemini AI for intelligent responses
- ChromaDB for vector storage
- Next.js and FastAPI communities

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/santoshnaya/codemet-rag-chatbot/issues) section
2. Create a new issue with detailed information
3. Include error logs and environment details

---

**Built with ❤️ using FastAPI, Next.js, and Google AI**