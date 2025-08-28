const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const SUPABASE_URL = 'https://xkqrigsupoomqevfwzni.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrcXJpZ3N1cG9vbXFldmZ3em5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkyNTA5MCwiZXhwIjoyMDcwNTAxMDkwfQ.ExKU7CttiYuC-1nveeZP9SbJmzVrUvcx_jc5CMK_Va8';

// Identifiants
const EMAIL = 'admin@votre-domaine.com';
const PASSWORD = 'MotDePasseSecurise123!';

async function testSupabaseAuth() {
  console.log('🧪 Test d\'authentification Supabase');
  console.log('===================================');

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    console.log(`📧 Email: ${EMAIL}`);
    console.log(`🔐 Password: ${PASSWORD}`);
    console.log('');

    // Test de connexion
    console.log('🔄 Tentative de connexion avec Supabase...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: EMAIL,
      password: PASSWORD,
    });

    if (error) {
      console.error('❌ Erreur Supabase:', error.message);
      console.error('🔍 Code erreur:', error.status || 'N/A');
      
      if (error.message.includes('Email not confirmed')) {
        console.log('');
        console.log('💡 Solution: L\'email n\'est pas vérifié dans Supabase');
        console.log('   Utilisez le dashboard Supabase pour marquer l\'email comme vérifié');
        console.log('   Ou utilisez l\'API admin pour confirmer l\'email');
      }
      
      return false;
    }

    console.log('✅ Connexion Supabase réussie !');
    console.log('👤 User ID:', data.user?.id);
    console.log('📧 Email:', data.user?.email);
    console.log('✅ Email vérifié:', data.user?.email_confirmed_at ? 'OUI' : 'NON');
    console.log('🎫 Token:', data.session?.access_token ? 'Présent' : 'Absent');
    
    return true;

  } catch (error) {
    console.error('💥 Erreur inattendue:', error);
    return false;
  }
}

// Test pour confirmer l'email automatiquement (nécessite la clé service)
async function confirmEmailWithServiceKey() {
  console.log('\n🔧 Tentative de confirmation d\'email avec la clé service...');
  
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // Note: Cette méthode nécessite la clé service_role, pas anon_key
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      '9541fc58-32e8-43c0-b16c-f987e48e7072', // L'ID utilisateur de votre script
      { email_confirm: true }
    );

    if (error) {
      console.log('❌ Impossible de confirmer automatiquement (clé service requise)');
      console.log('🔍 Erreur:', error.message);
    } else {
      console.log('✅ Email confirmé automatiquement');
    }
  } catch (error) {
    console.log('❌ Impossible de confirmer automatiquement');
  }
}

async function runTests() {
  const authSuccess = await testSupabaseAuth();
  
  if (!authSuccess) {
    await confirmEmailWithServiceKey();
    console.log('\n🔄 Nouveau test après tentative de confirmation...');
    await testSupabaseAuth();
  }
}

if (require.main === module) {
  runTests();
}