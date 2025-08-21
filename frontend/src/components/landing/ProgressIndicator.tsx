"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const ProgressIndicator = () => {
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!progressRef.current) return;

    const ctx = gsap.context(() => {
      gsap.set(progressRef.current, { scaleX: 0 });

      ScrollTrigger.create({
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          gsap.to(progressRef.current, {
            scaleX: self.progress,
            duration: 0.1,
            ease: "none"
          });
        }
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="progress fixed top-0 left-0 w-full z-50">
      <div
        ref={progressRef}
        className="progress-bar h-1 bg-gradient-to-r from-indigo-light to-indigo-dark"
      />
    </div>
  );
};

export default ProgressIndicator;