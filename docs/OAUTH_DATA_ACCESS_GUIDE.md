# 🔐 OAuth Data Access & Additional Info Guide

## 📋 **1. Data Access - Scopes Configuration**

### **Langkah-langkah:**
1. Klik tombol **"ADD OR REMOVE SCOPES"**
2. Centang scopes berikut:

| ✅ Scope | User-facing Description | Sensitive? |
|---------|------------------------|------------|
| `https://www.googleapis.com/auth/userinfo.email` | View your email address | ❌ No |
| `https://www.googleapis.com/auth/userinfo.profile` | See your personal info | ❌ No |
| `https://www.googleapis.com/auth/drive.readonly` | View the files in your Google Drive | ⚠️ **Sensitive** |
| `https://www.googleapis.com/auth/documents.readonly` | View your Google Docs documents | ⚠️ **Sensitive** |

3. Klik **"UPDATE"** untuk menyimpan

---

## 📝 **2. Additional Info (Copy-Paste Ini)**

```
DORA - Document Retrieval Assistant

=== APPLICATION PURPOSE ===
AI-powered document search and Q&A system that helps users interact with their Google Drive documents using natural language. Uses RAG (Retrieval-Augmented Generation) technology.

=== WHY WE NEED THESE PERMISSIONS ===

• userinfo.email & userinfo.profile
  → User authentication and displaying user info in UI
  
• drive.readonly
  → Read documents from user-selected Google Drive folders
  → We ONLY READ, never modify or delete files
  
• documents.readonly
  → Extract text from Google Docs for AI processing
  → Read-only access, no modifications

=== HOW IT WORKS ===
1. User logs in with Google
2. Selects Google Drive folder to index
3. App processes documents into AI embeddings
4. User asks questions → AI answers using document context
5. Original files stay in Google Drive (we don't store copies)

=== SECURITY & PRIVACY ===
• HTTPS encryption for all data
• User data isolated (separate databases per user)
• Only embeddings stored, not original documents
• Users can delete their data anytime
• Privacy policy: https://dora-j.vercel.app/privacy

=== TEST ACCOUNT ===
Email: suryahanajaya76@gmail.com

=== TECHNICAL INFO ===
• Frontend: https://dora-j.vercel.app (Next.js, Vercel)
• Backend: FastAPI, ChromaDB, Python
• GitHub: https://github.com/suryahanjaya/lenrag
• Open source (MIT License)

=== CONTACT ===
Developer: Surya Hanjaya
Email: suryahanajaya76@gmail.com

Note: Educational/portfolio project, currently in testing phase.
```

---

## 🎯 **Quick Copy-Paste (Versi Singkat - Max 1000 karakter)**

Jika ada limit 1000 karakter, gunakan versi ini:

```
DORA - AI Document Retrieval Assistant

PURPOSE: Help users search and interact with Google Drive documents using AI-powered natural language queries.

SCOPES JUSTIFICATION:
• userinfo.email/profile: User authentication
• drive.readonly: Read documents from user-selected folders (READ ONLY, no modifications)
• documents.readonly: Extract text from Google Docs for AI processing

HOW IT WORKS: User logs in → selects Drive folder → app creates AI embeddings → user asks questions → AI answers using document context. Original files remain in Google Drive.

SECURITY: HTTPS encryption, isolated user data, embeddings-only storage, user-controlled deletion.

TECH: Next.js frontend (Vercel), FastAPI backend, ChromaDB vector DB.
Privacy: https://dora-j.vercel.app/privacy
GitHub: https://github.com/suryahanjaya/lenrag

Test: suryahanajaya76@gmail.com
Contact: suryahanajaya76@gmail.com

Educational project, testing phase.
```

---

## ✅ **Checklist**

- [ ] Tambahkan 4 scopes yang diperlukan
- [ ] Copy-paste additional info (pilih versi panjang atau singkat)
- [ ] Pastikan test user email sudah ditambahkan: `suryahanajaya76@gmail.com`
- [ ] Verifikasi privacy policy & terms sudah live:
  - [ ] https://dora-j.vercel.app/privacy
  - [ ] https://dora-j.vercel.app/terms

---

## 🚨 **Penting!**

### **Jika Status "Testing":**
- Aplikasi hanya bisa digunakan oleh test users yang Anda tambahkan
- Maksimal 100 test users
- Tidak perlu verification

### **Jika Ingin "Production":**
- Harus submit untuk Google verification
- Proses review 4-6 minggu
- Perlu video demo aplikasi
- Perlu penjelasan detail penggunaan sensitive scopes

### **Rekomendasi:**
✅ **Gunakan status "Testing" dulu** untuk development dan demo
✅ Submit verification nanti jika sudah production-ready

---

## 📞 **Need Help?**

Jika ada pertanyaan atau error, hubungi:
- Email: suryahanajaya76@gmail.com
- GitHub Issues: https://github.com/suryahanjaya/lenrag/issues

---

**Last Updated**: December 16, 2025
