"use client";

import { useRef, useEffect, useState } from "react";
import { useInView } from "framer-motion";
import ScrollReveal from "./ScrollReveal";
import { Suspense, lazy } from "react";

const Scene3D = lazy(() => import("./Scene3D"));

function AnimatedCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let current = 0;
    const inc = target / 40;
    const timer = setInterval(() => {
      current += inc;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      setCount(Math.floor(current));
    }, 40);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return <div ref={ref} className="stat-num">{count}+</div>;
}

const stats = [
  { label: "Years Experience", value: 4 },
  { label: "Web Pages Built", value: 50 },
  { label: "Production RAG Systems", value: 3 },
  { label: "% Query Time Reduced", value: 60 },
];

export default function About() {
  const sphereRef = useRef<HTMLDivElement>(null);
  const sphereVisible = useInView(sphereRef, { once: false, margin: "200px" });

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      <section id="about" style={{ padding: "8rem 4rem" }}>
        <div className="about-grid">
          <div>
            <ScrollReveal>
              <div className="section-label">About Me</div>
              <h2 className="section-title">
                I BUILD<br />
                <span style={{ color: "var(--electric)" }}>SYSTEMS</span><br />
                THAT THINK
              </h2>
              <p className="about-text">
                AI-enabled Full-Stack Developer with <strong>4+ years of experience</strong> building scalable <strong>Python-based web and GenAI applications</strong> using React.js, Next.js, FastAPI, and Flask.
                <br /><br />
                Strong expertise in <strong>LangChain-based RAG systems</strong>, vector databases, and Azure AI services — with proven experience designing, deploying, and scaling enterprise-grade AI solutions on <strong>Azure App Services</strong>.
                <br /><br />
                Currently at <strong>Noventiq India</strong> (Feb 2025 – Present), architecting production RAG pipelines that handle real enterprise knowledge at scale.
              </p>
              <div className="stats-grid">
                {stats.map((stat) => (
                  <div key={stat.label} className="stat-card">
                    <AnimatedCounter target={stat.value} />
                    <div className="stat-label">{stat.label}</div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
          <ScrollReveal delay={0.2}>
            <div className="sphere-wrapper" ref={sphereRef}>
              <div style={{ width: "100%", height: 400 }}>
                {sphereVisible ? (
                  <Suspense fallback={<div style={{ width: "100%", height: 400, background: "var(--surface)" }} />}>
                    <Scene3D type="sphere" />
                  </Suspense>
                ) : (
                  <div style={{ width: "100%", height: 400, background: "var(--surface)" }} />
                )}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
