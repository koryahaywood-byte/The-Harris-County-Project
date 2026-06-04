"use client";
import { useEffect, useRef, ReactNode } from "react";

export default function ScrollReveal({
  children,
  className = "",
  stagger = false,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const targets = stagger ? Array.from(el.children) : [el];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.animationDelay = `${delay}ms`;
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    targets.forEach((t) => {
      t.classList.add("animate-in");
      observer.observe(t);
    });

    return () => observer.disconnect();
  }, [stagger, delay]);

  return (
    <div ref={ref} className={`${stagger ? "stagger" : ""} ${className}`}>
      {children}
    </div>
  );
}
