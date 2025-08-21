"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { 
  Github, 
  Linkedin, 
  Mail, 
  Twitter, 
  BrainCircuit,
  ExternalLink
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const SOCIAL_LINKS = [
  { name: "GitHub", icon: <Github className="w-5 h-5" />, url: "#", color: "hover:text-gray-400" },
  { name: "LinkedIn", icon: <Linkedin className="w-5 h-5" />, url: "#", color: "hover:text-blue-400" },
  { name: "Twitter", icon: <Twitter className="w-5 h-5" />, url: "#", color: "hover:text-blue-300" },
  { name: "Email", icon: <Mail className="w-5 h-5" />, url: "mailto:contact@rh-analytics.com", color: "hover:text-red-400" },
];

const FOOTER_LINKS = {
  "Produit": [
    { name: "Fonctionnalités", url: "#features" },
    { name: "Tarifs", url: "#pricing" },
    { name: "Intégrations", url: "#integrations" },
    { name: "API", url: "#api" },
  ],
  "Ressources": [
    { name: "Documentation", url: "#docs" },
    { name: "Guides", url: "#guides" },
    { name: "Blog", url: "#blog" },
    { name: "Support", url: "#support" },
  ],
  "Entreprise": [
    { name: "À propos", url: "#about" },
    { name: "Carrières", url: "#careers" },
    { name: "Partenaires", url: "#partners" },
    { name: "Contact", url: "#contact" },
  ]
};

const Meteors = () => {
  const meteorsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const createMeteor = () => {
      if (!meteorsRef.current) return;

      const meteor = document.createElement("div");
      meteor.className = "absolute w-2 h-2 bg-gradient-to-r from-indigo-light to-transparent rounded-full";
      meteor.style.left = `${Math.random() * 100}%`;
      meteor.style.top = `${Math.random() * 50}%`;
      meteor.style.animationDelay = `${Math.random() * 2}s`;
      
      meteorsRef.current.appendChild(meteor);

      gsap.fromTo(meteor, 
        { 
          x: -50, 
          y: -50, 
          opacity: 0,
          rotation: 45 
        },
        { 
          x: 300, 
          y: 300, 
          opacity: 1,
          duration: 2,
          ease: "none",
          onComplete: () => {
            meteor.remove();
          }
        }
      );
    };

    const interval = setInterval(createMeteor, 3000);
    return () => clearInterval(interval);
  }, []);

  return <div ref={meteorsRef} className="absolute inset-0 overflow-hidden pointer-events-none"></div>;
};

const Footer = () => {
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".footer-content", {
        scrollTrigger: {
          trigger: footerRef.current,
          start: "top 90%",
        },
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        ease: "power2.out"
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={footerRef}
      className="relative w-full bg-gradient-to-br from-gray-dark-4 to-gray-dark-5 overflow-hidden"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, rgba(99, 102, 241, 0.3) 2px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Meteors animation */}
      <Meteors />

      {/* Wave decoration */}
      <div className="absolute top-0 left-0 w-full overflow-hidden">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block w-full h-16"
        >
          <path
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            opacity=".25"
            className="fill-indigo-light/20"
          ></path>
          <path
            d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
            opacity=".5"
            className="fill-indigo-dark/20"
          ></path>
          <path
            d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
            className="fill-gray-dark-3"
          ></path>
        </svg>
      </div>

      <div className="relative z-10 2xl:container mx-auto xl:px-20 md:px-12 px-4 pt-20 pb-12">
        {/* Main footer content */}
        <div className="footer-content grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-light to-indigo-dark rounded-xl flex items-center justify-center">
                <BrainCircuit className="w-6 h-6 text-white" />
              </div>
              <span className="text-white font-bold text-2xl">RH Analytics Pro</span>
            </div>
            
            <p className="text-gray-300 mb-6 leading-relaxed">
              Révolutionnez vos processus RH avec notre plateforme d'analyse IA. 
              Transformez vos recrutements et prenez des décisions éclairées.
            </p>
            
            {/* Social links */}
            <div className="flex gap-4">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  className={`p-3 bg-gray-dark-3 rounded-lg text-gray-300 transition-all duration-300 ${social.color} hover:scale-110 hover:bg-gray-dark-2`}
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links sections */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category} className="footer-content">
              <h3 className="text-white font-semibold text-lg mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.url}
                      className="text-gray-300 hover:text-indigo-light transition-colors duration-300 flex items-center gap-2 group"
                    >
                      {link.name}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter section */}
        <div className="footer-content bg-gradient-to-r from-gray-dark-3/50 to-gray-dark-2/50 rounded-2xl p-8 mb-12 border border-gray-dark-1/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-white font-semibold text-xl mb-2">
                Restez informé de nos nouveautés
              </h3>
              <p className="text-gray-300">
                Recevez les dernières mises à jour et conseils RH directement dans votre boîte mail
              </p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <input
                type="email"
                placeholder="Votre email..."
                className="px-4 py-3 bg-gray-dark-4 border border-gray-dark-1 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-indigo-light transition-colors duration-300 flex-1 md:w-64"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-indigo-light to-indigo-dark text-white rounded-lg font-semibold hover:scale-105 transition-all duration-300 whitespace-nowrap">
                S'abonner
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-content flex flex-col md:flex-row items-center justify-between pt-8 border-t border-gray-dark-1/50">
          <p className="text-gray-300 text-sm mb-4 md:mb-0">
            © 2024 RH Analytics Pro. Tous droits réservés.
          </p>
          
          <div className="flex gap-6 text-sm">
            <Link href="#privacy" className="text-gray-300 hover:text-indigo-light transition-colors duration-300">
              Politique de confidentialité
            </Link>
            <Link href="#terms" className="text-gray-300 hover:text-indigo-light transition-colors duration-300">
              Conditions d'utilisation
            </Link>
            <Link href="#cookies" className="text-gray-300 hover:text-indigo-light transition-colors duration-300">
              Cookies
            </Link>
          </div>
        </div>
      </div>

      {/* Gradient overlay at bottom */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-gray-dark-5 to-transparent"></div>
    </footer>
  );
};

export default Footer;