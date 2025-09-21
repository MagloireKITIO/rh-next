import { PartialType } from '@nestjs/mapped-types';
import { CreateInterviewEvaluationDto } from './create-interview-evaluation.dto';

export class UpdateInterviewEvaluationDto extends PartialType(CreateInterviewEvaluationDto) {}