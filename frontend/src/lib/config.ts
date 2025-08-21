/**
 * Configuration centralisée pour les URLs d'API
 * Utilise les variables d'environnement avec des fallbacks pour le développement
 */

export const API_CONFIG = {
  // URL du backend API
  BASE_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001',
  
  // URLs spécifiques
  get PROJECTS_URL() { return `${this.BASE_URL}/api/projects`; },
  get TEAM_REQUESTS_URL() { return `${this.BASE_URL}/api/team-requests`; },
  get PUBLIC_PROJECTS_URL() { return `${this.BASE_URL}/api/public/projects`; },
  get PUBLIC_TEAM_REQUESTS_URL() { return `${this.BASE_URL}/api/public/team-requests`; },
  get AUTH_URL() { return `${this.BASE_URL}/api/auth`; },
  get CANDIDATES_URL() { return `${this.BASE_URL}/api/candidates`; },
  get COMPANIES_URL() { return `${this.BASE_URL}/api/companies`; },
} as const;

/**
 * Configuration des URLs frontend
 */
export const FRONTEND_CONFIG = {
  // URL du frontend (utilisée pour les redirections, emails, etc.)
  BASE_URL: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
  
  // Pages spécifiques
  get INVITATION_CALLBACK_URL() { return `${this.BASE_URL}/auth/invitation-callback`; },
  get SHARED_PROJECT_URL() { return (token: string) => `${this.BASE_URL}/shared/${token}`; },
  get TEAM_REQUEST_SUBMITTED_URL() { return (company: string) => `${this.BASE_URL}/team-request-submitted?company=${encodeURIComponent(company)}`; },
} as const;

/**
 * Validation des configurations au démarrage (côté client uniquement)
 */
if (typeof window !== 'undefined') {
  const requiredEnvVars = {
    'NEXT_PUBLIC_BACKEND_URL': process.env.NEXT_PUBLIC_BACKEND_URL,
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0 && process.env.NODE_ENV === 'production') {
    console.error('⚠️ Variables d\'environnement manquantes:', missingVars);
  }
}

export default API_CONFIG;