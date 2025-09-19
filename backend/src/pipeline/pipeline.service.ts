import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { RecruitmentPipeline } from './entities/recruitment-pipeline.entity';
import { PipelineStage } from './entities/pipeline-stage.entity';
import { CandidatePipelineStatus } from './entities/candidate-pipeline-status.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Project } from '../projects/entities/project.entity';
import { CreatePipelineDto, UpdatePipelineDto, MoveCandidateDto } from './dto';

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  constructor(
    @InjectRepository(RecruitmentPipeline)
    private pipelineRepository: Repository<RecruitmentPipeline>,
    @InjectRepository(PipelineStage)
    private stageRepository: Repository<PipelineStage>,
    @InjectRepository(CandidatePipelineStatus)
    private candidateStatusRepository: Repository<CandidatePipelineStatus>,
    @InjectRepository(Candidate)
    private candidateRepository: Repository<Candidate>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async createDefaultPipeline(projectId: string): Promise<RecruitmentPipeline> {
    this.logger.log(`🔄 Creating default pipeline for project ${projectId}`);

    return await this.dataSource.transaction(async manager => {
      this.logger.log(`📝 Starting transaction for project ${projectId}`);

      // Créer le pipeline
      const pipeline = manager.create(RecruitmentPipeline, {
        name: 'Pipeline de Recrutement',
        description: 'Pipeline par défaut pour le suivi des candidats',
        projectId,
        isActive: true,
      });

      const savedPipeline = await manager.save(pipeline);
      this.logger.log(`✅ Pipeline entity saved with ID: ${savedPipeline.id}`);

      // Créer les étapes par défaut
      const defaultStages = [
        { name: 'Candidature', description: 'Candidats ayant postulé', color: '#3b82f6', order: 1, isDefault: true },
        { name: 'Pré-sélection', description: 'Première sélection des candidats', color: '#f59e0b', order: 2, isDefault: true },
        { name: 'Entretien RH', description: 'Entretien avec les ressources humaines', color: '#8b5cf6', order: 3, isDefault: true },
        { name: 'Entretien Technique', description: 'Évaluation technique du candidat', color: '#ef4444', order: 4, isDefault: true },
        { name: 'Décision Finale', description: 'Prise de décision et validation', color: '#10b981', order: 5, isDefault: true },
      ];

      this.logger.log(`🎯 Creating ${defaultStages.length} default stages`);
      const stages = [];
      for (const stageData of defaultStages) {
        const stage = manager.create(PipelineStage, {
          ...stageData,
          pipelineId: savedPipeline.id,
        });
        const savedStage = await manager.save(stage);
        stages.push(savedStage);
        this.logger.log(`✅ Stage created: ${savedStage.name} (${savedStage.id})`);
      }

      // Mettre tous les candidats existants du projet dans la première étape
      const candidates = await manager.find(Candidate, { where: { projectId } });
      const firstStage = stages[0];

      this.logger.log(`👥 Found ${candidates.length} existing candidates to assign to first stage`);

      for (const candidate of candidates) {
        const status = manager.create(CandidatePipelineStatus, {
          candidateId: candidate.id,
          pipelineId: savedPipeline.id,
          currentStageId: firstStage.id,
          movedBy: 'system', // TODO: Utiliser l'ID de l'utilisateur créateur du projet
          movedAt: new Date(),
          notes: 'Ajouté automatiquement lors de la création du pipeline',
        });
        await manager.save(status);
        this.logger.log(`✅ Candidate ${candidate.name} assigned to stage ${firstStage.name}`);
      }

      this.logger.log(`🎉 Default pipeline created successfully for project ${projectId}:`, {
        pipelineId: savedPipeline.id,
        stagesCount: stages.length,
        candidatesAssigned: candidates.length
      });

      // Retourner le pipeline avec les stages
      savedPipeline.stages = stages;
      return savedPipeline;
    });
  }

  async findByProject(projectId: string, companyId: string): Promise<RecruitmentPipeline[]> {
    // Vérifier que le projet appartient à l'entreprise
    const project = await this.projectRepository.findOne({
      where: { id: projectId, company_id: companyId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found in your company`);
    }

    return await this.pipelineRepository.find({
      where: { projectId },
      relations: ['stages'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, companyId: string): Promise<RecruitmentPipeline> {
    const pipeline = await this.pipelineRepository.findOne({
      where: { id },
      relations: ['project', 'stages'],
    });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline with ID ${id} not found`);
    }

    // Vérifier que le pipeline appartient à une entreprise autorisée
    if (pipeline.project.company_id !== companyId) {
      throw new NotFoundException(`Pipeline with ID ${id} not found in your company`);
    }

    return pipeline;
  }

  async getPipelineWithCandidates(id: string, companyId: string): Promise<any> {
    const pipeline = await this.findOne(id, companyId);

    // Récupérer les étapes avec les candidats
    const stages = await this.stageRepository.find({
      where: { pipelineId: id },
      order: { order: 'ASC' },
    });

    const stagesWithCandidates = await Promise.all(
      stages.map(async (stage) => {
        const candidateStatuses = await this.candidateStatusRepository.find({
          where: { currentStageId: stage.id },
          relations: ['candidate'],
          order: { movedAt: 'DESC' },
        });

        return {
          ...stage,
          candidates: candidateStatuses.map(status => ({
            ...status.candidate,
            pipelineStatus: {
              id: status.id,
              movedAt: status.movedAt,
              notes: status.notes,
              movedBy: status.movedBy,
            },
          })),
        };
      })
    );

    return {
      ...pipeline,
      stages: stagesWithCandidates,
    };
  }

  async create(createPipelineDto: CreatePipelineDto, projectId: string, companyId: string): Promise<RecruitmentPipeline> {
    // Vérifier que le projet appartient à l'entreprise
    const project = await this.projectRepository.findOne({
      where: { id: projectId, company_id: companyId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found in your company`);
    }

    return await this.dataSource.transaction(async manager => {
      const pipeline = manager.create(RecruitmentPipeline, {
        ...createPipelineDto,
        projectId,
      });

      const savedPipeline = await manager.save(pipeline);

      // Créer les étapes si fournies
      if (createPipelineDto.stages && createPipelineDto.stages.length > 0) {
        for (let i = 0; i < createPipelineDto.stages.length; i++) {
          const stageData = createPipelineDto.stages[i];
          const stage = manager.create(PipelineStage, {
            ...stageData,
            pipelineId: savedPipeline.id,
            order: i + 1,
          });
          await manager.save(stage);
        }
      }

      return savedPipeline;
    });
  }

  async update(id: string, updatePipelineDto: UpdatePipelineDto, companyId: string): Promise<RecruitmentPipeline> {
    const pipeline = await this.findOne(id, companyId);

    await this.pipelineRepository.update(id, updatePipelineDto);
    return this.findOne(id, companyId);
  }

  async remove(id: string, companyId: string): Promise<void> {
    const pipeline = await this.findOne(id, companyId);

    await this.dataSource.transaction(async manager => {
      // Supprimer tous les statuts des candidats pour ce pipeline
      await manager.delete(CandidatePipelineStatus, { pipelineId: id });

      // Supprimer toutes les étapes
      await manager.delete(PipelineStage, { pipelineId: id });

      // Supprimer le pipeline
      await manager.delete(RecruitmentPipeline, { id });
    });

    this.logger.log(`Pipeline ${id} deleted successfully`);
  }

  async addStage(pipelineId: string, stageData: { name: string; description?: string; color?: string }, companyId: string): Promise<PipelineStage> {
    const pipeline = await this.findOne(pipelineId, companyId);

    // Trouver l'ordre suivant
    const lastStage = await this.stageRepository.findOne({
      where: { pipelineId },
      order: { order: 'DESC' },
    });

    const newOrder = lastStage ? lastStage.order + 1 : 1;

    const stage = this.stageRepository.create({
      ...stageData,
      pipelineId,
      order: newOrder,
      isDefault: false,
    });

    return await this.stageRepository.save(stage);
  }

  async updateStage(stageId: string, stageData: { name?: string; description?: string; color?: string }, companyId: string): Promise<PipelineStage> {
    const stage = await this.stageRepository.findOne({
      where: { id: stageId },
      relations: ['pipeline', 'pipeline.project'],
    });

    if (!stage) {
      throw new NotFoundException(`Stage with ID ${stageId} not found`);
    }

    if (stage.pipeline.project.company_id !== companyId) {
      throw new NotFoundException(`Stage with ID ${stageId} not found in your company`);
    }

    await this.stageRepository.update(stageId, stageData);
    return await this.stageRepository.findOne({ where: { id: stageId } });
  }

  async removeStage(stageId: string, companyId: string): Promise<void> {
    const stage = await this.stageRepository.findOne({
      where: { id: stageId },
      relations: ['pipeline', 'pipeline.project'],
    });

    if (!stage) {
      throw new NotFoundException(`Stage with ID ${stageId} not found`);
    }

    if (stage.pipeline.project.company_id !== companyId) {
      throw new NotFoundException(`Stage with ID ${stageId} not found in your company`);
    }

    if (stage.isDefault) {
      throw new BadRequestException('Cannot delete default stage');
    }

    // Vérifier s'il y a des candidats dans cette étape
    const candidatesCount = await this.candidateStatusRepository.count({
      where: { currentStageId: stageId },
    });

    if (candidatesCount > 0) {
      throw new BadRequestException(`Cannot delete stage with ${candidatesCount} candidates. Move them to another stage first.`);
    }

    await this.stageRepository.remove(stage);
  }

  async moveCandidate(moveCandidateDto: MoveCandidateDto, companyId: string, userId: string): Promise<CandidatePipelineStatus> {
    const { candidateId, stageId, notes } = moveCandidateDto;

    // Vérifier que le candidat existe et appartient à l'entreprise
    const candidate = await this.candidateRepository.findOne({
      where: { id: candidateId },
      relations: ['project'],
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${candidateId} not found`);
    }

    if (candidate.project.company_id !== companyId) {
      throw new NotFoundException(`Candidate with ID ${candidateId} not found in your company`);
    }

    // Vérifier que l'étape existe et appartient au même projet
    const stage = await this.stageRepository.findOne({
      where: { id: stageId },
      relations: ['pipeline'],
    });

    if (!stage) {
      throw new NotFoundException(`Stage with ID ${stageId} not found`);
    }

    if (stage.pipeline.projectId !== candidate.projectId) {
      throw new BadRequestException('Stage and candidate must belong to the same project');
    }

    // Vérifier s'il y a déjà un statut pour ce candidat dans ce pipeline
    const existingStatus = await this.candidateStatusRepository.findOne({
      where: {
        candidateId,
        pipelineId: stage.pipelineId,
      },
    });

    return await this.dataSource.transaction(async manager => {
      if (existingStatus) {
        // Mettre à jour le statut existant
        await manager.update(CandidatePipelineStatus, existingStatus.id, {
          previousStageId: existingStatus.currentStageId,
          currentStageId: stageId,
          movedBy: userId,
          movedAt: new Date(),
          notes,
        });

        return await manager.findOne(CandidatePipelineStatus, {
          where: { id: existingStatus.id },
          relations: ['candidate', 'currentStage', 'previousStage'],
        });
      } else {
        // Créer un nouveau statut
        const newStatus = manager.create(CandidatePipelineStatus, {
          candidateId,
          pipelineId: stage.pipelineId,
          currentStageId: stageId,
          movedBy: userId,
          movedAt: new Date(),
          notes,
        });

        const savedStatus = await manager.save(newStatus);
        return await manager.findOne(CandidatePipelineStatus, {
          where: { id: savedStatus.id },
          relations: ['candidate', 'currentStage', 'previousStage'],
        });
      }
    });
  }

  async reorderStages(pipelineId: string, stageOrders: { stageId: string; order: number }[], companyId: string): Promise<PipelineStage[]> {
    const pipeline = await this.findOne(pipelineId, companyId);

    await this.dataSource.transaction(async manager => {
      for (const { stageId, order } of stageOrders) {
        await manager.update(PipelineStage, stageId, { order });
      }
    });

    return await this.stageRepository.find({
      where: { pipelineId },
      order: { order: 'ASC' },
    });
  }

  async getPipelineStats(pipelineId: string, companyId: string): Promise<any> {
    const pipeline = await this.findOne(pipelineId, companyId);

    const stages = await this.stageRepository.find({
      where: { pipelineId },
      order: { order: 'ASC' },
    });

    const statsPromises = stages.map(async (stage) => {
      const candidatesCount = await this.candidateStatusRepository.count({
        where: { currentStageId: stage.id },
      });

      // Calculer le temps moyen dans cette étape
      const avgTimeQuery = await this.dataSource
        .createQueryBuilder()
        .select('AVG(EXTRACT(EPOCH FROM (COALESCE(next_status.movedAt, NOW()) - current_status.movedAt))) / 86400', 'avgDays')
        .from(CandidatePipelineStatus, 'current_status')
        .leftJoin(
          CandidatePipelineStatus,
          'next_status',
          'next_status.candidateId = current_status.candidateId AND next_status.previousStageId = current_status.currentStageId'
        )
        .where('current_status.currentStageId = :stageId', { stageId: stage.id })
        .getRawOne();

      return {
        stageId: stage.id,
        stageName: stage.name,
        candidatesCount,
        averageDays: avgTimeQuery?.avgDays ? Math.round(parseFloat(avgTimeQuery.avgDays) * 10) / 10 : 0,
      };
    });

    const stageStats = await Promise.all(statsPromises);

    // Calculer les taux de conversion entre étapes
    const conversionRates = [];
    for (let i = 0; i < stages.length - 1; i++) {
      const currentStage = stageStats[i];
      const nextStage = stageStats[i + 1];

      const conversionRate = currentStage.candidatesCount > 0
        ? Math.round((nextStage.candidatesCount / currentStage.candidatesCount) * 100)
        : 0;

      conversionRates.push({
        fromStage: currentStage.stageName,
        toStage: nextStage.stageName,
        rate: conversionRate,
      });
    }

    return {
      pipeline: {
        id: pipeline.id,
        name: pipeline.name,
      },
      stages: stageStats,
      conversionRates,
      totalCandidates: stageStats.reduce((sum, stage) => sum + stage.candidatesCount, 0),
    };
  }
}