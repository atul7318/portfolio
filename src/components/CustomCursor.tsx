"use client";

import { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number>(0);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Only show on devices with a fine pointer (mouse)
    const match = window.matchMedia("(pointer: fine)");
    setIsDesktop(match.matches);
    if (!match.matches) return;

    let mx = 0, my = 0, rx = 0, ry = 0;
    let moving = false;
    let stopTimer: ReturnType<typeof setTimeout>;

    const animate = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${mx - 6}px, ${my - 6}px, 0)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${rx - 20}px, ${ry - 20}px, 0)`;
      }

      if (moving) {
        rafId.current = requestAnimationFrame(animate);
      }
    };

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!moving) {
        moving = true;
        rafId.current = requestAnimationFrame(animate);
      }
      clearTimeout(stopTimer);
      stopTimer = setTimeout(() => {
        moving = false;
      }, 300); // Stop animating 300ms after last mouse move
    };

    window.addEventListener("mousemove", onMove, { passive: true });

    // Attach hover listeners once DOM settles
    const timeout = setTimeout(() => {
      const interactives = document.querySelectorAll(
        "a, button, .project-card, .stat-card, .tech-group, .social-link"
      );
      interactives.forEach((el) => {
        el.addEventListener("mouseenter", () => {
          cursorRef.current?.classList.add("cursor-hover");
          ringRef.current?.classList.add("ring-hover");
        });
        el.addEventListener("mouseleave", () => {
          cursorRef.current?.classList.remove("cursor-hover");
          ringRef.current?.classList.remove("ring-hover");
        });
      });
    }, 2500);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId.current);
      clearTimeout(timeout);
      clearTimeout(stopTimer);
    };
  }, []);

  if (!isDesktop) return null;

  return (
    <>
      <div
        ref={cursorRef}
        className="custom-cursor-dot"
      />
      <div
        ref={ringRef}
        className="custom-cursor-ring"
      />
    </>
  );
}
