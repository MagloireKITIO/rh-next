/**
 * Script de débogage pour analyser le système d'automatisation d'emails
 * Ce script teste tous les composants du système d'automatisation
 * 
 * Usage: node automation-debug.js
 */

const { execSync } = require('child_process');

// Configuration de test
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3001',
  testProjectId: null, // À remplir avec un vrai ID de projet
  testCandidateName: 'Test Debug Candidate',
  testEmail: 'debug@test.com'
};

console.log('🔍 DIAGNOSTIC DU SYSTÈME D\'AUTOMATISATION D\'EMAILS');
console.log('====================================================\n');

// 1. Test de connexion à l'API
async function testApiConnection() {
  console.log('1️⃣ Test de connexion à l\'API...');
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/health`);
    if (response.ok) {
      console.log('✅ API accessible');
      return true;
    } else {
      console.log('❌ API non accessible:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur de connexion API:', error.message);
    return false;
  }
}

// 2. Vérifier les automatisations configurées
async function checkAutomations() {
  console.log('\n2️⃣ Vérification des automatisations configurées...');
  try {
    // Cette route devrait exister dans votre API
    const response = await fetch(`${TEST_CONFIG.baseUrl}/mail-automation`);
    if (response.ok) {
      const automations = await response.json();
      console.log(`✅ ${automations.length} automatisations trouvées`);
      
      // Analyser les automatisations
      automations.forEach((auto, index) => {
        console.log(`  ${index + 1}. ${auto.title}`);
        console.log(`     - Entité: ${auto.entity_type}`);
        console.log(`     - Déclencheur: ${auto.trigger_event}`);
        console.log(`     - Active: ${auto.is_active ? '✅' : '❌'}`);
        console.log(`     - Conditions: ${auto.conditions?.length || 0}`);
      });
      
      return automations;
    } else {
      console.log('❌ Impossible de récupérer les automatisations');
      return [];
    }
  } catch (error) {
    console.log('❌ Erreur lors de la vérification des automatisations:', error.message);
    return [];
  }
}

// 3. Tester l'AutomationSubscriber via les logs
function checkSubscriberLogs() {
  console.log('\n3️⃣ Analyse des logs TypeORM Subscriber...');
  
  // Instructions pour l'utilisateur
  console.log('📋 Vérifiez les logs de votre application pour ces messages:');
  console.log('   - "🔧 AutomationSubscriber constructor called"');
  console.log('   - "🔧 DataSource available: true"');
  console.log('   - "🔧 afterInsert called" lors de création d\'entité');
  console.log('   - "🎯 Auto-triggering CANDIDATE ON_CREATE automation"');
  console.log('\n⚠️  Si ces logs n\'apparaissent pas, le Subscriber n\'est pas correctement enregistré.\n');
}

// 4. Vérifier la configuration du module
async function checkModuleConfiguration() {
  console.log('4️⃣ Points de vérification de la configuration du module:');
  
  const checks = [
    {
      name: 'AutomationSubscriber dans MailAutomationModule',
      description: 'Vérifiez que AutomationSubscriber est dans les providers du module'
    },
    {
      name: 'SubscribersModule importé dans AppModule',
      description: 'Le module SubscribersModule doit être importé dans AppModule'
    },
    {
      name: 'TypeORM Subscribers configuration',
      description: 'subscribers: [AutomationSubscriber] dans TypeOrmModule.forRoot()'
    },
    {
      name: 'AutomationTriggerService disponible',
      description: 'Le service AutomationTriggerService doit être injectable'
    }
  ];

  checks.forEach((check, index) => {
    console.log(`   ${index + 1}. ${check.name}`);
    console.log(`      📝 ${check.description}`);
  });
}

// 5. Test manuel de création de candidat
async function testCandidateCreation() {
  console.log('\n5️⃣ Test de création de candidat (simulation)...');
  
  if (!TEST_CONFIG.testProjectId) {
    console.log('⚠️  Configurez TEST_CONFIG.testProjectId avec un ID de projet valide pour tester la création');
    return;
  }

  try {
    // Simuler la création d'un candidat via l'API publique
    const formData = new FormData();
    formData.append('name', TEST_CONFIG.testCandidateName);
    formData.append('email', TEST_CONFIG.testEmail);
    formData.append('phone', '+33123456789');

    // Créer un faux fichier PDF pour le test
    const fakeCV = new Blob(['Test CV content'], { type: 'application/pdf' });
    formData.append('cv', fakeCV, 'test-cv.pdf');

    console.log('📤 Envoi de la candidature de test...');
    console.log(`   Nom: ${TEST_CONFIG.testCandidateName}`);
    console.log(`   Email: ${TEST_CONFIG.testEmail}`);
    console.log('   CV: test-cv.pdf');

    const response = await fetch(`${TEST_CONFIG.baseUrl}/projects/${TEST_CONFIG.testProjectId}/apply`, {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Candidature créée avec succès:', result.candidateId);
      console.log('   🔍 Surveillez maintenant les logs pour voir si l\'automatisation se déclenche');
      return result.candidateId;
    } else {
      const error = await response.text();
      console.log('❌ Erreur lors de la création:', error);
    }
  } catch (error) {
    console.log('❌ Erreur lors du test de candidature:', error.message);
  }
}

// 6. Vérifier les services de mail
async function checkMailServices() {
  console.log('\n6️⃣ Vérification des services de mail...');
  
  const services = [
    'MailService (mail-configuration/mail.service.ts)',
    'MailAutomationService (mail-automation/services/mail-automation.service.ts)',
    'AutomationTriggerService (mail-automation/services/automation-trigger.service.ts)',
    'ConditionEvaluatorService (mail-automation/services/condition-evaluator.service.ts)'
  ];

  console.log('📋 Services requis pour le fonctionnement:');
  services.forEach((service, index) => {
    console.log(`   ${index + 1}. ${service}`);
  });

  console.log('\n🔧 Vérifiez que tous ces services sont correctement injectés et disponibles');
}

// 7. Script de diagnostic complet
async function runDiagnostic() {
  console.log('🚀 Début du diagnostic...\n');

  // Tests séquentiels
  const apiOk = await testApiConnection();
  if (!apiOk) {
    console.log('\n❌ Diagnostic arrêté - API non accessible');
    return;
  }

  const automations = await checkAutomations();
  
  checkSubscriberLogs();
  checkModuleConfiguration();
  await checkMailServices();
  
  if (automations.length === 0) {
    console.log('\n⚠️  PROBLÈME DÉTECTÉ: Aucune automatisation configurée');
    console.log('   Solution: Créez au moins une automatisation pour les candidats avec le déclencheur ON_CREATE');
  }

  // Test optionnel de création de candidat
  await testCandidateCreation();

  // Résumé des actions à effectuer
  console.log('\n📋 ACTIONS DE DÉBOGAGE RECOMMANDÉES:');
  console.log('=====================================');
  console.log('1. Vérifiez les logs de l\'application pour les messages du Subscriber');
  console.log('2. Assurez-vous qu\'au moins une automatisation est configurée et active');
  console.log('3. Vérifiez que tous les modules sont correctement importés');
  console.log('4. Testez la création d\'un candidat et surveillez les logs');
  console.log('5. Vérifiez la configuration du service de mail');
  
  console.log('\n💡 ASTUCE: Activez les logs détaillés en définissant LOG_LEVEL=debug dans votre .env');
}

// Fonction d'assistance pour générer des données de test
function generateTestData() {
  console.log('\n🧪 GÉNÉRATION DE DONNÉES DE TEST');
  console.log('================================');
  
  const testAutomation = {
    title: 'Test - Nouvelle candidature reçue',
    description: 'Automatisation de test pour déboguer le système',
    entity_type: 'CANDIDATE',
    trigger_event: 'ON_CREATE',
    is_active: true,
    recipients: ['debug@test.com'],
    mail_template: {
      subject: 'Test - Nouvelle candidature: {{name}}',
      html_content: '<h1>Test automatisation</h1><p>Candidat: {{name}}</p><p>Email: {{email}}</p>',
      text_content: 'Test automatisation - Candidat: {{name}} - Email: {{email}}'
    },
    conditions: [], // Aucune condition pour simplifier le test
    template_variables: {
      company_name: 'Société Test'
    }
  };

  console.log('📝 Automatisation de test à créer via API POST /mail-automation:');
  console.log(JSON.stringify(testAutomation, null, 2));
}

// Point d'entrée principal
async function main() {
  try {
    await runDiagnostic();
    generateTestData();
    
    console.log('\n✨ Diagnostic terminé!');
    console.log('   Consultez les résultats ci-dessus pour identifier les problèmes.');
  } catch (error) {
    console.error('\n💥 Erreur lors du diagnostic:', error);
  }
}

// Configuration pour Node.js
if (typeof window === 'undefined') {
  // Polyfill fetch pour Node.js si nécessaire
  if (typeof fetch === 'undefined') {
    console.log('⚠️  fetch non disponible. Installez node-fetch ou utilisez Node.js 18+');
  }
  
  // Exécuter le diagnostic
  main();
} else {
  console.log('💻 Ce script peut être exécuté dans la console du navigateur ou avec Node.js');
}