#!/usr/bin/env node

/**
 * 🎯 SCRIPT DE DEBUG COMPLET - VOTE → QUIZ → QUESTIONS → RÉPONSES
 * 
 * Ce script teste le processus complet :
 * 1. Création d'un salon
 * 2. Système de vote sur les catégories
 * 3. Génération automatique du quiz basé sur le vote
 * 4. Création des questions par IA
 * 5. Simulation des réponses des participants
 * 6. Calcul des scores et résultats finaux
 * 
 * Usage :
 * node debug-vote-to-quiz-complete.js
 */

const axios = require('axios');
const readline = require('readline');

// Configuration
const config = {
  backendUrl: 'http://localhost:3001',
  frontendUrl: 'http://localhost:3000',
};

// Interface readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utilitaires
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  debug: (msg) => console.log(`${colors.cyan}🔍 ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.magenta}🎯 ${msg}${colors.reset}\n`)
};

// Variables globales pour les tests
let authToken = null;
let testUser = null;
let testRoom = null;
let voteSession = null;
let quizSession = null;
let participants = [];
let questions = [];
let currentQuestionIndex = 0;
let answers = [];

/**
 * 1. SETUP INITIAL
 */
async function setupTest() {
  log.section('SETUP INITIAL');
  
  try {
    // Connexion
    log.info('Connexion avec le compte...');
    const loginResponse = await axios.post(`${config.backendUrl}/auth/signin`, {
      email: 'magloirekitio1@gmail.com',
      password: '@Dieuestgrand6'
    });
    
    authToken = loginResponse.data.access_token;
    testUser = loginResponse.data.user;
    log.success(`Connecté: ${testUser.username}`);
    
    // Création du salon
    log.info('Création du salon de test...');
    const roomData = {
      name: `Test Vote→Quiz ${Date.now()}`,
      description: 'Salon pour tester le flux vote vers quiz',
      isPrivate: false,
      maxParticipants: 5,
      category: 'programming',
      difficulty: 'intermediate',
      timeLimit: 30
    };
    
    const roomResponse = await axios.post(`${config.backendUrl}/rooms`, roomData, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    testRoom = roomResponse.data;
    log.success(`Salon créé: ${testRoom.id}`);
    log.debug(`Salon: ${JSON.stringify(testRoom, null, 2)}`);
    
    return true;
  } catch (error) {
    log.error(`Erreur setup: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * 2. TEST DU SYSTÈME DE VOTE
 */
async function testVotingSystem() {
  log.section('TEST DU SYSTÈME DE VOTE');
  
  try {
    // Récupérer les catégories disponibles
    log.info('Récupération des catégories de vote...');
    const categoriesResponse = await axios.get(`${config.backendUrl}/voting/categories`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const categories = categoriesResponse.data.categories;
    log.success(`${categories.length} catégories disponibles`);
    log.debug(`Catégories: ${categories.map(c => c.title).join(', ')}`);
    
    // Créer une session de vote
    log.info('Création de la session de vote...');
    const voteData = {
      title: 'Vote pour le sujet du quiz',
      description: 'Choisissez le sujet sur lequel vous voulez être interrogés',
      type: 'category_selection',
      durationSeconds: 60,
      allowMultipleChoices: false,
      isAnonymous: false,
      requiresAllParticipants: false,
      allowAddOptions: false,
      settings: {
        autoStart: true,
        showResults: true,
        allowChangeVote: true
      },
      options: [
        {
          title: 'JavaScript',
          description: 'Questions sur JavaScript ES6+, React, Node.js',
          metadata: { category: 'javascript', difficulty: 'intermediate' }
        },
        {
          title: 'Python',
          description: 'Questions sur Python, Django, Data Science',
          metadata: { category: 'python', difficulty: 'intermediate' }
        },
        {
          title: 'Bases de données',
          description: 'SQL, NoSQL, PostgreSQL, MongoDB',
          metadata: { category: 'databases', difficulty: 'intermediate' }
        },
        {
          title: 'Cloud Computing',
          description: 'AWS, Azure, Docker, Kubernetes',
          metadata: { category: 'cloud', difficulty: 'intermediate' }
        }
      ]
    };
    
    const voteSessionResponse = await axios.post(
      `${config.backendUrl}/voting/rooms/${testRoom.id}/sessions`,
      voteData,
      { headers: { 'Authorization': `Bearer ${authToken}` } }
    );
    
    voteSession = voteSessionResponse.data;
    log.success(`Session de vote créée: ${voteSession.id}`);
    log.debug(`Vote session: ${JSON.stringify(voteSession, null, 2)}`);
    
    // Attendre que le vote démarre automatiquement
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Voter (simuler le choix de JavaScript)
    log.info('Émission du vote...');
    const voteChoice = voteSession.options[0]; // JavaScript
    const voteResponse = await axios.post(
      `${config.backendUrl}/voting/sessions/${voteSession.id}/votes`,
      {
        optionIds: [voteChoice.id],
        weight: 1,
        metadata: { reason: 'Test automatique' }
      },
      { headers: { 'Authorization': `Bearer ${authToken}` } }
    );
    
    log.success(`Vote émis pour: ${voteChoice.title}`);
    log.debug(`Vote response: ${JSON.stringify(voteResponse.data, null, 2)}`);
    
    // Terminer le vote
    log.info('Fin de la session de vote...');
    const endVoteResponse = await axios.post(
      `${config.backendUrl}/voting/sessions/${voteSession.id}/end`,
      {},
      { headers: { 'Authorization': `Bearer ${authToken}` } }
    );
    
    const finalVoteSession = endVoteResponse.data;
    log.success('Vote terminé!');
    log.success(`Résultat gagnant: ${finalVoteSession.results.winningOptions.join(', ')}`);
    log.debug(`Résultats complets: ${JSON.stringify(finalVoteSession.results, null, 2)}`);
    
    // Mettre à jour la session de vote
    voteSession = finalVoteSession;
    
    return true;
  } catch (error) {
    log.error(`Erreur vote: ${error.response?.data?.message || error.message}`);
    log.debug(`Status: ${error.response?.status}`);
    log.debug(`Response: ${JSON.stringify(error.response?.data, null, 2)}`);
    return false;
  }
}

/**
 * 3. GÉNÉRATION DU QUIZ BASÉ SUR LE VOTE
 */
async function generateQuizFromVote() {
  log.section('GÉNÉRATION DU QUIZ BASÉ SUR LE VOTE');
  
  try {
    if (!voteSession || !voteSession.results) {
      log.error('Aucun résultat de vote disponible');
      return false;
    }
    
    // Extraire la catégorie gagnante du vote
    const winningOption = voteSession.options.find(option => 
      voteSession.results.winningOptions.includes(option.title)
    );
    
    if (!winningOption) {
      log.error('Impossible de déterminer l\'option gagnante');
      return false;
    }
    
    const selectedCategory = winningOption.metadata.category;
    const selectedDifficulty = winningOption.metadata.difficulty;
    
    log.info(`Génération du quiz pour: ${winningOption.title} (${selectedCategory})`);
    
    // Créer la session de quiz
    const quizData = {
      title: `Quiz ${winningOption.title}`,
      description: `Quiz généré automatiquement basé sur le vote des participants`,
      type: 'multiplayer',
      categories: [selectedCategory],
      difficulty: selectedDifficulty,
      questionTypes: ['multiple_choice', 'true_false'],
      totalQuestions: 10,
      timePerQuestion: 30,
      settings: {
        randomizeQuestions: true,
        randomizeOptions: true,
        showCorrectAnswer: true,
        showExplanation: true,
        allowSkip: false
      },
      aiPromptSettings: {
        temperature: 0.7,
        avoidDuplicates: true,
        customPrompt: `Créez des questions ${selectedDifficulty} sur ${winningOption.title}. ${winningOption.description}`,
        focusAreas: [selectedCategory, winningOption.title],
        excludeTopics: []
      }
    };
    
    log.debug(`Quiz data: ${JSON.stringify(quizData, null, 2)}`);
    
    const quizResponse = await axios.post(
      `${config.backendUrl}/quiz/rooms/${testRoom.id}/sessions`,
      quizData,
      { headers: { 'Authorization': `Bearer ${authToken}` } }
    );
    
    quizSession = quizResponse.data;
    log.success(`Quiz créé: ${quizSession.id}`);
    log.success(`Titre: ${quizSession.title}`);
    log.success(`Catégorie: ${selectedCategory}`);
    log.success(`Difficulté: ${selectedDifficulty}`);
    log.success(`Questions: ${quizSession.totalQuestions}`);
    
    return true;
  } catch (error) {
    log.error(`Erreur génération quiz: ${error.response?.data?.message || error.message}`);
    log.debug(`Response: ${JSON.stringify(error.response?.data, null, 2)}`);
    return false;
  }
}

/**
 * 4. RÉCUPÉRATION DES QUESTIONS GÉNÉRÉES
 */
async function getGeneratedQuestions() {
  log.section('RÉCUPÉRATION DES QUESTIONS GÉNÉRÉES');
  
  try {
    if (!quizSession) {
      log.error('Aucune session de quiz disponible');
      return false;
    }
    
    // Attendre que les questions soient générées
    log.info('Attente de la génération des questions par l\'IA...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Récupérer les détails de la session avec les questions
    const sessionResponse = await axios.get(
      `${config.backendUrl}/quiz/sessions/${quizSession.id}`,
      { headers: { 'Authorization': `Bearer ${authToken}` } }
    );
    
    quizSession = sessionResponse.data;
    questions = quizSession.questions || [];
    
    log.success(`${questions.length} questions générées par l\'IA`);
    
    questions.forEach((question, index) => {
      log.info(`Question ${index + 1}: ${question.question}`);
      log.debug(`Type: ${question.type}, Difficulté: ${question.difficulty}`);
      if (question.options && question.options.length > 0) {
        log.debug(`Options: ${question.options.join(', ')}`);
      }
      log.debug(`Réponse: ${question.correctAnswer}`);
      log.debug(`Explication: ${question.explanation}`);
    });
    
    return true;
  } catch (error) {
    log.error(`Erreur récupération questions: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * 5. DÉMARRAGE DU QUIZ
 */
async function startQuiz() {
  log.section('DÉMARRAGE DU QUIZ');
  
  try {
    if (!quizSession) {
      log.error('Aucune session de quiz disponible');
      return false;
    }
    
    log.info('Démarrage de la session de quiz...');
    const startResponse = await axios.post(
      `${config.backendUrl}/quiz/sessions/${quizSession.id}/start`,
      {},
      { headers: { 'Authorization': `Bearer ${authToken}` } }
    );
    
    quizSession = startResponse.data;
    log.success(`Quiz démarré! Statut: ${quizSession.status}`);
    
    // Attendre le délai de démarrage
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    return true;
  } catch (error) {
    log.error(`Erreur démarrage quiz: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * 6. SIMULATION DES RÉPONSES
 */
async function simulateAnswers() {
  log.section('SIMULATION DES RÉPONSES');
  
  try {
    if (!questions || questions.length === 0) {
      log.error('Aucune question disponible');
      return false;
    }
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      log.info(`Réponse à la question ${i + 1}: ${question.question}`);
      
      // Simuler une réponse (parfois correcte, parfois incorrecte)
      let userAnswer;
      const isCorrectAnswer = Math.random() > 0.3; // 70% de chance de répondre correctement
      
      if (isCorrectAnswer) {
        userAnswer = question.correctAnswer;
        log.success('Réponse correcte simulée');
      } else {
        // Générer une mauvaise réponse
        if (question.options && question.options.length > 0) {
          const wrongOptions = question.options.filter(opt => opt !== question.correctAnswer);
          userAnswer = wrongOptions[Math.floor(Math.random() * wrongOptions.length)] || question.options[0];
        } else {
          userAnswer = 'Mauvaise réponse';
        }
        log.warning('Réponse incorrecte simulée');
      }
      
      // Simuler le temps de réponse (entre 5 et 25 secondes)
      const responseTime = Math.floor(Math.random() * 20000) + 5000;
      
      const answerData = {
        questionId: question.id,
        answer: userAnswer,
        responseTime: responseTime,
        startedAt: new Date(Date.now() - responseTime).toISOString(),
        metadata: {
          userAgent: 'Debug Script',
          confidence: Math.random()
        }
      };
      
      const answerResponse = await axios.post(
        `${config.backendUrl}/quiz/sessions/${quizSession.id}/answers`,
        answerData,
        { headers: { 'Authorization': `Bearer ${authToken}` } }
      );
      
      const answer = answerResponse.data;
      answers.push(answer);
      
      log.success(`Réponse enregistrée: ${userAnswer}`);
      log.info(`Points gagnés: ${answer.pointsEarned}`);
      log.info(`Temps de réponse: ${responseTime}ms`);
      log.info(`Streak: ${answer.streak}`);
      
      // Petite pause entre les questions
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return true;
  } catch (error) {
    log.error(`Erreur simulation réponses: ${error.response?.data?.message || error.message}`);
    log.debug(`Response: ${JSON.stringify(error.response?.data, null, 2)}`);
    return false;
  }
}

/**
 * 7. RÉCUPÉRATION DES RÉSULTATS FINAUX
 */
async function getFinalResults() {
  log.section('RÉCUPÉRATION DES RÉSULTATS FINAUX');
  
  try {
    if (!quizSession) {
      log.error('Aucune session de quiz disponible');
      return false;
    }
    
    // Attendre que le quiz se termine automatiquement
    log.info('Attente de la fin automatique du quiz...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Récupérer les résultats
    const resultsResponse = await axios.get(
      `${config.backendUrl}/quiz/sessions/${quizSession.id}/results`,
      { headers: { 'Authorization': `Bearer ${authToken}` } }
    );
    
    const results = resultsResponse.data;
    log.success(`Résultats récupérés pour ${results.length} participant(s)`);
    
    results.forEach((result, index) => {
      log.info(`Participant ${index + 1}: ${result.user.username}`);
      log.success(`Score final: ${result.finalScore}`);
      log.success(`Précision: ${(result.accuracy * 100).toFixed(1)}%`);
      log.success(`Bonnes réponses: ${result.correctAnswers}/${result.totalQuestions}`);
      log.success(`Temps total: ${result.totalTimeSpent}ms`);
      log.success(`Meilleur streak: ${result.bestStreak}`);
      log.success(`Rang: ${result.finalRank}/${result.totalParticipants}`);
    });
    
    return true;
  } catch (error) {
    log.error(`Erreur récupération résultats: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * 8. NETTOYAGE
 */
async function cleanup() {
  log.section('NETTOYAGE');
  
  try {
    if (testRoom) {
      log.info('Suppression du salon de test...');
      await axios.delete(`${config.backendUrl}/rooms/${testRoom.id}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      log.success('Salon supprimé');
    }
    
    return true;
  } catch (error) {
    log.warning('Impossible de supprimer le salon de test');
    return false;
  }
}

/**
 * TEST COMPLET
 */
async function runCompleteVoteToQuizTest() {
  log.section('🚀 DÉBUT DU TEST COMPLET VOTE → QUIZ → QUESTIONS → RÉPONSES');
  
  const results = {
    setup: false,
    voting: false,
    quizGeneration: false,
    questionGeneration: false,
    quizStart: false,
    answersSimulation: false,
    finalResults: false,
    cleanup: false
  };
  
  // Séquence de tests
  results.setup = await setupTest();
  if (results.setup) {
    results.voting = await testVotingSystem();
    if (results.voting) {
      results.quizGeneration = await generateQuizFromVote();
      if (results.quizGeneration) {
        results.questionGeneration = await getGeneratedQuestions();
        if (results.questionGeneration) {
          results.quizStart = await startQuiz();
          if (results.quizStart) {
            results.answersSimulation = await simulateAnswers();
            if (results.answersSimulation) {
              results.finalResults = await getFinalResults();
            }
          }
        }
      }
    }
    results.cleanup = await cleanup();
  }
  
  // Rapport final
  log.section('📊 RAPPORT FINAL');
  console.log('');
  
  Object.entries(results).forEach(([test, success]) => {
    const status = success ? '✅ SUCCÈS' : '❌ ÉCHEC';
    const color = success ? colors.green : colors.red;
    console.log(`${color}${status}${colors.reset} - ${test}`);
  });
  
  const successCount = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n📈 Score: ${successCount}/${totalTests} tests réussis`);
  
  if (successCount === totalTests) {
    log.success('🎉 FLUX COMPLET VOTE → QUIZ TESTÉ AVEC SUCCÈS !');
  } else {
    log.warning('⚠️  Certains tests ont échoué. Vérifiez les logs ci-dessus.');
  }
  
  return results;
}

/**
 * POINT D'ENTRÉE PRINCIPAL
 */
async function main() {
  console.log(`${colors.magenta}
╔══════════════════════════════════════════════════════════════╗
║              🎯 TEST COMPLET VOTE → QUIZ → RÉPONSES         ║
║                                                              ║
║  Ce script teste le flux complet :                          ║
║  1. 🗳️  Système de vote sur les catégories                   ║
║  2. 🤖 Génération automatique du quiz basé sur le vote      ║
║  3. ❓ Création des questions par l'IA                       ║
║  4. 🎮 Simulation des réponses des participants             ║
║  5. 🏆 Calcul des scores et résultats finaux                ║
║                                                              ║
║  Backend requis: ${config.backendUrl}                     ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);

  await runCompleteVoteToQuizTest();
  process.exit(0);
}

// Gestion des erreurs
process.on('unhandledRejection', (error) => {
  log.error(`Erreur non gérée: ${error.message}`);
  console.error(error);
});

process.on('SIGINT', () => {
  log.info('\nScript interrompu par l\'utilisateur');
  process.exit(0);
});

// Démarrage
if (require.main === module) {
  main().catch(error => {
    log.error(`Erreur fatale: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  setupTest,
  testVotingSystem,
  generateQuizFromVote,
  getGeneratedQuestions,
  startQuiz,
  simulateAnswers,
  getFinalResults,
  runCompleteVoteToQuizTest
};