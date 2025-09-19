src/migrations/1700000014000-CreatePipelineTables.ts:170:65 - error TS2350: Only a void function can be called with the 'new' keyword.

170     await queryRunner.createForeignKey('recruitment_pipelines', new ForeignKey({
                                                                    ~~~~~~~~~~~~~~~~
171       columnNames: ['projectId'],
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
... 
174       onDelete: 'CASCADE',
    ~~~~~~~~~~~~~~~~~~~~~~~~~~
175     }));
    ~~~~~~

src/migrations/1700000014000-CreatePipelineTables.ts:171:7 - error TS2353: Object literal may only specify known properties, and 'columnNames' does not exist in type '(type?: any) => ObjectType<unknown>'.

171       columnNames: ['projectId'],
          ~~~~~~~~~~~

src/migrations/1700000014000-CreatePipelineTables.ts:177:59 - error TS2350: Only a void function can be called with the 'new' keyword.

177     await queryRunner.createForeignKey('pipeline_stages', new ForeignKey({
                                                              ~~~~~~~~~~~~~~~~
178       columnNames: ['pipelineId'],
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
... 
181       onDelete: 'CASCADE',
    ~~~~~~~~~~~~~~~~~~~~~~~~~~
182     }));
    ~~~~~~

src/migrations/1700000014000-CreatePipelineTables.ts:178:7 - error TS2353: Object literal may only specify known properties, and 'columnNames' does not exist in type '(type?: any) => ObjectType<unknown>'.

178       columnNames: ['pipelineId'],
          ~~~~~~~~~~~

src/migrations/1700000014000-CreatePipelineTables.ts:184:71 - error TS2350: Only a void function can be called with the 'new' keyword.

184     await queryRunner.createForeignKey('candidate_pipeline_statuses', new ForeignKey({
                                                                          ~~~~~~~~~~~~~~~~
185       columnNames: ['candidateId'],
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
...
188       onDelete: 'CASCADE',
    ~~~~~~~~~~~~~~~~~~~~~~~~~~
189     }));
    ~~~~~~

src/migrations/1700000014000-CreatePipelineTables.ts:185:7 - error TS2353: Object literal may only specify known properties, and 'columnNames' does not exist in type '(type?: any) => ObjectType<unknown>'.

185       columnNames: ['candidateId'],
          ~~~~~~~~~~~

src/migrations/1700000014000-CreatePipelineTables.ts:191:71 - error TS2350: Only a void function can be called with the 'new' keyword.

191     await queryRunner.createForeignKey('candidate_pipeline_statuses', new ForeignKey({
                                                                          ~~~~~~~~~~~~~~~~
192       columnNames: ['pipelineId'],
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
...
195       onDelete: 'CASCADE',
    ~~~~~~~~~~~~~~~~~~~~~~~~~~
196     }));
    ~~~~~~

src/migrations/1700000014000-CreatePipelineTables.ts:192:7 - error TS2353: Object literal may only specify known properties, and 'columnNames' does not exist in type '(type?: any) => ObjectType<unknown>'.

192       columnNames: ['pipelineId'],
          ~~~~~~~~~~~

src/migrations/1700000014000-CreatePipelineTables.ts:198:71 - error TS2350: Only a void function can be called with the 'new' keyword.

198     await queryRunner.createForeignKey('candidate_pipeline_statuses', new ForeignKey({
                                                                          ~~~~~~~~~~~~~~~~
199       columnNames: ['currentStageId'],
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
...
202       onDelete: 'CASCADE',
    ~~~~~~~~~~~~~~~~~~~~~~~~~~
203     }));
    ~~~~~~

src/migrations/1700000014000-CreatePipelineTables.ts:199:7 - error TS2353: Object literal may only specify known properties, and 'columnNames' does not exist in type '(type?: any) => ObjectType<unknown>'.

199       columnNames: ['currentStageId'],
          ~~~~~~~~~~~

src/migrations/1700000014000-CreatePipelineTables.ts:205:71 - error TS2350: Only a void function can be called with the 'new' keyword.

205     await queryRunner.createForeignKey('candidate_pipeline_statuses', new ForeignKey({
                                                                          ~~~~~~~~~~~~~~~~
206       columnNames: ['previousStageId'],
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
...
209       onDelete: 'SET NULL',
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~
210     }));
    ~~~~~~

src/migrations/1700000014000-CreatePipelineTables.ts:206:7 - error TS2353: Object literal may only specify known properties, and 'columnNames' does not exist in type '(type?: any) => ObjectType<unknown>'.

206       columnNames: ['previousStageId'],
          ~~~~~~~~~~~

src/migrations/1700000014000-CreatePipelineTables.ts:212:71 - error TS2350: Only a void function can be called with the 'new' keyword.

212     await queryRunner.createForeignKey('candidate_pipeline_statuses', new ForeignKey({
                                                                          ~~~~~~~~~~~~~~~~
213       columnNames: ['movedBy'],
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
...
216       onDelete: 'RESTRICT',
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~
217     }));
    ~~~~~~

src/migrations/1700000014000-CreatePipelineTables.ts:213:7 - error TS2353: Object literal may only specify known properties, and 'columnNames' does not exist in type '(type?: any) => ObjectType<unknown>'.

213       columnNames: ['movedBy'],
          ~~~~~~~~~~~

src/migrations/1700000014000-CreatePipelineTables.ts:220:60 - error TS2350: Only a void function can be called with the 'new' keyword.

220     await queryRunner.createIndex('recruitment_pipelines', new Index('IDX_pipeline_project', ['projectId']));
                                                               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/migrations/1700000014000-CreatePipelineTables.ts:221:54 - error TS2350: Only a void function can be called with the 'new' keyword.

221     await queryRunner.createIndex('pipeline_stages', new Index('IDX_stage_pipeline_order', ['pipelineId', 'order']));
                                                         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/migrations/1700000014000-CreatePipelineTables.ts:222:66 - error TS2350: Only a void function can be called with the 'new' keyword.

222     await queryRunner.createIndex('candidate_pipeline_statuses', new Index('IDX_candidate_current_stage', ['candidateId', 'currentStageId']));
                                                                     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/migrations/1700000014000-CreatePipelineTables.ts:223:66 - error TS2350: Only a void function can be called with the 'new' keyword.

223     await queryRunner.createIndex('candidate_pipeline_statuses', new Index('IDX_pipeline_stage_candidates', ['pipelineId', 'currentStageId']));
                                                                     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/pipeline/pipeline.controller.ts:15:30 - error TS2307: Cannot find module '../auth/jwt-auth.guard' or its corresponding type declarations.

15 import { JwtAuthGuard } from '../auth/jwt-auth.guard';
                                ~~~~~~~~~~~~~~~~~~~~~~~~

src/pipeline/pipeline.controller.ts:16:67 - error TS2307: Cannot find module '@nestjs/swagger' or its corresponding type declarations.

16 import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
                                                                     ~~~~~~~~~~~~~~~~~