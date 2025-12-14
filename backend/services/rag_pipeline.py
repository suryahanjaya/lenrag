import os
import logging
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import google.generativeai as genai
from google.api_core import exceptions as google_exceptions
from groq import Groq
import json
import re
from datetime import datetime
import time
from config import RAGConfig

logger = logging.getLogger(__name__)

class DORAPipeline:
    def __init__(self):
        # Determine which LLM provider to use
        self.llm_provider = RAGConfig.LLM_PROVIDER.lower()
        logger.info(f"🤖 Initializing DORA with LLM provider: {self.llm_provider}")
        
        if self.llm_provider == "groq":
            # Initialize Groq API
            self.groq_api_key = os.getenv("GROQ_API_KEY")
            if not self.groq_api_key:
                raise ValueError("GROQ_API_KEY environment variable not set")
            self.groq_client = Groq(api_key=self.groq_api_key)
            
            # Primary model (configurable via GROQ_MODEL env var)
            self.primary_model_name = RAGConfig.GROQ_MODEL
            logger.info(f"✅ Initialized Groq with model: {self.primary_model_name}")
            
            # OPTIMAL Fallback Strategy: Quality FIRST, then Reliability
            self.fallback_models = [
                'openai/gpt-oss-120b',          # 120B - BEST quality (1K req/day)
                'llama-3.3-70b-versatile',      # 70B - Excellent quality (1K req/day)
                'qwen/qwen3-32b',               # 32B - Very good (1K req/day, 60 req/min)
                'meta-llama/llama-4-scout-17b-16e-instruct',  # 17B - Good (30K tokens/min)
                'meta-llama/llama-guard-4-12b', # 12B - Decent (14.4K req/day!)
                'allam-2-7b',                   # 7B - Fast (7K req/day)
            ]
        else:  # Default to Gemini
            # Initialize Gemini API
            self.gemini_api_key = os.getenv("GEMINI_API_KEY")
            if not self.gemini_api_key:
                raise ValueError("GEMINI_API_KEY environment variable not set")
            genai.configure(api_key=self.gemini_api_key)
            
            # Primary model (configurable via GEMINI_MODEL env var)
            self.primary_model_name = RAGConfig.GEMINI_MODEL
            self.model = genai.GenerativeModel(self.primary_model_name)
            
            # Fallback models in case of quota exceeded
            # Using models without 'models/' prefix (based on API key version)
            self.fallback_models = [
                'gemini-1.5-pro-exp-0827',  # Experimental pro version
                'gemini-exp-1206',          # Latest experimental
            ]
        
        # Remove primary model from fallbacks if it's already in the list
        self.fallback_models = [m for m in self.fallback_models if m != self.primary_model_name]
        
        logger.info(f"✅ Initialized primary model: {self.primary_model_name}")
        logger.info(f"🔄 Fallback models available: {', '.join(self.fallback_models)}")
        
        # Initialize embedding model - OPTIMIZED FOR SPEED!
        # all-MiniLM-L6-v2: FAST embeddings (384 dimensions)
        # 3x faster than MPNet, good accuracy for most use cases
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Initialize ChromaDB with optimizations for large scale document storage
        # Use absolute path to avoid confusion between root and backend folders
        chroma_path = os.path.join(os.path.dirname(__file__), "..", "chroma_db")
        self.chroma_client = chromadb.PersistentClient(
            path=chroma_path,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        # Standardized text splitter configuration - BALANCED FOR DETAIL & SPEED
        # Target: 850 chars = sweet spot between speed and information retention
        self.chunk_size = 850   # Balanced: 2.5x more chunks than 2000, still fast!
        self.chunk_overlap = 85  # 10% overlap
        self.separators = ["\n\n", "\n", ". ", "! ", "? ", " ", ""]
        
        # BALANCED chunk sizes - 850 chars for optimal detail
        self.document_chunk_sizes = {
            'pdf': 850,       # Balanced detail
            'doc': 850,       # Balanced detail
            'ppt': 850,       # Balanced detail
            'academic': 850,  # Better context
            'legal': 850,     # Complete sections
            'technical': 850, # Complete code blocks
            'business': 850,  # Complete sections
            'general': 850    # Better context
        }
        
        # Document type detection patterns
        self.document_patterns = {
            'legal': [r'pasal\s+\d+', r'undang-undang', r'peraturan', r'hukum'],
            'academic': [r'referensi', r'daftar pustaka', r'kajian', r'penelitian'],
            'technical': [r'api', r'endpoint', r'function', r'method', r'class'],
            'business': [r'proposal', r'laporan', r'analisis', r'strategi'],
            'medical': [r'diagnosis', r'gejala', r'pengobatan', r'terapi'],
            'financial': [r'anggaran', r'keuangan', r'investasi', r'profit']
        }
    
    def _get_user_collection(self, user_id: str):
        """Get or create a ChromaDB collection for a specific user"""
        collection_name = f"user_{user_id}"
        try:
            return self.chroma_client.get_collection(collection_name)
        except:
            return self.chroma_client.create_collection(
                collection_name,
                metadata={"hnsw:space": "cosine"}
            )
    
    def _generate_chunk_id(self, document_id: str, chunk_index: int) -> str:
        """Generate a unique ID for a document chunk"""
        return f"{document_id}_chunk_{chunk_index}"
    
    def _generate_content_with_retry(self, prompt: str, max_retries: int = 3) -> str:
        """
        Generate content with automatic retry and fallback to other models if quota exceeded.
        This prevents quota exceeded errors from breaking the application.
        Supports both Groq and Gemini providers.
        """
        models_to_try = [self.primary_model_name] + self.fallback_models
        
        for model_index, model_name in enumerate(models_to_try):
            for retry in range(max_retries):
                try:
                    if self.llm_provider == "groq":
                        # Use Groq API
                        if model_name != self.primary_model_name:
                            logger.warning(f"🔄 Trying fallback Groq model: {model_name}")
                        
                        response = self.groq_client.chat.completions.create(
                            model=model_name,
                            messages=[
                                {"role": "system", "content": "You are DORA (Document Retrieval Assistant), a helpful AI assistant that answers questions based on document context."},
                                {"role": "user", "content": prompt}
                            ],
                            temperature=RAGConfig.GROQ_TEMPERATURE,
                            max_tokens=RAGConfig.GROQ_MAX_TOKENS
                        )
                        
                        # Success!
                        if model_name != self.primary_model_name:
                            logger.info(f"✅ Successfully generated response using fallback Groq model: {model_name}")
                        
                        return response.choices[0].message.content
                        
                    else:  # Gemini
                        # Use current model
                        if model_name != self.primary_model_name:
                            logger.warning(f"🔄 Trying fallback Gemini model: {model_name}")
                            current_model = genai.GenerativeModel(model_name)
                        else:
                            current_model = self.model
                        
                        # Generate content
                        response = current_model.generate_content(prompt)
                        
                        # Success!
                        if model_name != self.primary_model_name:
                            logger.info(f"✅ Successfully generated response using fallback Gemini model: {model_name}")
                        
                        return response.text
                    
                except google_exceptions.ResourceExhausted as e:
                    # Quota exceeded for Gemini
                    logger.warning(f"⚠️ Quota exceeded for Gemini model: {model_name}")
                    
                    if retry < max_retries - 1:
                        # Retry with exponential backoff (only for same model)
                        wait_time = (2 ** retry) * 1  # 1s, 2s, 4s
                        logger.info(f"⏱️ Retrying in {wait_time}s... (attempt {retry + 2}/{max_retries})")
                        time.sleep(wait_time)
                    else:
                        # Move to next model
                        if model_index < len(models_to_try) - 1:
                            logger.info(f"🔄 Moving to next fallback model...")
                            break
                        else:
                            # All models exhausted
                            logger.error(f"❌ All Gemini models quota exceeded. Please wait or upgrade to paid plan.")
                            raise Exception(
                                "Quota exceeded for all available Gemini models. "
                                "Please wait a few minutes for quota reset, or upgrade to a paid plan at https://ai.google.dev/"
                            )
                
                except Exception as e:
                    # Other errors (including Groq errors)
                    error_msg = str(e).lower()
                    
                    # Check if it's a rate limit error for Groq
                    if "rate" in error_msg or "limit" in error_msg or "quota" in error_msg:
                        logger.warning(f"⚠️ Rate limit/quota exceeded for {self.llm_provider} model: {model_name}")
                        
                        if retry < max_retries - 1:
                            wait_time = (2 ** retry) * 1
                            logger.info(f"⏱️ Retrying in {wait_time}s...")
                            time.sleep(wait_time)
                        else:
                            # Move to next model
                            if model_index < len(models_to_try) - 1:
                                logger.info(f"🔄 Moving to next fallback model...")
                                break
                            else:
                                logger.error(f"❌ All {self.llm_provider} models quota exceeded.")
                                raise Exception(
                                    f"Quota exceeded for all available {self.llm_provider} models. "
                                    "Please wait a few minutes for quota reset."
                                )
                    else:
                        # Other errors
                        logger.error(f"❌ Error generating content with {model_name}: {e}")
                        if retry < max_retries - 1:
                            wait_time = (2 ** retry) * 1
                            logger.info(f"⏱️ Retrying in {wait_time}s...")
                            time.sleep(wait_time)
                        else:
                            raise
        
        # Should not reach here
        raise Exception(f"Failed to generate content with all available {self.llm_provider} models")
    
    def _detect_document_type(self, text: str, mime_type: str = None) -> str:
        """Detect document type based on content and MIME type"""
        text_lower = text.lower()
        
        # Check MIME type first
        if mime_type:
            if 'pdf' in mime_type:
                return 'pdf'
            elif 'word' in mime_type or 'document' in mime_type:
                return 'document'
            elif 'presentation' in mime_type or 'powerpoint' in mime_type:
                return 'presentation'
            elif 'spreadsheet' in mime_type or 'excel' in mime_type:
                return 'spreadsheet'
        
        # Detect by content patterns
        for doc_type, patterns in self.document_patterns.items():
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    return doc_type
        
        return 'general'
    
    def _split_text(self, text: str, mime_type: str = None) -> List[str]:
        """Split text into chunks using intelligent text splitting for maximum information retention"""
        if not text or not text.strip():
            return []
        
        chunks = []
        doc_type = self._detect_document_type(text, mime_type)
        
        # Determine optimal chunk size based on document type and MIME type
        # BALANCED: 850 chars for optimal detail and speed
        base_chunk_size = 850  # Sweet spot!
        
        # Adaptive sizing based on document length
        doc_length = len(text)
        if doc_length < 3000:  # Very small document
            base_chunk_size = 500  # Smaller chunks
            logger.info(f"Very small document ({doc_length} chars) - chunk size: {base_chunk_size}")
        elif doc_length < 10000:  # Small document
            base_chunk_size = 700  # Medium chunks
            logger.info(f"Small document ({doc_length} chars) - chunk size: {base_chunk_size}")
        else:  # Medium to large document
            base_chunk_size = 850  # Optimal chunks
            logger.info(f"Document ({doc_length} chars) - chunk size: {base_chunk_size}")
        
        if mime_type == 'application/pdf':
            optimal_chunk_size = self.document_chunk_sizes.get('pdf', base_chunk_size)
        elif mime_type and 'word' in mime_type.lower():
            optimal_chunk_size = self.document_chunk_sizes.get('doc', base_chunk_size)
        elif mime_type and 'presentation' in mime_type.lower():
            optimal_chunk_size = self.document_chunk_sizes.get('ppt', base_chunk_size)
        else:
            optimal_chunk_size = self.document_chunk_sizes.get(doc_type, base_chunk_size)
        
        logger.info(f"Document type: {doc_type}, MIME: {mime_type}, chunk size: {optimal_chunk_size}")
        logger.info(f"Processing: {doc_length} characters")
        logger.info(f"TARGET: Balanced chunking (850 chars) for detail + speed")
        
        # Debug logging for large documents
        if len(text) > 50000:  # Large document
            logger.info(f"Processing large document: {len(text)} characters, type: {doc_type}")
            expected_chunks = len(text) // optimal_chunk_size
            logger.info(f"Expected chunks for this document: ~{expected_chunks} (target: 300 for 100 pages)")
        
        # Strategy 1: Document-specific splitting with optimal chunk sizes
        if doc_type == 'legal':
            sections = self._split_legal_document(text)
        elif doc_type == 'academic':
            sections = self._split_academic_document(text)
        elif doc_type == 'technical':
            sections = self._split_technical_document(text)
        elif doc_type == 'business':
            sections = self._split_business_document(text)
        else:
            sections = self._split_general_document(text)
        
        # Process sections into chunks with optimal chunk size
        logger.info(f"Processing {len(sections)} sections into chunks with optimal size: {optimal_chunk_size}")
        logger.info(f"LEGAL DOCUMENT DEBUG: Document type: {doc_type}, MIME: {mime_type}")
        logger.info(f"LEGAL DOCUMENT DEBUG: Total text length: {len(text)} characters")
        logger.info(f"LEGAL DOCUMENT DEBUG: Number of sections found: {len(sections)}")
        
        # SIMPLIFIED CHUNKING ALGORITHM - Target: 100 halaman = 300 chunks
        # Process all sections into chunks with optimal chunk size
        current_chunk = ""
        
        for i, section in enumerate(sections):
            if not section.strip():
                continue
                
            # If section fits in current chunk, add it
            if len(current_chunk) + len(section) <= optimal_chunk_size:
                current_chunk += section + "\n\n"
            else:
                # Save current chunk if it has content
                if current_chunk.strip():
                    chunks.append(current_chunk.strip())
                    logger.info(f"Added chunk {len(chunks)}: {len(current_chunk.strip())} characters")
                
                # Start new chunk with current section
                if len(section) <= optimal_chunk_size:
                    current_chunk = section + "\n\n"
                else:
                    # If section is too long, split it by paragraphs
                    paragraphs = section.split('\n\n')
                    current_chunk = ""
                    
                    for paragraph in paragraphs:
                        if len(current_chunk) + len(paragraph) <= optimal_chunk_size:
                            current_chunk += paragraph + "\n\n"
                        else:
                            # Save current chunk if it has content
                            if current_chunk.strip():
                                chunks.append(current_chunk.strip())
                                logger.info(f"Added chunk {len(chunks)}: {len(current_chunk.strip())} characters")
                            
                            # Start new chunk with current paragraph
                            if len(paragraph) <= optimal_chunk_size:
                                current_chunk = paragraph + "\n\n"
                            else:
                                # If paragraph is still too long, split by sentences
                                sentences = re.split(r'[.!?]+\s+', paragraph)
                                temp_chunk = ""
                                
                                for sentence in sentences:
                                    if len(temp_chunk) + len(sentence) <= optimal_chunk_size:
                                        temp_chunk += sentence + ". "
                                    else:
                                        if temp_chunk.strip():
                                            chunks.append(temp_chunk.strip())
                                            logger.info(f"Added chunk {len(chunks)}: {len(temp_chunk.strip())} characters")
                                        temp_chunk = sentence + ". "
                                
                                if temp_chunk.strip():
                                    chunks.append(temp_chunk.strip())
                                    logger.info(f"Added chunk {len(chunks)}: {len(temp_chunk.strip())} characters")
                                current_chunk = ""
        
        # Add final chunk if it has content
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
            logger.info(f"Added final chunk {len(chunks)}: {len(current_chunk.strip())} characters")
        
        # Apply overlap if we have multiple chunks for better context preservation
        if len(chunks) > 1 and self.chunk_overlap > 0:
            overlapped_chunks = []
            for i, chunk in enumerate(chunks):
                if i == 0:
                    overlapped_chunks.append(chunk)
                else:
                    # Add overlap from previous chunk for better context
                    prev_chunk = chunks[i-1]
                    overlap_text = prev_chunk[-self.chunk_overlap:] if len(prev_chunk) > self.chunk_overlap else prev_chunk
                    overlapped_chunks.append(overlap_text + " " + chunk)
            logger.info(f"Applied overlap: {len(overlapped_chunks)} chunks with {self.chunk_overlap} character overlap")
            return overlapped_chunks
        
        logger.info(f"Final chunk count: {len(chunks)}")
        return chunks
    
    def _split_legal_document(self, text: str) -> List[str]:
        """Split legal documents by major sections only to prevent over-chunking"""
        # FIXED: Use only major section patterns to prevent over-chunking
        # Focus on BAB (chapters) first, then major sections
        patterns = [
            r'(?=BAB\s+[IVX]+)',     # BAB I, BAB II, BAB III, etc. (Roman numerals)
            r'(?=BAB\s+\d+)',        # BAB 1, BAB 2, etc. (Arabic numerals)
            r'(?=BAGIAN\s+[IVX]+)',  # BAGIAN I, BAGIAN II, etc.
            r'(?=BAGIAN\s+\d+)',    # BAGIAN 1, BAGIAN 2, etc.
        ]
        
        for pattern in patterns:
            sections = re.split(pattern, text)
            if len(sections) > 1:
                logger.info(f"Found {len(sections)} legal major sections using pattern: {pattern}")
                return [s.strip() for s in sections if s.strip()]
        
        # FALLBACK: If no major sections found, use paragraph splitting
        # This prevents over-chunking by individual Pasal
        logger.info("No major legal sections found, using paragraph splitting")
        return re.split(r'\n\s*\n', text)
    
    def _split_academic_document(self, text: str) -> List[str]:
        """Split academic documents by chapters, sections, references"""
        patterns = [
            r'(?=Chapter\s+\d+)',  # Chapter 1, Chapter 2
            r'(?=CHAPTER\s+\d+)',  # CHAPTER 1, CHAPTER 2
            r'(?=Bab\s+\d+)',       # Bab 1, Bab 2
            r'(?=BAB\s+\d+)',       # BAB 1, BAB 2
            r'(?=Section\s+\d+)',   # Section 1, Section 2
            r'(?=Referensi)',       # References section
            r'(?=Daftar Pustaka)',  # Bibliography
        ]
        
        for pattern in patterns:
            sections = re.split(pattern, text)
            if len(sections) > 1:
                logger.info(f"Found {len(sections)} academic sections using pattern: {pattern}")
                return [s.strip() for s in sections if s.strip()]
        
        # Fallback to paragraph splitting
        return re.split(r'\n\s*\n', text)
    
    def _split_technical_document(self, text: str) -> List[str]:
        """Split technical documents by functions, classes, APIs"""
        patterns = [
            r'(?=def\s+\w+)',      # Python functions
            r'(?=function\s+\w+)', # JavaScript functions
            r'(?=class\s+\w+)',    # Classes
            r'(?=public\s+\w+)',   # Public methods
            r'(?=private\s+\w+)',  # Private methods
            r'(?=API\s+Endpoint)', # API endpoints
        ]
        
        for pattern in patterns:
            sections = re.split(pattern, text)
            if len(sections) > 1:
                logger.info(f"Found {len(sections)} technical sections using pattern: {pattern}")
                return [s.strip() for s in sections if s.strip()]
        
        # Fallback to paragraph splitting
        return re.split(r'\n\s*\n', text)
    
    def _split_business_document(self, text: str) -> List[str]:
        """Split business documents by sections, subsections"""
        patterns = [
            r'(?=Executive Summary)',  # Executive Summary
            r'(?=Introduction)',       # Introduction
            r'(?=Methodology)',        # Methodology
            r'(?=Results)',            # Results
            r'(?=Conclusion)',         # Conclusion
            r'(?=Recommendations)',    # Recommendations
        ]
        
        for pattern in patterns:
            sections = re.split(pattern, text)
            if len(sections) > 1:
                logger.info(f"Found {len(sections)} business sections using pattern: {pattern}")
                return [s.strip() for s in sections if s.strip()]
        
        # Fallback to paragraph splitting
        return re.split(r'\n\s*\n', text)
    
    def _split_general_document(self, text: str) -> List[str]:
        """Split general documents with consistent strategy for 300-400 chunks per 100 pages"""
        # Consistent splitting strategy for standardized results
        
        # Strategy 1: Split by double newlines (paragraphs) - most common
        sections = re.split(r'\n\s*\n', text)
        if len(sections) > 1:
            logger.info(f"Found {len(sections)} paragraphs using double newlines")
            return [s.strip() for s in sections if s.strip()]
        
        # Strategy 2: Split by single newlines (lines) - fallback
        sections = re.split(r'\n', text)
        if len(sections) > 1:
            logger.info(f"Found {len(sections)} lines using single newlines")
            return [s.strip() for s in sections if s.strip()]
        
        # Strategy 3: Split by sentences - last resort
        sections = re.split(r'[.!?]+\s+', text)
        if len(sections) > 1:
            logger.info(f"Found {len(sections)} sentences")
            return [s.strip() for s in sections if s.strip()]
        
        return [text]

    async def add_document(self, user_id: str, document_id: str, content: str, document_name: str, mime_type: str = None) -> int:
        """Add a document to the vector store. Returns the number of chunks added."""
        try:
            collection = self._get_user_collection(user_id)
            
            # Check content size and warn if very large
            content_size_mb = len(content) / (1024 * 1024)
            if content_size_mb > 10:
                logger.warning(f"⚠️ Large document detected: {document_name} ({content_size_mb:.2f} MB)")
            
            # Split text into chunks
            chunks = self._split_text(content, mime_type)
            
            if not chunks:
                logger.warning(f"No chunks generated for document {document_id}")
                return 0
            
            logger.info(f"Adding {len(chunks)} chunks for document {document_id}")
            
            # MEMORY OPTIMIZATION: Process embeddings in batches for very large documents
            # This prevents OOM errors when processing files with 1000+ chunks
            EMBEDDING_BATCH_SIZE = 100  # Process 100 chunks at a time
            
            if len(chunks) > EMBEDDING_BATCH_SIZE:
                logger.info(f"🔄 Large document: Processing {len(chunks)} chunks in batches of {EMBEDDING_BATCH_SIZE}")
                
                all_embeddings = []
                for i in range(0, len(chunks), EMBEDDING_BATCH_SIZE):
                    batch_chunks = chunks[i:i+EMBEDDING_BATCH_SIZE]
                    logger.info(f"  Processing embedding batch {i//EMBEDDING_BATCH_SIZE + 1}/{(len(chunks)-1)//EMBEDDING_BATCH_SIZE + 1}")
                    batch_embeddings = self.embedding_model.encode(batch_chunks, show_progress_bar=False).tolist()
                    all_embeddings.extend(batch_embeddings)
                embeddings = all_embeddings
            else:
                # For smaller documents, process all at once
                logger.info(f"Generating embeddings using {self.embedding_model}")
                embeddings = self.embedding_model.encode(chunks, show_progress_bar=False).tolist()
            
            # Prepare data for ChromaDB
            ids = [f"{document_id}_{i}" for i in range(len(chunks))]
            metadatas = [{
                "document_id": document_id,
                "document_name": document_name,
                "chunk_index": i,
                "mime_type": mime_type or "text/plain",
                "timestamp": str(datetime.now().isoformat())
            } for i in range(len(chunks))]
            
            # Add to collection with our custom embeddings
            collection.add(
                documents=chunks,
                metadatas=metadatas,
                ids=ids,
                embeddings=embeddings
            )
            
            logger.info(f"Successfully added document {document_id} with {len(chunks)} chunks")
            return len(chunks)
            
        except Exception as e:
            logger.error(f"Error adding document {document_id}: {e}")
            raise

    async def remove_document(self, user_id: str, document_id: str):
        """Remove a document from the vector store"""
        try:
            collection = self._get_user_collection(user_id)
            
            logger.info(f"Attempting to remove document {document_id} for user {user_id}")
            
            # Get all chunks for this document
            results = collection.get(
                where={"document_id": document_id}
            )
            
            logger.info(f"Found {len(results['ids']) if results['ids'] else 0} chunks for document {document_id}")
            
            if results['ids']:
                collection.delete(ids=results['ids'])
                logger.info(f"Successfully removed {len(results['ids'])} chunks for document {document_id}")
            else:
                logger.warning(f"No chunks found for document {document_id}. It may have already been deleted.")
            
        except Exception as e:
            logger.error(f"Error removing document {document_id}: {e}")
            logger.error(f"Error type: {type(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise
    
    async def query(self, user_id: str, query: str, use_fallback: bool = False) -> Dict[str, Any]:
        """Query the RAG system"""
        try:
            collection = self._get_user_collection(user_id)
            
            # Check if collection has any documents
            count = collection.count()
            logger.info(f"Collection for user {user_id} has {count} documents")
            
            if count == 0:
                logger.warning(f"No documents in knowledge base for user {user_id}")
                return {
                    'answer': "Maaf, saya tidak dapat menjawab pertanyaan karena knowledge base Anda masih kosong. Silakan tambahkan dokumen terlebih dahulu dari Google Drive untuk memulai percakapan.",
                    'sources': [],
                    'from_documents': False,
                    'fallback_used': False
                }
            
            # Create expanded query for better understanding
            expanded_query = self._expand_query(query)
            logger.info(f"Original query: {query}")
            logger.info(f"Expanded query: {expanded_query}")
            
            # Generate query embedding using our MPNet model
            query_embedding = self.embedding_model.encode([expanded_query], show_progress_bar=False).tolist()
            
            # Search for relevant chunks with expanded query
            # OPTIMIZED: Reduced n_results for FASTER response time
            results = collection.query(
                query_embeddings=query_embedding,
                n_results=12  # Optimized for speed while maintaining quality
            )
            
            documents = results['documents'][0] if results['documents'] else []
            metadatas = results['metadatas'][0] if results['metadatas'] else []
            distances = results['distances'][0] if results['distances'] else []
            
            logger.info(f"Query results: {len(documents)} documents found")
            logger.info(f"Distances: {distances}")
            
            # More lenient threshold for better recall with high-quality embeddings
            if documents and distances and min(distances) < 1.0:  # Relaxed from 0.95
                # Create context from retrieved documents with document names and more context
                # OPTIMIZED: Only use top 8 most relevant documents for faster processing
                context_parts = []
                for i, (doc, meta) in enumerate(zip(documents[:8], metadatas[:8])):
                    doc_name = meta.get('document_name', f'Dokumen {i+1}')
                    # Include more context around the relevant text
                    context_parts.append(f"Dokumen: {doc_name}\nKonten: {doc}")
                context = "\n\n".join(context_parts)
                
                # Add instruction to be more flexible in understanding
                context += "\n\nPENTING: Jawab pertanyaan berdasarkan konteks di atas, bahkan jika ada variasi kata atau frasa dalam pertanyaan. Fokus pada makna dan inti pertanyaan, bukan pada kata-kata yang persis sama."
                
                # Generate answer using retrieved context with DORA's enhanced intelligence
                prompt = f"""Anda adalah DORA (Document Retrieval Assistant) - asisten cerdas yang dapat memahami dan menganalisis berbagai jenis dokumen. WAJIB MENGGUNAKAN BAHASA INDONESIA SAJA.

Konteks dari dokumen pengguna:
{context}

Pertanyaan: {query}

INSTRUKSI KHUSUS UNTUK DORA (DOCUMENT RETRIEVAL ASSISTANT):
- ANALISIS KONTEKS dengan cermat dari berbagai jenis dokumen dan berikan jawaban yang LENGKAP dan AKURAT
- DORA dapat memahami dokumen hukum, akademik, teknis, bisnis, medis, keuangan, dan jenis dokumen lainnya
- Jika pertanyaan tentang hukum, CARI dan SEBUTKAN undang-undang, pasal, atau peraturan yang relevan
- Jika pertanyaan tentang akademik, berikan analisis berdasarkan penelitian, referensi, atau kajian
- Jika pertanyaan tentang teknis, jelaskan konsep, fungsi, atau implementasi yang relevan
- Jika pertanyaan tentang bisnis, berikan analisis strategi, proposal, atau laporan yang relevan
- JANGAN katakan "tidak ada informasi" jika ada konten yang relevan dalam dokumen

FORMAT RESPONS YANG DIHARUSKAN:
JAWAB LANGSUNG APA YANG DIMINTA DALAM SESINGKAT-KATNYA TANPA PENJELASAN LEBIH LANJUT

PANDUAN PENULISAN:
- Tulis dengan gaya percakapan yang profesional dan informatif
- Gunakan kalimat yang lengkap dan koheren
- Hindari frasa yang terputus-putus
- Buat alur logis dari satu ide ke ide berikutnya
- WAJIB menggunakan bahasa Indonesia dalam seluruh respons
- BERSIFAT CERDAS dalam memahami maksud pertanyaan
- BERIKAN jawaban yang KONSTRUKTIF dan BERMANFAAT
- JANGAN sebutkan nama dokumen sumber di akhir respons (sistem akan menampilkannya secara otomatis)

Jawaban:"""
                
                # Use retry mechanism with fallback models
                raw_answer = self._generate_content_with_retry(prompt)
                
                # Clean up the response
                answer = self._clean_response(raw_answer)
                
                # Extract source document information with deduplication and relevance filtering
                source_info = []
                seen_docs = set()  # Track unique document IDs
                
                # Filter documents based on similarity score - OPTIMIZED for speed
                relevant_threshold = 1.0  # More lenient for comprehensive references
                max_sources = 5  # Optimized for faster response
                logger.info(f"Relevant threshold: {relevant_threshold}")
                logger.info(f"Max sources: {max_sources}")
                logger.info(f"All distances: {distances}")
                
                for i, (meta, distance) in enumerate(zip(metadatas, distances)):
                    logger.info(f"Document {i+1}: distance={distance:.3f}, doc_id={meta.get('document_id', 'unknown')}, name={meta.get('document_name', 'unknown')}")
                    # Only include documents that are highly relevant and limit number of sources
                    if distance < relevant_threshold and len(source_info) < max_sources:
                        doc_id = meta.get('document_id', 'unknown')
                        doc_name = meta.get('document_name', f'Document {i+1}')
                        mime_type = meta.get('mime_type', 'unknown')
                        
                        # Only add if we haven't seen this document before
                        if doc_id not in seen_docs and doc_id != 'unknown':
                            seen_docs.add(doc_id)
                            
                            # Create Google Drive link - proper format for all file types
                            # Use /open?id= format for better compatibility with PPTX, Word, etc.
                            drive_link = f"https://drive.google.com/open?id={doc_id}"
                            
                            source_info.append({
                                "id": doc_id,
                                "name": doc_name,
                                "type": mime_type,
                                "link": drive_link
                            })
                            logger.info(f"Added relevant source: {doc_name} (distance: {distance:.3f})")
                        else:
                            logger.info(f"Skipped duplicate or unknown document: {doc_name}")
                    else:
                        logger.info(f"Document not relevant enough: {meta.get('document_name', 'unknown')} (distance: {distance:.3f} >= {relevant_threshold})")
                
                logger.info(f"Relevant sources found: {len(source_info)} documents")
                
                # If no relevant sources found, try to include at least the best document
                if len(source_info) == 0 and len(metadatas) > 0:
                    logger.warning("No sources passed threshold, including best document as fallback")
                    best_meta = metadatas[0]  # Take the first (best) document
                    doc_id = best_meta.get('document_id', 'unknown')
                    doc_name = best_meta.get('document_name', 'Dokumen')
                    mime_type = best_meta.get('mime_type', 'unknown')
                    
                    if doc_id != 'unknown':
                        drive_link = f"https://drive.google.com/file/d/{doc_id}/view"
                        source_info.append({
                            "id": doc_id,
                            "name": doc_name,
                            "type": mime_type,
                            "link": drive_link
                        })
                        logger.info(f"Added fallback source: {doc_name}")
                
                return {
                    'answer': answer,
                    'sources': source_info,
                    'from_documents': True,
                    'fallback_used': False
                }
            
            else:
                logger.warning(f"No relevant documents found. Min distance: {min(distances) if distances else 'N/A'}, threshold: 0.7")
                return {
                    'answer': "Maaf, saya tidak dapat menemukan informasi yang relevan dalam dokumen Anda untuk menjawab pertanyaan ini. Silakan coba pertanyaan lain atau pastikan dokumen yang relevan sudah ditambahkan ke knowledge base.",
                    'sources': [],
                    'from_documents': False,
                    'fallback_used': False
                }
            
        except Exception as e:
            logger.error(f"Error querying DORA system: {e}")
            logger.error(f"Error type: {type(e)}")
            logger.error(f"Error details: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {
                'answer': "Maaf, terjadi kesalahan saat memproses pertanyaan Anda. Silakan coba lagi.",
                'sources': [],
                'from_documents': False,
                'fallback_used': False
            }
    
    def _expand_query(self, query: str) -> str:
        """Expand query with synonyms and related terms for universal document understanding"""
        # Enhanced synonyms and expansions for DORA's universal document understanding
        expansions = {
            # Legal terms
            'warga negara': 'warga negara citizen kewarganegaraan penduduk',
            'undang-undang': 'undang-undang uu peraturan hukum ketentuan',
            'hukum': 'hukum undang-undang peraturan ketentuan',
            'pasal': 'pasal ayat butir ketentuan',
            'peraturan': 'peraturan ketentuan aturan regulasi',
            
            # Academic terms
            'penelitian': 'penelitian riset kajian studi analisis',
            'metodologi': 'metodologi metode pendekatan cara',
            'referensi': 'referensi sumber pustaka literatur',
            'kajian': 'kajian analisis penelitian studi',
            'hasil': 'hasil temuan outcome result',
            
            # Technical terms
            'fungsi': 'fungsi function method prosedur',
            'implementasi': 'implementasi penerapan aplikasi',
            'sistem': 'sistem system platform aplikasi',
            'teknologi': 'teknologi technology teknis',
            'kode': 'kode code script program',
            
            # Business terms
            'strategi': 'strategi strategy rencana plan',
            'analisis': 'analisis analysis evaluasi assessment',
            'laporan': 'laporan report dokumen document',
            'proposal': 'proposal usulan rencana plan',
            'investasi': 'investasi investment modal capital',
            
            # Medical terms
            'diagnosis': 'diagnosis diagnosa identifikasi',
            'gejala': 'gejala symptom tanda sign',
            'pengobatan': 'pengobatan treatment terapi therapy',
            'pasien': 'pasien patient orang sakit',
            'kesehatan': 'kesehatan health medical medis',
            
            # Financial terms
            'anggaran': 'anggaran budget biaya cost',
            'keuangan': 'keuangan financial finance',
            'profit': 'profit keuntungan benefit',
            'investasi': 'investasi investment modal',
            'ekonomi': 'ekonomi economic financial',
            
            # General terms
            'dokumen': 'dokumen document file berkas',
            'informasi': 'informasi information data',
            'data': 'data information informasi',
            'konten': 'konten content isi materi',
            'sumber': 'sumber source referensi reference'
        }
        
        expanded_query = query.lower()
        for term, synonyms in expansions.items():
            if term in expanded_query:
                expanded_query = expanded_query.replace(term, f"{term} {synonyms}")
        
        return expanded_query

    def _clean_response(self, text: str) -> str:
        """Clean up the AI response to make it more readable with proper paragraph formatting"""
        if not text:
            return text
        
        import re  # Import re at the beginning of the method
        
        # Remove asterisks used for emphasis
        text = text.replace('*', '')
        
        # Remove common markdown formatting
        text = text.replace('**', '')
        text = text.replace('__', '')
        text = text.replace('##', '')
        text = text.replace('###', '')
        
        # Remove bullet points and numbering
        text = re.sub(r'^[\s]*[•\-\*]\s*', '', text, flags=re.MULTILINE)
        text = re.sub(r'^\s*\d+\.\s*', '', text, flags=re.MULTILINE)
        
        # Clean up excessive whitespace and newlines
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            line = line.strip()
            if line:  # Only add non-empty lines
                cleaned_lines.append(line)
        
        # Join lines with proper paragraph spacing
        result = '\n\n'.join(cleaned_lines)
        
        # Remove any remaining multiple spaces within lines
        result = re.sub(r'[ \t]+', ' ', result)
        
        # Ensure proper paragraph spacing (exactly 2 newlines between paragraphs)
        result = re.sub(r'\n\s*\n\s*\n+', '\n\n', result)
        
        # Remove any leading/trailing whitespace
        result = result.strip()
        
        return result
    
    async def summarize_document(self, user_id: str, document_id: str) -> str:
        """Summarize a specific document (bonus feature)"""
        try:
            collection = self._get_user_collection(user_id)
            
            # Get all chunks for this document
            results = collection.get(
                where={"document_id": document_id}
            )
            
            if not results['documents']:
                return "Document not found in knowledge base."
            
            # Combine all chunks
            full_content = "\n\n".join(results['documents'])
            
            # Generate summary
            prompt = f"""
Please provide a comprehensive summary of the following document:

{full_content}

Summary:
"""
            
            response = self.model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            logger.error(f"Error summarizing document {document_id}: {e}")
            raise
    
    async def multi_document_query(self, user_id: str, query: str, document_ids: List[str]) -> Dict[str, Any]:
        """Query across multiple specific documents (bonus feature)"""
        try:
            collection = self._get_user_collection(user_id)
            
            # Search within specified documents only
            where_clause = {"$or": [{"document_id": doc_id} for doc_id in document_ids]}
            
            results = collection.query(
                query_texts=[query],
                n_results=10,
                where=where_clause
            )
            
            documents = results['documents'][0] if results['documents'] else []
            metadatas = results['metadatas'][0] if results['metadatas'] else []
            
            if documents:
                # Group by document
                doc_groups = {}
                for doc, meta in zip(documents, metadatas):
                    doc_id = meta.get('document_id', 'unknown')
                    if doc_id not in doc_groups:
                        doc_groups[doc_id] = []
                    doc_groups[doc_id].append(doc)
                
                # Create context
                context_parts = []
                for doc_id, chunks in doc_groups.items():
                    context_parts.append(f"From Document {doc_id}:\n" + "\n".join(chunks))
                
                context = "\n\n".join(context_parts)
                
                # Generate answer
                prompt = f"""
Based on the following context from multiple documents, answer the question. 
Indicate which documents support your answer.

Context:
{context}

Question: {query}

Answer:
"""
                
                response = self.model.generate_content(prompt)
                
                return {
                    'answer': response.text,
                    'sources': list(doc_groups.keys()),
                    'from_documents': True,
                    'fallback_used': False
                }
            
            else:
                return {
                    'answer': "No relevant information found in the specified documents.",
                    'sources': [],
                    'from_documents': False,
                    'fallback_used': False
                }
            
        except Exception as e:
            logger.error(f"Error in multi-document query: {e}")
            raise
    
    async def get_database_stats(self, user_id: str) -> Dict[str, Any]:
        """Get database statistics for monitoring large scale operations"""
        try:
            collection = self._get_user_collection(user_id)
            
            # Get total count
            count = collection.count()
            
            # Get sample of documents
            sample = collection.get(limit=10)
            
            # Count unique documents
            unique_docs = set()
            if sample['metadatas']:
                for meta in sample['metadatas']:
                    if 'document_id' in meta:
                        unique_docs.add(meta['document_id'])
            
            return {
                'total_chunks': count,
                'sample_size': len(sample.get('ids', [])),
                'estimated_documents': len(unique_docs),
                'status': 'healthy' if count > 0 else 'empty'
            }
            
        except Exception as e:
            logger.error(f"Error getting database stats: {e}")
            return {
                'total_chunks': 0,
                'sample_size': 0,
                'estimated_documents': 0,
                'status': 'error',
                'error': str(e)
            }