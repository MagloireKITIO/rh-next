import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete, 
  UseInterceptors, 
  UploadedFiles,
  Query,
  Res,
  UseGuards
} from '@nestjs/common';
import { Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CandidatesService } from './candidates.service';
import { AnalysisQueueService } from './analysis-queue.service';
import { ProjectsService } from '../projects/projects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyGuard } from '../auth/guards/company.guard';
import { CurrentCompany } from '../auth/decorators/current-user.decorator';

@Controller('candidates')
@UseGuards(JwtAuthGuard, CompanyGuard)
export class CandidatesController {
  constructor(
    private readonly candidatesService: CandidatesService,
    private readonly analysisQueueService: AnalysisQueueService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Get()
  findAll(@CurrentCompany() companyId: string, @Query('projectId') projectId?: string) {
    if (projectId) {
      return this.candidatesService.findByProject(projectId, companyId);
    }
    return this.candidatesService.findAll(companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentCompany() companyId: string) {
    return this.candidatesService.findOne(id, companyId);
  }

  @Get('project/:projectId/candidate/:candidateId')
  findCandidateInProject(
    @Param('projectId') projectId: string,
    @Param('candidateId') candidateId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.candidatesService.findCandidateInProject(projectId, candidateId, companyId);
  }

  @Post('upload/:projectId')
  @UseInterceptors(FilesInterceptor('files', 20, {
    storage: memoryStorage(), // Utiliser memoryStorage pour avoir accès au buffer
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed'), false);
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  }))
  async uploadCVs(
    @Param('projectId') projectId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentCompany() companyId: string
  ) {
    const project = await this.projectsService.findOne(projectId, companyId);
    
    const results = await Promise.allSettled(
      files.map(file => this.candidatesService.uploadCV(file, projectId, project))
    );

    const successful = results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<any>).value);

    const failed = results
      .filter(result => result.status === 'rejected')
      .map((result, index) => ({
        filename: files[index].originalname,
        error: (result as PromiseRejectedResult).reason.message
      }));

    return {
      successful: successful.length,
      failed: failed.length,
      total: files.length,
      candidates: successful,
      errors: failed,
    };
  }

  @Post(':id/analyze')
  async analyzeCandidate(@Param('id') id: string, @CurrentCompany() companyId: string) {
    await this.candidatesService.analyzeCandidate(id, companyId);
    return { message: 'Analysis started' };
  }

  @Get('project/:projectId/rankings')
  getRankingChanges(@Param('projectId') projectId: string, @CurrentCompany() companyId: string) {
    return this.candidatesService.getRankingChanges(projectId, companyId);
  }

  @Get('project/:projectId/queue-status')
  getQueueStatus(@Param('projectId') projectId: string) {
    return this.analysisQueueService.getQueueStatus(projectId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.candidatesService.remove(id);
  }

  @Get('file/:filename')
  async serveFile(@Param('filename') filename: string, @Res() res: Response) {
    try {
      const filePath = `./uploads/${filename}`;
      return res.sendFile(filename, { root: './uploads' });
    } catch (error) {
      return res.status(404).json({ message: 'File not found' });
    }
  }
}