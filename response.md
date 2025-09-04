[Nest] 21612  - 04/09/2025 12:11:55    WARN [TogetherAIService] ❌ Failed to parse AI response as JSON, returning raw response
[Nest] 21612  - 04/09/2025 12:11:55    WARN [TogetherAIService] Parse error details: Expected ',' or '}' after property value in JSON at position 1831 (line 38 column 21)
[Nest] 21612  - 04/09/2025 12:11:55    WARN [TogetherAIService] 🔍 Raw JSON that failed to parse:
[Nest] 21612  - 04/09/2025 12:11:55    WARN [TogetherAIService] Voici l'évaluation du CV de Magloire KITIO KENFACK :

```json
{
  "score": 85,
  "summary": "Développeur senior/architecte avec une expérience significative en conception de SI, automatisation de processus et développement d'APIs REST. Spécialisé en orchestration de systèmes complexes, optimisation PostgreSQL et Python Flask.",
  "strengths": [
    "Expérience significative en conception de SI et automatisation de processus",
    "Compétences en développement d'APIs REST et orchestration de systèmes complexes",
    "Connaissance approfondie de PostgreSQL et Python Flask",
    "Formation en architecture de solutions digitales et systèmes d'information"
  ],
  "weaknesses": [
    "Manque de connaissance en certaines technologies (par exemple,.NET, PHP)",
    "Taux de satisfaction de 95% en résolution d'incidents techniques, mais pas de détails sur les types d'incidents"
  ],
  "recommendations": [
    "Recommander pour un entretien pour discuter de la compatibilité culturelle et des soft skills",
    "Suggérer une formation ou un atelier pour améliorer les compétences en.NET et PHP"
  ],
  "hrDecision": {
    "recommendation": "ENTRETIEN",
    "confidence": 80,
    "reasoning": "Le candidat présente une expérience significative et des compétences pertinentes pour le poste, mais il faudrait discuter de la compatibilité culturelle et des soft skills pour confirmer son adaptation à l'équipe.",
    "priority": "MEDIUM"
  },
  "skillsMatch": {
    "technical": 90,
    "experience": 80,
    "cultural": 60,
    "overall": 80
  },
  "risks": [
    "Manque de connaissance en certaines technologies",
    "Taux de satisfaction de 95% en résolution d'incidents techniques, mais pas de détails sur les types d'incidents"
  ],
  "extractedData": {
    "name": "Magloire KITIO KENFACK",
    "email": "rmagloirekitio1@gmail.com",
    "phone": "+237 693 937 344",
    "experience": 5 ans,
    "skills": [
      "Développement Python (Flask, Django)",
      "PostgreSQL (expertise)",
      "J
[Nest] 21612  - 04/09/2025 12:11:55    WARN [TogetherAIService] 🔧 Fixed JSON attempt:
[Nest] 21612  - 04/09/2025 12:11:55    WARN [TogetherAIService] Voici l'évaluation du CV de Magloire KITIO KENFACK :

```json
{
  "score": 85,
  "summary": "Développeur senior/architecte avec une expérience significative en conception de SI, automatisation de processus et développement d'APIs REST. Spécialisé en orchestration de systèmes complexes, optimisation PostgreSQL et Python Flask.",
  "strengths": [
    "Expérience significative en conception de SI et automatisation de processus",
    "Compétences en développement d'APIs REST et orchestration de systèmes complexes",
    "Connaissance approfondie de PostgreSQL et Python Flask",
    "Formation en architecture de solutions digitales et systèmes d'information"
  ],
  "weaknesses": [
    "Manque de connaissance en certaines technologies (par exemple,.NET, PHP)",
    "Taux de satisfaction de 95% en résolution d'incidents techniques, mais pas de détails sur les types d'incidents"
  ],
  "recommendations": [
    "Recommander pour un entretien pour discuter de la compatibilité culturelle et des soft skills",
    "Suggérer une formation ou un atelier pour améliorer les compétences en.NET et PHP"
  ],
  "hrDecision": {
    "recommendation": "ENTRETIEN",
    "confidence": 80,
    "reasoning": "Le candidat présente une expérience significative et des compétences pertinentes pour le poste, mais il faudrait discuter de la compatibilité culturelle et des soft skills pour confirmer son adaptation à l'équipe.",
    "priority": "MEDIUM"
  },
  "skillsMatch": {
    "technical": 90,
    "experience": 80,
    "cultural": 60,
    "overall": 80
  },
  "risks": [
    "Manque de connaissance en certaines technologies",
    "Taux de satisfaction de 95% en résolution d'incidents techniques, mais pas de détails sur les types d'incidents"
  ],
  "extractedData": {
    "name": "Magloire KITIO KENFACK",
    "email": "rmagloirekitio1@gmail.com",
    "phone": "+237 693 937 344",
    "experience": 5 ans,
    "skills": [
      "Développement Python (Flask, Django)",
      "PostgreSQL (expertise)",
      "J
[Nest] 21612  - 04/09/2025 12:11:55    WARN [TogetherAIService] 🔄 Returning fallback result with score: 25
[Nest] 21612  - 04/09/2025 12:11:58     LOG [TogetherAIService] 🔍 Starting CV analysis for company: d7ea7dce-7183-4975-a2ba-23ecce600eac
[Nest] 21612  - 04/09/2025 12:11:58     LOG [TogetherAIService] 📄 CV text length: 1614 characters
[Nest] 21612  - 04/09/2025 12:11:58     LOG [TogetherAIService] 💼 Job description length: 63 characters
[Nest] 21612  - 04/09/2025 12:11:58     LOG [TogetherAIService] 🔑 Using API key: sk-or-v1...
[Nest] 21612  - 04/09/2025 12:11:58     LOG [TogetherAIService] 📊 Account usage: 0/1000 requests
[Nest] 21612  - 04/09/2025 12:11:58     LOG [TogetherAIService] 🎯 Using configured models for key sk-or-v1...: meta-llama/llama-3.2-11b-vision-instruct, anthropic/claude-3-haiku
[Nest] 21612  - 04/09/2025 12:11:58     LOG [TogetherAIService] 🤖 Configured models: meta-llama/llama-3.2-11b-vision-instruct, anthropic/claude-3-haiku
[Nest] 21612  - 04/09/2025 12:11:58     LOG [TogetherAIService] ✨ Selected primary model: meta-llama/llama-3.2-11b-vision-instruct
[Nest] 21612  - 04/09/2025 12:11:58     LOG [TogetherAIService] 🤖 Making AI request with model: meta-llama/llama-3.2-11b-vision-instruct
[Nest] 21612  - 04/09/2025 12:11:58     LOG [TogetherAIService] ⏱️ Request started at: 2025-09-04T11:11:58.797Z
[Nest] 21612  - 04/09/2025 12:12:23     LOG [TogetherAIService] ✅ AI request completed successfully
[Nest] 21612  - 04/09/2025 12:12:23     LOG [TogetherAIService] ⏱️ Response received at: 2025-09-04T11:12:23.041Z
[Nest] 21612  - 04/09/2025 12:12:23     LOG [TogetherAIService] 📈 Response status: 200 OK
[Nest] 21612  - 04/09/2025 12:12:23     LOG [TogetherAIService] 💾 API key usage updated in database
[Nest] 21612  - 04/09/2025 12:12:23     LOG [TogetherAIService] 📝 AI response length: 2211 characters
[Nest] 21612  - 04/09/2025 12:12:23     LOG [TogetherAIService] 🎯 Successfully parsed AI response - Score: 70
[Nest] 21612  - 04/09/2025 12:12:23     LOG [TogetherAIService] 📊 HR Decision: ENTRETIEN (Confidence: 60%)
[Nest] 21612  - 04/09/2025 12:12:23     LOG [TogetherAIService] 👤 Extracted candidate: Nemzou Nyamsi Philippe (pnemzou@gmail.com)
[Nest] 21612  - 04/09/2025 12:12:26     LOG [TogetherAIService] 🔍 Starting CV analysis for company: d7ea7dce-7183-4975-a2ba-23ecce600eac
[Nest] 21612  - 04/09/2025 12:12:26     LOG [TogetherAIService] 📄 CV text length: 4239 characters
[Nest] 21612  - 04/09/2025 12:12:26     LOG [TogetherAIService] 💼 Job description length: 63 characters
[Nest] 21612  - 04/09/2025 12:12:27     LOG [TogetherAIService] 🔑 Using API key: sk-or-v1...
[Nest] 21612  - 04/09/2025 12:12:27     LOG [TogetherAIService] 📊 Account usage: 0/1000 requests
[Nest] 21612  - 04/09/2025 12:12:27     LOG [TogetherAIService] 🎯 Using configured models for key sk-or-v1...: meta-llama/llama-3.2-11b-vision-instruct, anthropic/claude-3-haiku
[Nest] 21612  - 04/09/2025 12:12:27     LOG [TogetherAIService] 🤖 Configured models: meta-llama/llama-3.2-11b-vision-instruct, anthropic/claude-3-haiku
[Nest] 21612  - 04/09/2025 12:12:27     LOG [TogetherAIService] ✨ Selected primary model: meta-llama/llama-3.2-11b-vision-instruct
[Nest] 21612  - 04/09/2025 12:12:27     LOG [TogetherAIService] 🤖 Making AI request with model: meta-llama/llama-3.2-11b-vision-instruct
[Nest] 21612  - 04/09/2025 12:12:27     LOG [TogetherAIService] ⏱️ Request started at: 2025-09-04T11:12:27.799Z
[Nest] 21612  - 04/09/2025 12:12:43     LOG [TogetherAIService] ✅ AI request completed successfully
[Nest] 21612  - 04/09/2025 12:12:43     LOG [TogetherAIService] ⏱️ Response received at: 2025-09-04T11:12:43.945Z
[Nest] 21612  - 04/09/2025 12:12:43     LOG [TogetherAIService] 📈 Response status: 200 OK
[Nest] 21612  - 04/09/2025 12:12:45     LOG [TogetherAIService] 💾 API key usage updated in database
[Nest] 21612  - 04/09/2025 12:12:45     LOG [TogetherAIService] 📝 AI response length: 2882 characters
[Nest] 21612  - 04/09/2025 12:12:45     LOG [TogetherAIService] 🎯 Successfully parsed AI response - Score: 70
[Nest] 21612  - 04/09/2025 12:12:45     LOG [TogetherAIService] 📊 HR Decision: ENTRETIEN (Confidence: 80%)
[Nest] 21612  - 04/09/2025 12:12:45     LOG [TogetherAIService] 👤 Extracted candidate: Charles-Eric Heuna (charlesricheuna@gmail.com)
[Nest] 21612  - 04/09/2025 12:12:47     LOG [AnalysisQueueService] All workers completed for project 8ca75e45-143f-43ad-96ba-b98ef1ec352e