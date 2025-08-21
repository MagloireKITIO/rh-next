"use client";

import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

const Header = ({ children }: { children?: React.ReactNode }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = useCallback((e: React.MouseEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    if (target.checked) {
      // Play sound effect if available
      console.log("Menu opened");
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && inputRef.current?.checked) {
      inputRef.current.checked = false;
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <nav className="w-full fixed top-0 py-8 z-50 select-none bg-gradient-to-b from-black via-black/80 to-transparent transition-all duration-300">
      <div className="flex justify-between section-container">
        <Link href="#home" className="link">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-light to-indigo-dark rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">RH</span>
            </div>
            <span className="text-white font-semibold text-lg">RH Analytics</span>
          </div>
        </Link>
        <div className="outer-menu relative flex items-center gap-8 z-[1]">
          <input
            ref={inputRef}
            aria-labelledby="menu"
            aria-label="menu"
            className="checkbox-toggle link absolute top-0 right-0 w-6 h-6 opacity-0"
            type="checkbox"
            onClick={handleClick}
          />
          <div className="hamburger w-6 h-6 flex items-center justify-center">
            <div className="relative flex-none w-full bg-white duration-300 flex items-center justify-center" />
          </div>
          {children}
        </div>
      </div>
    </nav>
  );
};

export default Header;