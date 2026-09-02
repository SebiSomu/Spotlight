# Spotlight AI Chatbot Service

FastAPI-based RAG service providing AI concert assistance and recommendations using Groq LLaMA 3.3 and pgvector embeddings.

## Setup & Running

1. **Environment Setup**
   ```bash
   cd backend/ai-chatbot
   python -m venv venv
   # On Windows PowerShell:
   .\venv\Scripts\Activate.ps1
   # On Linux/macOS:
   # source venv/bin/activate
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment Configuration**
   Ensure `.env` contains your `GROQ_API_KEY` and database connection URL.

4. **Start Service**
   ```bash
   python main.py
   # or
   uvicorn main:app --reload --port 8000
   ```

The API will be available at `http://localhost:8000` with interactive docs at `http://localhost:8000/docs`.
