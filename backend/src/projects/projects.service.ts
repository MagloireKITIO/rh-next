import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Analysis } from '../analysis/entities/analysis.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Candidate)
    private candidateRepository: Repository<Candidate>,
    @InjectRepository(Analysis)
    private analysisRepository: Repository<Analysis>,
  ) {}

  async create(createProjectDto: CreateProjectDto, companyId: string, userId: string): Promise<Project> {
    const project = this.projectRepository.create({
      ...createProjectDto,
      company_id: companyId,
      created_by: userId,
    });
    return await this.projectRepository.save(project);
  }

  async findAll(companyId: string): Promise<Project[]> {
    return await this.projectRepository.find({
      where: { company_id: companyId },
      relations: ['candidates'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, companyId: string): Promise<Project> {
    console.log('🔍 [PROJECTS SERVICE] findOne called:', {
      projectId: id,
      companyId: companyId
    });

    const project = await this.projectRepository.findOne({
      where: { id, company_id: companyId },
      relations: ['candidates', 'analyses'],
    });

    console.log('🔍 [PROJECTS SERVICE] Database query result:', {
      found: project ? 'YES' : 'NO',
      projectId: project?.id,
      projectName: project?.name,
      projectCompanyId: project?.company_id
    });

    if (!project) {
      console.error('❌ [PROJECTS SERVICE] Project not found:', {
        searchedId: id,
        searchedCompanyId: companyId
      });
      throw new NotFoundException(`Project with ID ${id} not found in your company`);
    }

    console.log('✅ [PROJECTS SERVICE] Project found and returned');
    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, companyId: string): Promise<Project> {
    // Vérifier que le projet appartient à l'entreprise
    const project = await this.findOne(id, companyId);
    await this.projectRepository.update(id, updateProjectDto);
    return this.findOne(id, companyId);
  }

  async remove(id: string, companyId: string): Promise<void> {
    // Vérifier que le projet existe et appartient à l'entreprise
    const project = await this.projectRepository.findOne({
      where: { id, company_id: companyId },
      relations: ['candidates', 'analyses']
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found in your company`);
    }

    this.logger.log(`Starting deletion of project ${project.name} (${id})`);

    try {
      // 1. Supprimer toutes les analyses du projet
      const analysisCount = await this.analysisRepository.count({ where: { projectId: id } });
      if (analysisCount > 0) {
        await this.analysisRepository.delete({ projectId: id });
        this.logger.log(`Deleted ${analysisCount} analyses`);
      }

      // 2. Supprimer tous les candidats du projet
      const candidateCount = await this.candidateRepository.count({ where: { projectId: id } });
      if (candidateCount > 0) {
        await this.candidateRepository.delete({ projectId: id });
        this.logger.log(`Deleted ${candidateCount} candidates`);
      }

      // 3. Supprimer le projet lui-même
      const result = await this.projectRepository.delete(id);
      if (result.affected === 0) {
        throw new NotFoundException(`Project with ID ${id} not found`);
      }

      this.logger.log(`Successfully deleted project ${project.name} and all associated data`);
    } catch (error) {
      this.logger.error(`Error deleting project ${id}:`, error);
      throw error;
    }
  }

  async getProjectStats(id: string, companyId: string) {
    const project = await this.findOne(id, companyId);
    
    const totalCandidates = project.candidates.length;
    const analyzedCandidates = project.candidates.filter(c => c.status === 'analyzed').length;
    const avgScore = project.candidates.length > 0 
      ? project.candidates.reduce((sum, c) => sum + Number(c.score), 0) / project.candidates.length 
      : 0;
    
    const topCandidates = project.candidates
      .sort((a, b) => Number(b.score) - Number(a.score))
      .slice(0, 5);

    return {
      totalCandidates,
      analyzedCandidates,
      pendingAnalysis: totalCandidates - analyzedCandidates,
      averageScore: Math.round(avgScore * 100) / 100,
      topCandidates: topCandidates.map(c => ({
        id: c.id,
        name: c.name,
        score: c.score,
        summary: c.summary,
      })),
    };
  }

  async generateShareLink(id: string, companyId: string, expirationDays: number = 30): Promise<{ shareToken: string, expiresAt: Date }> {
    const project = await this.findOne(id, companyId);
    
    const shareToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    await this.projectRepository.update(id, {
      public_share_token: shareToken,
      is_public_shared: true,
      public_share_expires_at: expiresAt,
    });

    return { shareToken, expiresAt };
  }

  async getSharedProject(shareToken: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { 
        public_share_token: shareToken,
        is_public_shared: true,
      },
      relations: ['candidates', 'analyses', 'company'],
    });

    if (!project) {
      throw new NotFoundException('Lien de partage invalide ou expiré');
    }

    if (project.public_share_expires_at && new Date() > project.public_share_expires_at) {
      throw new NotFoundException('Lien de partage expiré');
    }

    return project;
  }

  async revokeShare(id: string, companyId: string): Promise<void> {
    const project = await this.findOne(id, companyId);
    
    await this.projectRepository.update(id, {
      public_share_token: null,
      is_public_shared: false,
      public_share_expires_at: null,
    });
  }
}