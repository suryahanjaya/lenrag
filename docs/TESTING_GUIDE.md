# 🧪 Testing Guide - Sebelum Deploy ke Vercel/Railway

## 📋 Overview

Dokumen ini menjelaskan cara menjalankan semua tests **secara lokal** sebelum deploy ke Vercel atau Railway. Ini akan memastikan bahwa CI/CD pipeline di GitHub Actions akan sukses.

---

## 🚀 Quick Start - Automated Testing

### **Windows (PowerShell):**
```powershell
.\test-before-deploy.ps1
```

### **Linux/Mac (Bash):**
```bash
chmod +x test-before-deploy.sh
./test-before-deploy.sh
```

Script ini akan otomatis menjalankan:
1. ✅ Backend unit tests
2. ✅ Backend integration tests
3. ✅ Code quality checks
4. ✅ Frontend build
5. ✅ Security scans

---

## 📝 Manual Testing (Step by Step)

Jika Anda ingin menjalankan tests secara manual satu per satu:

### **1. Backend Tests**

#### Setup Environment
```bash
cd backend

# Create test .env file
cat > .env << EOF
GROQ_API_KEY=test_groq_key_for_ci
GOOGLE_CLIENT_ID=test_client_id
GOOGLE_CLIENT_SECRET=test_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
ENVIRONMENT=test
LOG_LEVEL=WARNING
EOF
```

#### Install Dependencies
```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
pip install pytest pytest-asyncio httpx flake8 black
```

#### Verify Installation
```bash
python -m pytest --version
```

#### Run Tests
```bash
# Unit tests
python -m pytest tests/test_basic.py -v --tb=short

# Integration tests
python -m pytest tests/test_integration.py -v --tb=short

# All tests
python -m pytest tests/ -v --tb=short
```

#### Code Quality (Optional)
```bash
# Flake8 - syntax errors only
python -m flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics --exclude=venv,__pycache__,.git,tests

# Black - formatting check
python -m black --check . --exclude="venv|__pycache__|.git|tests"
```

---

### **2. Frontend Tests**

#### Setup Environment
```bash
cd ..  # Back to root directory

# Create .env.local
cat > .env.local << EOF
NEXT_PUBLIC_GOOGLE_CLIENT_ID=test_client_id
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF
```

#### Install Dependencies
```bash
npm ci
```

#### Run Tests
```bash
# Lint check (optional)
npm run lint

# Build check (CRITICAL)
npm run build
```

---

### **3. Security Scan (Optional)**

```bash
cd backend

# Install security tools
pip install safety bandit

# Check dependencies
safety check --file requirements.txt --output text

# Run Bandit
bandit -r . -f json -o bandit-report.json --exclude ./venv,./tests
```

---

## ✅ Expected Results

### **Backend Tests**
```
tests/test_basic.py::TestHealthEndpoints::test_root_endpoint PASSED
tests/test_basic.py::TestHealthEndpoints::test_health_endpoint PASSED
tests/test_basic.py::TestHealthEndpoints::test_health_detailed PASSED
tests/test_basic.py::TestHealthEndpoints::test_health_live PASSED
tests/test_basic.py::TestAuthentication::test_auth_endpoint_exists PASSED
tests/test_basic.py::TestRateLimiting::test_rate_limit_exists PASSED
tests/test_basic.py::TestCORS::test_cors_headers PASSED

========================= 7 passed in 2.5s =========================
```

### **Frontend Build**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Creating an optimized production build
✓ Collecting page data
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB         87.4 kB
└ ○ /auth/callback                       1.8 kB         83.9 kB

○  (Static)  automatically rendered as static HTML
```

---

## 🔧 Troubleshooting

### **Error: pytest: command not found**
**Solusi:**
```bash
pip install pytest pytest-asyncio httpx
# Atau gunakan:
python -m pip install pytest pytest-asyncio httpx
```

### **Error: Module not found**
**Solusi:**
```bash
cd backend
pip install -r requirements.txt
```

### **Frontend Build Error: Missing environment variables**
**Solusi:**
```bash
# Pastikan .env.local ada
cat > .env.local << EOF
NEXT_PUBLIC_GOOGLE_CLIENT_ID=test_client_id
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF
```

### **ChromaDB Errors di Tests**
**Solusi:**
Tests dirancang untuk handle ChromaDB errors dengan graceful degradation. Jika ChromaDB tidak available, tests akan tetap pass dengan status "degraded".

---

## 🚀 Deploy Checklist

Sebelum deploy ke Vercel/Railway, pastikan:

- [ ] ✅ Backend unit tests PASSED
- [ ] ✅ Backend integration tests PASSED
- [ ] ✅ Frontend build PASSED
- [ ] ✅ No critical security vulnerabilities
- [ ] ✅ Environment variables sudah dikonfigurasi di Vercel/Railway

### **Vercel Environment Variables**
Di Vercel Dashboard → Settings → Environment Variables, tambahkan:
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your_real_client_id>
NEXT_PUBLIC_API_URL=<your_backend_url>
```

### **Railway Environment Variables**
Di Railway Dashboard → Variables, tambahkan semua variables dari `backend/.env`:
```
GROQ_API_KEY=<your_real_key>
GOOGLE_CLIENT_ID=<your_real_client_id>
GOOGLE_CLIENT_SECRET=<your_real_client_secret>
GOOGLE_REDIRECT_URI=<your_real_redirect_uri>
```

---

## 📊 CI/CD Pipeline Status

Setelah push ke GitHub, monitor status di:
- **GitHub Actions**: `https://github.com/your-username/lenrag/actions`
- **Vercel**: Vercel Dashboard → Deployments
- **Railway**: Railway Dashboard → Deployments

### **Expected GitHub Actions Results:**
```
✅ Backend Tests - PASSED
✅ Frontend Tests - PASSED  
✅ Security Scan - PASSED
⏭️ Deploy to Staging - SKIPPED (only on main branch)
⏭️ Deploy to Production - SKIPPED (only on main branch)
```

---

## 🔄 Continuous Testing Workflow

### **Development Workflow:**
```bash
# 1. Make changes
git checkout -b feature/my-feature

# 2. Test locally
.\test-before-deploy.ps1  # Windows
./test-before-deploy.sh   # Linux/Mac

# 3. If tests pass, commit and push
git add .
git commit -m "feat: Add new feature"
git push origin feature/my-feature

# 4. Create Pull Request
# GitHub Actions will run automatically

# 5. After PR approved and merged to main
# Vercel/Railway will auto-deploy
```

---

## 📚 Additional Resources

- **Pytest Documentation**: https://docs.pytest.org/
- **Next.js Build**: https://nextjs.org/docs/deployment
- **GitHub Actions**: https://docs.github.com/en/actions
- **Vercel Deployment**: https://vercel.com/docs
- **Railway Deployment**: https://docs.railway.app/

---

## 🆘 Need Help?

Jika masih ada issues setelah mengikuti guide ini:

1. Check logs di GitHub Actions untuk error messages spesifik
2. Verify environment variables di Vercel/Railway
3. Run tests locally untuk reproduce issues
4. Check `docs/CI_CD_TROUBLESHOOTING.md` untuk common issues

---

## 📝 Notes

- **Test environment variables** adalah safe defaults - tidak menggunakan real API keys
- **Security scans** non-blocking - warnings tidak akan fail pipeline
- **Linting** non-blocking - fokus pada build success
- **Deploy jobs** hanya jalan di `main` branch dengan push event
