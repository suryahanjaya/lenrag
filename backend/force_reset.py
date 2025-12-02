"""
FORCE RESET SCRIPT - Menghapus semua cache dan ChromaDB
Jalankan script ini jika ada masalah dengan embedding dimension mismatch
"""

import os
import shutil
import sys

def force_reset():
    """Force reset ChromaDB dan cache"""
    
    print("🔥🔥🔥 FORCE RESET SCRIPT 🔥🔥🔥")
    print("=" * 60)
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 1. Hapus ChromaDB
    chroma_path = os.path.join(base_dir, "chroma_db")
    if os.path.exists(chroma_path):
        print(f"\n💥 Deleting ChromaDB: {chroma_path}")
        try:
            shutil.rmtree(chroma_path)
            print("✅ ChromaDB deleted successfully")
        except Exception as e:
            print(f"❌ Error deleting ChromaDB: {e}")
    else:
        print(f"ℹ️  ChromaDB directory not found: {chroma_path}")
    
    # 2. Hapus cache dokumen
    cache_path = os.path.join(base_dir, "cache")
    if os.path.exists(cache_path):
        print(f"\n💥 Deleting cache: {cache_path}")
        try:
            shutil.rmtree(cache_path)
            print("✅ Cache deleted successfully")
        except Exception as e:
            print(f"❌ Error deleting cache: {e}")
    else:
        print(f"ℹ️  Cache directory not found: {cache_path}")
    
    # 3. Hapus __pycache__
    pycache_dirs = []
    for root, dirs, files in os.walk(base_dir):
        if '__pycache__' in dirs:
            pycache_path = os.path.join(root, '__pycache__')
            pycache_dirs.append(pycache_path)
    
    if pycache_dirs:
        print(f"\n💥 Deleting {len(pycache_dirs)} __pycache__ directories")
        for pycache_path in pycache_dirs:
            try:
                shutil.rmtree(pycache_path)
                print(f"✅ Deleted: {pycache_path}")
            except Exception as e:
                print(f"❌ Error deleting {pycache_path}: {e}")
    
    # 4. Hapus Sentence Transformer cache (model cache)
    home_dir = os.path.expanduser("~")
    st_cache_path = os.path.join(home_dir, ".cache", "torch", "sentence_transformers")
    
    if os.path.exists(st_cache_path):
        print(f"\n💥 Deleting Sentence Transformer cache: {st_cache_path}")
        print("⚠️  WARNING: This will delete ALL cached embedding models!")
        response = input("Continue? (yes/no): ")
        
        if response.lower() == 'yes':
            try:
                shutil.rmtree(st_cache_path)
                print("✅ Sentence Transformer cache deleted")
            except Exception as e:
                print(f"❌ Error deleting cache: {e}")
        else:
            print("ℹ️  Skipped Sentence Transformer cache deletion")
    else:
        print(f"ℹ️  Sentence Transformer cache not found: {st_cache_path}")
    
    # 5. Recreate directories
    print("\n🔄 Recreating directories...")
    os.makedirs(chroma_path, exist_ok=True)
    os.makedirs(cache_path, exist_ok=True)
    print("✅ Directories recreated")
    
    print("\n" + "=" * 60)
    print("🎉 FORCE RESET COMPLETED!")
    print("=" * 60)
    print("\n📋 NEXT STEPS:")
    print("1. Restart the backend server:")
    print("   cd backend")
    print("   python main.py")
    print("\n2. Check the logs for:")
    print("   ✅ Embedding model loaded successfully. Dimension: 768")
    print("\n3. Upload your documents again")
    print("=" * 60)

if __name__ == "__main__":
    try:
        force_reset()
    except KeyboardInterrupt:
        print("\n\n❌ Reset cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Error during reset: {e}")
        sys.exit(1)





