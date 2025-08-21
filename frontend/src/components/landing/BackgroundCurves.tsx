"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const BackgroundCurves = () => {
  const curvesRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!curvesRef.current) return;

    const ctx = gsap.context(() => {
      // Animation des courbes - rotation lente
      gsap.to(".curve-1", {
        rotation: 360,
        duration: 60,
        repeat: -1,
        ease: "none",
        transformOrigin: "center"
      });

      gsap.to(".curve-2", {
        rotation: -360,
        duration: 80,
        repeat: -1,
        ease: "none",
        transformOrigin: "center"
      });

      gsap.to(".curve-3", {
        rotation: 360,
        duration: 100,
        repeat: -1,
        ease: "none",
        transformOrigin: "center"
      });

      // Animation d'opacité
      gsap.to(".curve-1", {
        opacity: 0.3,
        duration: 4,
        yoyo: true,
        repeat: -1,
        ease: "power2.inOut"
      });

      gsap.to(".curve-2", {
        opacity: 0.2,
        duration: 6,
        yoyo: true,
        repeat: -1,
        ease: "power2.inOut",
        delay: 1
      });

      gsap.to(".curve-3", {
        opacity: 0.25,
        duration: 5,
        yoyo: true,
        repeat: -1,
        ease: "power2.inOut",
        delay: 2
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      <svg
        ref={curvesRef}
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="purpleGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b31ff" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#6366f1" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#4338ca" stopOpacity="0.05" />
          </linearGradient>
          
          <linearGradient id="purpleGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.12" />
            <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#5b21b6" stopOpacity="0.04" />
          </linearGradient>
          
          <linearGradient id="purpleGradient3" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#9333ea" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#6b21a8" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* Courbe 1 - Grande courbe en haut à droite */}
        <path
          className="curve-1"
          d="M1200,0 C1400,100 1500,300 1400,500 C1300,700 1100,600 900,500 C700,400 800,200 1000,100 C1100,50 1150,0 1200,0 Z"
          fill="url(#purpleGradient1)"
          opacity="0.2"
        />

        {/* Courbe 2 - Courbe moyenne au centre gauche */}
        <path
          className="curve-2"
          d="M0,300 C200,250 400,400 300,600 C200,800 50,700 0,600 C-50,500 0,400 100,350 C150,325 0,300 0,300 Z"
          fill="url(#purpleGradient2)"
          opacity="0.15"
        />

        {/* Courbe 3 - Petite courbe en bas à droite */}
        <path
          className="curve-3"
          d="M1400,800 C1600,750 1700,900 1650,1000 C1600,1100 1450,1080 1350,1000 C1250,920 1300,850 1400,800 Z"
          fill="url(#purpleGradient3)"
          opacity="0.18"
        />

        {/* Courbe 4 - Très grande courbe de fond */}
        <ellipse
          className="curve-1"
          cx="960"
          cy="540"
          rx="800"
          ry="400"
          fill="url(#purpleGradient1)"
          opacity="0.05"
          transform="rotate(25)"
        />

        {/* Courbe 5 - Petite courbe flottante */}
        <circle
          className="curve-2"
          cx="300"
          cy="800"
          r="150"
          fill="url(#purpleGradient2)"
          opacity="0.08"
        />

        {/* Courbe 6 - Courbe organique en haut à gauche */}
        <path
          className="curve-3"
          d="M0,0 C300,50 400,200 250,350 C100,500 0,400 0,250 Z"
          fill="url(#purpleGradient3)"
          opacity="0.12"
        />

        {/* Courbes supplémentaires pour plus de richesse */}
        <path
          className="curve-1"
          d="M1800,400 C1900,450 1920,600 1850,750 C1780,900 1650,850 1600,700 C1550,550 1650,450 1750,400 C1775,390 1800,400 1800,400 Z"
          fill="url(#purpleGradient1)"
          opacity="0.1"
        />

        <ellipse
          className="curve-2"
          cx="1500"
          cy="200"
          rx="200"
          ry="100"
          fill="url(#purpleGradient2)"
          opacity="0.07"
          transform="rotate(-30)"
        />

        <path
          className="curve-3"
          d="M600,1080 C800,1000 900,1050 850,1080 C700,1080 600,1080 600,1080 Z"
          fill="url(#purpleGradient3)"
          opacity="0.09"
        />
      </svg>
      
      {/* Particules flottantes */}
      <div className="absolute inset-0">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 opacity-20 animate-pulse`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default BackgroundCurves;