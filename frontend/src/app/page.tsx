"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/landing");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-2xl">RH</span>
        </div>
        <div className="flex items-center gap-2 justify-center">
          <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></div>
          <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
          <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
        </div>
        <p className="text-gray-400 mt-4">
          {loading ? "Vérification..." : "Redirection..."}
        </p>
      </div>
    </div>
  );
}
