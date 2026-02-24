"use client";

import ScrollReveal from "./ScrollReveal";

const projects = [
  {
    num: "01",
    badge: "RAG System",
    title: "Intelligent Document Search System",
    desc: "LangChain-based RAG pipeline for contextual Q&A over enterprise documents. Implemented document ingestion, chunking, and vector indexing using Azure OpenAI embeddings with FAISS and ChromaDB. Integrated Azure Document Intelligence for PDF extraction and Azure AI Search for vector-based retrieval.",
    stack: ["LangChain", "Azure OpenAI", "FAISS", "ChromaDB", "FastAPI", "Next.js", "Doc Intelligence", "Azure AI Search"],
    github: "https://github.com/atultiwari63",
    demo: "https://github.com/atultiwari63",
  },
  {
    num: "02",
    badge: "Hybrid RAG",
    title: "Enterprise Knowledge Base Chatbot",
    desc: "Multi-document RAG chatbot for internal enterprise knowledge (HR policies, SOPs, technical docs). Implemented hybrid search (keyword + vector) using Azure AI Search with metadata-based filtering for department-specific retrieval. Reduced internal query resolution time by ~60%.",
    stack: ["LangChain", "Azure AI Search", "Azure OpenAI", "FAISS", "FastAPI", "React.js", "Hybrid Search"],
    github: "https://github.com/atultiwari63",
    demo: "https://github.com/atultiwari63",
  },
  {
    num: "03",
    badge: "Conversational AI",
    title: "Conversational RAG with Chat History",
    desc: "Conversation-aware RAG using LangChain Memory with follow-up question handling via query rewriting. Stored and reused chat history to improve multi-turn answer accuracy. Integrated Azure OpenAI streaming responses, improving response relevance by ~40% for conversational queries.",
    stack: ["LangChain", "LangChain Memory", "Azure OpenAI", "Query Rewriting", "FastAPI", "Streaming"],
    github: "https://github.com/atultiwari63",
    demo: "https://github.com/atultiwari63",
  },
];

export default function Projects() {
  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      <section id="projects" style={{ padding: "8rem 4rem" }}>
        <ScrollReveal>
          <div className="section-label">AI / GenAI Projects</div>
          <h2 className="section-title">
            PROJECTS<br />
            <span style={{ color: "var(--azure)" }}>THAT SHIP</span>
          </h2>
        </ScrollReveal>

        <div className="projects-grid">
          {projects.map((project, i) => (
            <ScrollReveal key={project.num} delay={i * 0.1}>
              <div className="project-card">
                <div className="project-num">{project.num}</div>
                <div className="project-badge">{project.badge}</div>
                <h3 className="project-title">{project.title}</h3>
                <p className="project-desc">{project.desc}</p>
                <div className="project-stack">
                  {project.stack.map((tech) => (
                    <span key={tech} className="stack-tag">{tech}</span>
                  ))}
                </div>
                <div className="project-links">
                  <a href={project.github} className="project-link">
                    GitHub <span className="arrow">→</span>
                  </a>
                  <a href={project.demo} className="project-link">
                    Live Demo <span className="arrow">→</span>
                  </a>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>
    </div>
  );
}
