const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3001';
const ADMIN_EMAIL = 'admin@votre-domaine.com';
const ADMIN_PASSWORD = 'MotDePasseSecurise123!';

async function testAdminLogin() {
  console.log('🧪 Test de connexion administrateur');
  console.log('=====================================');
  console.log(`📧 Email: ${ADMIN_EMAIL}`);
  console.log(`🔐 Password: ${ADMIN_PASSWORD}`);
  console.log(`🌐 API URL: ${API_BASE_URL}`);
  console.log('');

  try {
    // 1. Test de l'endpoint /auth/admin/login
    console.log('🔄 Test POST /auth/admin/login...');
    
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/admin/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ Connexion réussie !');
    console.log('📊 Status:', loginResponse.status);
    console.log('🎫 Token reçu:', loginResponse.data.access_token ? 'OUI' : 'NON');
    console.log('👤 Utilisateur:', loginResponse.data.user);
    console.log('🎯 Rôle:', loginResponse.data.user?.role);
    console.log('');

    // 2. Test du profil avec le token
    if (loginResponse.data.access_token) {
      console.log('🔄 Test GET /auth/profile avec le token...');
      
      const profileResponse = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${loginResponse.data.access_token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log('✅ Profil récupéré !');
      console.log('📊 Status:', profileResponse.status);
      console.log('👤 Profil:', profileResponse.data);
    }

    console.log('');
    console.log('🎉 Tous les tests sont passés avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du test:');
    
    if (error.response) {
      // La requête a été faite et le serveur a répondu avec un code d'erreur
      console.error('📊 Status:', error.response.status);
      console.error('📝 Message:', error.response.data?.message || 'Aucun message');
      console.error('🔍 Data complète:', error.response.data);
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      console.error('📡 Aucune réponse du serveur');
      console.error('🔍 Request:', error.request);
    } else {
      // Quelque chose s'est mal passé lors de la configuration de la requête
      console.error('⚙️ Erreur de configuration:', error.message);
    }
    
    console.error('');
    console.error('🔧 Vérifications à faire:');
    console.error('1. Le backend est-il démarré sur le port 3001 ?');
    console.error('2. L\'utilisateur admin existe-t-il dans la base ?');
    console.error('3. Le rôle est-il bien "super_admin" ?');
    console.error('4. Les endpoints /auth/admin/login et /auth/profile existent-ils ?');
  }
}

// Fonction pour tester la disponibilité du serveur
async function testServerAvailability() {
  try {
    console.log('🔄 Test de disponibilité du serveur...');
    // Test avec l'endpoint auth qui existe sûrement
    const response = await axios.get(`${API_BASE_URL}/api/auth/debug-user`, {
      timeout: 5000
    });
    console.log('✅ Serveur disponible - Status:', response.status);
    return true;
  } catch (error) {
    if (error.response && error.response.status) {
      console.log(`✅ Serveur disponible - Status: ${error.response.status} (endpoint debug inexistant mais serveur répond)`);
      return true;
    }
    console.error('❌ Serveur non disponible:', error.message);
    return false;
  }
}

// Fonction principale
async function runTests() {
  console.log('🚀 Démarrage des tests de connexion admin');
  console.log('==========================================');
  console.log('');

  // Test de disponibilité du serveur
  const isServerAvailable = await testServerAvailability();
  console.log('');
  
  if (!isServerAvailable) {
    console.log('❌ Tests interrompus - serveur non disponible');
    return;
  }

  // Test de connexion admin
  await testAdminLogin();
}

// Exécuter les tests
if (require.main === module) {
  runTests();
}

module.exports = { testAdminLogin, testServerAvailability };