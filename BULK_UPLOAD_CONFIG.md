# Panduan Konfigurasi Bulk Upload

## Cara Mengatur Batch Size

Batch size menentukan berapa banyak dokumen yang diproses secara bersamaan (parallel). 

### Metode 1: Melalui Environment Variable (Recommended)

Tambahkan ke file `.env` Anda:

```env
# Bulk Upload Configuration
BULK_UPLOAD_BATCH_SIZE=5  # Default: 5 dokumen per batch
```

### Metode 2: Melalui System Environment Variable

**Windows (PowerShell):**
```powershell
$env:BULK_UPLOAD_BATCH_SIZE="10"
```

**Linux/Mac:**
```bash
export BULK_UPLOAD_BATCH_SIZE=10
```

## Rekomendasi Batch Size

### Berdasarkan Spesifikasi Sistem

| Spesifikasi | RAM | CPU | Batch Size | Kecepatan |
|------------|-----|-----|------------|-----------|
| **Low-end** | 4GB | 2 cores | 3 | Lambat tapi stabil |
| **Mid-range** | 8GB | 4 cores | 5 | **Default (Recommended)** |
| **High-end** | 16GB+ | 8+ cores | 10 | Sangat cepat |
| **Server** | 32GB+ | 16+ cores | 15-20 | Maksimal |

### Berdasarkan Jumlah Dokumen

| Jumlah Dokumen | Batch Size | Estimasi Waktu |
|----------------|------------|----------------|
| 1-10 | 3-5 | 10-30 detik |
| 10-50 | 5-7 | 30-90 detik |
| 50-100 | 7-10 | 1-3 menit |
| 100+ | 10-15 | 3-10 menit |

## Contoh Konfigurasi

### Untuk Sistem Lemah (4GB RAM)
```env
BULK_UPLOAD_BATCH_SIZE=3
```

### Untuk Sistem Standar (8GB RAM) - Default
```env
BULK_UPLOAD_BATCH_SIZE=5
```

### Untuk Sistem Kuat (16GB+ RAM)
```env
BULK_UPLOAD_BATCH_SIZE=10
```

### Untuk Server Production
```env
BULK_UPLOAD_BATCH_SIZE=15
```

## Testing Performa

Untuk menguji performa dengan batch size berbeda:

1. **Set batch size** di `.env`:
   ```env
   BULK_UPLOAD_BATCH_SIZE=5
   ```

2. **Restart backend**:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

3. **Upload dokumen** dan monitor log:
   - Lihat waktu proses per batch
   - Monitor penggunaan CPU dan RAM
   - Catat total waktu upload

4. **Ulangi** dengan batch size berbeda untuk perbandingan

## Monitoring

Saat bulk upload berjalan, Anda akan melihat log seperti:

```
🚀 STEP 2: Processing documents in parallel batches of 5...
🔄 Processing batch 1: documents 1-5 of 25
✅ Batch 1 completed: 5/5 successful so far
🔄 Processing batch 2: documents 6-10 of 25
✅ Batch 2 completed: 10/10 successful so far
...
🎉 BULK UPLOAD COMPLETED: 25/25 successful, 0 failed
```

## Troubleshooting

### Jika Upload Terlalu Lambat
- **Naikkan** batch size (misal dari 5 ke 10)
- Pastikan sistem memiliki resource yang cukup

### Jika Terjadi Error atau Crash
- **Turunkan** batch size (misal dari 10 ke 5 atau 3)
- Check log untuk error spesifik
- Monitor penggunaan RAM

### Jika Beberapa Dokumen Gagal
- Batch size tidak mempengaruhi error handling
- Check log untuk detail error per dokumen
- Dokumen yang gagal akan dilaporkan di `failed_documents`

## Best Practices

1. ✅ **Mulai dengan default (5)** dan adjust berdasarkan performa
2. ✅ **Monitor resource usage** saat testing
3. ✅ **Gunakan batch size lebih kecil** untuk dokumen besar (PDF 100+ halaman)
4. ✅ **Gunakan batch size lebih besar** untuk dokumen kecil (TXT, DOC)
5. ✅ **Set batch size sesuai environment**:
   - Development: 3-5
   - Staging: 5-10
   - Production: 10-15

## Advanced Configuration

Untuk konfigurasi lebih lanjut, edit `backend/config.py`:

```python
class Settings(BaseSettings):
    # ...
    bulk_upload_batch_size: int = Field(
        default=5,  # Ubah default di sini
        env="BULK_UPLOAD_BATCH_SIZE",
        description="Number of documents to process in parallel per batch"
    )
```

---

**Note**: Perubahan konfigurasi memerlukan restart backend server.
