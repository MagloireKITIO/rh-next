/**
 * Script de test simple pour vérifier le système d'automatisation
 * Execute avec: node test-automation.js
 */

const baseUrl = 'http://localhost:3001/api';

async function testAutomation() {
  console.log('🚀 Test du système d\'automatisation...\n');

  try {
    // 1. Vérifier si l'API est accessible
    console.log('1. Test de connexion API...');
    const testResponse = await fetch(`${baseUrl}/mail-automation`).catch(() => null);
    
    if (!testResponse) {
      console.log('❌ API non accessible. Vérifiez que le serveur backend est démarré sur le port 3001');
      return;
    }
    console.log('✅ API accessible\n');

    // 2. Lister les automatisations existantes
    console.log('2. Vérification des automatisations...');
    try {
      const automationsResponse = await fetch(`${baseUrl}/mail-automation`);
      if (automationsResponse.ok) {
        const automations = await automationsResponse.json();
        console.log(`✅ ${automations.length} automatisations trouvées`);
        
        if (automations.length === 0) {
          console.log('⚠️  PROBLÈME: Aucune automatisation configurée!');
          console.log('   Solution: Créez une automatisation avec le déclencheur ON_CREATE pour les candidats\n');
        } else {
          automations.forEach(auto => {
            console.log(`   - ${auto.title} (${auto.entity_type} ${auto.trigger_event}) ${auto.is_active ? '✅' : '❌'}`);
          });
        }
      }
    } catch (error) {
      console.log('❌ Erreur lors de la récupération des automatisations:', error.message);
    }

    // 3. Test de récupération des projets actifs
    console.log('\n3. Récupération des projets actifs...');
    try {
      const projectsResponse = await fetch(`${baseUrl}/projects/job-offers`);
      if (projectsResponse.ok) {
        const projects = await projectsResponse.json();
        console.log(`✅ ${projects.length} projets actifs trouvés`);
        
        if (projects.length > 0) {
          const testProject = projects[0];
          console.log(`   Premier projet: ${testProject.name} (ID: ${testProject.id})`);
          
          // 4. Instructions pour le test manuel
          console.log('\n4. TEST MANUEL:');
          console.log('================');
          console.log('Ouvrez votre navigateur et allez à:');
          console.log(`http://localhost:3000/apply/${testProject.id}`);
          console.log('\nSoumettez une candidature de test et surveillez les logs du backend.');
          console.log('Vous devriez voir ces messages:');
          console.log('- "🔧 afterInsert called"');
          console.log('- "🎯 Auto-triggering CANDIDATE ON_CREATE automation"');
          console.log('- "✅ Successfully triggered CANDIDATE ON_CREATE automation"');
          
        } else {
          console.log('❌ Aucun projet actif trouvé pour le test');
        }
      }
    } catch (error) {
      console.log('❌ Erreur lors de la récupération des projets:', error.message);
    }

    // 5. Diagnostic des logs
    console.log('\n5. DIAGNOSTIC DES LOGS:');
    console.log('=======================');
    console.log('Surveillez les logs de votre application Node.js pour:');
    console.log('');
    console.log('✅ SI TOUT FONCTIONNE, vous verrez:');
    console.log('   - "🔧 AutomationSubscriber constructor called"');
    console.log('   - "🔧 afterInsert called" lors de créations');
    console.log('   - "🎯 Auto-triggering..." messages');
    console.log('   - Messages d\'envoi d\'email');
    console.log('');
    console.log('❌ SI ÇA NE FONCTIONNE PAS, vous verrez:');
    console.log('   - Pas de messages "🔧" du Subscriber');
    console.log('   - Seulement: "📧 Automation triggers will be executed automatically"');
    console.log('   - Pas d\'emails envoyés');

    // 6. Solutions possibles
    console.log('\n6. SOLUTIONS SI LE SUBSCRIBER NE FONCTIONNE PAS:');
    console.log('================================================');
    console.log('Option A - Forcer l\'enregistrement du subscriber:');
    console.log('   Modifiez app.module.ts ligne 33 pour:');
    console.log('   subscribers: [AutomationSubscriber],');
    console.log('');
    console.log('Option B - Réactiver les appels manuels:');
    console.log('   Décommentez les lignes dans projects.service.ts:508-510');
    console.log('   Et réimportez AutomationTriggerService');
    console.log('');
    console.log('Option C - Vérifier les logs détaillés:');
    console.log('   Ajoutez LOG_LEVEL=debug dans votre fichier .env');

  } catch (error) {
    console.log('💥 Erreur inattendue:', error.message);
  }
}

// Fonction utilitaire pour créer une automatisation de test
function createTestAutomation() {
  console.log('\n📋 AUTOMATISATION DE TEST À CRÉER');
  console.log('==================================');
  console.log('Utilisez cette configuration pour créer une automatisation via l\'API:');
  console.log('');
  console.log('POST /mail-automation');
  console.log(JSON.stringify({
    title: 'Test - Nouvelle candidature',
    description: 'Email automatique lors d\'une nouvelle candidature',
    entity_type: 'CANDIDATE',
    trigger_event: 'ON_CREATE',
    is_active: true,
    recipients: ['test@example.com'], // Remplacez par votre email
    mail_template: {
      subject: 'Nouvelle candidature: {{name}}',
      html_content: '<h1>Nouvelle candidature reçue</h1><p>Nom: {{name}}</p><p>Email: {{email}}</p><p>Projet: {{project_name}}</p>',
      text_content: 'Nouvelle candidature - Nom: {{name}} - Email: {{email}} - Projet: {{project_name}}'
    },
    conditions: [],
    template_variables: {}
  }, null, 2));
}

// Point d'entrée
if (typeof fetch === 'undefined') {
  // Pour Node.js < 18
  console.log('⚠️  Ce script nécessite Node.js 18+ ou l\'installation de node-fetch');
  console.log('Vous pouvez également copier-coller ce code dans la console du navigateur');
} else {
  testAutomation().then(() => {
    createTestAutomation();
    console.log('\n✨ Test terminé! Suivez les instructions ci-dessus pour déboguer.');
  });
}