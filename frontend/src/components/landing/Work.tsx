"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import Image from "next/image";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const WORK_CONTENTS = [
  {
    title: "RH Analytics Pro",
    description: "Plateforme révolutionnaire d'analyse RH avec IA intégrée pour optimiser les processus de recrutement et la gestion des talents.",
    content: (
      <div className="h-full w-full flex items-center justify-center text-white px-4 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-lg">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-indigo-light to-indigo-dark rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-white font-bold text-3xl">RH</span>
          </div>
          <p className="text-lg font-medium">Intelligence Artificielle</p>
          <p className="text-sm text-gray-300">pour le Recrutement</p>
        </div>
      </div>
    ),
    image: "/api/placeholder/600/400", // Placeholder pour capture dashboard
  },
  {
    title: "Dashboard Analytics",
    description: "Interface intuitive avec métriques en temps réel, visualisations interactives et rapports détaillés pour une prise de décision éclairée.",
    content: (
      <div className="h-full w-full flex items-center justify-center text-white px-4">
        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="bg-gradient-to-br from-blue-500/30 to-blue-600/30 p-4 rounded-lg">
            <div className="text-2xl font-bold">1,247</div>
            <div className="text-sm text-gray-300">CV Analysés</div>
          </div>
          <div className="bg-gradient-to-br from-green-500/30 to-green-600/30 p-4 rounded-lg">
            <div className="text-2xl font-bold">98.5%</div>
            <div className="text-sm text-gray-300">Précision</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/30 to-purple-600/30 p-4 rounded-lg">
            <div className="text-2xl font-bold">45h</div>
            <div className="text-sm text-gray-300">Économisées</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500/30 to-orange-600/30 p-4 rounded-lg">
            <div className="text-2xl font-bold">127</div>
            <div className="text-sm text-gray-300">Projets</div>
          </div>
        </div>
      </div>
    ),
    image: "/api/placeholder/600/400", // Placeholder pour capture analytics
  },
  {
    title: "Analyse IA Avancée",
    description: "Moteur d'IA sophistiqué capable d'analyser et d'évaluer automatiquement les profils candidats avec une précision inégalée.",
    content: (
      <div className="h-full w-full flex items-center justify-center text-white px-4">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-32 h-32 bg-gradient-to-r from-indigo-light to-indigo-dark rounded-full mx-auto flex items-center justify-center mb-4 animate-pulse">
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center">
                <span className="text-2xl">🧠</span>
              </div>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <p className="font-medium">IA en cours d'analyse...</p>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-indigo-light to-indigo-dark h-2 rounded-full w-3/4 animate-pulse"></div>
          </div>
        </div>
      </div>
    ),
    image: "/api/placeholder/600/400", // Placeholder pour capture IA
  }
];

const Work = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".work-title", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power2.out"
      });

      gsap.from(".work-item", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
        },
        y: 100,
        opacity: 0,
        duration: 0.8,
        stagger: 0.3,
        ease: "power2.out"
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="work"
      className="w-full py-24 bg-gradient-to-b from-black to-gray-dark-4 relative overflow-hidden"
    >
      {/* Decorative curves */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <svg className="absolute top-32 left-0 w-64 h-64 opacity-5" viewBox="0 0 100 100">
          <ellipse cx="30" cy="50" rx="25" ry="40" fill="#8b31ff" transform="rotate(-20)" />
        </svg>
        <svg className="absolute bottom-32 right-0 w-80 h-80 opacity-8" viewBox="0 0 100 100">
          <path d="M20,80 Q50,20 80,80 T120,80" stroke="#6366f1" strokeWidth="0.5" fill="none" opacity="0.3" />
        </svg>
      </div>
      <div className="2xl:container mx-auto xl:px-20 md:px-12 px-4">
        <div className="text-center mb-16">
          <h2 className="work-title text-5xl md:text-6xl font-bold text-white mb-6">
            Notre <span className="text-gradient">Plateforme</span>
          </h2>
          <p className="work-title text-xl text-gray-300 max-w-3xl mx-auto">
            Découvrez les fonctionnalités qui font de RH Analytics Pro la solution de référence
          </p>
        </div>

        <div className="space-y-24">
          {WORK_CONTENTS.map((work, index) => (
            <div
              key={index}
              className={`work-item flex flex-col ${
                index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
              } items-center gap-12`}
            >
              {/* Content */}
              <div className="flex-1 space-y-6">
                <h3 className="text-3xl md:text-4xl font-bold text-white">
                  {work.title}
                </h3>
                <p className="text-lg text-gray-300 leading-relaxed">
                  {work.description}
                </p>
                
                {/* Interactive content */}
                <div className="bg-gradient-to-br from-gray-dark-2 to-gray-dark-3 rounded-2xl p-8 border border-gray-dark-1 h-64">
                  {work.content}
                </div>
              </div>

              {/* Image placeholder */}
              <div className="flex-1">
                <div className="relative group">
                  <div className="bg-gradient-to-br from-gray-dark-2 to-gray-dark-3 rounded-2xl p-4 border border-gray-dark-1 hover:border-indigo-light/50 transition-all duration-300">
                    {/* Placeholder for screenshot */}
                    <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-xl aspect-video flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-light/10 to-indigo-dark/10"></div>
                      <div className="relative z-10 text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-indigo-light to-indigo-dark rounded-xl mx-auto mb-4 flex items-center justify-center">
                          <span className="text-white font-bold text-xl">📸</span>
                        </div>
                        <p className="text-white font-medium">Capture d'écran</p>
                        <p className="text-gray-300 text-sm">Interface {work.title}</p>
                      </div>
                      
                      {/* Floating elements */}
                      <div className="absolute top-4 left-4 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <div className="absolute top-4 left-10 w-3 h-3 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                      <div className="absolute top-4 left-16 w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                    </div>
                  </div>
                  
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-light/20 to-indigo-dark/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Work;