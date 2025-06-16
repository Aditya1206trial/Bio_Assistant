#!/usr/bin/env python3
"""
Startup script for the Biology RAG Assistant API
"""
import os
import sys
import subprocess
import time

def check_ollama():
    """Check if Ollama is running"""
    try:
        result = subprocess.run(['ollama', 'list'], capture_output=True, text=True, timeout=5)
        return result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False

def main():
    print("🚀 Biology RAG Assistant - Server Startup")
    print("=" * 50)
    
    # Check if Ollama is running
    print("🔍 Checking Ollama service...")
    if not check_ollama():
        print("❌ Ollama is not running or not found")
        print("📝 Please start Ollama first:")
        print("   - Download from: https://ollama.ai")
        print("   - Run: ollama serve")
        print("   - Then run this script again")
        return False
    else:
        print("✅ Ollama is running")
    
    # Check if rag_app.py exists
    # Check if rag_app.py exists in the parent directory
    rag_file = os.path.join(os.path.dirname(__file__), '..', 'rag_app.py')
    if not os.path.exists(rag_file):
        print(f"❌ {rag_file} not found in src/ directory")
        print(f"📝 Please copy your rag_app.py to the src/ directory")
        return False
    else:
        print(f"✅ Found rag_app.py in src/")

    
    # Start the FastAPI server
    print("\n🌐 Starting FastAPI server...")
    print("📚 API documentation will be available at: http://localhost:8000/docs")
    print("🔧 Server logs:")
    print("-" * 30)
    
    try:
        # Import and run the server
        import uvicorn
        
        uvicorn.run(
        "fastapi_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
    except Exception as e:
        print(f"\n❌ Error starting server: {e}")
        return False

if __name__ == "__main__":
    main()