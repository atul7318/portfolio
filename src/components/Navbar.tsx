"use client";

import { useState, useEffect, useCallback } from "react";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { label: "About", href: "#about", id: "about" },
  { label: "Experience", href: "#experience", id: "experience" },
  { label: "Projects", href: "#projects", id: "projects" },
  { label: "Stack", href: "#stack", id: "stack" },
  { label: "Certs", href: "#certifications", id: "certifications" },
  { label: "Contact", href: "#contact", id: "contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ── Active section tracking via IntersectionObserver ── */
  useEffect(() => {
    const sectionIds = navLinks.map((l) => l.id);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  /* ── Close mobile menu on link click ── */
  const handleNavClick = useCallback(() => {
    setMenuOpen(false);
  }, []);

  /* ── Lock body scroll when mobile menu is open ── */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <nav className={`nav-bar ${scrolled ? "scrolled" : ""}`}>
      <a href="#" className="nav-logo">AKT</a>

      {/* Hamburger button — visible only on mobile */}
      <button
        className={`hamburger ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Toggle navigation menu"
        aria-expanded={menuOpen}
      >
        <span /><span /><span />
      </button>

      {/* Backdrop */}
      {menuOpen && <div className="mobile-backdrop" onClick={() => setMenuOpen(false)} />}

      {/* Nav links — desktop inline, mobile slide-in */}
      <ul className={`nav-links ${menuOpen ? "mobile-open" : ""}`}>
        {navLinks.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className={activeSection === link.id ? "active" : ""}
              onClick={handleNavClick}
            >
              {link.label}
            </a>
          </li>
        ))}
        {/* Show CTA inside mobile menu too */}
        <li className="mobile-cta">
          <a href="mailto:atulkumartiwari758@gmail.com" className="nav-cta" onClick={handleNavClick}>Hire Me</a>
        </li>
      </ul>

      <div className="nav-actions">
        <ThemeToggle />
        <a href="mailto:atulkumartiwari758@gmail.com" className="nav-cta desktop-only">Hire Me</a>
      </div>
    </nav>
  );
}
