"use client";

import ScrollReveal from "./ScrollReveal";
import { ExternalLink } from "lucide-react";

const certifications = [
  {
    name: "Microsoft Certified: Azure Fundamentals",
    org: "Microsoft",
    date: "Sep 2025",
    credUrl: "https://learn.microsoft.com/en-us/users/me/credentials/6FCA337D9CEC387E",
    badge: "AZ-900",
  },
  {
    name: "DW-200: Accelerate Agentic AI",
    org: "Koenig Solutions Pvt. Ltd.",
    date: "Jan 2026",
    credUrl: "https://www.linkedin.com/in/atultiwari63",
    badge: "DW-200",
  },
  {
    name: "Learning Docker",
    org: "LinkedIn",
    date: "Feb 2026",
    credUrl: "https://www.linkedin.com/in/atultiwari63",
    badge: "Docker",
  },
  {
    name: "React Certification",
    org: "Codprog",
    date: "Dec 2024",
    credUrl: "https://www.linkedin.com/in/atultiwari63",
    badge: "React",
  },
  {
    name: "Fullstack Developer in Python",
    org: "Itvedant Education Pvt. Ltd.",
    date: "Mar 2022",
    credUrl: "https://www.linkedin.com/in/atultiwari63",
    badge: "Python",
  },
];

export default function Certifications() {
  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      <section id="certifications" style={{ padding: "8rem 4rem" }}>
        <ScrollReveal>
          <div className="section-label">Credentials</div>
          <h2 className="section-title">
            CERTIFI<span style={{ color: "var(--electric)" }}>CATIONS</span>
          </h2>
        </ScrollReveal>

        <div className="certs-grid">
          {certifications.map((cert, i) => (
            <ScrollReveal key={cert.name} delay={i * 0.1}>
              <div className="cert-card">
                <div className="cert-top">
                  <div className="cert-badge">{cert.badge}</div>
                  <span className="cert-num">0{i + 1}</span>
                </div>
                <h3 className="cert-name">{cert.name}</h3>
                <div className="cert-meta">
                  <span className="cert-org">{cert.org}</span>
                  <span className="cert-dot">·</span>
                  <span className="cert-date">{cert.date}</span>
                </div>
                <div className="cert-footer">
                  <a
                    href={cert.credUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cert-link"
                  >
                    Verify Credential <ExternalLink size={11} />
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
