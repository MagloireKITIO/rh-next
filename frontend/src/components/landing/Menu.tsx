"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

const Menu = () => {
  const router = useRouter();
  const { user } = useAuth();

  const MENU_LINKS = [
    { name: "Accueil", ref: "home", type: "anchor" },
    { name: "Services", ref: "services", type: "anchor" },
    { name: "Fonctionnalités", ref: "features", type: "anchor" },
    ...(user ? [{ name: "Dashboard", ref: "/dashboard", type: "route" }] : []),
    { name: "Contact", ref: "contact", type: "anchor" },
  ];

  const handleLinkClick = (item: any) => {
    if (item.type === "route") {
      router.push(item.ref);
    }
  };

  return (
    <div className="menu fixed invisible top-0 left-0 w-full h-screen overflow-hidden pointer-events-none flex items-center justify-center">
      <div className="flex items-center justify-center">
        <div className="text-center">
          <ul className="list-none text-center">
            {MENU_LINKS.map((link, index) => (
              <li key={link.ref} className="mb-8">
                {link.type === "route" ? (
                  <button
                    onClick={() => handleLinkClick(link)}
                    className="text-6xl md:text-8xl font-bold transition-all duration-300 hover:scale-110 cursor-pointer"
                  >
                    {link.name}
                  </button>
                ) : (
                  <Link 
                    href={`#${link.ref}`}
                    className="text-6xl md:text-8xl font-bold transition-all duration-300 hover:scale-110"
                  >
                    {link.name}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          
          <div className="mt-16">
            <button
              onClick={() => router.push(user ? "/dashboard" : "/auth/signup")}
              className="px-8 py-4 bg-gradient-to-r from-indigo-light to-indigo-dark text-white rounded-lg font-semibold hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              {user ? "Accéder au Dashboard" : "Commencer maintenant"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menu;