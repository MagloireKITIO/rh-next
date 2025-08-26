"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { useAuth } from "@/contexts/auth-context";
import { NavBar } from "@/components/ui/navbar";
import Header from "@/components/landing/Header";
import Menu from "@/components/landing/Menu";
import ProgressIndicator from "@/components/landing/ProgressIndicator";
import Hero from "@/components/landing/Hero";
import Services from "@/components/landing/Services";
import Stats from "@/components/landing/Stats";
import Work from "@/components/landing/Work";
import Footer from "@/components/landing/Footer";
import BackgroundCurves from "@/components/landing/BackgroundCurves";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  gsap.config({ nullTargetWarn: false });
}

export default function Landing() {
  const [isLoading, setIsLoading] = useState(true);
  const [clientHeight, setClientHeight] = useState(0);
  const [clientWidth, setClientWidth] = useState(0);
  const { user, loading } = useAuth();
  const router = useRouter();

  // Note: Pas de redirection automatique - permet aux utilisateurs connectés de voir le landing

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const { innerWidth, innerHeight } = window;
      setClientHeight(innerHeight);
      setClientWidth(innerWidth);
    }
  }, []);

  // Show loading while auth is being checked
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-indigo-light to-indigo-dark rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-2xl">RH</span>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <div className="w-3 h-3 bg-indigo-light rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-indigo-light rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
            <div className="w-3 h-3 bg-indigo-light rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
          </div>
          <p className="text-gray-light-3 mt-4">Vérification...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-indigo-light to-indigo-dark rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-2xl">RH</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-indigo-light rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-indigo-light rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
            <div className="w-3 h-3 bg-indigo-light rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
          </div>
          <p className="text-gray-light-3 mt-4">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Background curves */}
      <BackgroundCurves />
      
      {/* Navigation - Use NavBar for authenticated users, Header for guests */}
      {user ? (
        <NavBar variant="landing" />
      ) : (
        <Header>
          <Menu />
        </Header>
      )}
      <ProgressIndicator />
      
      <main className="flex flex-col relative z-10">
        {/* Background decorative text */}
        <div
          role="img"
          className="text-gray-light-1 opacity-5 text-6xl md:text-9xl inline-block -z-10 absolute rotate-90 right-0 md:top-52 xs:top-96 font-bold pointer-events-none select-none"
        >
          RH AI
        </div>
        
        {/* Fixed background overlay */}
        <div className="fixed top-0 left-0 h-screen w-screen -z-1" />
        
        {/* Page sections */}
        <Hero />
        <Services />
        <Work />
        <Stats />
        
        {/* Features section placeholder */}
        <section id="features" className="w-full py-24 2xl:container mx-auto xl:px-20 md:px-12 px-4">
          <div className="text-center">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Fonctionnalités <span className="text-gradient">Avancées</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12">
              Découvrez toutes les fonctionnalités qui font de RH Analytics Pro la solution de référence
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="bg-gradient-to-br from-gray-dark-2 to-gray-dark-3 rounded-2xl p-8 border border-gray-dark-1">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-light to-indigo-dark rounded-xl mb-4 flex items-center justify-center">
                  <span className="text-white font-bold">AI</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">IA Conversationnelle</h3>
                <p className="text-gray-300">Interaction naturelle avec l'IA pour des insights personnalisés</p>
              </div>
              
              <div className="bg-gradient-to-br from-gray-dark-2 to-gray-dark-3 rounded-2xl p-8 border border-gray-dark-1">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-light to-indigo-dark rounded-xl mb-4 flex items-center justify-center">
                  <span className="text-white font-bold">⚡</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Performance Optimale</h3>
                <p className="text-gray-300">Traitement ultra-rapide grâce à notre infrastructure cloud</p>
              </div>
              
              <div className="bg-gradient-to-br from-gray-dark-2 to-gray-dark-3 rounded-2xl p-8 border border-gray-dark-1">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-light to-indigo-dark rounded-xl mb-4 flex items-center justify-center">
                  <span className="text-white font-bold">🔒</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Sécurité Renforcée</h3>
                <p className="text-gray-300">Conformité RGPD et chiffrement de bout en bout</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact section placeholder */}
        <section id="contact" className="w-full py-24 bg-gradient-to-r from-gray-dark-3 to-gray-dark-4">
          <div className="2xl:container mx-auto xl:px-20 md:px-12 px-4 text-center">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Prêt à <span className="text-gradient">Commencer</span> ?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12">
              Transformez vos recrutements dès aujourd'hui avec RH Analytics Pro
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-12 py-6 bg-gradient-to-r from-indigo-light to-indigo-dark text-white rounded-lg font-semibold hover:scale-105 transition-all duration-300 text-lg">
                Essai Gratuit - 30 jours
              </button>
              <button className="px-12 py-6 border-2 border-indigo-light text-indigo-light rounded-lg font-semibold hover:bg-indigo-light hover:text-white transition-all duration-300 text-lg">
                Demander une Démo
              </button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
}