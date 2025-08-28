const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

// Configuration - Remplacez par vos vraies valeurs
const SUPABASE_URL = 'https://xkqrigsupoomqevfwzni.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrcXJpZ3N1cG9vbXFldmZ3em5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkyNTA5MCwiZXhwIjoyMDcwNTAxMDkwfQ.ExKU7CttiYuC-1nveeZP9SbJmzVrUvcx_jc5CMK_Va8';
const DATABASE_URL = 'postgresql://postgres.xkqrigsupoomqevfwzni:@Dieuestgrand6@aws-0-eu-north-1.pooler.supabase.com:6543/postgres';

// Données du super admin
const SUPER_ADMIN_EMAIL = 'admin@votre-domaine.com';
const SUPER_ADMIN_PASSWORD = 'MotDePasseSecurise123!';
const SUPER_ADMIN_NAME = 'Super Administrateur';

async function createSuperAdmin() {
  try {
    console.log('🚀 Création du super administrateur...');
    
    // 1. Créer l'utilisateur dans Supabase avec la clé service (auto-confirmé)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASSWORD,
      email_confirm: true, // Auto-confirmer l'email pour l'admin
      user_metadata: {
        name: SUPER_ADMIN_NAME,
      },
    });

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      return;
    }

    console.log('✅ Utilisateur super admin créé dans Supabase (email auto-confirmé):', data.user.id);

    // 2. Créer l'utilisateur dans la base de données PostgreSQL
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    await client.connect();

    const insertQuery = `
      INSERT INTO users (
        email, 
        name, 
        google_id, 
        role, 
        is_active, 
        email_verified, 
        is_onboarded,
        created_at, 
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        role = $4,
        is_active = $5,
        email_verified = $6,
        updated_at = NOW()
    `;

    await client.query(insertQuery, [
      SUPER_ADMIN_EMAIL,
      SUPER_ADMIN_NAME,
      data.user.id,
      'super_admin',
      true,
      true,
      true
    ]);

    await client.end();

    console.log('✅ Super administrateur créé avec succès !');
    console.log('📧 Email:', SUPER_ADMIN_EMAIL);
    console.log('🔐 Mot de passe:', SUPER_ADMIN_PASSWORD);
    console.log('🎯 Rôle: super_admin');
    console.log('');
    console.log('Vous pouvez maintenant vous connecter sur:');
    console.log('http://localhost:3002/auth/login');

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
  }
}

// Exécuter le script
if (require.main === module) {
  createSuperAdmin();
}

module.exports = { createSuperAdmin };