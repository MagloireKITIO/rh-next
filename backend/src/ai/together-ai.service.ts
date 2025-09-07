import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ApiKeysService } from '../api-keys/api-keys.service';
import { OpenRouterService } from '../openrouter/openrouter.service';
import { ApiKeyModelConfigService } from '../api-keys/api-key-model-config.service';

interface TogetherAIAccount {
  apiKey: string;
  apiKeyId: string; // Ajout de l'ID pour retrouver la config
  isActive: boolean;
  lastUsed?: Date;
  requestCount: number;
  maxRequests: number;
}

@Injectable()
export class TogetherAIService {
  private readonly logger = new Logger(TogetherAIService.name);
  private accounts: TogetherAIAccount[] = [];
  private currentAccountIndex = 0;

  constructor(
    private apiKeysService: ApiKeysService,
    private openRouterService: OpenRouterService,
    private apiKeyModelConfigService: ApiKeyModelConfigService
  ) {
    this.initializeAccounts();
  }

  private async initializeAccounts() {
    try {
      const apiKeysWithIds = await this.apiKeysService.findActiveWithIds();
      this.accounts = apiKeysWithIds.map(keyData => ({
        apiKeyId: keyData.id,
        apiKey: keyData.key,
        isActive: true,
        requestCount: 0,
        maxRequests: 1000, // Limite par défaut
      }));
      this.logger.log(`🔑 Initialized ${this.accounts.length} API key accounts`);
    } catch (error) {
      this.logger.warn('Failed to load API keys from database, falling back to environment variables');
      const apiKeys = process.env.OPENROUTER_API_KEYS?.split(',') || [];
      this.accounts = apiKeys.map((key, index) => ({
        apiKeyId: `env-fallback-${index}`, // ID factice pour les clés d'environnement
        apiKey: key.trim(),
        isActive: true,
        requestCount: 0,
        maxRequests: 1000,
      }));
      this.logger.warn(`🔑 Using ${this.accounts.length} fallback API keys from environment`);
    }
  }

  private async getAccountsForCompany(companyId?: string): Promise<TogetherAIAccount[]> {
    try {
      let apiKeysWithIds: { id: string; key: string }[] = [];
      
      if (companyId) {
        // D'abord essayer les clés spécifiques à l'entreprise
        apiKeysWithIds = await this.apiKeysService.findActiveByCompanyWithIds(companyId);
        
        // Si aucune clé spécifique, utiliser les clés globales
        if (apiKeysWithIds.length === 0) {
          apiKeysWithIds = await this.apiKeysService.findActiveGlobalWithIds();
        }
      } else {
        // Pas d'entreprise spécifiée, utiliser toutes les clés actives
        apiKeysWithIds = await this.apiKeysService.findActiveWithIds();
      }

      return apiKeysWithIds.map(keyData => ({
        apiKeyId: keyData.id,
        apiKey: keyData.key,
        isActive: true,
        requestCount: 0,
        maxRequests: 1000,
      }));
    } catch (error) {
      this.logger.warn('Failed to load API keys, using default accounts');
      return this.accounts;
    }
  }

  private getNextAvailableAccount(): TogetherAIAccount | null {
    const startIndex = this.currentAccountIndex;
    
    // D'abord, essayer de trouver un compte actif avec des requêtes disponibles
    do {
      const account = this.accounts[this.currentAccountIndex];
      
      if (account.isActive && account.requestCount < account.maxRequests) {
        // Passer au compte suivant pour la prochaine rotation
        this.currentAccountIndex = (this.currentAccountIndex + 1) % this.accounts.length;
        return account;
      }
      
      this.currentAccountIndex = (this.currentAccountIndex + 1) % this.accounts.length;
    } while (this.currentAccountIndex !== startIndex);

    // Si aucun compte actif trouvé, essayer de réactiver des comptes avec rate limit expiré
    this.resetAccountLimits();
    
    // Réessayer une fois après le reset
    do {
      const account = this.accounts[this.currentAccountIndex];
      
      if (account.isActive && account.requestCount < account.maxRequests) {
        this.currentAccountIndex = (this.currentAccountIndex + 1) % this.accounts.length;
        return account;
      }
      
      this.currentAccountIndex = (this.currentAccountIndex + 1) % this.accounts.length;
    } while (this.currentAccountIndex !== startIndex);

    return null;
  }

  private markAccountAsUsed(account: TogetherAIAccount) {
    account.lastUsed = new Date();
    account.requestCount++;
    
    if (account.requestCount >= account.maxRequests) {
      account.isActive = false;
      this.logger.warn(`Account ${account.apiKey.substring(0, 8)}... has reached its limit`);
    }
  }

  private resetAccountLimits() {
    const now = new Date();
    this.accounts.forEach(account => {
      if (account.lastUsed) {
        const minutesSinceLastUse = (now.getTime() - account.lastUsed.getTime()) / (1000 * 60);
        // Reset après 1 heure pour les rate limits temporaires
        if (minutesSinceLastUse >= 60) {
          account.requestCount = 0;
          account.isActive = true;
          this.logger.log(`Reset account ${account.apiKey.substring(0, 8)}... after rate limit cooldown`);
        }
      }
    });
  }

  // Récupérer les modèles configurés pour une clé API
  private async getConfiguredModels(account: TogetherAIAccount): Promise<string[]> {
    try {
      // Récupérer la configuration des modèles pour cette clé API
      const models = await this.apiKeyModelConfigService.getModelsFallbackOrder(account.apiKeyId);
      
      if (models.length > 0) {
        this.logger.log(`🎯 Using configured models for key ${account.apiKey.substring(0, 8)}...: ${models.join(', ')}`);
        return models;
      }

      // Si pas de configuration, utiliser les modèles par défaut
      this.logger.log(`⚙️ No configuration found for key ${account.apiKey.substring(0, 8)}..., using defaults`);
      return this.getDefaultModels();
      
    } catch (error) {
      this.logger.warn(`Could not fetch configured models: ${error.message}`);
      return this.getDefaultModels();
    }
  }

  // Modèles par défaut équilibrés coût/performance
  private getDefaultModels(): string[] {
    return [
      'meta-llama/llama-3.2-11b-vision-instruct', // Bon rapport qualité/prix
      'anthropic/claude-3-haiku', // Rapide et économique  
      'openai/gpt-3.5-turbo' // Fallback fiable
    ];
  }

  async analyzeCV(cvText: string, jobDescription: string, customPrompt?: string, companyId?: string): Promise<any> {
    this.logger.log(`🔍 Starting CV analysis for company: ${companyId || 'global'}`);
    this.logger.log(`📄 CV text length: ${cvText.length} characters`);
    this.logger.log(`💼 Job description length: ${jobDescription.length} characters`);
    
    // Utiliser les clés spécifiques à l'entreprise
    const companyAccounts = await this.getAccountsForCompany(companyId);
    
    if (companyAccounts.length === 0) {
      this.logger.error('❌ No API keys available for company');
      throw new Error('Aucune clé API OpenRouter disponible pour cette entreprise. Contactez votre administrateur.');
    }

    // Utiliser la première clé disponible pour cette entreprise
    const account = companyAccounts[0];
    if (!account) {
      this.logger.error('❌ No available accounts found');
      throw new Error('No available OpenRouter AI accounts');
    }

    this.logger.log(`🔑 Using API key: ${account.apiKey.substring(0, 8)}...`);
    this.logger.log(`📊 Account usage: ${account.requestCount}/${account.maxRequests} requests`)

    // Pas de délai ici car c'est géré par la queue
    // Le délai est maintenant géré par AnalysisQueueService

    const prompt = customPrompt || this.getDefaultPrompt();
    const fullPrompt = `${prompt}

JOB DESCRIPTION:
${jobDescription}

CV CONTENT:
${cvText}

Analysez ce CV et fournissez une réponse JSON avec la structure suivante :
{
  "score": number (0-100),
  "summary": "Résumé succinct du candidat",
  "strengths": ["liste", "des", "points forts"],
  "weaknesses": ["liste", "des", "faiblesses"], 
  "recommendations": ["liste", "des", "recommandations"],
  "hrDecision": {
    "recommendation": "RECRUTER|ENTRETIEN|REJETER",
    "confidence": number (0-100),
    "reasoning": "Justification de la décision",
    "priority": "HIGH|MEDIUM|LOW"
  },
  "skillsMatch": {
    "technical": number (0-100),
    "experience": number (0-100), 
    "cultural": number (0-100),
    "overall": number (0-100)
  },
  "risks": ["liste", "des", "risques identifiés"],
  "extractedData": {
    "name": "nom du candidat",
    "email": "email si trouvé", 
    "phone": "téléphone si trouvé",
    "experience": "années d'expérience",
    "skills": ["liste", "des", "compétences"],
    "education": "parcours éducatif",
    "seniority": "JUNIOR|MIDDLE|SENIOR|LEAD"
  }
}`;

    // Récupérer les modèles configurés pour cette clé API
    const configuredModels = await this.getConfiguredModels(account);
    const selectedModel = configuredModels[0]; // Utiliser le modèle principal configuré

    this.logger.log(`🤖 Configured models: ${configuredModels.join(', ')}`);
    this.logger.log(`✨ Selected primary model: ${selectedModel}`);

    try {
      this.logger.log(`🤖 Making AI request with model: ${selectedModel}`);
      this.logger.log(`⏱️ Request started at: ${new Date().toISOString()}`);
      
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: selectedModel,
          messages: [
            {
              role: 'user',
              content: fullPrompt
            }
          ],
          max_tokens: 2048,
          temperature: 0.1,
          top_p: 0.9,
        },
        {
          headers: {
            'Authorization': `Bearer ${account.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://your-app.com', // Optionnel mais recommandé
            'X-Title': 'RH-Next CV Analysis', // Optionnel mais recommandé
          },
        }
      );

      this.logger.log(`✅ AI request completed successfully`);
      this.logger.log(`⏱️ Response received at: ${new Date().toISOString()}`);
      this.logger.log(`📈 Response status: ${response.status} ${response.statusText}`);
      
      this.markAccountAsUsed(account);
      
      // Analyser les headers de rate limiting si disponibles
      const rateLimitHeaders = response.headers;
      if (rateLimitHeaders['x-ratelimit-remaining']) {
        const remaining = parseInt(rateLimitHeaders['x-ratelimit-remaining']);
        this.logger.log(`📊 Rate limit remaining: ${remaining} requests`);
        if (remaining <= 5) { // Si il reste moins de 5 requêtes
          this.logger.warn(`⚠️ Account ${account.apiKey.substring(0, 8)}... has only ${remaining} requests remaining`);
        }
      }
      
      // Mettre à jour le compteur d'utilisation dans la base de données
      try {
        await this.apiKeysService.incrementUsage(account.apiKey);
        this.logger.log(`💾 API key usage updated in database`);
      } catch (error) {
        this.logger.warn('Failed to update API key usage in database', error);
      }
      
      const aiResponse = response.data.choices?.[0]?.message?.content || response.data.output?.choices?.[0]?.text;
      this.logger.log(`📝 AI response length: ${aiResponse?.length || 0} characters`);
      
      try {
        // Nettoyer la réponse et extraire le JSON
        let cleanResponse = aiResponse;
        
        // Gérer les blocs de code markdown
        if (aiResponse.includes('```json')) {
          cleanResponse = aiResponse.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
        } else if (aiResponse.includes('```')) {
          cleanResponse = aiResponse.replace(/```\s*/g, '');
        }
        
        // Extraire le JSON même s'il y a du texte avant/après
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanResponse = jsonMatch[0];
        }
        
        // Nettoyer le JSON pour corriger les erreurs communes
        const fixedJson = this.fixCommonJsonErrors(cleanResponse.trim());
        const parsedResponse = JSON.parse(fixedJson);
        
        this.logger.log(`🎯 Successfully parsed AI response - Score: ${parsedResponse.score || 'N/A'}`);
        this.logger.log(`📊 HR Decision: ${parsedResponse.hrDecision?.recommendation || 'N/A'} (Confidence: ${parsedResponse.hrDecision?.confidence || 'N/A'}%)`);
        this.logger.log(`👤 Extracted candidate: ${parsedResponse.extractedData?.name || 'N/A'} (${parsedResponse.extractedData?.email || 'N/A'})`);
        
        // Nettoyer l'email extrait s'il contient des caractères parasites
        if (parsedResponse.extractedData?.email) {
          parsedResponse.extractedData.email = this.cleanEmail(parsedResponse.extractedData.email);
        }
        
        return parsedResponse;
      } catch (parseError) {
        this.logger.warn('❌ Failed to parse AI response as JSON, returning raw response');
        this.logger.warn(`Parse error details: ${parseError.message}`);
        this.logger.warn(`🔍 Raw JSON that failed to parse:`, aiResponse.substring(0, 2000));
        this.logger.warn(`🔧 Fixed JSON attempt:`, this.fixCommonJsonErrors(aiResponse).substring(0, 2000));
        
        // Si le CV est vide ou contient un message d'erreur, score = 0
        const isEmptyCV = cvText.includes('[PDF extraction failed]') || 
                         cvText.includes('[PDF processing error]') || 
                         cvText.trim().length < 20;
        
        const fallbackResult = {
          score: isEmptyCV ? 0 : 25, // Score minimal pour parsing échoué mais CV valide
          summary: isEmptyCV ? 'Impossible d\'analyser : échec de l\'extraction PDF' : 'Analyse terminée mais format de réponse à revoir',
          aiResponse,
          extractedData: {},
          hrDecision: {
            recommendation: 'REJETER' as const,
            confidence: isEmptyCV ? 95 : 50,
            reasoning: isEmptyCV ? 'CV impossible à analyser - extraction PDF échouée' : 'Erreur de parsing - recommandation par défaut',
            priority: 'LOW' as const
          },
          strengths: [],
          weaknesses: isEmptyCV ? ['CV illisible'] : ['Réponse IA mal formatée'],
          recommendations: ['Vérifier le fichier CV et relancer l\'analyse'],
          skillsMatch: {
            technical: 0,
            experience: 0,
            cultural: 0,
            overall: 0
          },
          risks: ['Analyse incomplète']
        };
        
        this.logger.warn(`🔄 Returning fallback result with score: ${fallbackResult.score}`);
        return fallbackResult;
      }
    } catch (error) {
      this.logger.error(`💥 Error with OpenRouter AI account ${account.apiKey.substring(0, 8)}...`, error.message);
      
      // Log plus détaillé pour diagnostiquer
      if (error.response) {
        this.logger.error(`🔴 HTTP Status: ${error.response.status} ${error.response.statusText}`);
        this.logger.error(`📄 Response data:`, JSON.stringify(error.response.data, null, 2));
        this.logger.error(`📋 Response headers:`, error.response.headers);
      } else if (error.request) {
        this.logger.error(`📡 No response received - Network or timeout error`);
        this.logger.error(`Request details:`, error.request?.method, error.request?.url);
      } else {
        this.logger.error(`⚙️ Request setup error:`, error.message);
      }
      
      if (error.response?.status === 429 || error.response?.status === 402) {
        account.isActive = false;
        this.logger.warn(`🚫 Marking account as inactive due to rate limit or payment issue`);
      }
      
      // Si le modèle principal échoue, essayer avec le suivant
      const nextModelIndex = configuredModels.indexOf(selectedModel) + 1;
      if (nextModelIndex < configuredModels.length) {
        const fallbackModel = configuredModels[nextModelIndex];
        this.logger.warn(`🔄 ${selectedModel} failed, retrying with ${fallbackModel}`);
        return this.retryWithFallbackModel(cvText, jobDescription, customPrompt, account, configuredModels, nextModelIndex);
      }
      
      this.logger.error(`❌ AI analysis completely failed for account ${account.apiKey.substring(0, 8)}...`);
      throw new Error(`OpenRouter AI analysis failed: ${error.message}`);
    }
  }

  private async retryWithFallbackModel(
    cvText: string, 
    jobDescription: string, 
    customPrompt?: string, 
    account?: any, 
    availableModels?: string[], 
    modelIndex?: number
  ): Promise<any> {
    const fallbackModel = availableModels?.[modelIndex] || 'anthropic/claude-3-haiku';
    this.logger.log(`🔄 Retrying with fallback model: ${fallbackModel}`);
    const prompt = customPrompt || this.getDefaultPrompt();
    const fullPrompt = `${prompt}

JOB DESCRIPTION:
${jobDescription}

CV CONTENT:
${cvText}

Analysez ce CV et fournissez une réponse JSON avec la structure suivante :
{
  "score": number (0-100),
  "summary": "Résumé succinct du candidat",
  "strengths": ["liste", "des", "points forts"],
  "weaknesses": ["liste", "des", "faiblesses"], 
  "recommendations": ["liste", "des", "recommandations"],
  "hrDecision": {
    "recommendation": "RECRUTER|ENTRETIEN|REJETER",
    "confidence": number (0-100),
    "reasoning": "Justification de la décision",
    "priority": "HIGH|MEDIUM|LOW"
  },
  "skillsMatch": {
    "technical": number (0-100),
    "experience": number (0-100), 
    "cultural": number (0-100),
    "overall": number (0-100)
  },
  "risks": ["liste", "des", "risques identifiés"],
  "extractedData": {
    "name": "nom du candidat",
    "email": "email si trouvé", 
    "phone": "téléphone si trouvé",
    "experience": "années d'expérience",
    "skills": ["liste", "des", "compétences"],
    "education": "parcours éducatif",
    "seniority": "JUNIOR|MIDDLE|SENIOR|LEAD"
  }
}`;

    try {
      this.logger.log(`🤖 Making fallback AI request at: ${new Date().toISOString()}`);
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: fallbackModel, // Modèle de fallback dynamique
          messages: [
            {
              role: 'user',
              content: fullPrompt
            }
          ],
          max_tokens: 2048,
          temperature: 0.1,
          top_p: 0.9,
        },
        {
          headers: {
            'Authorization': `Bearer ${account.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://your-app.com',
            'X-Title': 'RH-Next CV Analysis',
          },
        }
      );

      this.logger.log(`✅ Fallback AI request completed successfully`);
      this.logger.log(`⏱️ Fallback response received at: ${new Date().toISOString()}`);
      
      const aiResponse = response.data.choices?.[0]?.message?.content || response.data.output?.choices?.[0]?.text;
      this.logger.log(`📝 Fallback AI response length: ${aiResponse?.length || 0} characters`);
      
      try {
        // Nettoyer la réponse et extraire le JSON
        let cleanResponse = aiResponse;
        
        // Gérer les blocs de code markdown
        if (aiResponse.includes('```json')) {
          cleanResponse = aiResponse.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
        } else if (aiResponse.includes('```')) {
          cleanResponse = aiResponse.replace(/```\s*/g, '');
        }
        
        // Extraire le JSON même s'il y a du texte avant/après
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanResponse = jsonMatch[0];
        }
        
        // Nettoyer le JSON pour corriger les erreurs communes
        const fixedJson = this.fixCommonJsonErrors(cleanResponse.trim());
        const parsedResponse = JSON.parse(fixedJson);
        
        this.logger.log(`🎯 Successfully parsed fallback response - Score: ${parsedResponse.score || 'N/A'}`);
        this.logger.log(`📊 Fallback HR Decision: ${parsedResponse.hrDecision?.recommendation || 'N/A'} (Confidence: ${parsedResponse.hrDecision?.confidence || 'N/A'}%)`);
        
        // Nettoyer l'email extrait s'il contient des caractères parasites
        if (parsedResponse.extractedData?.email) {
          parsedResponse.extractedData.email = this.cleanEmail(parsedResponse.extractedData.email);
        }
        
        return parsedResponse;
      } catch (parseError) {
        this.logger.warn(`❌ Failed to parse fallback AI response as JSON`);
        this.logger.warn(`Fallback parse error: ${parseError.message}`);
        this.logger.warn(`🔍 Raw fallback JSON that failed to parse:`, aiResponse.substring(0, 2000));
        this.logger.warn(`🔧 Fixed fallback JSON attempt:`, this.fixCommonJsonErrors(aiResponse).substring(0, 2000));
        
        // Si le CV est vide ou contient un message d'erreur, score = 0
        const isEmptyCV = cvText.includes('[PDF extraction failed]') || 
                         cvText.includes('[PDF processing error]') || 
                         cvText.trim().length < 20;
        
        const fallbackResult = {
          score: isEmptyCV ? 0 : 25,
          summary: isEmptyCV ? 'Impossible d\'analyser : échec de l\'extraction PDF' : 'Analyse terminée mais format de réponse à revoir',
          aiResponse,
          extractedData: {},
          hrDecision: {
            recommendation: 'REJETER' as const,
            confidence: isEmptyCV ? 95 : 50,
            reasoning: isEmptyCV ? 'CV impossible à analyser - extraction PDF échouée' : 'Erreur de parsing du modèle de fallback',
            priority: 'LOW' as const
          },
          strengths: [],
          weaknesses: isEmptyCV ? ['CV illisible'] : ['Réponse IA mal formatée'],
          recommendations: ['Vérifier le fichier CV et relancer l\'analyse'],
          skillsMatch: {
            technical: 0,
            experience: 0,
            cultural: 0,
            overall: 0
          },
          risks: ['Analyse incomplète']
        };
        
        this.logger.warn(`🔄 Returning fallback result from retry with score: ${fallbackResult.score}`);
        return fallbackResult;
      }
    } catch (error) {
      this.logger.error(`💥 Fallback model (${fallbackModel}) also failed:`, error.message);
      if (error.response) {
        this.logger.error(`🔴 Fallback HTTP Status: ${error.response.status} ${error.response.statusText}`);
        this.logger.error(`📄 Fallback Response data:`, JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  private fixCommonJsonErrors(jsonStr: string): string {
    return jsonStr
      // Corriger les virgules orphelines (": ,")
      .replace(/:\s*,/g, ': null,')
      // Corriger les virgules avant accolades fermantes  
      .replace(/,(\s*[}\]])/g, '$1')
      // Corriger les doubles virgules
      .replace(/,,+/g, ',');
  }

  private cleanEmail(email: string): string {
    if (!email) return email;
    
    // Supprimer les caractères parasites courants qui apparaissent avant l'email
    // Comme 'R', 'O', '@' parasites, etc.
    let cleanedEmail = email.trim();
    
    // Pattern pour détecter un email valide
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const match = cleanedEmail.match(emailPattern);
    
    if (match) {
      return match[0];
    }
    
    // Si pas de match, essayer de nettoyer les caractères en début
    cleanedEmail = cleanedEmail.replace(/^[^a-zA-Z0-9]+/, '');
    
    return cleanedEmail;
  }

  private getDefaultPrompt(): string {
    return `Vous êtes un expert recruteur RH senior. Analysez ce CV par rapport à la description de poste et fournissez une évaluation complète pour la prise de décision de recrutement.

ANALYSEZ CES DIMENSIONS CLÉS :
1. Adéquation technique au poste (compétences, technologies)
2. Niveau d'expérience vs requis (années, séniorité)
3. Compatibilité culturelle et soft skills
4. Potentiel d'évolution et d'apprentissage
5. Risques identifiés (sur/sous-qualification, stabilité)

FOURNISSEZ UNE RECOMMANDATION CLAIRE :
- RECRUTER : Candidat idéal, forte adéquation
- ENTRETIEN : Potentiel intéressant, à approfondir  
- REJETER : Inadéquation majeure, critères non remplis

Soyez factuel, précis et orienté décision RH.`;
  }

  getAccountsStatus() {
    return this.accounts.map((account, index) => ({
      index,
      isActive: account.isActive,
      requestCount: account.requestCount,
      maxRequests: account.maxRequests,
      lastUsed: account.lastUsed,
      keyPreview: account.apiKey.substring(0, 8) + '...',
    }));
  }
}