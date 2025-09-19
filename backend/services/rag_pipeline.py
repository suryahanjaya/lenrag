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
        
        # Initialize ChromaDB
        self.chroma_client = chromadb.Client(Settings(
            persist_directory="./chroma_db",
            anonymized_telemetry=False
        ))
        
        # Text splitter configuration for chunking documents
        self.chunk_size = 800  # Reduced for better context matching
        self.chunk_overlap = 150  # Increased overlap for better continuity
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
        """Split text into chunks using simple text splitting logic"""
        if not text or not text.strip():
            return []
        
        chunks = []
        
        # First try to split by double newlines (paragraphs)
        paragraphs = text.split('\n\n')
        
        for paragraph in paragraphs:
            if len(paragraph) <= self.chunk_size:
                if paragraph.strip():
                    chunks.append(paragraph.strip())
            else:
                # Split long paragraphs by sentences or lines
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
        
        return chunks
    
    async def add_document(self, user_id: str, document_id: str, content: str, document_name: str = None, mime_type: str = None):
        """Add a document to the user's knowledge base"""
        try:
            if not content or not content.strip():
                logger.warning(f"Empty content for document {document_id}")
                return
            
            collection = self._get_user_collection(user_id)
            
            # Split document into chunks
            chunks = self._split_text(content)
            
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
                # Add to ChromaDB
                collection.add(
                    documents=chunk_texts,
                    metadatas=metadatas,
                    ids=chunk_ids
                )
                
                logger.info(f"Added {len(chunk_ids)} chunks for document {document_id}")
            
        except Exception as e:
            logger.error(f"Error adding document {document_id}: {e}")
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
                n_results=8  # Increased to get more context with expanded query
            )
            
            documents = results['documents'][0] if results['documents'] else []
            metadatas = results['metadatas'][0] if results['metadatas'] else []
            distances = results['distances'][0] if results['distances'] else []
            
            logger.info(f"Query results: {len(documents)} documents found")
            logger.info(f"Distances: {distances}")
            
            # More lenient similarity threshold for expanded queries
            if documents and distances and min(distances) < 0.8:
                # Create context from retrieved documents with document names and more context
                context_parts = []
                for i, (doc, meta) in enumerate(zip(documents, metadatas)):
                    doc_name = meta.get('document_name', f'Dokumen {i+1}')
                    # Include more context around the relevant text
                    context_parts.append(f"Dokumen: {doc_name}\nKonten: {doc}")
                context = "\n\n".join(context_parts)
                
                # Add instruction to be more flexible in understanding
                context += "\n\nPENTING: Jawab pertanyaan berdasarkan konteks di atas, bahkan jika ada variasi kata atau frasa dalam pertanyaan. Fokus pada makna dan inti pertanyaan, bukan pada kata-kata yang persis sama."
                
                # Generate answer using retrieved context
                prompt = f"""Anda adalah asisten yang membantu menjawab pertanyaan berdasarkan dokumen pengguna. WAJIB MENGGUNAKAN BAHASA INDONESIA SAJA.

Konteks dari dokumen pengguna:
{context}

Pertanyaan: {query}

Instruksi:
- Berikan jawaban yang jelas dan terstruktur berdasarkan konteks di atas
- Format respons dalam paragraf yang bersih tanpa menggunakan asterisk (*) atau bullet points
- Jika menemukan informasi yang relevan, jelaskan dengan jelas dan menyeluruh
- Jika konteks tidak mengandung informasi yang cukup, katakan dengan sopan
- Tulis dengan gaya percakapan yang mudah dibaca
- JANGAN gunakan format markdown atau karakter khusus
- WAJIB menggunakan bahasa Indonesia dalam seluruh respons
- JANGAN sebutkan "Dokumen 1, 2, 3" - sebutkan nama dokumen yang sebenarnya
- BERSIFAT FLEKSIBEL dalam memahami variasi pertanyaan - fokus pada makna, bukan kata-kata yang persis sama
- Jika pertanyaan memiliki variasi kata (seperti "Penyidik Pegawai Negeri Sipil" vs "Penyidik Pejabat Pegawai Negeri Sipil"), jawab berdasarkan konteks yang relevan
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
                
                # Filter documents based on similarity score (balanced threshold)
                relevant_threshold = 0.6  # Balanced threshold - include documents with similarity score < 0.6
                max_sources = 3  # Maximum number of sources to show
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
        # Common synonyms and expansions for legal/regulatory terms
        expansions = {
            'penyidik': 'penyidik investigator penyelidik',
            'pegawai negeri sipil': 'pegawai negeri sipil pns aparatur sipil negara asn',
            'pemerintah daerah': 'pemerintah daerah pemda daerah otonom',
            'berwenang': 'berwenang kewenangan wewenang hak',
            'pejabat': 'pejabat pejabat negara pejabat publik',
            'lingkungan': 'lingkungan wilayah daerah',
            'sebagaimana dimaksud': 'sebagaimana dimaksud sesuai dengan menurut',
            'ayat': 'ayat pasal butir',
            'berwenang': 'berwenang kewenangan wewenang hak tugas',
            'penyidik pejabat': 'penyidik pejabat penyidik pegawai negeri sipil',
            'di lingkungan': 'di lingkungan dalam lingkungan pada lingkungan'
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