}
[Nest] 24612  - 21/08/2025 13:46:46     LOG [AnalysisQueueService] Worker 0 started for project 7522b12b-f47e-4e11-b89d-7ef281361ed8
[Nest] 24612  - 21/08/2025 13:46:46     LOG [AnalysisQueueService] Started 1 workers for project 7522b12b-f47e-4e11-b89d-7ef281361ed8. Total active: 1
🛡️ [JWT GUARD] Checking authentication for: GET /api/candidates?projectId=7522b12b-f47e-4e11-b89d-7ef281361ed8
🛡️ [JWT GUARD] Headers: { authorization: 'EXISTS', 'content-type': undefined }
✅ [JWT GUARD] Authentication successful for user: {
  id: 'fbcc68b1-b5a8-40c3-a050-dbacda8d4f7f',
  email: 'magloirekitio1@gmail.com',
  role: 'admin',
  url: '/api/candidates?projectId=7522b12b-f47e-4e11-b89d-7ef281361ed8'
}
[Nest] 24612  - 21/08/2025 13:46:48     LOG [TogetherAIService] Initialized 1 Together AI accounts from database
[Nest] 24612  - 21/08/2025 13:46:48   DEBUG [TogetherAIService] Making request to Together AI with model: meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo
[Nest] 24612  - 21/08/2025 13:46:48   DEBUG [TogetherAIService] Prompt length: 4967 characters
[Nest] 24612  - 21/08/2025 13:46:54    WARN [TogetherAIService] Account a1c9fd0f... has only 1 requests remaining
[Nest] 24612  - 21/08/2025 13:46:54   DEBUG [TogetherAIService] AI Response received: Here is the analysis of the CV:

```json
{
  "score": 85,
  "summary": "Magloire KITIO KENFACK is a senior developer with 5+ years of experience in full-stack development, architecture, and DevOps. He...
[Nest] 24612  - 21/08/2025 13:46:55     LOG [WebSocketGateway] Emitted analysisUpdate to project 7522b12b-f47e-4e11-b89d-7ef281361ed8:
[Nest] 24612  - 21/08/2025 13:46:55     LOG [WebSocketGateway] Object(4) {
  type: 'analysis_completed',
  projectId: '7522b12b-f47e-4e11-b89d-7ef281361ed8',
  candidate: Candidate {
    name: 'Magloire KITIO KENFACK',
    extractedText: 'Magloire KITIO KENFACK\nD ́eveloppeur Senior/Architecte & DevOps\nRmagloirekitio1@gmail.comÓ+237 693 937 344vCamerounais ̄linkedin.com/in/magloire-kitio\x87github.com/MagloireKITIO\nD ́eveloppeur Senior  r/Architecte avec expertise en conception de SI `a fort volume, automatisation compl`ete des processus et d ́eveloppement\nd’APIs REST. Sp ́ecialis ́e dans l’orchestration de syst`emes complexes, l’optimisation PostgreSQL e  et Python Flask.  Passionn ́e par l’architecture\n ́evolutive et les solutions open source pour la transformation digitale des organisations.\nEXP\n ́\nERIENCE PROFESSIONNELLE\nD ́eveloppeur Senior/Architecte & PMOD ́ecembr    re 2023 - Pr ́esent\nGroupe Activa, Douala\n•Conception  et  d ́eveloppement  du  cœur  SI  pour  plateforme  Myactiva  :   orchestration  du  provisioning  de  2  filiales\nsuppl ́ementaires avec gestion de fort volume d’a  activit ́e\n•Architecture et d ́eveloppement d’une plateforme de recrutement end-to-end avec automatisation compl`ete du traitement\ndes candidatures via IA et int ́egration intelligente `a la base de donn ́ees\n•D ́evelopp    pement d’APIs REST pour l’orchestration et l’int ́egration des syst`emes RH existants avec garantie d’automatisation\nmaximum\n•Conception d’architecture  ́evolutive pour plateforme de fid ́elisation employ ́es, anticipant     les  ́evolutions technologiques\nfutures\nConsultant IT/Architecte Solutions2023\nDigital Business Group, Douala\n•Architecture et d ́eploiement de solutions cloud pour migration d’infrastructures `a fort volume\n•Concepti ion d’APIs REST pour orchestration et int ́egration de syst`emes tiers avec automatisation des processus m ́etiers\n•Optimisation d’ERP et configuration de syst`emes d’entreprise avec approche pragmatique et hi ́erarchisati  ion des priorit ́es\n•Accompagnement technique sur l’adoption de frameworks open source et solutions d’automatisation\nAdministrateur Syst`emes & SupportAoˆut 2020 - Janvier 2021\nHalcyon Agri Corporation Limited (HEVECAM SS.A), Kribi\n•Administration syst`eme Debian/Linux et Windows Server avec automatisation des tˆaches r ́ep ́etitives\n•Gestion s ́ecuris ́ee Active Directory et orchestration des acc`es aux syst`emes critiques\n•Conception     et mise en place de solutions de sauvegarde automatis ́ees avec plans de continuit ́e d’activit ́e\n•R ́esolution d’incidents techniques avec approche analytique et prise de recul (taux satisfaction 95%)\nCOMP\n ́\nETENCES    S TECHNIQUES\nD ́eveloppementPython (Flask, Django), PostgreSQL (expertise), JavaScript, .NET, PHP\nArchitecture & APIsConception SI, Orchestration, APIs REST, Int ́egration syst`emes\nSyst`emes & DevOpsLinux Debian, Docker r, GitLab CI/CD, Terraform, Automatisation\nCloud & InfrastructureAzure, OCI, Windows Server, Active Directory\nBases de donn ́eesPostgreSQL (expertise), MySQL, MongoDB\nFrameworks & ToolsFlask, Open Source, Git, Jira, Micrrosoft 365\nFORMATION\nProgramme Sp ́ecialis ́e Bac+5 Manager de Solutions Digitales et Data2023\nInstitut Universitaire de la Cˆote / 3IL Ing ́enieur France, Douala\n•Sp ́ecialisation :Architecture de Solutions Digitales e   et Syst`emes d’Information\nLicence Professionnelle Syst`emes d’Information d’Aide `a la D ́ecision2019\nESIAC /\n ́\nEcole Polytechnique, Douala\nDEC en Programmation Web et Mobile2017\nInstitut Universitaire de la Cˆote / / Coll`ege Communautaire du Nouveau-Brunswick, Douala\nCERTIFICATIONS & LANGUES\nCertifications\n•Microsoft Azure Fundamentals (AZ-900)\n•Oracle Cloud Infrastructure (1Z0-1085-23)\n•ITIL v4 Foundation (en cours)\n•KPMG Data Analytics Consulting\nLangues\n•Fran ̧cais :  Natif\n•Anglais :  Technique (8/10), Conversationnel (6/10)\nCentres d’int ́erˆet\n•Veille  technologique  architecture  SI,  frameworks  open\nsource\nR\n ́\nEF\n ́\nERENCES\   \nMorelle DOKOU\nProgram Manager Office, Activa Group\nm.dokou@group-activa.com / +237 696 670 703\nG ́ed ́eon GNIGNI\nCEO, Digital Business Group\n+237 697 875 106',
    fileName: 'Magloire_KITIO_cv_developeur_architecte.pdf',
    fileUrl: 'https://xkqrigsupoomqevfwzni.supabase.co/storage/v1/object/public/cv-documents/cvs/1755780404705-Magloire_KITIO_cv_developeur_architecte.pdf',
    status: 'analyzed',
    projectId: '7522b12b-f47e-4e11-b89d-7ef281361ed8',
    email: 'rmagloirekitio1@gmail.com',
    phone: '+237 693 937 344',
    extractedData: {
      name: 'Magloire KITIO KENFACK',
      email: 'rmagloirekitio1@gmail.com',
      phone: '+237 693 937 344',
      experience: '5+ years',
      skills: [
        'Python (Flask, Django)',
        'PostgreSQL (expertise)',
        'JavaScript',
        '.NET',
        'PHP',
        'API design and integration',
        'Automation (GitLab CI/CD, Terraform)',
        'Cloud infrastructure (Azure, OCI, Windows Server)',
        'Linux Debian',
        'Docker'
      ],
      education: "Bac+5 Manager de Solutions Digitales et Data (2023), Licence Professionnelle Systèmes d'Information d'Aide à la Décision (2019), DEC en Programmation Web et Mobile (2017)"
    },
    summary: 'Magloire KITIO KENFACK is a senior developer with 5+ years of experience in full-stack development, architecture, and DevOps. He has a strong background in Python, PostgreSQL, and cloud infrastructure, with a passion for digital transformation and open-source solutions.',
    id: '73532745-8cf9-4b31-9cc0-623fe96883ab',
    score: 85,
    ranking: 0,
    previousScore: '0.00',
    createdAt: 2025-08-21T11:46:46.465Z,
    updatedAt: 2025-08-21T11:46:46.465Z
  },
  timestamp: '2025-08-21T12:46:55.426Z'
}
[Nest] 24612  - 21/08/2025 13:46:55     LOG [WebSocketGateway] Emitted analysisUpdate to project 7522b12b-f47e-4e11-b89d-7ef281361ed8:
[Nest] 24612  - 21/08/2025 13:46:55     LOG [WebSocketGateway] Object(4) {
  type: 'queue_progress',
  projectId: '7522b12b-f47e-4e11-b89d-7ef281361ed8',
  progress: {
    total: 1,
    processed: 1,
    remaining: 0,
    isProcessing: true,
    estimatedTimeRemaining: '0 secondes',
    percentComplete: 100
  },
  timestamp: '2025-08-21T12:46:55.432Z'
}
[Nest] 24612  - 21/08/2025 13:46:55     LOG [AnalysisQueueService] Worker 0 processed candidate 73532745-8cf9-4b31-9cc0-623fe96883ab. Progress: 1/1
[Nest] 24612  - 21/08/2025 13:46:56     LOG [AnalysisQueueService] Worker 0 finished for project 7522b12b-f47e-4e11-b89d-7ef281361ed8. Remaining workers: 0
[Nest] 24612  - 21/08/2025 13:46:56     LOG [AnalysisQueueService] All workers completed for project 7522b12b-f47e-4e11-b89d-7ef281361ed8
[Nest] 24612  - 21/08/2025 13:46:56     LOG [WebSocketGateway] Emitted analysisUpdate to project 7522b12b-f47e-4e11-b89d-7ef281361ed8:
[Nest] 24612  - 21/08/2025 13:46:56     LOG [WebSocketGateway] Object(4) {
  type: 'queue_completed',
  projectId: '7522b12b-f47e-4e11-b89d-7ef281361ed8',
  progress: {
    total: 1,
    processed: 1,
    remaining: 0,
    isProcessing: false,
    estimatedTimeRemaining: '0 secondes',
    percentComplete: 100
  },
  timestamp: '2025-08-21T12:46:56.944Z'
}