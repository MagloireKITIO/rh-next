const { Client } = require('pg');
require('dotenv').config();

async function checkUser() {
  // Utiliser DATABASE_URL si disponible, sinon les variables séparées
  const client = new Client({
    connectionString: process.env.DATABASE_URL || undefined,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('🔗 Connexion à la base de données réussie');

    const query = `
      SELECT 
        u.id,
        u.email,
        u.name,
        u.role,
        u.is_active,
        u.is_invited,
        u.is_onboarded,
        u.email_verified,
        u.company_id,
        u.google_id,
        u.created_at,
        u.updated_at,
        c.name as company_name,
        c.domain as company_domain
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      WHERE u.email = $1
    `;

    // Analyser plusieurs utilisateurs pour comparaison
    const emails = ['magloirekitio1@gmail.com', 'm.kitio@group-activa.com'];
    
    for (const email of emails) {
      const result = await client.query(query, [email]);
      
      console.log(`\n🔍 ANALYSE DE: ${email}`);
      console.log('='.repeat(50));
      
      if (result.rows.length === 0) {
        console.log('❌ Aucun utilisateur trouvé avec cet email');
        continue;
      }
      
      const user = result.rows[0];
      
      // Informations de base
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Nom: ${user.name}`);
      console.log(`Rôle: ${user.role}`);
      console.log(`Actif: ${user.is_active ? '✅' : '❌'}`);
      console.log(`Invité: ${user.is_invited ? '✅' : '❌'}`);
      console.log(`Onboardé: ${user.is_onboarded ? '✅' : '❌'}`);
      console.log(`Email vérifié: ${user.email_verified ? '✅' : '❌'}`);
      console.log(`Google ID: ${user.google_id || 'Non défini'}`);
      console.log(`Entreprise: ${user.company_name || 'Aucune'} (${user.company_domain || 'N/A'})`);
      
      // Analyse des permissions Settings
      console.log('\n🔐 ANALYSE DES PERMISSIONS:');
      
      // Variable simulant le contexte auth frontend
      const isAdmin = user.role === 'admin';
      const isHR = user.role === 'hr';
      const canManageUsers = isAdmin;
      const canViewUsers = isAdmin || isHR;
      
      console.log(`isAdmin: ${isAdmin}`);
      console.log(`isHR: ${isHR}`);
      console.log(`canManageUsers: ${canManageUsers}`);
      console.log(`canViewUsers: ${canViewUsers}`);
      
      console.log('\n📋 ACCÈS AUX SECTIONS:');
      console.log(`- Configuration AI: ${isAdmin ? '✅ Visible' : '❌ Masquée'}`);
      console.log(`- Gestion Utilisateurs: ${canViewUsers ? '✅ Visible' : '❌ Masquée'}`);
      console.log(`- Bouton Inviter: ${canManageUsers ? '✅ Visible' : '❌ Masqué'}`);
      console.log(`- Modifier Rôles: ${canManageUsers ? '✅ Autorisé' : '❌ Lecture seule'}`);
      console.log(`- Actions (Toggle/Delete): ${canManageUsers ? '✅ Autorisé' : '❌ Masqué'}`);
      
      // Diagnostic spécifique
      console.log('\n🔍 Diagnostic:');
      if (!user.is_active) console.log('⚠️  Utilisateur INACTIF - Ne peut pas se connecter');
      if (!user.email_verified) console.log('⚠️  Email NON VÉRIFIÉ - Ne peut pas se connecter');
      if (!user.is_onboarded) console.log('ℹ️  Onboarding NON TERMINÉ');
      
      if (user.role === 'admin') {
        console.log('👑 ADMINISTRATEUR - Accès complet');
      } else if (user.role === 'hr') {
        console.log('🛡️  RH - Accès limité (pas de config AI, lecture seule utilisateurs)');
      } else {
        console.log('👤 UTILISATEUR STANDARD - Pas d\'accès aux settings');
      }
      
      // Problèmes potentiels
      if (user.role === 'hr' && !canViewUsers) {
        console.log('🚨 PROBLÈME: RH devrait voir les utilisateurs !');
      }
      
      // Instructions pour résoudre les problèmes frontend
      if (user.role === 'hr') {
        console.log('\n🔧 VÉRIFICATIONS À FAIRE:');
        console.log('1. Vider le localStorage: localStorage.clear()');
        console.log('2. Redémarrer le serveur frontend: npm run dev');
        console.log('3. Se déconnecter/reconnecter complètement');
        console.log('4. Vérifier dans la console: console.log(user?.role)');
        console.log('5. Vérifier le token JWT décrypté sur jwt.io');
      }
    }

    // Vérification finale
    console.log('\n' + '='.repeat(50));
    console.log('🎯 RÉSUMÉ DES PERMISSIONS ATTENDUES:');
    console.log('👑 ADMIN: Voit tout + peut tout modifier');
    console.log('🛡️  RH: Voit utilisateurs en lecture seule, PAS de config AI');
    console.log('👤 USER: Pas d\'accès aux settings');

  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    console.log('\n🔧 Variables d\'environnement:');
    console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅ Définie' : '❌ Non définie');
    console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Définie' : '❌ Non définie');
  } finally {
    await client.end();
  }
}

checkUser();