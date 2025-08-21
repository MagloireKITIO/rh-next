"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const STATS_DATA = [
  {
    number: 10000,
    suffix: "+",
    label: "CV Analysés",
    description: "Documents traités avec précision"
  },
  {
    number: 98,
    suffix: "%",
    label: "Précision IA",
    description: "Taux de précision de nos algorithmes"
  },
  {
    number: 75,
    suffix: "%",
    label: "Temps Économisé",
    description: "Réduction du temps de screening"
  },
  {
    number: 500,
    suffix: "+",
    label: "Entreprises",
    description: "Font confiance à notre solution"
  }
];

const Stats = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [counters, setCounters] = useState(STATS_DATA.map(() => 0));
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animation du titre
      gsap.from(".stats-title", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power2.out"
      });

      // Animation des cartes de stats avec trigger plus sensible
      gsap.fromTo(".stat-card", 
        {
          y: 80,
          opacity: 0,
          scale: 0.9
        },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 90%",
            end: "bottom 10%",
            onEnter: () => {
              if (!isAnimated) {
                setIsAnimated(true);
                animateCounters();
              }
            }
          },
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power2.out"
        }
      );
    });

    return () => ctx.revert();
  }, [isAnimated]);

  const animateCounters = () => {
    STATS_DATA.forEach((stat, index) => {
      gsap.to({}, {
        duration: 2,
        ease: "power2.out",
        onUpdate: function() {
          const progress = this.progress();
          const currentValue = Math.floor(stat.number * progress);
          setCounters(prev => {
            const newCounters = [...prev];
            newCounters[index] = currentValue;
            return newCounters;
          });
        }
      });
    });
  };

  // Fallback: déclencher l'animation après un délai si elle ne s'est pas déclenchée
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isAnimated) {
        setIsAnimated(true);
        animateCounters();
        
        // Forcer l'affichage des cartes si GSAP n'a pas marché
        gsap.set(".stat-card", {
          y: 0,
          opacity: 1,
          scale: 1
        });
      }
    }, 2000); // Réduire le délai à 2 secondes

    return () => clearTimeout(timer);
  }, [isAnimated]);

  // Debug function pour forcer l'affichage
  const forceShowStats = () => {
    setIsAnimated(true);
    animateCounters();
    gsap.set(".stat-card", {
      y: 0,
      opacity: 1,
      scale: 1
    });
  };

  return (
    <section
      ref={sectionRef}
      id="stats"
      className="w-full py-24 relative overflow-hidden"
    >
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-dark-3 to-gray-dark-2"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-10 w-32 h-32 bg-indigo-light/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-indigo-dark/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-purple/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <div className="relative z-10 2xl:container mx-auto xl:px-20 md:px-12 px-4">
        <div className="text-center mb-16">
          <h2 className="stats-title text-5xl md:text-6xl font-bold text-white mb-6">
            Nos <span className="text-gradient">Résultats</span>
          </h2>
          <p className="stats-title text-xl text-gray-300 max-w-3xl mx-auto mb-4">
            Des chiffres qui parlent d'eux-mêmes et témoignent de notre excellence
          </p>
          {/* Debug button - temporaire */}
          {!isAnimated && (
            <button
              onClick={forceShowStats}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded text-sm"
            >
              🔧 Forcer l'affichage des stats (debug)
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS_DATA.map((stat, index) => (
            <div
              key={index}
              className="stat-card group relative bg-gradient-to-br from-gray-dark-1/50 to-gray-dark-2/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-dark-1/50 text-center hover:border-indigo-light/50 transition-all duration-300"
              style={{
                opacity: isAnimated ? undefined : 1,
                transform: isAnimated ? undefined : 'none'
              }}
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-light/10 to-indigo-dark/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10">
                <div className="mb-4">
                  <span className="text-5xl md:text-6xl font-bold text-gradient">
                    {counters[index]}
                  </span>
                  <span className="text-3xl md:text-4xl font-bold text-indigo-light">
                    {stat.suffix}
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-2">
                  {stat.label}
                </h3>
                
                <p className="text-gray-300 text-sm">
                  {stat.description}
                </p>
              </div>

              {/* Decorative corner */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-light/30 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ))}
        </div>

        {/* Additional info section */}
        <div className="mt-20 text-center">
          <div className="inline-flex flex-col md:flex-row items-center gap-8 bg-gradient-to-r from-gray-dark-2/50 to-gray-dark-3/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-dark-1/50">
            <div className="text-left">
              <h3 className="text-2xl font-bold text-white mb-2">
                Une croissance constante depuis 2024
              </h3>
              <p className="text-gray-300">
                Nos métriques s'améliorent chaque jour grâce aux retours de nos utilisateurs
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-light">+150%</div>
                <div className="text-sm text-gray-300">Croissance mensuelle</div>
              </div>
              <div className="w-px h-12 bg-gray-dark-1"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-light">24/7</div>
                <div className="text-sm text-gray-300">Support disponible</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Stats;