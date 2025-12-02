"""
DIAGNOSTIC SCRIPT - Cek model embedding yang ter-load
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def check_embedding_model():
    """Check which embedding model is loaded and its dimension"""
    
    print("🔍 DIAGNOSTIC: Checking Embedding Model")
    print("=" * 60)
    
    try:
        from sentence_transformers import SentenceTransformer
        
        # Test beberapa model
        models_to_test = [
            'all-mpnet-base-v2',  # 768 dimensi (TARGET)
            'paraphrase-multilingual-mpnet-base-v2',  # 768 dimensi
            'all-MiniLM-L6-v2',  # 384 dimensi (OLD - HARUS DIHINDARI)
        ]
        
        print("\n📊 Testing Models:")
        print("-" * 60)
        
        for model_name in models_to_test:
            try:
                print(f"\n🔄 Loading: {model_name}...")
                model = SentenceTransformer(model_name)
                
                # Test encoding
                test_embedding = model.encode(["test sentence"])
                dimension = len(test_embedding[0])
                
                status = "✅ CORRECT" if dimension == 768 else "❌ WRONG"
                print(f"{status} Model: {model_name}")
                print(f"   Dimension: {dimension}")
                
                if dimension == 768:
                    print(f"   👍 This model is compatible!")
                else:
                    print(f"   ⚠️  This model is NOT compatible (needs 768 dims)")
                    
            except Exception as e:
                print(f"❌ Failed to load {model_name}: {e}")
        
        print("\n" + "=" * 60)
        print("📋 RECOMMENDATION:")
        print("=" * 60)
        print("✅ Use: all-mpnet-base-v2 (768 dimensions)")
        print("❌ Avoid: all-MiniLM-L6-v2 (384 dimensions)")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Error checking models: {e}")
        print("\nMake sure sentence-transformers is installed:")
        print("   pip install sentence-transformers")

def check_chromadb_collections():
    """Check existing ChromaDB collections"""
    
    print("\n\n🔍 DIAGNOSTIC: Checking ChromaDB Collections")
    print("=" * 60)
    
    try:
        import chromadb
        from chromadb.config import Settings
        
        chroma_path = os.path.join(os.path.dirname(__file__), "chroma_db")
        
        if not os.path.exists(chroma_path):
            print(f"ℹ️  ChromaDB directory not found: {chroma_path}")
            print("✅ No existing collections (fresh start)")
            return
        
        client = chromadb.PersistentClient(
            path=chroma_path,
            settings=Settings(anonymized_telemetry=False, allow_reset=True)
        )
        
        collections = client.list_collections()
        
        print(f"\n📊 Found {len(collections)} collection(s):")
        print("-" * 60)
        
        for collection in collections:
            print(f"\n📁 Collection: {collection.name}")
            try:
                count = collection.count()
                print(f"   Chunks: {count}")
                
                # Get metadata if available
                metadata = collection.metadata
                if metadata:
                    print(f"   Metadata: {metadata}")
                    if 'dimension' in metadata:
                        dim = metadata['dimension']
                        status = "✅" if dim == 768 else "❌"
                        print(f"   {status} Dimension: {dim}")
                else:
                    print(f"   ⚠️  No metadata found")
                    
            except Exception as e:
                print(f"   ❌ Error reading collection: {e}")
        
        print("\n" + "=" * 60)
        
    except Exception as e:
        print(f"❌ Error checking ChromaDB: {e}")

if __name__ == "__main__":
    try:
        check_embedding_model()
        check_chromadb_collections()
        
        print("\n\n📋 NEXT STEPS:")
        print("=" * 60)
        print("If you see dimension mismatches:")
        print("1. Run: python force_reset.py")
        print("2. Restart backend: python main.py")
        print("3. Re-upload your documents")
        print("=" * 60)
        
    except KeyboardInterrupt:
        print("\n\n❌ Cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        sys.exit(1)





