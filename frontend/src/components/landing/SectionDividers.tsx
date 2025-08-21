"use client";

const SectionDividers = () => {
  return (
    <>
      {/* Divider between Hero and Services */}
      <div className="relative w-full h-32 overflow-hidden">
        <svg
          className="absolute bottom-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0 C480,120 960,120 1440,0 L1440,120 L0,120 Z"
            fill="url(#sectionGradient1)"
            opacity="0.1"
          />
          <path
            d="M0,20 C360,100 1080,100 1440,20 L1440,120 L0,120 Z"
            fill="url(#sectionGradient2)"
            opacity="0.15"
          />
          <defs>
            <linearGradient id="sectionGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b31ff" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#4338ca" />
            </linearGradient>
            <linearGradient id="sectionGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#5b21b6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Wave pattern for sections */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg
          className="absolute top-1/4 left-0 w-full h-96 opacity-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 400"
          preserveAspectRatio="none"
        >
          <path
            d="M0,200 C360,100 720,300 1080,200 C1260,150 1350,250 1440,200 L1440,400 L0,400 Z"
            fill="url(#waveGradient)"
          />
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b31ff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#4338ca" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </>
  );
};

export default SectionDividers;