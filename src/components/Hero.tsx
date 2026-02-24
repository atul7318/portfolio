"use client";

import { Suspense, lazy } from "react";
import { motion } from "framer-motion";

const Scene3D = lazy(() => import("./Scene3D"));

export default function Hero() {
  return (
    <section className="hero-section" id="hero">
      {/* 3D Canvas Background */}
      <div className="hero-canvas-wrapper">
        <Suspense fallback={<div style={{ width: "100%", height: "100%", background: "#050508" }} />}>
          <Scene3D type="hero" />
        </Suspense>
      </div>

      <div className="hero-content">
        <motion.div
          className="hero-label"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <span className="hero-label-line" />
          Available · +91-6307567426
        </motion.div>

        <motion.h1
          className="hero-name"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          ATUL<br />
          <span className="line2">KUMAR</span><br />
          TIWARI
        </motion.h1>

        <motion.div
          className="hero-sub"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <p className="hero-title-text">AI-Enabled Full-Stack Developer</p>
          <p className="hero-desc">
            Building Scalable GenAI &amp; RAG Systems on Azure. LangChain · FastAPI · Azure OpenAI · Next.js
          </p>
        </motion.div>

        <motion.div
          className="hero-cta"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          <a href="#projects" className="btn-primary">
            <span>View Projects</span>
          </a>
          <a href="#contact" className="btn-outline">
            Contact Me
          </a>
        </motion.div>
      </div>

      <motion.div
        className="hero-scroll"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        <div className="scroll-line" />
        <span className="scroll-text">Scroll</span>
      </motion.div>
    </section>
  );
}
