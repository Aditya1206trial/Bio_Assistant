# fastapi_server.py
import os
import sys
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(parent_dir)
from rag_app import RAGApp
from fastapi import FastAPI, HTTPException, UploadFile, File,Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import tempfile
import shutil
import uvicorn
from spellchecker import SpellChecker
import base64

#integrating Gemini live 2.0 flash for voice assistant
from google import genai
from fastapi import FastAPI, UploadFile, HTTPException
import soundfile as sf
import numpy as np
import librosa
import base64
import io
import asyncio
client = genai.Client(api_key="GEMINI_API_KEY")

# Import your existing RAG system
# Make sure enhanced_rag_app.py is in the same directory
#sys.path.append('C:/Users/link4/OneDrive/Desktop/RAGlocal')

# FastAPI app initialization
app = FastAPI(
    title="Biology RAG Assistant API",
    description="API for Biology Research Assistant with RAG capabilities",
    version="1.0.0"
)


# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
     allow_origins=[
        "http://localhost:3000",  # for Vite or React dev server
        "http://localhost:5173",  # for Vite
        "http://127.0.0.1:5173",
        "http://localhost:8000",  # if testing from Swagger UI
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global RAG instance
rag_app = None

# Pydantic models
class ChatMessage(BaseModel):
    message: str
    conversation_id: str

class ChatResponse(BaseModel):
    response: str
    sources: Optional[List[str]] = []

class SearchQuery(BaseModel):
    query: str
    filters: Dict[str, Any] = {}

class SearchResult(BaseModel):
    id: str
    title: str
    snippet: str
    source: str
    relevance: float
    url: Optional[str] = None

class SearchResponse(BaseModel):
    results: List[SearchResult]

class UploadResponse(BaseModel):
    status: str
    message: str
    filename: Optional[str] = None

# Initialize RAG system on startup
@app.on_event("startup")
async def startup_event():
    global rag_app
    try:
        print("🚀 Initializing RAG system...")
        rag_app = RAGApp()
        
        # Check if vector store has documents
        try:
            doc_count = rag_app.vectorstore._collection.count()
            if doc_count == 0:
                print("📝 No documents found. Upload PDFs via the API to get started.")
            else:
                print(f"📚 Found {doc_count} existing documents in vector store")
        except Exception as e:
            print(f"⚠️  Could not check document count: {e}")
        
        print("✅ RAG system ready!")
    except Exception as e:
        print(f"❌ Failed to initialize RAG system: {e}")
        raise e

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Biology RAG Assistant API is running"}

# Chat endpoint
@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(chat_message: ChatMessage):
    global rag_app
    
    if rag_app is None:
        raise HTTPException(status_code=500, detail="RAG system not initialized")
    
    try:
        print(f"🔍 Processing query: {chat_message.message}")
        
        # Use your RAG app's query method
        result = rag_app.query(chat_message.message)
        
        response = ChatResponse(
            response=result["answer"],
            sources=result.get("sources", [])[:3]  # Limit sources for frontend
        )
        
        print(f"✅ Query processed successfully")
        return response
        
    except Exception as e:
        print(f"❌ Error processing chat message: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}")

# Search endpoint
@app.post("/search", response_model=SearchResponse)
async def search_endpoint(search_query: SearchQuery):
    global rag_app
    
    if rag_app is None:
        raise HTTPException(status_code=500, detail="RAG system not initialized")
    
    try:
        print(f"🔍 Processing search: {search_query.query}")
        
        # Use vector store similarity search
        docs = rag_app.vectorstore.similarity_search_with_score(
            search_query.query, 
            k=10
        )
        
        results = []
        for i, (doc, score) in enumerate(docs):
            # Convert similarity score to relevance (higher is better)
            relevance = max(0, 1 - score) if score <= 1 else 1 / (1 + score)
            
            result = SearchResult(
                id=str(i),
                title=f"Document Excerpt {i+1}",
                snippet=doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                source=doc.metadata.get("source", "Unknown Source"),
                relevance=round(relevance, 2)
            )
            results.append(result)
        
        # Sort by relevance
        results.sort(key=lambda x: x.relevance, reverse=True)
        
        print(f"✅ Search processed successfully, found {len(results)} results")
        return SearchResponse(results=results)
        
    except Exception as e:
        print(f"❌ Error processing search: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing search: {str(e)}")

# Upload endpoint
@app.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    global rag_app

    if rag_app is None:
        raise HTTPException(status_code=500, detail="RAG system not initialized")

    # Check file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        print(f"📤 Processing upload: {file.filename}")

        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name

        try:
            # --- KEY CHANGE: Load and split PDF, add original filename to metadata ---
            from langchain_community.document_loaders import PyPDFLoader
            from langchain.text_splitter import RecursiveCharacterTextSplitter

            loader = PyPDFLoader(temp_path)
            documents = loader.load()
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200
            )
            chunks = text_splitter.split_documents(documents)

            # Add original filename to metadata for each chunk
            for chunk in chunks:
                chunk.metadata["source"] = temp_path  # (keep temp path if you want)
                chunk.metadata["original_filename"] = file.filename  # <-- THIS IS THE KEY LINE

            # Add to vector store
            rag_app.vectorstore.add_documents(chunks)

            response = UploadResponse(
                status="success",
                message=f"Successfully processed and added {file.filename} to the knowledge base",
                filename=file.filename
            )

            print(f"✅ Upload processed successfully: {file.filename}")
            return response

        finally:
            # Clean up temporary file
            os.unlink(temp_path)

    except Exception as e:
        print(f"❌ Error processing upload: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
    
# Get vector store stats
@app.get("/stats")
async def get_stats():
    global rag_app
    
    if rag_app is None:
        raise HTTPException(status_code=500, detail="RAG system not initialized")
    
    try:
        doc_count = rag_app.vectorstore._collection.count()
        return {
            "document_count": doc_count,
            "model_name": rag_app.model_name,
            "embedding_model": rag_app.embedding_model,
            "status": "ready"
        }
    except Exception as e:
        return {
            "document_count": "unknown",
            "model_name": rag_app.model_name if rag_app else "unknown",
            "embedding_model": rag_app.embedding_model if rag_app else "unknown",
            "status": "error",
            "error": str(e)
        }
#Get all files stored in vector DB
@app.get("/api/files")
async def list_uploaded_files():
    global rag_app

    if rag_app is None:
        raise HTTPException(status_code=500, detail="RAG system not initialized")

    try:
        documents = rag_app.vectorstore._collection.get(include=["metadatas"])
        unique_files = {}
        for meta in documents["metadatas"]:
            # Use original_filename if present, else fallback to source basename
            name = meta.get("original_filename") or os.path.basename(meta.get("source", ""))
            path = meta.get("source", "")
            if name:
                unique_files[name] = path
        file_list = [{"name": name, "path": path} for name, path in unique_files.items()]
        return {"files": file_list}
    except Exception as e:
        print(f"❌ Error listing files: {e}")
        raise HTTPException(status_code=500, detail=str(e))

#voice query
@app.post("/api/voice-query")
async def voice_query(audio: UploadFile):
    print("Voice query processing")
    try:
        # 1. Validate and convert audio to required format
        audio_bytes = await audio.read()
        y, sr = librosa.load(io.BytesIO(audio_bytes), sr=16000, mono=True)
        y = y.reshape(-1, 1) 
        buffer = io.BytesIO()
        sf.write(buffer, y, sr, format='WAV', subtype='PCM_16')
        buffer.seek(0)
        pcm_audio = buffer.getvalue()

        # 2. Configure Live API session
        config = {
            "input_modalities": ["AUDIO"],
            "response_modalities": ["TEXT", "AUDIO"],
            "enable_fallback": True,
            "system_instruction": "You are a biology research assistant."
        }

        # 3. Create Live API session
        async with genai.aio.live.connect(
            model="gemini-2.0-flash-live-001",
            config=config
        ) as session:
            
            # 4. Send audio input
            await session.send_realtime_input(
                audio=genai.types.Blob(
                    data=pcm_audio,
                    mime_type="audio/pcm;rate=16000"
                )
            )

            # 5. Process responses
            response_audio = bytearray()
            question = ""
            answer = ""
            
            async for response in session.receive():
                # Transcription logic
                if response.server_content and response.server_content.text:
                    question = response.server_content.text
                
                # Answer extraction
                if response.server_content and response.server_content.model_turn:
                    answer = response.server_content.model_turn.text
                
                # Audio collection
                if response.data:
                    response_audio.extend(response.data)

            # 6. Return formatted response
            return {
                "question": question,
                "answer": answer,
                "audio": base64.b64encode(bytes(response_audio)).decode("utf-8")
            }

    except Exception as e:
        print(f"🔴 Error: {str(e)}")
        raise HTTPException(500, f"Voice processing failed: {str(e)}")
    
if __name__ == "__main__":
    print("🚀 Starting Biology RAG Assistant API Server...")
    print("📝 Make sure you have:")
    print("   - Ollama running with required models")
    print("   - enhanced_rag_app.py in the same directory")
    print("   - Required dependencies installed")
    print("🌐 Server will be available at http://localhost:8000")
    print("📚 API docs will be available at http://localhost:8000/docs")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        reload=True,
        log_level="info"
    )