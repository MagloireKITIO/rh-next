const { Client } = require('pg');

// Configuration base de données
const DATABASE_URL = 'postgresql://postgres.xkqrigsupoomqevfwzni:@Dieuestgrand6@aws-0-eu-north-1.pooler.supabase.com:6543/postgres';

async function checkAdminInDatabase() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log('🔌 Connexion à la base de données...');
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');

    // Vérifier si l'utilisateur existe
    console.log('\n🔍 Recherche de l\'utilisateur admin...');
    const userQuery = `
      SELECT 
        email, 
        name, 
        role, 
        google_id,
        is_active,
        email_verified,
        is_onboarded,
        created_at
      FROM users 
      WHERE email = $1
    `;
    
    const result = await client.query(userQuery, ['admin@votre-domaine.com']);

    if (result.rows.length === 0) {
      console.log('❌ Aucun utilisateur trouvé avec cet email');
    } else {
      console.log('✅ Utilisateur trouvé:');
      console.table(result.rows[0]);
    }

    // Lister tous les utilisateurs pour debug
    console.log('\n📋 Liste de tous les utilisateurs:');
    const allUsersQuery = `
      SELECT 
        email, 
        name, 
        role, 
        is_active,
        created_at
      FROM users 
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    const allUsers = await client.query(allUsersQuery);
    console.table(allUsers.rows);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
    console.log('🔌 Connexion fermée');
  }
}

if (require.main === module) {
  checkAdminInDatabase();
}