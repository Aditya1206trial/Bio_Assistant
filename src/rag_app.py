# enhanced_rag_app.py
import os
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.schema import Document
from langchain_community.llms import Ollama
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain.text_splitter import RecursiveCharacterTextSplitter
import fitz  # PyMuPDF

def extract_text_pymupdf(pdf_path):
    """Extract all text from a PDF using PyMuPDF (fitz)."""
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page_num in range(doc.page_count):
            page = doc.load_page(page_num)
            text += page.get_text()
        doc.close()
        return text
    except Exception as e:
        print(f"❌ Failed to process {pdf_path}: {e}")
        return ""

class RAGApp:
    def add_pdfs(self, pdf_paths, chunk_size=1000, chunk_overlap=100):
        splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        docs = []
        for pdf_path in pdf_paths:
            full_text = extract_text_pymupdf(pdf_path)
            if not full_text.strip():
                print(f"⚠️  No extractable text in {pdf_path}")
                continue
            for chunk in splitter.split_text(full_text):
                docs.append(Document(page_content=chunk, metadata={"source": pdf_path}))
            print(f"✅ Loaded and chunked {pdf_path}")
        if docs:
            self.vectorstore.add_documents(docs)
            print(f"✅ Added {len(docs)} chunks from {len(pdf_paths)} PDFs to the vector store.")
        else:
            print("⚠️  No documents were added.")

    def __init__(self, persist_dir="./chroma_store", model_name="llama3.2:3b", embedding_model="nomic-embed-text"):
        self.persist_dir = persist_dir
        self.model_name = model_name
        self.embedding_model = embedding_model
        self.vectorstore = None
        self.qa_chain = None
        self._check_models()
        self._setup_components()
    
    def _check_models(self):
        """Check if required models are available"""
        import subprocess
        import json
        
        try:
            # Check available models
            result = subprocess.run(['ollama', 'list'], capture_output=True, text=True)
            available_models = result.stdout
            
            print(f"🔍 Checking for required models...")
            
            # Check LLM model
            if self.model_name not in available_models:
                print(f"❌ {self.model_name} not found. Installing...")
                print(f"📥 Running: ollama pull {self.model_name}")
                pull_result = subprocess.run(['ollama', 'pull', self.model_name], capture_output=True, text=True)
                if pull_result.returncode != 0:
                    print(f"❌ Failed to pull {self.model_name}")
                    print("🔄 Falling back to gemma:2b")
                    self.model_name = "gemma:2b"
                else:
                    print(f"✅ Successfully installed {self.model_name}")
            else:
                print(f"✅ {self.model_name} is available")
            
            # Check embedding model
            if self.embedding_model not in available_models:
                print(f"❌ {self.embedding_model} not found. Installing...")
                print(f"📥 Running: ollama pull {self.embedding_model}")
                pull_result = subprocess.run(['ollama', 'pull', self.embedding_model], capture_output=True, text=True)
                if pull_result.returncode != 0:
                    print(f"❌ Failed to pull {self.embedding_model}")
                    raise Exception(f"Could not install {self.embedding_model}")
                else:
                    print(f"✅ Successfully installed {self.embedding_model}")
            else:
                print(f"✅ {self.embedding_model} is available")
                
        except Exception as e:
            print(f"⚠️  Could not check models automatically: {e}")
            print("📝 Please ensure you have the following models:")
            print(f"   - ollama pull {self.model_name}")
            print(f"   - ollama pull {self.embedding_model}")
    
    def _setup_components(self):
        """Initialize embeddings, vector store, and QA chain"""
        try:
            # Setup embeddings using LangChain's Ollama wrapper
            print(f"🔧 Setting up embeddings with {self.embedding_model}...")
            self.embedder = OllamaEmbeddings(model=self.embedding_model)
            
            # Test embedding to make sure it works
            test_embed = self.embedder.embed_query("test")
            print(f"✅ Embeddings working (dimension: {len(test_embed)})")
            
            # Setup vector store
            print(f"🔧 Setting up vector store at {self.persist_dir}...")
            self.vectorstore = Chroma(
                collection_name="rag_docs",
                embedding_function=self.embedder,
                persist_directory=self.persist_dir
            )
            
            # Setup LLM
            print(f"🔧 Setting up LLM with {self.model_name}...")
            self.llm = Ollama(model=self.model_name)
            
            # Test LLM to make sure it works
            test_response = self.llm.invoke("Hello, respond with just 'OK'")
            print(f"✅ LLM working (test response: {test_response.strip()[:20]})")
            
            # Custom prompt template optimized for Llama
            if "llama" in self.model_name.lower():
                template = """<|begin_of_text|><|start_header_id|>system<|end_header_id|>
            You are a helpful assistant. Answer questions based on the provided context. Be direct, specific, and provide a comprehensive, in-depth explanation. Whenever possible, elaborate on the context and share additional relevant information, examples, or insights to help the user understand the topic better. 
            Format your answer using markdown: use bullet points, numbered lists, tables, and code blocks where appropriate.<|eot_id|>

            <|start_header_id|>user<|end_header_id|>
            Context:
            {context}

            Question: {question}<|eot_id|>

            <|start_header_id|>assistant<|end_header_id|>
            Based on the context provided:"""
            else:
                # Generic template for other models
                template = """You are a helpful assistant. Answer the question based on the context provided. Be direct, specific, and provide a comprehensive, in-depth explanation. Whenever possible, elaborate on the context and share additional relevant information, examples, or insights to help the user understand the topic better.
            Format your answer using markdown: use bullet points, numbered lists, tables, and code blocks where appropriate.

            Context:
            {context}

            Question: {question}

            Answer:"""

            prompt = PromptTemplate(
                template=template, 
                input_variables=["context", "question"]
            )

            # Setup QA chain with custom prompt
            print(f"🔧 Setting up QA chain...")
            self.qa_chain = RetrievalQA.from_chain_type(
                llm=self.llm,
                chain_type="stuff",
                retriever=self.vectorstore.as_retriever(
                    search_type="similarity",
                    search_kwargs={"k": 3}
                ),
                return_source_documents=True,
                chain_type_kwargs={"prompt": prompt}
            )
            print(f"✅ RAG system ready!")
            
        except Exception as e:
            print(f"❌ Error setting up components: {e}")
            raise

    def add_documents(self, documents):
        """Add documents to the vector store"""
        if isinstance(documents, list) and all(isinstance(doc, Document) for doc in documents):
            try:
                self.vectorstore.add_documents(documents)
                print(f"✅ Added {len(documents)} documents to vector store")
            except Exception as e:
                print(f"❌ Error adding documents: {e}")
        else:
            print("❌ Documents must be a list of Document objects")
    
    def add_text_documents(self, texts):
        """Helper method to add plain text documents"""
        docs = [Document(page_content=text) for text in texts]
        self.add_documents(docs)
    
    def query(self, question):
        """Ask a question and get response with sources"""
        try:
            # Debug: Show what's being retrieved
            retrieved_docs = self.vectorstore.similarity_search(question, k=3)
            print(f"\n🔍 Debug - Retrieved {len(retrieved_docs)} documents:")
            for i, doc in enumerate(retrieved_docs):
                print(f"  {i+1}. {doc.page_content[:100]}...")
            
            response = self.qa_chain.invoke({"query": question})
            return {
                "question": question,
                "answer": response["result"],
                "sources": [doc.page_content for doc in response["source_documents"]]
            }
        except Exception as e:
            return {
                "question": question,
                "answer": f"Error processing query: {e}",
                "sources": []
            }
    
    def simple_query(self, question):
        """Simple manual RAG without LangChain chains for debugging"""
        try:
            # Get similar documents
            docs = self.vectorstore.similarity_search(question, k=3)
            context = "\n\n".join([doc.page_content for doc in docs])
            
            # Create prompt manually
            prompt = f"""Based on the following context, answer this question: {question}

Context:
{context}

Answer:"""
            
            # Generate response
            response = self.llm.invoke(prompt)
            
            return {
                "question": question,
                "answer": response,
                "sources": [doc.page_content for doc in docs],
                "context_used": context
            }
        except Exception as e:
            return {
                "question": question,
                "answer": f"Error: {e}",
                "sources": []
            }

def main():
    print("🚀 Starting RAG System...")
    print("=" * 50)
    # List your PDF file paths here
    pdf_paths = [
         "C:/Users/link4/OneDrive/Desktop/RAGlocal/PDF/lebo1ps.pdf",
         "C:/Users/link4/OneDrive/Desktop/RAGlocal/PDF/lebo101.pdf",
         "C:/Users/link4/OneDrive/Desktop/RAGlocal/PDF/lebo102.pdf",
         "C:/Users/link4/OneDrive/Desktop/RAGlocal/PDF/lebo103.pdf",
         "C:/Users/link4/OneDrive/Desktop/RAGlocal/PDF/lebo104.pdf",
         "C:/Users/link4/OneDrive/Desktop/RAGlocal/PDF/lebo105.pdf",
         "C:/Users/link4/OneDrive/Desktop/RAGlocal/PDF/lebo106.pdf",
         "C:/Users/link4/OneDrive/Desktop/RAGlocal/PDF/lebo107.pdf",
         "C:/Users/link4/OneDrive/Desktop/RAGlocal/PDF/lebo108.pdf",
         "C:/Users/link4/OneDrive/Desktop/RAGlocal/PDF/lebo109.pdf",
         "C:/Users/link4/OneDrive/Desktop/RAGlocal/PDF/lebo110.pdf", 
         "C:/Users/link4/OneDrive/Desktop/RAGlocal/PDF/lebo111.pdf",
         "C:/Users/link4/OneDrive/Desktop/RAGlocal/PDF/lebo112.pdf",
        "C:/Users/link4/OneDrive/Desktop/RAGlocal/PDF/lebo113.pdf",
        # Add more as needed
    ]

 # Initialize RAG app (will auto-install models if needed)
    try:
        rag = RAGApp()
    except Exception as e:
        print(f"❌ Failed to initialize RAG system: {e}")
        return

    print("\n" + "=" * 50)

    # Check if vector store already has documents
    try:
        doc_count = rag.vectorstore._collection.count()
        if doc_count == 0:
            print("📝 Adding PDF documents...")
            rag.add_pdfs(pdf_paths)
        else:
            print(f"📚 Found {doc_count} existing documents")
    except Exception as e:
        print(f"⚠️  Could not check document count: {e}")

    print("\n👋 Hi, I'm your Biology Assistant. Ask me anything about your PDFs!")

    print("\n" + "=" * 50)

    while True:
        query = input("\n🔍 Your question: ").strip()

        if query.lower() in ['quit', 'exit', 'q']:
            print("👋 Goodbye!")
            break
        if query.lower() == 'add':
            pdfs_to_add = input("Enter PDF paths separated by commas: ").strip().split(',')
            pdfs_to_add = [p.strip() for p in pdfs_to_add if p.strip()]
            rag.add_pdfs(pdfs_to_add)
            print("✅ Added new PDFs!")
            continue   
        if not query:
            continue

        print("\n🔄 Processing...")
        result = rag.query(query)

        print(f"\n🧠 Answer: {result['answer']}")

        # Try simple query as backup if main query fails
        if "cannot answer" in result['answer'].lower() or "don't know" in result['answer'].lower():
            print("\n🔄 Trying simple RAG approach...")
            simple_result = rag.simple_query(query)
            print(f"🧠 Simple Answer: {simple_result['answer']}")
            result = simple_result

        print("-" * 50)

if __name__ == "__main__":
    main()   