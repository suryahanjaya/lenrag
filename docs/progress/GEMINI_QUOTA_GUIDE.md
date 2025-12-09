# Panduan Mengatasi Gemini API Quota Exceeded

## 🚨 Error yang Terjadi

```
429 You exceeded your current quota
* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0
```

## 📊 Quota Limits Gemini API (Free Tier)

| Model | Requests/Minute | Requests/Day | Input Tokens/Minute | Input Tokens/Day |
|-------|----------------|--------------|---------------------|------------------|
| **gemini-2.5-pro** | 2 | 50 | 32,000 | 1,000,000 |
| **gemini-1.5-flash** | 15 | 1,500 | 1,000,000 | 50,000,000 |
| **gemini-1.5-pro** | 2 | 50 | 32,000 | 1,000,000 |

## 💡 Solusi

### Solusi 1: Tunggu Reset Quota ⏱️

Quota akan reset otomatis:
- **Per menit**: Tunggu 1-2 menit
- **Per hari**: Reset jam 00:00 UTC (07:00 WIB)

**Cara cek quota saat ini:**
1. Buka: https://ai.dev/usage?tab=rate-limit
2. Login dengan akun Google yang sama dengan API key
3. Lihat usage dan reset time

### Solusi 2: Switch ke Model dengan Quota Lebih Besar 🔄

Tambahkan ke file `.env`:

```env
# Gunakan gemini-1.5-flash untuk quota lebih besar
GEMINI_MODEL=gemini-1.5-flash
```

**Perbandingan:**
- `gemini-2.5-pro`: 2 requests/menit, 50 requests/hari (kualitas tinggi)
- `gemini-1.5-flash`: **15 requests/menit, 1500 requests/hari** (lebih cepat, quota besar)

**Restart backend** setelah mengubah `.env`:
```bash
# Stop server (Ctrl+C)
cd backend
python main.py
```

### Solusi 3: Upgrade ke Paid Plan 💳 (Recommended untuk Production)

**Keuntungan:**
- ✅ Unlimited requests
- ✅ Higher rate limits
- ✅ Priority support
- ✅ Sangat murah (pay-per-use)

**Cara upgrade:**
1. Buka [Google AI Studio](https://aistudio.google.com/)
2. Klik **"Upgrade"** atau **"Enable billing"**
3. Hubungkan dengan Google Cloud Project
4. Enable billing di Google Cloud Console

**Estimasi biaya (sangat murah):**
- gemini-1.5-flash: $0.075 per 1M input tokens
- gemini-2.5-pro: $1.25 per 1M input tokens
- Untuk 1000 queries: ~$0.10 - $2.00

### Solusi 4: Gunakan Multiple API Keys 🔑 (Advanced)

Buat beberapa API key dan rotate:

1. **Buat API key baru** di [Google AI Studio](https://aistudio.google.com/apikey)
2. **Simpan di `.env`**:
   ```env
   GEMINI_API_KEY=AIzaSy...  # Primary key
   GEMINI_API_KEY_2=AIzaSy... # Backup key
   GEMINI_API_KEY_3=AIzaSy... # Backup key 2
   ```

3. **Implementasi rotation** (opsional, advanced)

### Solusi 5: Implement Caching & Rate Limiting 🛡️

Untuk mengurangi penggunaan API:

1. **Cache responses** untuk query yang sama
2. **Implement rate limiting** di frontend
3. **Batch requests** jika memungkinkan

## 🔧 Konfigurasi Model

Sekarang model dapat dikonfigurasi melalui environment variable:

```env
# File: backend/.env

# Pilih salah satu model:
GEMINI_MODEL=gemini-1.5-flash      # Quota besar, cepat (RECOMMENDED untuk development)
# GEMINI_MODEL=gemini-2.5-pro      # Kualitas tinggi, quota kecil (untuk production dengan billing)
# GEMINI_MODEL=gemini-1.5-pro      # Balance antara kualitas dan quota
```

## 📝 Best Practices

### Untuk Development (Free Tier)
```env
GEMINI_MODEL=gemini-1.5-flash
```
- ✅ 15 requests/menit (cukup untuk testing)
- ✅ 1500 requests/hari
- ✅ Cepat dan efisien

### Untuk Production (Paid)
```env
GEMINI_MODEL=gemini-2.5-pro
```
- ✅ Kualitas jawaban terbaik
- ✅ Unlimited dengan billing
- ✅ Lebih akurat untuk RAG

## 🔍 Monitoring Quota

### Cara 1: Google AI Studio
1. Buka: https://ai.dev/usage?tab=rate-limit
2. Login dengan akun yang sama
3. Monitor usage real-time

### Cara 2: Check Error Message
Error message akan memberitahu:
- Quota mana yang exceeded
- Berapa lama harus menunggu
- Link ke dokumentasi

## ⚠️ Tips Menghindari Quota Exceeded

1. **Gunakan gemini-1.5-flash** untuk development
2. **Implement caching** untuk query yang sering
3. **Rate limit** di frontend (max 1 request per 5 detik)
4. **Upgrade ke paid** jika aplikasi digunakan intensif
5. **Monitor usage** secara berkala

## 🚀 Quick Fix

**Jika quota habis sekarang:**

1. **Edit `.env`**:
   ```env
   GEMINI_MODEL=gemini-1.5-flash
   ```

2. **Restart backend**:
   ```bash
   cd backend
   python main.py
   ```

3. **Test lagi** setelah 1-2 menit

---

## 📚 Resources

- [Gemini API Quotas](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Google AI Studio](https://aistudio.google.com/)
- [Usage Dashboard](https://ai.dev/usage?tab=rate-limit)
- [Pricing](https://ai.google.dev/pricing)

---

**Update**: Model sekarang dapat dikonfigurasi melalui environment variable `GEMINI_MODEL` tanpa mengubah kode!
