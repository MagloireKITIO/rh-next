"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { BrainCircuit, FileText, TrendingUp, Users, Zap, Shield } from "lucide-react";
import DotPattern from "./DotPattern";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const SERVICES = [
  {
    icon: <BrainCircuit className="w-8 h-8" />,
    title: "Analyse IA Avancée",
    description: "Analysez les CV avec notre IA de dernière génération pour une évaluation précise des compétences et de l'expérience.",
    features: ["Extraction automatique", "Score de pertinence", "Analyse contextuelle"]
  },
  {
    icon: <FileText className="w-8 h-8" />,
    title: "Gestion de Projets",
    description: "Organisez vos campagnes de recrutement en projets structurés avec suivi en temps réel.",
    features: ["Projets multiples", "Suivi temps réel", "Collaboration équipe"]
  },
  {
    icon: <TrendingUp className="w-8 h-8" />,
    title: "Tableau de Bord Analytics",
    description: "Visualisez vos données RH avec des tableaux de bord interactifs et des métriques avancées.",
    features: ["Métriques en temps réel", "Graphiques interactifs", "Rapports exportables"]
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Ranking Intelligent",
    description: "Classez automatiquement vos candidats selon des critères personnalisables et objectifs.",
    features: ["Critères personnalisables", "Scoring objectif", "Comparaison facile"]
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Traitement Rapide",
    description: "Analysez des centaines de CV en quelques secondes grâce à notre infrastructure cloud optimisée.",
    features: ["Traitement en lot", "Résultats instantanés", "Scalabilité garantie"]
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Sécurité & Conformité",
    description: "Vos données sont protégées avec les plus hauts standards de sécurité et conformité RGPD.",
    features: ["Chiffrement bout en bout", "Conformité RGPD", "Audits de sécurité"]
  }
];

const Services = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animation du titre
      gsap.from(".services-title", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          end: "bottom 20%",
        },
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power2.out"
      });

      // Animation des cartes en cascade
      cardsRef.current.forEach((card, index) => {
        if (card) {
          gsap.from(card, {
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              end: "bottom 15%",
            },
            y: 80,
            opacity: 0,
            scale: 0.9,
            duration: 0.8,
            delay: index * 0.1,
            ease: "power2.out"
          });

          // Effet hover avec GSAP
          const handleMouseEnter = () => {
            gsap.to(card, {
              scale: 1.02,
              y: -10,
              duration: 0.3,
              ease: "power2.out"
            });
          };

          const handleMouseLeave = () => {
            gsap.to(card, {
              scale: 1,
              y: 0,
              duration: 0.3,
              ease: "power2.out"
            });
          };

          card.addEventListener("mouseenter", handleMouseEnter);
          card.addEventListener("mouseleave", handleMouseLeave);

          return () => {
            card.removeEventListener("mouseenter", handleMouseEnter);
            card.removeEventListener("mouseleave", handleMouseLeave);
          };
        }
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="services"
      className="w-full py-24 2xl:container mx-auto xl:px-20 md:px-12 px-4 relative"
    >
      {/* Dot pattern background */}
      <DotPattern className="opacity-10" />
      <div className="text-center mb-16">
        <h2 className="services-title text-5xl md:text-6xl font-bold text-white mb-6">
          Nos <span className="text-gradient">Services</span>
        </h2>
        <p className="services-title text-xl text-gray-300 max-w-3xl mx-auto">
          Découvrez notre suite complète d'outils RH alimentés par l'intelligence artificielle
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {SERVICES.map((service, index) => (
          <div
            key={index}
            ref={(el) => {
              if (el) cardsRef.current[index] = el;
            }}
            className="group relative bg-gradient-to-br from-gray-dark-2 to-gray-dark-3 rounded-2xl p-8 border border-gray-dark-1 overflow-hidden"
          >
            {/* Background gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-light/10 to-indigo-dark/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-r from-indigo-light to-indigo-dark rounded-xl text-white">
                  {service.icon}
                </div>
                <h3 className="text-2xl font-bold text-white">{service.title}</h3>
              </div>
              
              <p className="text-gray-300 mb-6 leading-relaxed">
                {service.description}
              </p>
              
              <ul className="space-y-2">
                {service.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-3 text-gray-400">
                    <div className="w-2 h-2 bg-indigo-light rounded-full"></div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Decorative corner */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-light/20 to-transparent rounded-bl-full"></div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="text-center mt-16">
        <div className="inline-flex items-center gap-4 bg-gradient-to-r from-gray-dark-2 to-gray-dark-3 rounded-2xl p-8 border border-gray-dark-1">
          <div className="text-left">
            <h3 className="text-2xl font-bold text-white mb-2">Prêt à transformer vos recrutements ?</h3>
            <p className="text-gray-300">Commencez votre essai gratuit dès aujourd'hui</p>
          </div>
          <button className="px-8 py-4 bg-gradient-to-r from-indigo-light to-indigo-dark text-white rounded-lg font-semibold hover:scale-105 transition-all duration-300 whitespace-nowrap">
            Essai Gratuit
          </button>
        </div>
      </div>
    </section>
  );
};

export default Services;