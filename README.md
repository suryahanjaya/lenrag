d
# 🚀 **Lara** - Legal RAG Assistant

<div align="center">

![Lara Logo](https://img.shields.io/badge/Lara-Legal%20RAG%20Assistant-blue?style=for-the-badge&logo=robot&logoColor=white)

**A powerful Retrieval-Augmented Generation (RAG) system designed to simplify the process of finding relevant laws and legal regulations.**

[![Next.js](https://img.shields.io/badge/Next.js-13+-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-yellow?style=flat-square&logo=python)](https://python.org/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector%20DB-purple?style=flat-square)](https://www.trychroma.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.0%20Flash-orange?style=flat-square&logo=google)](https://ai.google.dev/)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/suryahanjaya/lenrag?style=flat-square)](https://github.com/suryahanjaya/lenrag)
[![GitHub forks](https://img.shields.io/github/forks/suryahanjaya/lenrag?style=flat-square)](https://github.com/suryahanjaya/lenrag)

</div>

---

## 🎯 **What is Lara?**

**Lara** (Legal RAG Assistant) is an intelligent AI-powered system that revolutionizes how legal professionals and researchers access and understand legal documents. Built with cutting-edge technology, Lara combines the power of Google Drive integration, advanced AI processing, and semantic search to provide instant, accurate answers from your legal document collection.

### 🌟 **Why Lara?**

- **⚡ Lightning Fast**: Get answers in seconds, not hours
- **🎯 Precise Results**: AI-powered semantic search finds exactly what you need
- **📚 Multi-Format Support**: Works with Google Docs, PDFs, DOCX, and more
- **🔒 Secure**: Enterprise-grade security with Google OAuth
- **🌐 Always Available**: Cloud-based with 99.9% uptime
- **🎨 Beautiful UI**: Modern, responsive design that works on any device

---

## 🛠️ **Technology Stack**

### 🎨 **Frontend Technologies**

| Technology | Version | Purpose | Why We Chose It |
|------------|---------|---------|-----------------|
| **Next.js** | 13+ | React Framework | ⚡ App Router, SSR, optimized performance |
| **TypeScript** | 5.0+ | Type Safety | 🛡️ Catch errors at compile time |
| **Tailwind CSS** | 3.3+ | Styling | 🎨 Utility-first, responsive design |
| **Shadcn/ui** | Latest | Components | 🧩 Beautiful, accessible components |
| **Lucide React** | Latest | Icons | 🎯 Consistent, lightweight icons |

### ⚙️ **Backend Technologies**

| Technology | Version | Purpose | Why We Chose It |
|------------|---------|---------|-----------------|
| **FastAPI** | 0.100+ | Web Framework | 🚀 High performance, auto-docs, async |
| **Python** | 3.8+ | Programming Language | 🐍 Rich ecosystem, AI libraries |
| **ChromaDB** | Latest | Vector Database | 🔍 Optimized for embeddings, fast search |
| **Google APIs** | Latest | Integration | 📁 Drive, Docs, OAuth integration |
| **Gemini 2.0 Flash** | Latest | AI Model | 🤖 Advanced reasoning, fast responses |

### 🔧 **Infrastructure & Tools**

| Technology | Purpose | Benefits |
|------------|---------|----------|
| **Docker** | Containerization | 🐳 Consistent deployment, easy scaling |
| **Supabase** | Database (Optional) | 🗄️ PostgreSQL, real-time features |
| **Google Cloud** | APIs & Auth | ☁️ Reliable, secure, scalable |
| **Vercel** | Frontend Hosting | ⚡ Global CDN, zero-config deployment |
| **Render** | Backend Hosting | 🚀 Auto-deploy, managed infrastructure |

---

## 🚀 **Key Features**

### 🔐 **Authentication & Security**
- **Google OAuth 2.0**: Secure, industry-standard authentication
- **JWT Tokens**: Stateless, secure session management
- **Role-based Access**: Fine-grained permissions
- **Data Encryption**: End-to-end encryption for sensitive data

### 📁 **Document Management**
- **Google Drive Integration**: Seamless access to your documents
- **Multi-format Support**: Google Docs, PDFs, DOCX, TXT, PPTX
- **Smart Organization**: Automatic categorization and tagging
- **Version Control**: Track document changes over time

### 🤖 **AI-Powered Search**
- **Semantic Search**: Find documents by meaning, not just keywords
- **Contextual Understanding**: AI understands legal terminology
- **Multi-language Support**: Works in multiple languages
- **Smart Filtering**: Advanced search filters and sorting

### 💬 **Intelligent Chat**
- **Natural Language Processing**: Ask questions in plain English
- **Contextual Responses**: Answers based on your specific documents
- **Source Attribution**: Always know where answers come from
- **Conversation History**: Keep track of your research

---

## 📋 **Prerequisites**

### 🖥️ **System Requirements**
- **Node.js**: 16.0 or higher
- **Python**: 3.8 or higher
- **Git**: Latest version
- **Docker**: 20.0 or higher (optional)

### ☁️ **Cloud Services**
- **Google Cloud Console**: Project with APIs enabled
- **Gemini API**: API key for AI functionality
- **Supabase**: Account (optional, for advanced features)

### 🔑 **API Keys Required**
- Google OAuth Client ID & Secret
- Gemini API Key
- Supabase URL & Keys (optional)

---

## 🚀 **Quick Start Guide**

### 1️⃣ **Clone the Repository**

```bash
# Clone the repository
git clone https://github.com/suryahanjaya/lenrag.git
cd lenrag

# Check the structure
ls -la
```

### 2️⃣ **Google Cloud Setup**

1. **Create Google Cloud Project**
   ```bash
   # Go to Google Cloud Console
   # Create new project or select existing
   ```

2. **Enable Required APIs**
   - Google Drive API
   - Google Docs API
   - Google+ API

3. **Create OAuth Credentials**
   - Go to APIs & Services > Credentials
   - Create OAuth 2.0 Client ID
   - Set redirect URI: `http://localhost:3000/auth/callback`

### 3️⃣ **Environment Configuration**

#### Backend Environment (`.env` in backend folder):
```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Configuration (Optional)
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_key_here

# Development Settings
ENVIRONMENT=development
DEBUG=true
```

#### Frontend Environment (`.env.local` in root folder):
```env
# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here

# Backend Configuration
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Supabase Configuration (Optional)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4️⃣ **Backend Setup**

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the backend server
python main.py
```

### 5️⃣ **Frontend Setup**

```bash
# Navigate to root directory
cd ..

# Install dependencies
npm install

# Start the development server
npm run dev
```

### 6️⃣ **Access the Application**

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

---

## 🐳 **Docker Deployment**

### 🚀 **Quick Docker Setup**

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

### 🔧 **Individual Container Build**

#### Backend Container:
```bash
# Build backend image
docker build -f Dockerfile.backend -t lara-backend .

# Run backend container
docker run -p 8000:8000 --env-file backend/.env lara-backend
```

#### Frontend Container:
```bash
# Build frontend image
docker build -f Dockerfile.frontend -t lara-frontend .

# Run frontend container
docker run -p 3000:3000 --env-file .env.local lara-frontend
```

---

## 🌐 **Production Deployment**

### 🚀 **Vercel (Frontend)**

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Import your GitHub repository

2. **Configure Settings**
   ```yaml
   Framework Preset: Next.js
   Root Directory: . (root)
   Build Command: npm run build
   Output Directory: .next
   ```

3. **Environment Variables**
   - Add all `NEXT_PUBLIC_*` variables
   - Set production backend URL

### ⚙️ **Render (Backend)**

1. **Create Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Create new Web Service

2. **Configure Settings**
   ```yaml
   Root Directory: backend
   Build Command: pip install -r requirements.txt
   Start Command: python main.py
   Environment: Python 3
   ```

3. **Environment Variables**
   - Add all backend environment variables
   - Set production database URLs

---

## 📚 **API Documentation**

### 🔐 **Authentication Endpoints**

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| `POST` | `/auth/google` | Google OAuth authentication | `code`, `state` |
| `GET` | `/auth/refresh` | Refresh access token | `refresh_token` |
| `POST` | `/auth/logout` | Logout user | `token` |

### 📄 **Document Endpoints**

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| `GET` | `/documents` | List user documents | `page`, `limit`, `search` |
| `POST` | `/documents/add` | Add documents to knowledge base | `document_ids[]` |
| `DELETE` | `/documents/{id}` | Remove document from KB | `document_id` |
| `GET` | `/documents/{id}/content` | Get document content | `document_id` |

### 💬 **Chat Endpoints**

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| `POST` | `/chat` | Send message to AI | `message`, `context` |
| `GET` | `/chat/history` | Get chat history | `user_id`, `limit` |
| `DELETE` | `/chat/history` | Clear chat history | `user_id` |

### 🔍 **Search Endpoints**

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| `GET` | `/search` | Search documents | `query`, `filters` |
| `POST` | `/search/semantic` | Semantic search | `query`, `limit` |
| `GET` | `/search/suggestions` | Get search suggestions | `query` |

---

## 🎯 **Usage Examples**

### 📝 **Basic Document Search**

```typescript
// Search for documents about "contract law"
const searchResults = await fetch('/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "contract law",
    filters: { type: "legal_document" }
  })
});
```

### 💬 **AI Chat Example**

```typescript
// Ask a question about your documents
const chatResponse = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "What are the key requirements for a valid contract?",
    context: "legal_documents"
  })
});
```

### 📁 **Document Management**

```typescript
// Add documents to knowledge base
const addDocuments = await fetch('/api/documents/add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    document_ids: ["doc1", "doc2", "doc3"]
  })
});
```

---

## 🔍 **Troubleshooting**

### ❌ **Common Issues**

#### 1. **Authentication Failed**
```bash
# Check Google Cloud Console settings
✅ Redirect URI: http://localhost:3000/auth/callback
✅ APIs enabled: Drive, Docs, Google+
✅ Client ID and Secret in environment variables
```

#### 2. **Documents Not Loading**
```bash
# Check Google Drive API permissions
✅ Drive API enabled
✅ Proper scopes requested
✅ Access token valid
```

#### 3. **Chat Not Working**
```bash
# Check AI configuration
✅ Gemini API key valid
✅ Documents added to knowledge base
✅ Backend logs for errors
```

---

## 🤝 **Contributing**

We welcome contributions to Lara! Here's how you can help:

### 🚀 **Getting Started**

1. **Fork the Repository**
   ```bash
   git clone https://github.com/your-username/lenrag.git
   cd lenrag
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make Changes**
   - Follow our coding standards
   - Add tests for new features
   - Update documentation

4. **Submit Pull Request**
   ```bash
   git commit -m "Add amazing feature"
   git push origin feature/amazing-feature
   ```

---

## 📝 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

### 🏆 **Special Thanks**

- **Google AI Team** - For the amazing Gemini 2.0 Flash model
- **ChromaDB Team** - For the excellent vector database
- **Next.js Team** - For the incredible React framework
- **FastAPI Team** - For the high-performance Python framework
- **Open Source Community** - For all the amazing libraries and tools

---

## 📞 **Support & Contact**

### 🆘 **Need Help?**

- **Documentation**: Check our comprehensive docs above
- **Issues**: [GitHub Issues](https://github.com/suryahanjaya/lenrag/issues)
- **Discussions**: [GitHub Discussions](https://github.com/suryahanjaya/lenrag/discussions)
- **Email**: support@lara-legal.com

### 🌟 **Show Your Support**

If you find Lara helpful, please consider:

- ⭐ **Starring** the repository
- 🍴 **Forking** the project
- 🐛 **Reporting** bugs
- 💡 **Suggesting** new features
- 📢 **Sharing** with others

---

<div align="center">

### 🚀 **Built with ❤️ by the Lara Team**

**Lara** - Making Legal Research Simple, Fast, and Intelligent

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/suryahanjaya/lenrag)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/suryahanjaya)

---

**© 2025 Lara Legal RAG Assistant. All rights reserved.**

</div>
