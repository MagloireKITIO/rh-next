"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { useAuth } from "@/contexts/auth-context";
import FloatingImage from "./FloatingImage";

const TYPED_STRINGS = [
  "Révolutionnez vos processus RH",
  "Analysez les CV avec l'IA",
  "Optimisez vos recrutements",
  "Prenez des décisions éclairées"
];

const Hero = () => {
  const router = useRouter();
  const { user } = useAuth();
  const sectionRef = useRef<HTMLDivElement>(null);
  const typedElementRef = useRef<HTMLSpanElement>(null);
  const [currentStringIndex, setCurrentStringIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (sectionRef.current) {
        gsap
          .timeline({ defaults: { ease: "none" } })
          .to(sectionRef.current, { opacity: 1, duration: 2 })
          .from(
            sectionRef.current.querySelectorAll(".staggered-reveal"),
            { opacity: 0, duration: 0.5, stagger: 0.5 },
            "<"
          );
      }
    });

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const currentString = TYPED_STRINGS[currentStringIndex];
    
    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < currentString.length) {
          setDisplayText(currentString.slice(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentStringIndex((prev) => (prev + 1) % TYPED_STRINGS.length);
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentStringIndex]);

  const handleGetStarted = () => {
    console.log("Button clicked, user:", user); // Debug
    if (user) {
      console.log("Redirecting to dashboard"); // Debug  
      router.push("/dashboard");
    } else {
      console.log("Redirecting to signup"); // Debug
      router.push("/auth/signup");
    }
  };

  const handleLogin = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/auth/login");
    }
  };

  return (
    <section
      ref={sectionRef}
      id="home"
      className="w-full flex md:items-center py-8 2xl:container mx-auto xl:px-20 md:px-12 px-4 min-h-screen relative mb-24"
      style={{ opacity: 0 }}
    >
      <div className="flex flex-col pt-32 md:pt-20 select-none w-full">
        <h1 className="text-white text-6xl md:text-8xl font-bold">
          <span className="relative staggered-reveal text-gradient">
            RH Analytics
          </span>
          <br />
          <span className="staggered-reveal text-white">Pro</span>
        </h1>
        
        <div className="mt-8">
          <span
            ref={typedElementRef}
            className="staggered-reveal text-3xl md:text-4xl text-gray-300 font-mono leading-relaxed"
          >
            {displayText}
            <span className="animate-pulse">|</span>
          </span>
        </div>

        <p className="staggered-reveal text-xl text-gray-300 mt-6 max-w-2xl leading-relaxed">
          Transformez votre processus de recrutement avec notre plateforme d'analyse IA. 
          Évaluez les candidats, générez des insights et prenez des décisions éclairées.
        </p>

        <div className="staggered-reveal flex flex-col sm:flex-row gap-4 mt-12">
          <button
            onClick={handleGetStarted}
            className="px-8 py-4 bg-gradient-to-r from-indigo-light to-indigo-dark text-white rounded-lg font-semibold hover:scale-105 active:scale-95 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-dark/25 active:shadow-md cursor-pointer"
          >
            {user ? "Accéder au Dashboard" : "Commencer maintenant"}
          </button>
          
          {!user && (
            <button
              onClick={handleLogin}
              className="px-8 py-4 border-2 border-indigo-light text-indigo-light rounded-lg font-semibold hover:bg-indigo-light hover:text-white active:scale-95 transition-all duration-300 cursor-pointer"
            >
              Se connecter
            </button>
          )}
        </div>

        <div className="staggered-reveal mt-12 flex items-center gap-8 text-gray-300">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span>IA Avancée</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Analyses Instantanées</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
            <span>Interface Intuitive</span>
          </div>
        </div>
      </div>

      {/* Floating Image */}
      <FloatingImage />

      {/* Background decorative elements */}
      <div className="absolute bottom-20 left-10 w-64 h-64 opacity-5">
        <div className="w-full h-full bg-gradient-to-r from-purple to-indigo-light rounded-full blur-2xl animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      {/* Organic curves */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <svg className="absolute top-20 right-0 w-96 h-96 opacity-10" viewBox="0 0 200 200">
          <path
            d="M50,20 C80,10 120,30 150,50 C180,70 170,110 140,130 C110,150 70,140 40,110 C10,80 20,50 50,20 Z"
            fill="url(#heroGradient)"
            className="animate-pulse"
          />
          <defs>
            <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b31ff" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </section>
  );
};

export default Hero;