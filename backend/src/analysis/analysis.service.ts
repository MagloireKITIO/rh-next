import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Analysis } from './entities/analysis.entity';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { Project } from '../projects/entities/project.entity';
import { Candidate } from '../candidates/entities/candidate.entity';

@Injectable()
export class AnalysisService {
  constructor(
    @InjectRepository(Analysis)
    private analysisRepository: Repository<Analysis>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Candidate)
    private candidateRepository: Repository<Candidate>,
  ) {}

  async create(createAnalysisDto: CreateAnalysisDto): Promise<Analysis> {
    const analysis = this.analysisRepository.create(createAnalysisDto);
    return await this.analysisRepository.save(analysis);
  }

  async findAll(): Promise<Analysis[]> {
    return await this.analysisRepository.find({
      relations: ['project', 'candidate'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByProject(projectId: string, companyId: string): Promise<Analysis[]> {
    return await this.analysisRepository.find({
      where: { projectId, project: { company_id: companyId } },
      relations: ['candidate'],
      order: { score: 'DESC' },
    });
  }

  async findOne(id: string, companyId: string): Promise<Analysis> {
    const analysis = await this.analysisRepository.findOne({
      where: { id, project: { company_id: companyId } },
      relations: ['project', 'candidate'],
    });

    if (!analysis) {
      throw new NotFoundException(`Analysis with ID ${id} not found in your company`);
    }

    return analysis;
  }

  async generateProjectReport(projectId: string, companyId: string) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, company_id: companyId },
      relations: ['candidates', 'analyses'],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found in your company`);
    }

    const candidates = project.candidates;
    const analyses = project.analyses;

    // Statistiques générales
    const totalCandidates = candidates.length;
    const analyzedCandidates = candidates.filter(c => c.status === 'analyzed').length;
    const averageScore = candidates.length > 0 
      ? candidates.reduce((sum, c) => sum + Number(c.score), 0) / candidates.length 
      : 0;

    // Distribution des scores
    const scoreRanges = {
      excellent: candidates.filter(c => Number(c.score) >= 80).length,
      good: candidates.filter(c => Number(c.score) >= 60 && Number(c.score) < 80).length,
      average: candidates.filter(c => Number(c.score) >= 40 && Number(c.score) < 60).length,
      poor: candidates.filter(c => Number(c.score) < 40).length,
    };

    // Top candidats
    const topCandidates = candidates
      .filter(c => c.status === 'analyzed')
      .sort((a, b) => Number(b.score) - Number(a.score))
      .slice(0, 10)
      .map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        score: c.score,
        summary: c.summary,
        ranking: c.ranking,
      }));

    // Analyse des compétences les plus recherchées
    const skillsAnalysis = this.analyzeSkillsFromCandidates(candidates);

    // Recommandations
    const recommendations = this.generateRecommendations(candidates, averageScore);

    return {
      project: {
        id: project.id,
        name: project.name,
        jobDescription: project.jobDescription,
        createdAt: project.createdAt,
      },
      statistics: {
        totalCandidates,
        analyzedCandidates,
        pendingAnalysis: totalCandidates - analyzedCandidates,
        averageScore: Math.round(averageScore * 100) / 100,
        scoreDistribution: scoreRanges,
      },
      topCandidates,
      skillsAnalysis,
      recommendations,
      analysisDetails: analyses.map(a => ({
        id: a.id,
        candidateName: candidates.find(c => c.id === a.candidateId)?.name,
        score: a.score,
        summary: a.summary,
        strengths: a.strengths,
        weaknesses: a.weaknesses,
        createdAt: a.createdAt,
      })),
      generatedAt: new Date(),
    };
  }

  private analyzeSkillsFromCandidates(candidates: Candidate[]) {
    const skillCounts = new Map<string, number>();
    
    candidates.forEach(candidate => {
      if (candidate.extractedData?.skills) {
        candidate.extractedData.skills.forEach((skill: string) => {
          const normalizedSkill = skill.toLowerCase().trim();
          skillCounts.set(normalizedSkill, (skillCounts.get(normalizedSkill) || 0) + 1);
        });
      }
    });

    const sortedSkills = Array.from(skillCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([skill, count]) => ({
        skill,
        count,
        percentage: Math.round((count / candidates.length) * 100),
      }));

    return {
      mostCommonSkills: sortedSkills,
      totalUniqueSkills: skillCounts.size,
    };
  }

  private generateRecommendations(candidates: Candidate[], averageScore: number) {
    const recommendations = [];

    const highScorers = candidates.filter(c => Number(c.score) >= 80);
    const lowScorers = candidates.filter(c => Number(c.score) < 40);

    if (highScorers.length > 0) {
      recommendations.push({
        type: 'success',
        title: 'Excellents candidats identifiés',
        description: `${highScorers.length} candidat(s) ont obtenu un score excellent (≥80). Prioritisez ces profils pour les entretiens.`,
        candidates: highScorers.slice(0, 5).map(c => ({ id: c.id, name: c.name, score: c.score }))
      });
    }

    if (averageScore < 50) {
      recommendations.push({
        type: 'warning',
        title: 'Score moyen faible',
        description: 'Le score moyen est inférieur à 50. Considérez réviser les critères de recherche ou élargir le pool de candidats.',
      });
    }

    if (lowScorers.length > candidates.length * 0.7) {
      recommendations.push({
        type: 'info',
        title: 'Beaucoup de candidats en dessous du seuil',
        description: 'Plus de 70% des candidats ont un score faible. Le profil recherché pourrait être trop spécifique.',
      });
    }

    const quickWins = candidates.filter(c => Number(c.score) >= 60 && Number(c.score) < 80);
    if (quickWins.length > 0) {
      recommendations.push({
        type: 'info',
        title: 'Candidats prometteurs',
        description: `${quickWins.length} candidat(s) ont un potentiel intéressant (score 60-79). Ils pourraient convenir avec formation.`,
        candidates: quickWins.slice(0, 3).map(c => ({ id: c.id, name: c.name, score: c.score }))
      });
    }

    return recommendations;
  }

  async remove(id: string): Promise<void> {
    const result = await this.analysisRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Analysis with ID ${id} not found`);
    }
  }

  async removeByCandidate(candidateId: string): Promise<void> {
    await this.analysisRepository.delete({ candidateId });
  }
}