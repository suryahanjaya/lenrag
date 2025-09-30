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

class RAGPipeline:
    def __init__(self):
        # Initialize Gemini API
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not self.gemini_api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")
        genai.configure(api_key=self.gemini_api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        # Initialize embedding model
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Initialize ChromaDB with optimizations for large scale
        self.chroma_client = chromadb.Client(Settings(
            persist_directory="./chroma_db",
            anonymized_telemetry=False,
            # Optimizations for large scale
            allow_reset=True,
            is_persistent=True
        ))
        
        # Text splitter configuration for chunking documents - Optimized for 100 documents scale
        self.chunk_size = 2000  # Larger chunks for better context with fewer documents
        self.chunk_overlap = 200  # Reduced overlap for better performance
        self.separators = ["\n\n", "\n", " ", ""]
    
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
    
    def _split_text(self, text: str) -> List[str]:
        """Split text into chunks using intelligent text splitting logic for legal documents"""
        if not text or not text.strip():
            return []
        
        chunks = []
        logger.info(f"Starting text splitting for {len(text)} characters")
        
        # For legal documents, try multiple splitting strategies
        # Strategy 1: Split by Pasal (Article) boundaries if they exist
        pasal_sections = re.split(r'(?=Pasal\s+\d+)', text)
        
        # Strategy 1.5: For constitutional documents, also check for other patterns
        # UUD 1945 uses different structure - check for "BAB", "Pasal", or numbered sections
        constitutional_patterns = [
            r'(?=BAB\s+\d+)',  # BAB I, BAB II, etc.
            r'(?=Pasal\s+\d+)',  # Pasal 1, Pasal 2, etc.
            r'(?=Pasal\s+\d+[A-Z])',  # Pasal 1A, Pasal 2B, etc.
            r'(?=Pasal\s+\d+[a-z])',  # Pasal 1a, Pasal 2b, etc.
        ]
        
        logger.info(f"Found {len(pasal_sections)} Pasal sections")
        
        # Try constitutional patterns if no regular Pasal found
        if len(pasal_sections) <= 1:
            for pattern in constitutional_patterns:
                sections = re.split(pattern, text)
                if len(sections) > 1:
                    pasal_sections = sections
                    logger.info(f"Found {len(sections)} sections using pattern: {pattern}")
                    break
        
        if len(pasal_sections) > 1:  # Only use Pasal splitting if we found multiple sections
            logger.info("Using Pasal-based splitting strategy")
            for section in pasal_sections:
                if not section.strip():
                    continue
                    
                if len(section) <= self.chunk_size:
                    if section.strip():
                        chunks.append(section.strip())
                else:
                    # Split long sections by paragraphs first
                    paragraphs = section.split('\n\n')
                    current_chunk = ""
                    
                    for paragraph in paragraphs:
                        if len(current_chunk) + len(paragraph) <= self.chunk_size:
                            current_chunk += paragraph + "\n\n"
                        else:
                            if current_chunk.strip():
                                chunks.append(current_chunk.strip())
                            # If single paragraph is too long, split by sentences
                            if len(paragraph) > self.chunk_size:
                                sentences = re.split(r'[.!?]+\s+', paragraph)
                                temp_chunk = ""
                                
                                for sentence in sentences:
                                    if len(temp_chunk) + len(sentence) <= self.chunk_size:
                                        temp_chunk += sentence + ". "
                                    else:
                                        if temp_chunk.strip():
                                            chunks.append(temp_chunk.strip())
                                        temp_chunk = sentence + ". "
                                
                                if temp_chunk.strip():
                                    chunks.append(temp_chunk.strip())
                            else:
                                current_chunk = paragraph + "\n\n"
                    
                    if current_chunk.strip():
                        chunks.append(current_chunk.strip())
        
        # Strategy 2: If no Pasal sections found or chunks are too few, use paragraph splitting
        if not chunks or len(chunks) < 10:  # If we have very few chunks, use paragraph splitting
            logger.info(f"Using paragraph-based splitting strategy (chunks so far: {len(chunks)})")
            
            # For constitutional documents, be more aggressive with splitting
            # Split by multiple newlines first, then by single newlines
            text_sections = re.split(r'\n\s*\n\s*\n', text)  # Triple newlines
            if len(text_sections) <= 1:
                text_sections = re.split(r'\n\s*\n', text)  # Double newlines
            if len(text_sections) <= 1:
                text_sections = [text]  # Use whole text if no clear sections
            
            for section in text_sections:
                if not section.strip():
                    continue
                    
                if len(section) <= self.chunk_size:
                    if section.strip():
                        chunks.append(section.strip())
                else:
                    # Split long sections by paragraphs
                    paragraphs = section.split('\n\n')
                    current_chunk = ""
                    
                    for paragraph in paragraphs:
                        if len(current_chunk) + len(paragraph) <= self.chunk_size:
                            current_chunk += paragraph + "\n\n"
                        else:
                            if current_chunk.strip():
                                chunks.append(current_chunk.strip())
                            # If single paragraph is too long, split by sentences
                            if len(paragraph) > self.chunk_size:
                                sentences = re.split(r'[.!?]+\s+', paragraph)
                                temp_chunk = ""
                                
                                for sentence in sentences:
                                    if len(temp_chunk) + len(sentence) <= self.chunk_size:
                                        temp_chunk += sentence + ". "
                                    else:
                                        if temp_chunk.strip():
                                            chunks.append(temp_chunk.strip())
                                        temp_chunk = sentence + ". "
                                
                                if temp_chunk.strip():
                                    chunks.append(temp_chunk.strip())
                            else:
                                current_chunk = paragraph + "\n\n"
                    
                    if current_chunk.strip():
                        chunks.append(current_chunk.strip())
                    sentences = re.split(r'[.!?]+\s+', paragraph)
                    current_chunk = ""
                    
                    for sentence in sentences:
                        if len(current_chunk) + len(sentence) <= self.chunk_size:
                            current_chunk += sentence + ". "
                        else:
                            if current_chunk.strip():
                                chunks.append(current_chunk.strip())
                            current_chunk = sentence + ". "
                    
                    if current_chunk.strip():
                        chunks.append(current_chunk.strip())
        
        # Apply overlap if we have multiple chunks
        if len(chunks) > 1 and self.chunk_overlap > 0:
            overlapped_chunks = []
            for i, chunk in enumerate(chunks):
                if i == 0:
                    overlapped_chunks.append(chunk)
                else:
                    # Add overlap from previous chunk
                    prev_chunk = chunks[i-1]
                    overlap_text = prev_chunk[-self.chunk_overlap:] if len(prev_chunk) > self.chunk_overlap else prev_chunk
                    overlapped_chunks.append(overlap_text + " " + chunk)
            return overlapped_chunks
        
        logger.info(f"Final chunk count: {len(chunks)}")
        return chunks
    
    async def add_document(self, user_id: str, document_id: str, content: str, document_name: str = None, mime_type: str = None):
        """Add a document to the user's knowledge base"""
        try:
            if not content or not content.strip():
                logger.warning(f"Empty content for document {document_id}")
                return
            
            collection = self._get_user_collection(user_id)
            
            # Split document into chunks
            logger.info(f"Starting chunking for document {document_id} ({len(content)} characters)")
            chunks = self._split_text(content)
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
            
            # Create expanded query for better understanding
            expanded_query = self._expand_query(query)
            logger.info(f"Original query: {query}")
            logger.info(f"Expanded query: {expanded_query}")
            
            # Search for relevant chunks with expanded query
            results = collection.query(
                query_texts=[expanded_query],
                n_results=15  # Optimized for 100 documents - reduced for better performance
            )
            
            documents = results['documents'][0] if results['documents'] else []
            metadatas = results['metadatas'][0] if results['metadatas'] else []
            distances = results['distances'][0] if results['distances'] else []
            
            logger.info(f"Query results: {len(documents)} documents found")
            logger.info(f"Distances: {distances}")
            
            # More lenient similarity threshold for expanded queries
            if documents and distances and min(distances) < 0.9:
                # Create context from retrieved documents with document names and more context
                context_parts = []
                for i, (doc, meta) in enumerate(zip(documents, metadatas)):
                    doc_name = meta.get('document_name', f'Dokumen {i+1}')
                    # Include more context around the relevant text
                    context_parts.append(f"Dokumen: {doc_name}\nKonten: {doc}")
                context = "\n\n".join(context_parts)
                
                # Add instruction to be more flexible in understanding
                context += "\n\nPENTING: Jawab pertanyaan berdasarkan konteks di atas, bahkan jika ada variasi kata atau frasa dalam pertanyaan. Fokus pada makna dan inti pertanyaan, bukan pada kata-kata yang persis sama."
                
                # Generate answer using retrieved context with enhanced intelligence for large-scale knowledge base
                prompt = f"""Anda adalah asisten hukum yang sangat berpengalaman dengan akses ke database hukum yang sangat besar (1000+ dokumen). WAJIB MENGGUNAKAN BAHASA INDONESIA SAJA.

Konteks dari dokumen pengguna (dari database hukum yang luas):
{context}

Pertanyaan: {query}

INSTRUKSI KHUSUS UNTUK KECERDASAN TINGGI PADA SKALA BESAR:
- ANALISIS KONTEKS dengan cermat dari database hukum yang luas dan berikan jawaban yang LENGKAP dan AKURAT
- Manfaatkan pengetahuan dari 1000+ dokumen hukum untuk memberikan jawaban yang komprehensif
- Jika pertanyaan tentang "UU yang mengatur tentang warga negara", CARI dan SEBUTKAN undang-undang spesifik yang mengatur hal tersebut
- JANGAN katakan "tidak ada informasi" jika ada pasal atau undang-undang yang relevan dalam konteks
- BERIKAN jawaban yang SPESIFIK dengan menyebutkan:
  * Nama undang-undang yang tepat
  * Pasal dan ayat yang relevan
  * Penjelasan lengkap tentang ketentuan tersebut
  * Referensi silang dengan undang-undang terkait lainnya
- Jika menemukan informasi yang relevan, jelaskan dengan DETAIL dan MENYELURUH
- Manfaatkan konteks dari berbagai dokumen untuk memberikan perspektif yang komprehensif
- Format respons dalam paragraf yang bersih dan mudah dibaca
- Tulis dengan gaya percakapan yang profesional dan informatif
- WAJIB menggunakan bahasa Indonesia dalam seluruh respons
- BERSIFAT CERDAS dalam memahami maksud pertanyaan - fokus pada inti pertanyaan
- Jika ada variasi kata dalam pertanyaan, jawab berdasarkan konteks yang relevan
- BERIKAN jawaban yang KONSTRUKTIF dan BERMANFAAT dengan memanfaatkan database hukum yang luas
- Di akhir respons, sebutkan nama dokumen yang Anda gunakan sebagai sumber

Jawaban:"""
                
                response = self.model.generate_content(prompt)
                raw_answer = response.text
                
                # Clean up the response
                answer = self._clean_response(raw_answer)
                
                # Extract source document information with deduplication and relevance filtering
                from models.schemas import SourceInfo
                source_info = []
                seen_docs = set()  # Track unique document IDs
                
                # Filter documents based on similarity score (optimized for large-scale knowledge base)
                relevant_threshold = 0.8  # More lenient threshold for large knowledge base
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
                            source_info.append(SourceInfo(
                                id=doc_id,
                                name=doc_name,
                                type=mime_type,
                                link=drive_link
                            ))
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
                        source_info.append(SourceInfo(
                            id=doc_id,
                            name=doc_name,
                            type=mime_type,
                            link=drive_link
                        ))
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
            logger.error(f"Error querying RAG system: {e}")
            return {
                'answer': "Maaf, terjadi kesalahan saat memproses pertanyaan Anda. Silakan coba lagi.",
                'sources': [],
                'from_documents': False,
                'fallback_used': False
            }
    
    def _expand_query(self, query: str) -> str:
        """Expand query with synonyms and related terms for better understanding"""
        # Enhanced synonyms and expansions for large-scale legal knowledge base
        expansions = {
            # Basic legal terms
            'warga negara': 'warga negara citizen kewarganegaraan penduduk',
            'uu yang mengatur': 'undang-undang yang mengatur peraturan hukum ketentuan',
            'mengatur tentang': 'mengatur tentang mengatur mengenai mengatur terkait',
            'undang-undang': 'undang-undang uu peraturan hukum',
            'hukum': 'hukum undang-undang peraturan ketentuan',
            
            # Government and administration
            'pemerintah': 'pemerintah pemerintah pusat pemerintah daerah',
            'pemerintah daerah': 'pemerintah daerah pemda daerah otonom',
            'pejabat': 'pejabat pejabat negara pejabat publik',
            'pegawai negeri sipil': 'pegawai negeri sipil pns aparatur sipil negara asn',
            'berwenang': 'berwenang kewenangan wewenang hak tugas',
            
            # Legal procedures
            'penyidik': 'penyidik investigator penyelidik',
            'penyidik pejabat': 'penyidik pejabat penyidik pegawai negeri sipil',
            'sebagaimana dimaksud': 'sebagaimana dimaksud sesuai dengan menurut',
            'ayat': 'ayat pasal butir',
            'lingkungan': 'lingkungan wilayah daerah',
            'di lingkungan': 'di lingkungan dalam lingkungan pada lingkungan',
            
            # Rights and obligations
            'hak': 'hak hak asasi manusia hak warga negara',
            'kewajiban': 'kewajiban tanggung jawab kewajiban warga negara',
            'kewenangan': 'kewenangan wewenang kekuasaan',
            'tanggung jawab': 'tanggung jawab pertanggungjawaban',
            
            # Legal concepts
            'peraturan': 'peraturan ketentuan aturan',
            'ketentuan': 'ketentuan peraturan aturan',
            'sanksi': 'sanksi hukuman pidana',
            'pelanggaran': 'pelanggaran pelanggaran hukum',
            
            # Time and process
            'proses': 'proses prosedur tahapan',
            'tahapan': 'tahapan langkah proses',
            'jangka waktu': 'jangka waktu periode waktu',
            'batas waktu': 'batas waktu deadline tenggat'
        }
        
        expanded_query = query.lower()
        for term, synonyms in expansions.items():
            if term in expanded_query:
                expanded_query = expanded_query.replace(term, f"{term} {synonyms}")
        
        return expanded_query

    def _clean_response(self, text: str) -> str:
        """Clean up the AI response to make it more readable"""
        if not text:
            return text
        
        # Remove asterisks used for emphasis
        text = text.replace('*', '')
        
        # Remove common markdown formatting
        text = text.replace('**', '')
        text = text.replace('__', '')
        text = text.replace('##', '')
        text = text.replace('###', '')
        
        # Clean up excessive whitespace and newlines
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            line = line.strip()
            if line:  # Only add non-empty lines
                cleaned_lines.append(line)
        
        # Join lines with proper paragraph spacing
        result = '\n\n'.join(cleaned_lines)
        
        # Remove any remaining multiple spaces
        import re
        result = re.sub(r'\s+', ' ', result)
        result = re.sub(r'\n\s*\n', '\n\n', result)
        
        return result.strip()
    
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