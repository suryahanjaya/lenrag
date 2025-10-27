import os
import logging
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import google.generativeai as genai
import json
import re

logger = logging.getLogger(__name__)

class DORAPipeline:
    def __init__(self):
        # Initialize Gemini API
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not self.gemini_api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")
        genai.configure(api_key=self.gemini_api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        # Initialize embedding model - using multilingual model for better document understanding
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
        
        # Standardized text splitter configuration for consistent chunking
        # Target: 100 halaman = 300 chunks (konsisten untuk semua jenis dokumen)
        self.chunk_size = 400   # FIXED: Correct size untuk 100 halaman = 300 chunks
        self.chunk_overlap = 50  # Reduced overlap untuk efisiensi
        self.separators = ["\n\n", "\n", ". ", "! ", "? ", " ", ""]
        
        # UNIFIED chunk sizes untuk semua jenis dokumen - 100 halaman = 300 chunks
        self.document_chunk_sizes = {
            'pdf': 400,       # FIXED: 100 halaman = 300 chunks (119k chars ÷ 300 = ~400)
            'doc': 400,       # FIXED: 100 halaman = 300 chunks
            'academic': 400,  # FIXED: 100 halaman = 300 chunks
            'legal': 400,     # FIXED: 100 halaman = 300 chunks
            'technical': 400, # FIXED: 100 halaman = 300 chunks
            'business': 400,  # FIXED: 100 halaman = 300 chunks
            'general': 400    # FIXED: 100 halaman = 300 chunks
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
        # UNIFIED: All document types use 400 character chunks for 100 pages = 300 chunks
        if mime_type == 'application/pdf':
            optimal_chunk_size = self.document_chunk_sizes.get('pdf', 400)
        elif mime_type and 'word' in mime_type.lower():
            optimal_chunk_size = self.document_chunk_sizes.get('doc', 400)
        else:
            optimal_chunk_size = self.document_chunk_sizes.get(doc_type, 400)
        
        logger.info(f"Detected document type: {doc_type}, MIME: {mime_type}, optimal chunk size: {optimal_chunk_size}")
        logger.info(f"Processing document: {len(text)} characters")
        logger.info(f"TARGET: 100 halaman = 300 chunks (unified for all document types)")
        
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
        
        # Strategy 4: Use whole text if no clear sections
        logger.info("No clear sections found, using whole text")
        return [text.strip()] if text.strip() else []
    
    async def add_document(self, user_id: str, document_id: str, content: str, document_name: str = None, mime_type: str = None):
        """Add a document to the user's knowledge base"""
        try:
            if not content or not content.strip():
                logger.warning(f"Empty content for document {document_id}")
                return
            
            collection = self._get_user_collection(user_id)
            
            # Split document into chunks with MIME type detection
            logger.info(f"Starting chunking for document {document_id} ({len(content)} characters, MIME: {mime_type})")
            chunks = self._split_text(content, mime_type)
            logger.info(f"Generated {len(chunks)} chunks for document {document_id}")
            
            if not chunks:
                logger.warning(f"No chunks generated for document {document_id}")
                return
            
            # Generate embeddings and store chunks
            chunk_ids = []
            chunk_texts = []
            metadatas = []
            
            for i, chunk in enumerate(chunks):
                if not chunk.strip():
                    continue
                    
                chunk_id = self._generate_chunk_id(document_id, i)
                chunk_ids.append(chunk_id)
                chunk_texts.append(chunk)
                metadatas.append({
                    "document_id": document_id,
                    "document_name": document_name or f"Document {document_id[:8]}",
                    "mime_type": mime_type or "unknown",
                    "chunk_index": i,
                    "user_id": user_id
                })
            
            if chunk_ids:
                # Add to ChromaDB with batch processing for large scale
                logger.info(f"Adding {len(chunk_ids)} chunks to ChromaDB for document {document_id}")
                
                # Process in batches for large documents to prevent memory issues
                batch_size = 100  # Process 100 chunks at a time
                for i in range(0, len(chunk_ids), batch_size):
                    batch_ids = chunk_ids[i:i + batch_size]
                    batch_texts = chunk_texts[i:i + batch_size]
                    batch_metadatas = metadatas[i:i + batch_size]
                    
                    collection.add(
                        documents=batch_texts,
                        metadatas=batch_metadatas,
                        ids=batch_ids
                    )
                    logger.info(f"Added batch {i//batch_size + 1}/{(len(chunk_ids)-1)//batch_size + 1} for document {document_id}")
                
                logger.info(f"Successfully added {len(chunk_ids)} chunks for document {document_id}")
            
        except Exception as e:
            logger.error(f"Error adding document {document_id}: {e}")
            # Cleanup on error to prevent partial data
            try:
                collection.delete(where={"document_id": document_id})
                logger.info(f"Cleaned up partial data for document {document_id}")
            except:
                pass
            raise
    
    async def remove_document(self, user_id: str, document_id: str):
        """Remove a document from the user's knowledge base"""
        try:
            collection = self._get_user_collection(user_id)
            
            # Get all chunks for this document
            results = collection.get(
                where={"document_id": document_id}
            )
            
            if results['ids']:
                collection.delete(ids=results['ids'])
                logger.info(f"Removed {len(results['ids'])} chunks for document {document_id}")
            
        except Exception as e:
            logger.error(f"Error removing document {document_id}: {e}")
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
            
            # Detect query language and analyze intent for better understanding
            query_language = self._detect_query_language(query)
            query_intent = self._analyze_query_intent(query)
            expanded_query = self._expand_query(query)
            
            logger.info(f"Original query: {query}")
            logger.info(f"Detected language: {query_language}")
            logger.info(f"Query intent: {query_intent}")
            logger.info(f"Expanded query: {expanded_query}")
            
            # Search for relevant chunks with expanded query and multiple search strategies
            # Strategy 1: Search with expanded query
            results = collection.query(
                query_texts=[expanded_query],
                n_results=20  # Increased for better coverage
            )
            
            # Strategy 2: If intent detected, also search with intent-specific terms
            intent_query = None
            if query_intent['intent']:
                intent_terms = []
                for intent in query_intent['intent']:
                    if intent == 'definition':
                        intent_terms.extend(['definisi', 'pengertian', 'artinya', 'meaning'])
                    elif intent == 'how_to':
                        intent_terms.extend(['cara', 'langkah', 'prosedur', 'method'])
                    elif intent == 'when':
                        intent_terms.extend(['waktu', 'tanggal', 'kapan', 'time'])
                    elif intent == 'where':
                        intent_terms.extend(['lokasi', 'tempat', 'dimana', 'location'])
                    elif intent == 'why':
                        intent_terms.extend(['alasan', 'sebab', 'mengapa', 'reason'])
                    elif intent == 'comparison':
                        intent_terms.extend(['perbedaan', 'beda', 'banding', 'difference'])
                    elif intent == 'example':
                        intent_terms.extend(['contoh', 'sample', 'misal', 'example'])
                
                if intent_terms:
                    intent_query = f"{query} {' '.join(intent_terms)}"
                    logger.info(f"Intent-based query: {intent_query}")
                    
                    # Get additional results with intent query
                    intent_results = collection.query(
                        query_texts=[intent_query],
                        n_results=10
                    )
                    
                    # Merge results (combine and deduplicate)
                    if intent_results['documents'][0]:
                        # Combine document lists
                        all_docs = results['documents'][0] + intent_results['documents'][0]
                        all_metadatas = results['metadatas'][0] + intent_results['metadatas'][0]
                        all_distances = results['distances'][0] + intent_results['distances'][0]
                        
                        # Remove duplicates based on document content
                        seen_docs = set()
                        unique_docs = []
                        unique_metadatas = []
                        unique_distances = []
                        
                        for doc, meta, dist in zip(all_docs, all_metadatas, all_distances):
                            if doc not in seen_docs:
                                seen_docs.add(doc)
                                unique_docs.append(doc)
                                unique_metadatas.append(meta)
                                unique_distances.append(dist)
                        
                        # Sort by distance (relevance)
                        sorted_items = sorted(zip(unique_docs, unique_metadatas, unique_distances), 
                                            key=lambda x: x[2])
                        
                        results = {
                            'documents': [[item[0] for item in sorted_items]],
                            'metadatas': [[item[1] for item in sorted_items]],
                            'distances': [[item[2] for item in sorted_items]]
                        }
                        
                        logger.info(f"Combined results: {len(results['documents'][0])} unique documents")
            
            documents = results['documents'][0] if results['documents'] else []
            metadatas = results['metadatas'][0] if results['metadatas'] else []
            distances = results['distances'][0] if results['distances'] else []
            
            logger.info(f"Query results: {len(documents)} documents found")
            logger.info(f"Distances: {distances}")
            
            # Dynamic similarity threshold based on query complexity and intent
            base_threshold = 0.85  # Base threshold
            if query_intent['complexity'] == 'low':
                threshold = base_threshold + 0.05  # More lenient for simple queries
            elif query_intent['complexity'] == 'high':
                threshold = base_threshold - 0.05  # More strict for complex queries
            else:
                threshold = base_threshold
            
            # Adjust threshold based on intent
            if query_intent['intent']:
                threshold -= 0.05  # More lenient for specific intents
            
            logger.info(f"Using similarity threshold: {threshold}")
            
            if documents and distances and min(distances) < threshold:
                # Create context from retrieved documents with document names and more context
                context_parts = []
                for i, (doc, meta) in enumerate(zip(documents, metadatas)):
                    doc_name = meta.get('document_name', f'Dokumen {i+1}')
                    # Include more context around the relevant text
                    context_parts.append(f"Dokumen: {doc_name}\nKonten: {doc}")
                context = "\n\n".join(context_parts)
                
                # Add instruction to be more flexible in understanding
                context += "\n\nPENTING: Jawab pertanyaan berdasarkan konteks di atas, bahkan jika ada variasi kata atau frasa dalam pertanyaan. Fokus pada makna dan inti pertanyaan, bukan pada kata-kata yang persis sama."
                
                # Generate intent-specific instructions
                intent_instructions = ""
                if query_intent['intent']:
                    for intent in query_intent['intent']:
                        if intent == 'definition':
                            intent_instructions += "- Jika ini pertanyaan definisi, berikan pengertian yang jelas dan ringkas\n"
                        elif intent == 'how_to':
                            intent_instructions += "- Jika ini pertanyaan cara/langkah, berikan prosedur yang terstruktur dan mudah diikuti\n"
                        elif intent == 'when':
                            intent_instructions += "- Jika ini pertanyaan waktu, berikan informasi waktu/tanggal yang spesifik\n"
                        elif intent == 'where':
                            intent_instructions += "- Jika ini pertanyaan lokasi, berikan informasi tempat yang jelas\n"
                        elif intent == 'why':
                            intent_instructions += "- Jika ini pertanyaan alasan, berikan penjelasan sebab-akibat yang logis\n"
                        elif intent == 'comparison':
                            intent_instructions += "- Jika ini pertanyaan perbandingan, berikan perbedaan yang jelas\n"
                        elif intent == 'example':
                            intent_instructions += "- Jika ini pertanyaan contoh, berikan contoh yang relevan dan mudah dipahami\n"
                        elif intent == 'requirement':
                            intent_instructions += "- Jika ini pertanyaan syarat, berikan daftar syarat yang lengkap\n"
                        elif intent == 'process':
                            intent_instructions += "- Jika ini pertanyaan proses, berikan tahapan yang terstruktur\n"
                        elif intent == 'benefit':
                            intent_instructions += "- Jika ini pertanyaan manfaat, berikan keuntungan yang spesifik\n"
                        elif intent == 'problem':
                            intent_instructions += "- Jika ini pertanyaan masalah, berikan identifikasi masalah yang jelas\n"
                        elif intent == 'solution':
                            intent_instructions += "- Jika ini pertanyaan solusi, berikan pemecahan yang praktis\n"
                
                # Generate answer using retrieved context with DORA's enhanced intelligence
                prompt = f"""Anda adalah DORA (Document Retrieval Assistant) - asisten cerdas yang dapat memahami dan menganalisis berbagai jenis dokumen. WAJIB MENGGUNAKAN BAHASA INDONESIA SAJA.

Konteks dari dokumen pengguna:
{context}

Pertanyaan: {query}
Bahasa pertanyaan yang terdeteksi: {query_language}
Intent yang terdeteksi: {query_intent['intent']}
Konteks yang terdeteksi: {query_intent['context']}

INSTRUKSI KHUSUS UNTUK DORA (DOCUMENT RETRIEVAL ASSISTANT):
- WAJIB MENJAWAB DALAM BAHASA INDONESIA meskipun pertanyaan dalam bahasa apapun
- BERIKAN JAWABAN YANG SINGKAT, PADAT, DAN TO THE POINT
- ANALISIS KONTEKS dengan cermat dari berbagai jenis dokumen dan berikan jawaban yang AKURAT dan RELEVAN
- DORA dapat memahami dokumen hukum, akademik, teknis, bisnis, medis, keuangan, dan jenis dokumen lainnya
- Jika pertanyaan tentang hukum, CARI dan SEBUTKAN undang-undang, pasal, atau peraturan yang relevan
- Jika pertanyaan tentang akademik, berikan analisis berdasarkan penelitian, referensi, atau kajian
- Jika pertanyaan tentang teknis, jelaskan konsep, fungsi, atau implementasi yang relevan
- Jika pertanyaan tentang bisnis, berikan analisis strategi, proposal, atau laporan yang relevan
- JANGAN katakan "tidak ada informasi" jika ada konten yang relevan dalam dokumen

INSTRUKSI BERDASARKAN INTENT:
{intent_instructions}

FORMAT RESPONS YANG DIHARUSKAN:
- JAWAB LANGSUNG APA YANG DIMINTA DALAM SESINGKAT-KATNYA
- GUNAKAN BAHASA INDONESIA YANG JELAS DAN MUDAH DIPAHAMI
- HINDARI PENJELASAN PANJANG LEBAR - FOKUS PADA INTI PERTANYAAN
- BERIKAN INFORMASI YANG PENTING SAJA
- MAKSIMAL 3-4 KALIMAT UNTUK JAWABAN UMUM
- UNTUK PERTANYAAN KOMPLEKS, BERIKAN JAWABAN YANG TERSTRUKTUR TETAPI TETAP RINGKAS
- JANGAN ULANGI PERTANYAAN DALAM JAWABAN - LANGSUNG BERIKAN INFORMASI
- GUNAKAN PEMAHAMAN SEMANTIK - CARI INFORMASI YANG BERKAITAN MESKIPUN TIDAK EXACT MATCH

PANDUAN PENULISAN:
- Tulis dengan gaya percakapan yang profesional dan informatif
- Gunakan kalimat yang lengkap dan koheren
- Hindari frasa yang terputus-putus
- Buat alur logis dari satu ide ke ide berikutnya
- WAJIB menggunakan bahasa Indonesia dalam seluruh respons
- BERSIFAT CERDAS dalam memahami maksud pertanyaan
- BERIKAN jawaban yang KONSTRUKTIF dan BERMANFAAT
- Di akhir respons, sebutkan nama dokumen yang Anda gunakan sebagai sumber

Jawaban:"""
                
                response = self.model.generate_content(prompt)
                raw_answer = response.text
                
                # Clean up the response
                answer = self._clean_response(raw_answer)
                
                # Extract source document information with deduplication and relevance filtering
                source_info = []
                seen_docs = set()  # Track unique document IDs
                
                # Filter documents based on similarity score (optimized for large-scale knowledge base)
                relevant_threshold = threshold + 0.1  # Use the same threshold as document filtering
                max_sources = 8  # More sources for comprehensive context from large document collection
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
                            
                            # Create Google Drive link
                            drive_link = f"https://drive.google.com/file/d/{doc_id}/view"
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
                logger.warning(f"No relevant documents found. Min distance: {min(distances) if distances else 'N/A'}, threshold: {threshold}")
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
    
    def _detect_query_language(self, query: str) -> str:
        """Detect the language of the query to ensure proper handling"""
        query_lower = query.lower()
        
        # Common English words
        english_words = ['what', 'how', 'when', 'where', 'why', 'who', 'which', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'have', 'has', 'had', 'do', 'does', 'did', 'can', 'could', 'will', 'would', 'should', 'may', 'might', 'must', 'about', 'with', 'from', 'for', 'to', 'in', 'on', 'at', 'by']
        
        # Common Indonesian words
        indonesian_words = ['apa', 'bagaimana', 'kapan', 'dimana', 'mengapa', 'siapa', 'yang', 'dan', 'atau', 'tetapi', 'adalah', 'telah', 'sudah', 'bisa', 'dapat', 'akan', 'harus', 'mungkin', 'tentang', 'dengan', 'dari', 'untuk', 'ke', 'di', 'pada', 'oleh', 'dalam', 'atas', 'bawah']
        
        # Count English and Indonesian words
        english_count = sum(1 for word in english_words if word in query_lower)
        indonesian_count = sum(1 for word in indonesian_words if word in query_lower)
        
        # If more English words detected, likely English
        if english_count > indonesian_count:
            return 'english'
        elif indonesian_count > english_count:
            return 'indonesian'
        else:
            # Default to Indonesian for mixed or unclear languages
            return 'indonesian'
    
    def _analyze_query_intent(self, query: str) -> dict:
        """Analyze the intent and context of the query for better understanding"""
        query_lower = query.lower()
        
        # Intent patterns
        intent_patterns = {
            'definition': ['apa itu', 'apa yang dimaksud', 'definisi', 'pengertian', 'what is', 'what does', 'define'],
            'how_to': ['bagaimana cara', 'cara', 'langkah', 'prosedur', 'how to', 'how do', 'step by step'],
            'when': ['kapan', 'waktu', 'tanggal', 'kapan dimulai', 'when', 'what time', 'what date'],
            'where': ['dimana', 'lokasi', 'tempat', 'where', 'location', 'place'],
            'why': ['mengapa', 'kenapa', 'alasannya', 'why', 'reason', 'because'],
            'who': ['siapa', 'who', 'person', 'orang'],
            'what': ['apa', 'what', 'which'],
            'comparison': ['perbedaan', 'beda', 'bandingkan', 'difference', 'compare', 'versus'],
            'example': ['contoh', 'sample', 'misalnya', 'example', 'for instance'],
            'requirement': ['syarat', 'kebutuhan', 'requirement', 'need', 'prerequisite'],
            'process': ['proses', 'tahapan', 'process', 'step', 'procedure'],
            'benefit': ['manfaat', 'keuntungan', 'benefit', 'advantage', 'advantage'],
            'problem': ['masalah', 'problem', 'issue', 'trouble'],
            'solution': ['solusi', 'pemecahan', 'solution', 'fix', 'resolve']
        }
        
        # Context patterns
        context_patterns = {
            'legal': ['hukum', 'undang-undang', 'pasal', 'peraturan', 'legal', 'law', 'regulation'],
            'technical': ['teknologi', 'sistem', 'aplikasi', 'software', 'technical', 'system', 'application'],
            'business': ['bisnis', 'perusahaan', 'organisasi', 'business', 'company', 'organization'],
            'academic': ['penelitian', 'studi', 'kajian', 'research', 'study', 'analysis'],
            'medical': ['kesehatan', 'medis', 'dokter', 'pasien', 'medical', 'health', 'doctor'],
            'financial': ['keuangan', 'uang', 'biaya', 'anggaran', 'financial', 'money', 'budget'],
            'hr': ['karyawan', 'pegawai', 'hr', 'human resource', 'employee', 'staff'],
            'admin': ['administrasi', 'admin', 'tata usaha', 'administration', 'administrative']
        }
        
        # Analyze intent
        detected_intent = []
        for intent, patterns in intent_patterns.items():
            for pattern in patterns:
                if pattern in query_lower:
                    detected_intent.append(intent)
                    break
        
        # Analyze context
        detected_context = []
        for context, patterns in context_patterns.items():
            for pattern in patterns:
                if pattern in query_lower:
                    detected_context.append(context)
                    break
        
        return {
            'intent': detected_intent,
            'context': detected_context,
            'is_question': any(word in query_lower for word in ['apa', 'bagaimana', 'kapan', 'dimana', 'mengapa', 'siapa', 'what', 'how', 'when', 'where', 'why', 'who']),
            'is_request': any(word in query_lower for word in ['tolong', 'bisa', 'mohon', 'please', 'can you', 'could you']),
            'complexity': 'high' if len(query.split()) > 10 else 'medium' if len(query.split()) > 5 else 'low'
        }
    
    def _expand_query(self, query: str) -> str:
        """Expand query with synonyms and related terms for universal document understanding"""
        # Enhanced synonyms and expansions for DORA's universal document understanding
        expansions = {
            # Legal terms - expanded for better matching
            'warga negara': 'warga negara citizen kewarganegaraan penduduk masyarakat',
            'undang-undang': 'undang-undang uu peraturan hukum ketentuan aturan',
            'hukum': 'hukum undang-undang peraturan ketentuan aturan legal',
            'pasal': 'pasal ayat butir ketentuan klausul',
            'peraturan': 'peraturan ketentuan aturan regulasi kebijakan',
            'hak': 'hak right entitlement privilege',
            'kewajiban': 'kewajiban obligation duty tanggung jawab',
            'sanksi': 'sanksi penalty punishment hukuman',
            
            # Academic terms - expanded for better matching
            'penelitian': 'penelitian riset kajian studi analisis investigasi',
            'metodologi': 'metodologi metode pendekatan cara prosedur',
            'referensi': 'referensi sumber pustaka literatur acuan',
            'kajian': 'kajian analisis penelitian studi evaluasi',
            'hasil': 'hasil temuan outcome result kesimpulan',
            'tujuan': 'tujuan goal objective target maksud',
            'ruang lingkup': 'ruang lingkup scope coverage cakupan',
            
            # Technical terms - expanded for better matching
            'fungsi': 'fungsi function method prosedur operasi',
            'implementasi': 'implementasi penerapan aplikasi eksekusi',
            'sistem': 'sistem system platform aplikasi arsitektur',
            'teknologi': 'teknologi technology teknis digital',
            'kode': 'kode code script program algoritma',
            'database': 'database basis data penyimpanan',
            'server': 'server peladen host komputer',
            'client': 'client klien pengguna aplikasi',
            
            # Business terms - expanded for better matching
            'strategi': 'strategi strategy rencana plan taktik',
            'analisis': 'analisis analysis evaluasi assessment review',
            'laporan': 'laporan report dokumen document hasil',
            'proposal': 'proposal usulan rencana plan gagasan',
            'investasi': 'investasi investment modal capital dana',
            'profit': 'profit keuntungan benefit laba margin',
            'revenue': 'revenue pendapatan income penghasilan',
            'budget': 'budget anggaran biaya cost dana',
            
            # Medical terms - expanded for better matching
            'diagnosis': 'diagnosis diagnosa identifikasi penentuan',
            'gejala': 'gejala symptom tanda sign indikasi',
            'pengobatan': 'pengobatan treatment terapi therapy medikasi',
            'pasien': 'pasien patient orang sakit klien',
            'kesehatan': 'kesehatan health medical medis fisik',
            'penyakit': 'penyakit disease illness kondisi',
            'obat': 'obat medicine medication drug',
            
            # Financial terms - expanded for better matching
            'anggaran': 'anggaran budget biaya cost dana',
            'keuangan': 'keuangan financial finance moneter',
            'profit': 'profit keuntungan benefit laba margin',
            'investasi': 'investasi investment modal capital',
            'ekonomi': 'ekonomi economic financial bisnis',
            'biaya': 'biaya cost expense expenditure',
            'pendapatan': 'pendapatan income revenue earnings',
            
            # HR/Administrative terms - new category
            'karyawan': 'karyawan employee staff pekerja',
            'cuti': 'cuti leave vacation libur',
            'gaji': 'refund salary wage income',
            'benefit': 'benefit tunjangan fasilitas keuntungan',
            'performance': 'performance kinerja performa hasil',
            'training': 'training pelatihan education edukasi',
            
            # General terms - expanded for better matching
            'dokumen': 'dokumen document file berkas arsip',
            'informasi': 'informasi information data detail',
            'data': 'data information informasi detail',
            'konten': 'konten content isi materi substance',
            'sumber': 'sumber source referensi reference origin',
            'tujuan': 'tujuan goal objective target maksud',
            'proses': 'proses process procedure tahapan',
            'hasil': 'hasil result outcome output',
            'masalah': 'masalah problem issue trouble',
            'solusi': 'solusi solution answer resolution',
            
            # Question words - for better intent understanding
            'apa': 'apa what which bagaimana',
            'bagaimana': 'bagaimana how cara metode',
            'kapan': 'kapan when waktu tanggal',
            'dimana': 'dimana where lokasi tempat',
            'mengapa': 'mengapa why sebab alasan',
            'siapa': 'siapa who person orang',
            'berapa': 'berapa how many how much jumlah',
            
            # Action words - for better intent understanding
            'cara': 'cara how metode prosedur',
            'langkah': 'langkah step tahapan proses',
            'prosedur': 'prosedur procedure process langkah',
            'metode': 'metode method cara approach',
            'panduan': 'panduan guide manual instruksi',
            'petunjuk': 'petunjuk instruction guide panduan'
        }
        
        expanded_query = query.lower()
        
        # Apply expansions
        for term, synonyms in expansions.items():
            if term in expanded_query:
                expanded_query = expanded_query.replace(term, f"{term} {synonyms}")
        
        # Add the original query terms to ensure we don't lose the original intent
        original_terms = query.lower().split()
        expanded_query = f"{query.lower()} {expanded_query}"
        
        # Remove duplicate words while preserving order
        words = expanded_query.split()
        seen = set()
        unique_words = []
        for word in words:
            if word not in seen:
                seen.add(word)
                unique_words.append(word)
        
        return ' '.join(unique_words)

    def _clean_response(self, text: str) -> str:
        """Clean up the AI response to make it more readable and concise"""
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
        
        # Remove common AI response prefixes that make responses verbose
        text = re.sub(r'^(Berdasarkan konteks yang diberikan,?\s*)', '', text, flags=re.IGNORECASE)
        text = re.sub(r'^(Menurut dokumen yang tersedia,?\s*)', '', text, flags=re.IGNORECASE)
        text = re.sub(r'^(Dari informasi yang ada,?\s*)', '', text, flags=re.IGNORECASE)
        text = re.sub(r'^(Informasi yang dapat saya berikan adalah,?\s*)', '', text, flags=re.IGNORECASE)
        text = re.sub(r'^(Jawaban untuk pertanyaan Anda adalah,?\s*)', '', text, flags=re.IGNORECASE)
        
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