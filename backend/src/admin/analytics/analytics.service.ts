import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { Candidate } from '../../candidates/entities/candidate.entity';
import { Analysis } from '../../analysis/entities/analysis.entity';
import { Company } from '../../companies/entities/company.entity';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';

interface ProjectAnalyticsFilters {
  search?: string;
  status?: string;
  sortBy?: string;
}

interface ReportFilters {
  period?: string;
}

export interface ProjectAnalytics {
  id: string;
  name: string;
  status: string;
  companyName: string;
  totalCandidates: number;
  analyzedCandidates: number;
  averageScore: number;
  topCandidateScore: number;
  createdAt: string;
  lastActivity: string;
}

export interface ProjectReport {
  project: {
    id: string;
    name: string;
    status: string;
    companyName: string;
    createdAt: string;
    jobDescription: string;
  };
  metrics: {
    totalCandidates: number;
    analyzedCandidates: number;
    pendingAnalysis: number;
    averageScore: number;
    topScore: number;
    bottomScore: number;
    conversionRate: number;
  };
  scoreDistribution: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  };
  timeline: Array<{
    date: string;
    candidatesAdded: number;
    candidatesAnalyzed: number;
  }>;
  topCandidates: Array<{
    id: string;
    name: string;
    score: number;
    summary: string;
    status: string;
    hrDecision?: any;
  }>;
  skillsAnalysis: {
    technical: number;
    experience: number;
    cultural: number;
    overall: number;
  };
  hrRecommendations: {
    recruit: number;
    interview: number;
    reject: number;
  };
  risks: string[];
  insights: string[];
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Candidate)
    private candidateRepository: Repository<Candidate>,
    @InjectRepository(Analysis)
    private analysisRepository: Repository<Analysis>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async getProjectsAnalytics(filters: ProjectAnalyticsFilters): Promise<ProjectAnalytics[]> {
    let query = this.dataSource
      .createQueryBuilder(Project, 'project')
      .leftJoin('project.company', 'company')
      .leftJoin('project.candidates', 'candidate')
      .leftJoin('candidate.analyses', 'analysis')
      .select([
        'project.id',
        'project.name',
        'project.status',
        'project.createdAt',
        'project.updatedAt',
        'company.name as companyName'
      ])
      .addSelect('COUNT(DISTINCT candidate.id)', 'totalCandidates')
      .addSelect('COUNT(DISTINCT CASE WHEN candidate.status = \'analyzed\' THEN candidate.id END)', 'analyzedCandidates')
      .addSelect('AVG(CASE WHEN candidate.score IS NOT NULL THEN CAST(candidate.score AS FLOAT) END)', 'averageScore')
      .addSelect('MAX(CASE WHEN candidate.score IS NOT NULL THEN CAST(candidate.score AS FLOAT) END)', 'topCandidateScore')
      .addSelect('MAX(candidate.updatedAt)', 'lastActivity')
      .groupBy('project.id, project.name, project.status, project.createdAt, project.updatedAt, company.name');

    if (filters.search) {
      query = query.where(
        '(LOWER(project.name) LIKE LOWER(:search) OR LOWER(company.name) LIKE LOWER(:search))',
        { search: `%${filters.search}%` }
      );
    }

    if (filters.status && filters.status !== 'all') {
      query = query.andWhere('project.status = :status', { status: filters.status });
    }

    switch (filters.sortBy) {
      case 'totalCandidates':
        query = query.orderBy('totalCandidates', 'DESC');
        break;
      case 'averageScore':
        query = query.orderBy('averageScore', 'DESC');
        break;
      case 'name':
        query = query.orderBy('project.name', 'ASC');
        break;
      default:
        query = query.orderBy('COALESCE(MAX(candidate.updatedAt), project.updatedAt)', 'DESC');
    }

    const rawResults = await query.getRawMany();

    return rawResults.map(result => ({
      id: result.project_id,
      name: result.project_name,
      status: result.project_status,
      companyName: result.companyName || 'Non spécifié',
      totalCandidates: parseInt(result.totalCandidates) || 0,
      analyzedCandidates: parseInt(result.analyzedCandidates) || 0,
      averageScore: parseFloat(result.averageScore) || 0,
      topCandidateScore: parseFloat(result.topCandidateScore) || 0,
      createdAt: result.project_createdAt,
      lastActivity: result.lastActivity || result.project_updatedAt,
    }));
  }

  async getProjectReport(projectId: string, filters: ReportFilters): Promise<ProjectReport> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['company'],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    let candidatesQuery = this.candidateRepository
      .createQueryBuilder('candidate')
      .where('candidate.projectId = :projectId', { projectId });

    let analysesQuery = this.analysisRepository
      .createQueryBuilder('analysis')
      .where('analysis.projectId = :projectId', { projectId });

    if (filters.period && filters.period !== 'all') {
      const days = parseInt(filters.period);
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);
      
      candidatesQuery = candidatesQuery.andWhere('candidate.createdAt >= :dateThreshold', { dateThreshold });
      analysesQuery = analysesQuery.andWhere('analysis.createdAt >= :dateThreshold', { dateThreshold });
    }

    const candidates = await candidatesQuery
      .leftJoinAndSelect('candidate.analyses', 'analysis')
      .getMany();

    const analyses = await analysesQuery.getMany();

    const metrics = this.calculateMetrics(candidates);
    const scoreDistribution = this.calculateScoreDistribution(candidates);
    const timeline = await this.generateTimeline(projectId, filters.period);
    const topCandidates = this.getTopCandidates(candidates, 10);
    const skillsAnalysis = this.calculateSkillsAnalysis(analyses);
    const hrRecommendations = this.calculateHRRecommendations(analyses);
    const { risks, insights } = this.generateInsights(candidates, analyses, metrics);

    return {
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
        companyName: project.company?.name || 'Non spécifié',
        createdAt: project.createdAt.toISOString(),
        jobDescription: project.jobDescription,
      },
      metrics,
      scoreDistribution,
      timeline,
      topCandidates,
      skillsAnalysis,
      hrRecommendations,
      risks,
      insights,
    };
  }

  private calculateMetrics(candidates: Candidate[]) {
    const totalCandidates = candidates.length;
    const analyzedCandidates = candidates.filter(c => c.status === 'analyzed').length;
    const scores = candidates.map(c => parseFloat(c.score.toString())).filter(s => !isNaN(s) && s > 0);
    
    return {
      totalCandidates,
      analyzedCandidates,
      pendingAnalysis: totalCandidates - analyzedCandidates,
      averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      topScore: scores.length > 0 ? Math.max(...scores) : 0,
      bottomScore: scores.length > 0 ? Math.min(...scores) : 0,
      conversionRate: totalCandidates > 0 ? (analyzedCandidates / totalCandidates) * 100 : 0,
    };
  }

  private calculateScoreDistribution(candidates: Candidate[]) {
    const scores = candidates.map(c => parseFloat(c.score.toString())).filter(s => !isNaN(s) && s > 0);
    
    return {
      excellent: scores.filter(s => s >= 80).length,
      good: scores.filter(s => s >= 60 && s < 80).length,
      average: scores.filter(s => s >= 40 && s < 60).length,
      poor: scores.filter(s => s < 40).length,
    };
  }

  private async generateTimeline(projectId: string, period?: string) {
    let query = this.dataSource
      .createQueryBuilder()
      .select("DATE(candidate.createdAt)", "date")
      .addSelect("COUNT(*)", "candidatesAdded")
      .addSelect("SUM(CASE WHEN candidate.status = 'analyzed' THEN 1 ELSE 0 END)", "candidatesAnalyzed")
      .from(Candidate, "candidate")
      .where("candidate.projectId = :projectId", { projectId })
      .groupBy("DATE(candidate.createdAt)")
      .orderBy("DATE(candidate.createdAt)", "ASC");

    if (period && period !== 'all') {
      const days = parseInt(period);
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);
      query = query.andWhere("candidate.createdAt >= :dateThreshold", { dateThreshold });
    }

    const results = await query.getRawMany();
    
    return results.map(result => ({
      date: result.date,
      candidatesAdded: parseInt(result.candidatesAdded),
      candidatesAnalyzed: parseInt(result.candidatesAnalyzed),
    }));
  }

  private getTopCandidates(candidates: Candidate[], limit: number = 10) {
    return candidates
      .filter(c => c.score && parseFloat(c.score.toString()) > 0)
      .sort((a, b) => parseFloat(b.score.toString()) - parseFloat(a.score.toString()))
      .slice(0, limit)
      .map(c => ({
        id: c.id,
        name: c.name,
        score: parseFloat(c.score.toString()),
        summary: c.summary || 'Aucun résumé disponible',
        status: c.status,
        hrDecision: c.analyses?.length > 0 ? c.analyses[0].hrDecision : undefined,
      }));
  }

  private calculateSkillsAnalysis(analyses: Analysis[]) {
    const skillMatches = analyses.map(a => a.skillsMatch).filter(s => s);
    
    if (skillMatches.length === 0) {
      return { technical: 0, experience: 0, cultural: 0, overall: 0 };
    }

    const avg = (key: string) => 
      skillMatches.reduce((sum, match) => sum + (match[key] || 0), 0) / skillMatches.length;

    return {
      technical: avg('technical'),
      experience: avg('experience'),
      cultural: avg('cultural'),
      overall: avg('overall'),
    };
  }

  private calculateHRRecommendations(analyses: Analysis[]) {
    const decisions = analyses.map(a => a.hrDecision?.recommendation).filter(d => d);
    
    return {
      recruit: decisions.filter(d => d === 'RECRUTER').length,
      interview: decisions.filter(d => d === 'ENTRETIEN').length,
      reject: decisions.filter(d => d === 'REJETER').length,
    };
  }

  private generateInsights(candidates: Candidate[], analyses: Analysis[], metrics: any) {
    const insights: string[] = [];
    const risks: string[] = [];

    if (metrics.averageScore >= 70) {
      insights.push(`Excellente qualité de candidats avec un score moyen de ${Math.round(metrics.averageScore)}/100`);
    } else if (metrics.averageScore < 50) {
      risks.push(`Score moyen faible (${Math.round(metrics.averageScore)}/100) - Réviser les critères de sélection`);
    }

    if (metrics.conversionRate >= 80) {
      insights.push(`Très bon taux de traitement des candidatures (${Math.round(metrics.conversionRate)}%)`);
    } else if (metrics.conversionRate < 50) {
      risks.push(`Taux de traitement faible (${Math.round(metrics.conversionRate)}%) - Revoir les processus d'analyse`);
    }

    const recruitRecommendations = analyses.filter(a => a.hrDecision?.recommendation === 'RECRUTER').length;
    const totalAnalyzed = analyses.length;
    
    if (totalAnalyzed > 0) {
      const recruitRate = (recruitRecommendations / totalAnalyzed) * 100;
      if (recruitRate >= 20) {
        insights.push(`Fort potentiel de recrutement (${Math.round(recruitRate)}% de candidats recommandés)`);
      } else if (recruitRate < 5) {
        risks.push(`Très peu de candidats recommandés pour recrutement (${Math.round(recruitRate)}%)`);
      }
    }

    if (candidates.length >= 50) {
      insights.push(`Large bassin de candidats (${candidates.length}) permettant une sélection optimale`);
    } else if (candidates.length < 10) {
      risks.push(`Nombre de candidats limité (${candidates.length}) - Élargir la recherche`);
    }

    return { risks, insights };
  }

  async exportProjectReport(projectId: string, options: { format: 'pdf' | 'excel'; period?: string }): Promise<Buffer> {
    const report = await this.getProjectReport(projectId, { period: options.period });

    if (options.format === 'excel') {
      return this.generateExcelReport(report);
    } else {
      return this.generatePDFReport(report);
    }
  }

  private async generateExcelReport(report: ProjectReport): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    
    workbook.creator = 'RH Analytics Pro';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Rapport de Projet');

    worksheet.mergeCells('A1:D1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `Rapport d'Analytics - ${report.project.name}`;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center' };

    worksheet.addRow([]);
    worksheet.addRow(['Informations du Projet']);
    worksheet.addRow(['Nom:', report.project.name]);
    worksheet.addRow(['Entreprise:', report.project.companyName]);
    worksheet.addRow(['Statut:', report.project.status]);
    worksheet.addRow(['Date de création:', new Date(report.project.createdAt).toLocaleDateString('fr-FR')]);

    worksheet.addRow([]);
    worksheet.addRow(['Métriques Principales']);
    worksheet.addRow(['Total candidats:', report.metrics.totalCandidates]);
    worksheet.addRow(['Candidats analysés:', report.metrics.analyzedCandidates]);
    worksheet.addRow(['Score moyen:', Math.round(report.metrics.averageScore)]);
    worksheet.addRow(['Meilleur score:', Math.round(report.metrics.topScore)]);
    worksheet.addRow(['Taux de conversion:', `${Math.round(report.metrics.conversionRate)}%`]);

    worksheet.addRow([]);
    worksheet.addRow(['Distribution des Scores']);
    worksheet.addRow(['Excellent (80-100):', report.scoreDistribution.excellent]);
    worksheet.addRow(['Bon (60-79):', report.scoreDistribution.good]);
    worksheet.addRow(['Moyen (40-59):', report.scoreDistribution.average]);
    worksheet.addRow(['Faible (0-39):', report.scoreDistribution.poor]);

    worksheet.addRow([]);
    worksheet.addRow(['Top Candidats']);
    worksheet.addRow(['Rang', 'Nom', 'Score', 'Recommandation RH']);
    
    report.topCandidates.forEach((candidate, index) => {
      worksheet.addRow([
        index + 1,
        candidate.name,
        Math.round(candidate.score),
        candidate.hrDecision?.recommendation || 'N/A'
      ]);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private async generatePDFReport(report: ProjectReport): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        doc.fontSize(20).text(`Rapport d'Analytics - ${report.project.name}`, { align: 'center' });
        doc.moveDown();

        doc.fontSize(14).text('Informations du Projet', { underline: true });
        doc.fontSize(12);
        doc.text(`Entreprise: ${report.project.companyName}`);
        doc.text(`Statut: ${report.project.status}`);
        doc.text(`Date de création: ${new Date(report.project.createdAt).toLocaleDateString('fr-FR')}`);
        doc.moveDown();

        doc.fontSize(14).text('Métriques Principales', { underline: true });
        doc.fontSize(12);
        doc.text(`Total candidats: ${report.metrics.totalCandidates}`);
        doc.text(`Candidats analysés: ${report.metrics.analyzedCandidates}`);
        doc.text(`Score moyen: ${Math.round(report.metrics.averageScore)}/100`);
        doc.text(`Meilleur score: ${Math.round(report.metrics.topScore)}/100`);
        doc.text(`Taux de conversion: ${Math.round(report.metrics.conversionRate)}%`);
        doc.moveDown();

        doc.fontSize(14).text('Distribution des Scores', { underline: true });
        doc.fontSize(12);
        doc.text(`Excellent (80-100): ${report.scoreDistribution.excellent} candidats`);
        doc.text(`Bon (60-79): ${report.scoreDistribution.good} candidats`);
        doc.text(`Moyen (40-59): ${report.scoreDistribution.average} candidats`);
        doc.text(`Faible (0-39): ${report.scoreDistribution.poor} candidats`);
        doc.moveDown();

        doc.fontSize(14).text('Top 10 Candidats', { underline: true });
        doc.fontSize(10);
        report.topCandidates.slice(0, 10).forEach((candidate, index) => {
          doc.text(`${index + 1}. ${candidate.name} - Score: ${Math.round(candidate.score)} - ${candidate.hrDecision?.recommendation || 'N/A'}`);
        });

        if (report.insights.length > 0) {
          doc.addPage();
          doc.fontSize(14).text('Insights & Recommandations', { underline: true });
          doc.fontSize(11);
          report.insights.forEach(insight => {
            doc.text(`• ${insight}`, { paragraphGap: 5 });
          });
        }

        if (report.risks.length > 0) {
          doc.moveDown();
          doc.fontSize(14).text('Risques Identifiés', { underline: true });
          doc.fontSize(11);
          report.risks.forEach(risk => {
            doc.text(`⚠ ${risk}`, { paragraphGap: 5 });
          });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  async getProjectBasicInfo(projectId: string) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      select: ['id', 'name'],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    return project;
  }

  async getGlobalAnalyticsStats() {
    const totalProjects = await this.projectRepository.count();
    const totalCandidates = await this.candidateRepository.count();
    const totalAnalyses = await this.analysisRepository.count();
    const totalCompanies = await this.companyRepository.count();

    return {
      totalProjects,
      totalCandidates,
      totalAnalyses,
      totalCompanies,
      averageAnalysisRate: totalCandidates > 0 ? (totalAnalyses / totalCandidates) * 100 : 0,
    };
  }
}