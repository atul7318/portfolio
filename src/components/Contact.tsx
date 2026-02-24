"use client";

import ScrollReveal from "./ScrollReveal";

export default function Contact() {
  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      <section id="contact" className="contact-section" style={{ padding: "8rem 4rem" }}>
        <div className="contact-bg" />
        <ScrollReveal>
          <div className="section-label" style={{ justifyContent: "center" }}>Let&apos;s Talk</div>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <h2 className="section-title" style={{ textAlign: "center" }}>
            HAVE AN<br />
            <span style={{ color: "var(--azure)" }}>IDEA?</span>
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <p
            style={{
              textAlign: "center",
              fontSize: "0.72rem",
              color: "rgba(240,240,240,0.35)",
              marginTop: "0.8rem",
              fontFamily: "var(--font-mono), 'Space Mono', monospace",
              letterSpacing: "0.06em",
            }}
          >
            Drop a message and let&apos;s build something intelligent together.
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.3}>
          <a href="mailto:atulkumartiwari758@gmail.com" className="contact-email">
            atulkumartiwari758@gmail.com
          </a>
        </ScrollReveal>
        <ScrollReveal delay={0.4}>
          <div className="contact-links">
            <a href="https://linkedin.com/in/atultiwari63" className="social-link" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
            <a href="https://github.com/atul7318" className="social-link" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
            <a href="tel:+916307567426" className="social-link">+91-6307567426</a>
            <a href="/atul-16-resume.pdf" className="social-link" target="_blank" rel="noopener noreferrer">Resume ↗</a>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
