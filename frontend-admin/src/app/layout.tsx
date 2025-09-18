import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from '@/providers/QueryProvider';
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RH Analytics Pro - Administration",
  description: "Interface d'administration pour la gestion globale de la plateforme RH Analytics Pro",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              {children}
              <Toaster
                position="top-right"
                expand={false}
                richColors
                closeButton
              />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
