"use client";

const items = [
  "LangChain RAG Pipelines",
  "Azure OpenAI Embeddings",
  "FAISS · ChromaDB",
  "FastAPI Microservices",
  "Azure AI Search",
  "Azure Document Intelligence",
  "Next.js · React.js",
  "Hybrid Search RAG",
  "Vector Search",
  "Conversational RAG",
];

export default function Ticker() {
  // Duplicate for seamless loop
  const doubled = [...items, ...items];

  return (
    <div className="ticker">
      <div className="ticker-inner">
        {doubled.map((item, i) => (
          <div className="ticker-item" key={i}>
            <span className="ticker-dot" />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
