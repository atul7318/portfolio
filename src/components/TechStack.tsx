"use client";

import ScrollReveal from "./ScrollReveal";

const techGroups = [
  {
    icon: "⚡",
    title: "Frontend",
    items: ["React.js", "Next.js (App Router)", "TypeScript", "Tailwind CSS", "Bootstrap / SASS", "jQuery"],
  },
  {
    icon: "🔧",
    title: "Backend & APIs",
    items: ["FastAPI", "Flask", "Express.js", "REST APIs", "MySQL · MongoDB", "Azure Cosmos DB"],
  },
  {
    icon: "🧠",
    title: "AI / GenAI",
    items: ["LangChain", "RAG Pipelines (Naive · Hybrid · Conv.)", "Azure OpenAI · Embeddings", "FAISS · ChromaDB", "Prompt Engineering", "Vector & Semantic Search"],
  },
  {
    icon: "☁️",
    title: "Cloud · DevOps",
    items: ["Azure App Services", "Azure AI Search", "Azure Document Intelligence", "Azure Model Foundry", "Azure Blob Storage", "Git · GitHub · Jenkins · Docker"],
  },
];

export default function TechStack() {
  return (
    <div style={{ background: "var(--surface)", borderTop: "1px solid var(--border-c)", borderBottom: "1px solid var(--border-c)" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <section id="stack" style={{ padding: "8rem 4rem" }}>
          <ScrollReveal>
            <div className="section-label">Technology</div>
            <h2 className="section-title">
              THE<br />
              <span style={{ color: "var(--electric)" }}>ARSENAL</span>
            </h2>
          </ScrollReveal>

          <div className="tech-grid">
            {techGroups.map((group, i) => (
              <ScrollReveal key={group.title} delay={i * 0.08}>
                <div className="tech-group">
                  <div className="tech-group-icon">{group.icon}</div>
                  <div className="tech-group-title">{group.title}</div>
                  <ul className="tech-list">
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
