from typing import List, Dict, Optional
import uuid
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.models.domain import TranslationResult

# In a real app we'd use OpenAI directly. For safety in demo, we'll mock or optionally use openai if OPENAI_API_KEY is present
import os
try:
    import openai
    from openai import AsyncOpenAI
except ImportError:
    pass

class AssistantService:
    def __init__(self):
        self.chunk_size = 500 # chars
        
    def chunk_text(self, text: str) -> List[str]:
        """Simple character-based chunking with slight overlap."""
        chunks = []
        if not text:
            return chunks
        i = 0
        while i < len(text):
            chunks.append(text[i:i+self.chunk_size])
            i += (self.chunk_size - 50) # overlap
        return chunks
        
    def retrieve_relevant_chunks(self, query: str, chunks: List[str], top_k: int = 3) -> List[str]:
        """Use TF-IDF to retrieve most relevant text chunks."""
        if not chunks:
            return []
        if len(chunks) <= top_k:
            return chunks
            
        vectorizer = TfidfVectorizer()
        docs = [query] + chunks
        try:
            tfidf_matrix = vectorizer.fit_transform(docs)
            cosine_similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
            related_docs_indices = cosine_similarities.argsort()[:-top_k-1:-1]
            return [chunks[i] for i in related_docs_indices]
        except Exception:
            return chunks[:top_k]
            
    async def generate_response(self, query: str, context_chunks: List[str], chat_history: List[Dict[str, str]]) -> str:
        """Call AI model using context. Mocks if API key is not present."""
        api_key = os.getenv("OPENAI_API_KEY")
        
        context_text = "\n\n---\n\n".join(context_chunks)
        system_prompt = (
            "You are Lingora AI, a helpful translation and document analysis assistant. "
            "Use the following provided context from the user's document to answer their question. "
            "If the answer isn't in the context, do your best to help, but mention you can't find it in the file.\n\n"
            f"CONTEXT:\n{context_text}"
        )
        
        if not api_key:
            # Return a mocked intelligent response for the demo
            first_chunk = context_chunks[0] if context_chunks else "No document content available."
            last_chunk = context_chunks[-1] if context_chunks else "No document content available."
            if not context_chunks:
                return "I don't have any document content to reference yet. Please wait for the translation to complete, then try again."
            if "summarize" in query.lower():
                return f"Based on the document context, here is a summary:\n\n1. {first_chunk[:100]}...\n2. {last_chunk[:100]}...\n\n(This is a simulated AI summary)."
            elif "action items" in query.lower():
                return "1. Review the translated document.\n2. Approve formatting changes.\n(Simulated action items)."
            else:
                return f"I analyzed the document chunks. Regarding '{query}', I found this information: {first_chunk[:200]}... (Simulated AI response. Add OPENAI_API_KEY to .env for real responses)."
                
        client = AsyncOpenAI(api_key=api_key)
        
        messages = [{"role": "system", "content": system_prompt}]
        for msg in chat_history:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": query})
        
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=500
        )
        return response.choices[0].message.content
