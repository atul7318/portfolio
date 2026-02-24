"use client";

import ScrollReveal from "./ScrollReveal";

const experiences = [
  {
    period: "Feb 2025\nPresent",
    company: "Noventiq India",
    role: "Software Developer (AI)",
    desc: "Designed and implemented LangChain-based RAG pipelines using Azure OpenAI embeddings with FAISS and ChromaDB for semantic document retrieval. Integrated Azure Document Intelligence to extract structured data from PDFs. Developed and deployed FastAPI microservices on Azure App Services and built Azure AI Search with Vector Search for enterprise-grade intelligent search systems.",
    tags: ["LangChain", "Azure OpenAI", "FAISS", "ChromaDB", "FastAPI", "Azure AI Search", "Doc Intelligence", "Next.js"],
  },
  {
    period: "Jan 2023\nFeb 2025",
    company: "Crimson Interactive",
    role: "Web Developer",
    desc: "Developed 50+ responsive web pages using HTML, CSS, JavaScript, React.js, Next.js, and Flask — improving user engagement by 20%. Implemented Flask backend enhancements (+25% performance), optimised core web vitals (+30% page speed), and integrated Azure Blob Storage and Azure SQL / Cosmos DB for scalable web delivery.",
    tags: ["React.js", "Next.js", "Flask", "Azure App Services", "Azure Blob Storage", "Cosmos DB"],
  },
  {
    period: "Mar 2022\nAug 2022",
    company: "Blue Meteor Pvt Ltd.",
    role: "Frontend Developer",
    desc: "Developed user interfaces with HTML5, CSS3, SCSS, JavaScript, and jQuery — achieving a 15% lift in user satisfaction. Implemented page optimisation techniques (−20% load time) and ensured cross-browser compatibility (−10% user-reported issues) while collaborating in a team of 5.",
    tags: ["HTML5", "CSS3 / SCSS", "JavaScript", "jQuery"],
  },
  {
    period: "Jun 2020\nMar 2022",
    company: "Realty Quarter Pvt Ltd.",
    role: "Web UI Developer",
    desc: "Implemented responsive layouts across devices (+30% mobile engagement), utilised SASS/LESS preprocessors (−20% code redundancy), and maintained front-end components ensuring 99% uptime for client websites.",
    tags: ["HTML / CSS", "SASS / LESS", "JavaScript", "Responsive Design"],
  },
];

export default function Experience() {
  return (
    <div style={{ background: "var(--surface)", borderTop: "1px solid var(--border-c)", borderBottom: "1px solid var(--border-c)" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <section id="experience" style={{ padding: "8rem 4rem" }}>
          <ScrollReveal>
            <div className="section-label">Work Experience</div>
            <h2 className="section-title" style={{ marginBottom: 0 }}>
              THE<br />
              <span style={{ color: "var(--neon)" }}>JOURNEY</span>
            </h2>
          </ScrollReveal>

          <div className="timeline">
            {experiences.map((exp, i) => (
              <ScrollReveal key={exp.company} delay={i * 0.1}>
                <div className="timeline-item">
                  <div className="timeline-date" style={{ whiteSpace: "pre-line" }}>{exp.period}</div>
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div className="timeline-company">{exp.company}</div>
                    <div className="timeline-role">{exp.role}</div>
                    <p className="timeline-desc">{exp.desc}</p>
                    <div className="timeline-tags">
                      {exp.tags.map((tag) => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
