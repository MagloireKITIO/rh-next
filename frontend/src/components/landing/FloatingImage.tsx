"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const FloatingImage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !imageRef.current) return;

    const ctx = gsap.context(() => {
      // Animation flottante continue
      gsap.to(imageRef.current, {
        y: -20,
        duration: 3,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1
      });

      // Rotation subtile
      gsap.to(imageRef.current, {
        rotation: 5,
        duration: 4,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1
      });

      // Animation d'entrée
      gsap.from(imageRef.current, {
        scale: 0,
        opacity: 0,
        duration: 1.5,
        delay: 2,
        ease: "back.out(1.7)"
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute right-4 lg:right-20 top-1/2 transform -translate-y-1/2 w-80 h-80 lg:w-96 lg:h-96 pointer-events-none hidden lg:block"
    >
      <div
        ref={imageRef}
        className="relative w-full h-full"
      >
        {/* Conteneur principal avec gradient de fond */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-3xl border border-indigo-light/30 backdrop-blur-sm overflow-hidden">
          
          {/* Éléments décoratifs flottants */}
          <div className="absolute top-6 left-6 w-4 h-4 bg-gradient-to-r from-indigo-light to-indigo-dark rounded-full animate-pulse"></div>
          <div className="absolute top-12 right-8 w-3 h-3 bg-purple rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-16 left-8 w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          {/* Contenu principal de l'image */}
          <div className="absolute inset-8 bg-gradient-to-br from-gray-dark-2 to-gray-dark-3 rounded-2xl border border-gray-dark-1 flex flex-col items-center justify-center">
            
            {/* Header simulé */}
            <div className="absolute top-4 left-4 right-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="ml-4 h-2 bg-gray-600 rounded flex-1"></div>
            </div>
            
            {/* Dashboard mockup */}
            <div className="mt-12 space-y-4 w-full px-6">
              {/* Titre */}
              <div className="h-8 bg-gradient-to-r from-indigo-light to-indigo-dark rounded w-3/4 mx-auto"></div>
              
              {/* Stats cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-blue-500/30 to-blue-600/30 rounded-lg p-3">
                  <div className="w-full h-3 bg-white/40 rounded mb-2"></div>
                  <div className="w-2/3 h-2 bg-white/30 rounded"></div>
                </div>
                <div className="bg-gradient-to-br from-green-500/30 to-green-600/30 rounded-lg p-3">
                  <div className="w-full h-3 bg-white/40 rounded mb-2"></div>
                  <div className="w-2/3 h-2 bg-white/30 rounded"></div>
                </div>
              </div>
              
              {/* Chart mockup */}
              <div className="bg-gray-dark-4/50 rounded-lg p-4 mt-4">
                <div className="flex items-end gap-2 h-16">
                  <div className="bg-indigo-light rounded-t w-3 h-8"></div>
                  <div className="bg-indigo-light rounded-t w-3 h-12"></div>
                  <div className="bg-indigo-light rounded-t w-3 h-6"></div>
                  <div className="bg-indigo-light rounded-t w-3 h-16"></div>
                  <div className="bg-indigo-light rounded-t w-3 h-10"></div>
                </div>
              </div>
            </div>
            
            {/* Logo au centre */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-20 h-20 bg-gradient-to-r from-indigo-light to-indigo-dark rounded-2xl flex items-center justify-center opacity-20">
                <span className="text-white font-bold text-2xl">RH</span>
              </div>
            </div>
          </div>
          
          {/* Effets de lumière */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-light/5 to-transparent pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-purple/10 to-transparent rounded-full pointer-events-none"></div>
        </div>
        
        {/* Halo lumineux autour */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-light/20 to-purple/20 rounded-3xl blur-2xl -z-10 animate-pulse"></div>
      </div>
    </div>
  );
};

export default FloatingImage;