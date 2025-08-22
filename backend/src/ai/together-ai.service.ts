import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ApiKeysService } from '../api-keys/api-keys.service';

interface TogetherAIAccount {
  apiKey: string;
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

  constructor(private apiKeysService: ApiKeysService) {
    this.initializeAccounts();
  }

  private async initializeAccounts() {
    try {
      const apiKeys = await this.apiKeysService.findActive();
      this.accounts = apiKeys.map(key => ({
        apiKey: key,
        isActive: true,
        requestCount: 0,
        maxRequests: 1000, // Limite par défaut
      }));
      this.logger.log(`Initialized ${this.accounts.length} Together AI accounts from database`);
    } catch (error) {
      this.logger.warn('Failed to load API keys from database, falling back to environment variables');
      const apiKeys = process.env.TOGETHER_AI_KEYS?.split(',') || [];
      this.accounts = apiKeys.map(key => ({
        apiKey: key.trim(),
        isActive: true,
        requestCount: 0,
        maxRequests: 1000,
      }));
      this.logger.log(`Initialized ${this.accounts.length} Together AI accounts from env`);
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

  async analyzeCV(cvText: string, jobDescription: string, customPrompt?: string): Promise<any> {
    // Recharger les clés depuis la base de données pour les nouvelles clés
    await this.initializeAccounts();
    this.resetAccountLimits();
    
    const account = this.getNextAvailableAccount();
    if (!account) {
      throw new Error('No available Together AI accounts');
    }

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

    // Utiliser un modèle plus rapide par défaut, avec fallback
    const models = [
      'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo', // Plus rapide
      'deepseek-ai/deepseek-v3' // Fallback si le premier échoue
    ];
    
    const selectedModel = models[0]; // Commencer par le plus rapide

    try {
      // Log pour diagnostiquer
      this.logger.debug(`Making request to Together AI with model: ${selectedModel}`);
      this.logger.debug(`Prompt length: ${fullPrompt.length} characters`);
      
      const response = await axios.post(
        'https://api.together.xyz/v1/chat/completions',
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
          },
        }
      );

      this.markAccountAsUsed(account);
      
      // Analyser les headers de rate limiting si disponibles
      const rateLimitHeaders = response.headers;
      if (rateLimitHeaders['x-ratelimit-remaining']) {
        const remaining = parseInt(rateLimitHeaders['x-ratelimit-remaining']);
        if (remaining <= 5) { // Si il reste moins de 5 requêtes
          this.logger.warn(`Account ${account.apiKey.substring(0, 8)}... has only ${remaining} requests remaining`);
        }
      }
      
      // Mettre à jour le compteur d'utilisation dans la base de données
      try {
        await this.apiKeysService.incrementUsage(account.apiKey);
      } catch (error) {
        this.logger.warn('Failed to update API key usage in database', error);
      }
      
      const aiResponse = response.data.choices?.[0]?.message?.content || response.data.output?.choices?.[0]?.text;
      
      this.logger.debug(`AI Response received: ${aiResponse?.substring(0, 200)}...`);
      
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
        
        const parsedResponse = JSON.parse(cleanResponse.trim());
        
        // Nettoyer l'email extrait s'il contient des caractères parasites
        if (parsedResponse.extractedData?.email) {
          parsedResponse.extractedData.email = this.cleanEmail(parsedResponse.extractedData.email);
        }
        
        return parsedResponse;
      } catch (parseError) {
        this.logger.warn('Failed to parse AI response as JSON, returning raw response');
        this.logger.debug('Original response:', aiResponse);
        
        // Si le CV est vide ou contient un message d'erreur, score = 0
        const isEmptyCV = cvText.includes('[PDF extraction failed]') || 
                         cvText.includes('[PDF processing error]') || 
                         cvText.trim().length < 20;
        
        return {
          score: isEmptyCV ? 0 : 25, // Score minimal pour parsing échoué mais CV valide
          summary: isEmptyCV ? 'Impossible d\'analyser : échec de l\'extraction PDF' : 'Analyse terminée mais format de réponse à revoir',
          aiResponse,
          extractedData: {}
        };
      }
    } catch (error) {
      this.logger.error(`Error with Together AI account ${account.apiKey.substring(0, 8)}...`, error.message);
      
      // Log plus détaillé pour diagnostiquer
      if (error.response) {
        this.logger.error(`HTTP Status: ${error.response.status}`);
        this.logger.error(`Response data:`, error.response.data);
        this.logger.error(`Response headers:`, error.response.headers);
      } else if (error.request) {
        this.logger.error(`No response received:`, error.request);
      } else {
        this.logger.error(`Request setup error:`, error.message);
      }
      
      if (error.response?.status === 429 || error.response?.status === 402) {
        account.isActive = false;
        this.logger.warn(`Marking account as inactive due to rate limit or payment issue`);
      }
      
      // Si le modèle Llama échoue, retry avec deepseek
      if (selectedModel.includes('llama') && !selectedModel.includes('deepseek')) {
        this.logger.warn(`${selectedModel} failed, retrying with deepseek-v3`);
        return this.retryWithFallbackModel(cvText, jobDescription, customPrompt, account);
      }
      
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  private async retryWithFallbackModel(cvText: string, jobDescription: string, customPrompt?: string, account?: any): Promise<any> {
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
      const response = await axios.post(
        'https://api.together.xyz/v1/chat/completions',
        {
          model: 'deepseek-ai/deepseek-v3', // Modèle de fallback
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
          },
        }
      );

      const aiResponse = response.data.choices?.[0]?.message?.content || response.data.output?.choices?.[0]?.text;
      
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
        
        const parsedResponse = JSON.parse(cleanResponse.trim());
        
        // Nettoyer l'email extrait s'il contient des caractères parasites
        if (parsedResponse.extractedData?.email) {
          parsedResponse.extractedData.email = this.cleanEmail(parsedResponse.extractedData.email);
        }
        
        return parsedResponse;
      } catch (parseError) {
        this.logger.warn('Failed to parse fallback AI response as JSON');
        
        // Si le CV est vide ou contient un message d'erreur, score = 0
        const isEmptyCV = cvText.includes('[PDF extraction failed]') || 
                         cvText.includes('[PDF processing error]') || 
                         cvText.trim().length < 20;
        
        return {
          score: isEmptyCV ? 0 : 25,
          summary: isEmptyCV ? 'Impossible d\'analyser : échec de l\'extraction PDF' : 'Analyse terminée mais format de réponse à revoir',
          aiResponse,
          extractedData: {}
        };
      }
    } catch (error) {
      this.logger.error('Fallback model also failed:', error.message);
      throw error;
    }
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