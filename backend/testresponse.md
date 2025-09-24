FAIL src/auth/auth.service.spec.ts (48.173 s, 3280 MB heap size)
  ● AuthService › updateProfile › should throw BadRequestException when email is already taken

    expect(received).rejects.toThrow()

    Received promise resolved instead of rejected
    Resolved to value: {"message": "Profile updated successfully", "user": {"email": "updated@example.com", "id": "1", "name": "Updated Name", "role": "user", "updated_at": 2025-09-24T10:53:08.661Z}}

    [0m [90m 312 |[39m       })[33m;[39m
     [90m 313 |[39m
    [31m[1m>[22m[39m[90m 314 |[39m       [36mawait[39m expect(service[33m.[39mupdateProfile([32m'1'[39m[33m,[39m updateProfileDto))[33m.[39mrejects[33m.[39mtoThrow([33mBadRequestException[39m)[33m;[39m
     [90m     |[39m             [31m[1m^[22m[39m
     [90m 315 |[39m       expect(mockUserRepository[33m.[39mfindOne)[33m.[39mtoHaveBeenCalledTimes([35m2[39m)[33m;[39m
     [90m 316 |[39m     })[33m;[39m
     [90m 317 |[39m   })[33m;[39m[0m

      at expect (../node_modules/expect/build/index.js:113:15)
      at Object.<anonymous> (auth/auth.service.spec.ts:314:13)

FAIL src/candidates/candidates.service.spec.ts (3340 MB heap size)
  ● CandidatesService › findAll › should return paginated candidates without filters

    TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')

    [0m [90m  99 |[39m     [90m// Construction dynamique des conditions WHERE[39m
     [90m 100 |[39m     [36mconst[39m queryBuilder [33m=[39m [36mthis[39m[33m.[39mcandidateRepository[33m.[39mcreateQueryBuilder([32m'candidate'[39m)
    [31m[1m>[22m[39m[90m 101 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.project'[39m[33m,[39m [32m'project'[39m)
     [90m     |[39m                                                         [31m[1m^[22m[39m
     [90m 102 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.analyses'[39m[33m,[39m [32m'analyses'[39m)
     [90m 103 |[39m       [33m.[39mwhere([32m'project.company_id = :companyId'[39m[33m,[39m { companyId })[33m;[39m
     [90m 104 |[39m[0m

      at CandidatesService.findAll (candidates/candidates.service.ts:101:57)
      at Object.<anonymous> (candidates/candidates.service.spec.ts:241:36)

  ● CandidatesService › findAll › should apply search filter

    TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')

    [0m [90m  99 |[39m     [90m// Construction dynamique des conditions WHERE[39m
     [90m 100 |[39m     [36mconst[39m queryBuilder [33m=[39m [36mthis[39m[33m.[39mcandidateRepository[33m.[39mcreateQueryBuilder([32m'candidate'[39m)
    [31m[1m>[22m[39m[90m 101 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.project'[39m[33m,[39m [32m'project'[39m)
     [90m     |[39m                                                         [31m[1m^[22m[39m
     [90m 102 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.analyses'[39m[33m,[39m [32m'analyses'[39m)
     [90m 103 |[39m       [33m.[39mwhere([32m'project.company_id = :companyId'[39m[33m,[39m { companyId })[33m;[39m
     [90m 104 |[39m[0m

      at CandidatesService.findAll (candidates/candidates.service.ts:101:57)
      at Object.<anonymous> (candidates/candidates.service.spec.ts:263:21)

  ● CandidatesService › findAll › should apply status filter

    TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')

    [0m [90m  99 |[39m     [90m// Construction dynamique des conditions WHERE[39m
     [90m 100 |[39m     [36mconst[39m queryBuilder [33m=[39m [36mthis[39m[33m.[39mcandidateRepository[33m.[39mcreateQueryBuilder([32m'candidate'[39m)
    [31m[1m>[22m[39m[90m 101 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.project'[39m[33m,[39m [32m'project'[39m)
     [90m     |[39m                                                         [31m[1m^[22m[39m
     [90m 102 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.analyses'[39m[33m,[39m [32m'analyses'[39m)
     [90m 103 |[39m       [33m.[39mwhere([32m'project.company_id = :companyId'[39m[33m,[39m { companyId })[33m;[39m
     [90m 104 |[39m[0m

      at CandidatesService.findAll (candidates/candidates.service.ts:101:57)
      at Object.<anonymous> (candidates/candidates.service.spec.ts:272:21)

  ● CandidatesService › findAll › should apply excellent score filter

    TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')

    [0m [90m  99 |[39m     [90m// Construction dynamique des conditions WHERE[39m
     [90m 100 |[39m     [36mconst[39m queryBuilder [33m=[39m [36mthis[39m[33m.[39mcandidateRepository[33m.[39mcreateQueryBuilder([32m'candidate'[39m)
    [31m[1m>[22m[39m[90m 101 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.project'[39m[33m,[39m [32m'project'[39m)
     [90m     |[39m                                                         [31m[1m^[22m[39m
     [90m 102 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.analyses'[39m[33m,[39m [32m'analyses'[39m)
     [90m 103 |[39m       [33m.[39mwhere([32m'project.company_id = :companyId'[39m[33m,[39m { companyId })[33m;[39m
     [90m 104 |[39m[0m

      at CandidatesService.findAll (candidates/candidates.service.ts:101:57)
      at Object.<anonymous> (candidates/candidates.service.spec.ts:278:21)

  ● CandidatesService › findAll › should apply good score filter

    TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')

    [0m [90m  99 |[39m     [90m// Construction dynamique des conditions WHERE[39m
     [90m 100 |[39m     [36mconst[39m queryBuilder [33m=[39m [36mthis[39m[33m.[39mcandidateRepository[33m.[39mcreateQueryBuilder([32m'candidate'[39m)
    [31m[1m>[22m[39m[90m 101 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.project'[39m[33m,[39m [32m'project'[39m)
     [90m     |[39m                                                         [31m[1m^[22m[39m
     [90m 102 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.analyses'[39m[33m,[39m [32m'analyses'[39m)
     [90m 103 |[39m       [33m.[39mwhere([32m'project.company_id = :companyId'[39m[33m,[39m { companyId })[33m;[39m
     [90m 104 |[39m[0m

      at CandidatesService.findAll (candidates/candidates.service.ts:101:57)
      at Object.<anonymous> (candidates/candidates.service.spec.ts:284:21)

  ● CandidatesService › findAll › should apply average score filter

    TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')

    [0m [90m  99 |[39m     [90m// Construction dynamique des conditions WHERE[39m
     [90m 100 |[39m     [36mconst[39m queryBuilder [33m=[39m [36mthis[39m[33m.[39mcandidateRepository[33m.[39mcreateQueryBuilder([32m'candidate'[39m)
    [31m[1m>[22m[39m[90m 101 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.project'[39m[33m,[39m [32m'project'[39m)
     [90m     |[39m                                                         [31m[1m^[22m[39m
     [90m 102 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.analyses'[39m[33m,[39m [32m'analyses'[39m)
     [90m 103 |[39m       [33m.[39mwhere([32m'project.company_id = :companyId'[39m[33m,[39m { companyId })[33m;[39m
     [90m 104 |[39m[0m

      at CandidatesService.findAll (candidates/candidates.service.ts:101:57)
      at Object.<anonymous> (candidates/candidates.service.spec.ts:290:21)

  ● CandidatesService › findAll › should apply poor score filter

    TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')

    [0m [90m  99 |[39m     [90m// Construction dynamique des conditions WHERE[39m
     [90m 100 |[39m     [36mconst[39m queryBuilder [33m=[39m [36mthis[39m[33m.[39mcandidateRepository[33m.[39mcreateQueryBuilder([32m'candidate'[39m)
    [31m[1m>[22m[39m[90m 101 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.project'[39m[33m,[39m [32m'project'[39m)
     [90m     |[39m                                                         [31m[1m^[22m[39m
     [90m 102 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.analyses'[39m[33m,[39m [32m'analyses'[39m)
     [90m 103 |[39m       [33m.[39mwhere([32m'project.company_id = :companyId'[39m[33m,[39m { companyId })[33m;[39m
     [90m 104 |[39m[0m

      at CandidatesService.findAll (candidates/candidates.service.ts:101:57)
      at Object.<anonymous> (candidates/candidates.service.spec.ts:296:21)

  ● CandidatesService › findAll › should not apply filter for scoreFilter "all"

    TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')

    [0m [90m  99 |[39m     [90m// Construction dynamique des conditions WHERE[39m
     [90m 100 |[39m     [36mconst[39m queryBuilder [33m=[39m [36mthis[39m[33m.[39mcandidateRepository[33m.[39mcreateQueryBuilder([32m'candidate'[39m)
    [31m[1m>[22m[39m[90m 101 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.project'[39m[33m,[39m [32m'project'[39m)
     [90m     |[39m                                                         [31m[1m^[22m[39m
     [90m 102 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.analyses'[39m[33m,[39m [32m'analyses'[39m)
     [90m 103 |[39m       [33m.[39mwhere([32m'project.company_id = :companyId'[39m[33m,[39m { companyId })[33m;[39m
     [90m 104 |[39m[0m

      at CandidatesService.findAll (candidates/candidates.service.ts:101:57)
      at Object.<anonymous> (candidates/candidates.service.spec.ts:302:21)

  ● CandidatesService › findAll › should calculate pagination correctly for multiple pages

    TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')

    [0m [90m  99 |[39m     [90m// Construction dynamique des conditions WHERE[39m
     [90m 100 |[39m     [36mconst[39m queryBuilder [33m=[39m [36mthis[39m[33m.[39mcandidateRepository[33m.[39mcreateQueryBuilder([32m'candidate'[39m)
    [31m[1m>[22m[39m[90m 101 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.project'[39m[33m,[39m [32m'project'[39m)
     [90m     |[39m                                                         [31m[1m^[22m[39m
     [90m 102 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.analyses'[39m[33m,[39m [32m'analyses'[39m)
     [90m 103 |[39m       [33m.[39mwhere([32m'project.company_id = :companyId'[39m[33m,[39m { companyId })[33m;[39m
     [90m 104 |[39m[0m

      at CandidatesService.findAll (candidates/candidates.service.ts:101:57)
      at Object.<anonymous> (candidates/candidates.service.spec.ts:312:36)

[31m[Nest] 10836  - [39m24/09/2025 11:53:13 [31m  ERROR[39m [38;5;3m[SecurityService] [39m[31mFailed to log login attempt: Database connection failed[39m
Error: Database connection failed
    at Object.<anonymous> (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.spec.ts:250:21)
    at Promise.then.completed (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\utils.js:298:28)
    at new Promise (<anonymous>)
    at callAsyncCircusFn (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\utils.js:231:10)
    at _callCircusTest (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\run.js:316:40)
    at _runTest (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\run.js:252:3)
    at _runTestsForDescribeBlock (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\run.js:126:9)
    at _runTestsForDescribeBlock (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\run.js:121:9)
    at _runTestsForDescribeBlock (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\run.js:121:9)
    at run (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\run.js:71:3)
    at runAndTransformResultsToJestFormat (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapterInit.js:122:21)
    at jestAdapter (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapter.js:79:19)
    at runTestInternal (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-runner\build\runTest.js:367:16)
    at runTest (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-runner\build\runTest.js:444:34)
[31m[Nest] 10836  - [39m24/09/2025 11:53:14 [31m  ERROR[39m [38;5;3m[SecurityService] [39m[31mFailed to get login audit logs: Database query failed[39m
Error: Database query failed
    at Object.<anonymous> (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.spec.ts:422:21)
    at Promise.then.completed (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\utils.js:298:28)
    at new Promise (<anonymous>)
    at callAsyncCircusFn (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\utils.js:231:10)
    at _callCircusTest (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\run.js:316:40)
    at _runTest (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\run.js:252:3)
    at _runTestsForDescribeBlock (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\run.js:126:9)
    at _runTestsForDescribeBlock (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\run.js:121:9)
    at _runTestsForDescribeBlock (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\run.js:121:9)
    at run (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\run.js:71:3)
    at runAndTransformResultsToJestFormat (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapterInit.js:122:21)
    at jestAdapter (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapter.js:79:19)
    at runTestInternal (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-runner\build\runTest.js:367:16)
    at runTest (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-runner\build\runTest.js:444:34)
[31m[Nest] 10836  - [39m24/09/2025 11:53:14 [31m  ERROR[39m [38;5;3m[SecurityService] [39m[31mFailed to get login audit stats: Database statistics query failed[39m
Error: Database statistics query failed
    at Object.<anonymous> (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.spec.ts:540:21)
    at Promise.then.completed (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\utils.js:298:28)
    at new Promise (<anonymous>)
    at callAsyncCircusFn (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\utils.js:231:10)
    at _callCircusTest (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\run.js:316:40)
    at _runTest (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\run.js:252:3)
    at _runTestsForDescribeBlock (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\run.js:126:9)
    at _runTestsForDescribeBlock (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\run.js:121:9)
    at _runTestsForDescribeBlock (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\run.js:121:9)
    at run (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\run.js:71:3)
    at runAndTransformResultsToJestFormat (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapterInit.js:122:21)
    at jestAdapter (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapter.js:79:19)
    at runTestInternal (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-runner\build\runTest.js:367:16)
    at runTest (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-runner\build\runTest.js:444:34)
[31m[Nest] 10836  - [39m24/09/2025 11:53:14 [31m  ERROR[39m [38;5;3m[SecurityService] [39m[31mFailed to update session duration: Update failed[39m
Error: Update failed
    at Object.<anonymous> (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.spec.ts:565:21)
    at Promise.then.completed (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\utils.js:298:28)
    at new Promise (<anonymous>)
    at callAsyncCircusFn (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\utils.js:231:10)
    at _callCircusTest (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\run.js:316:40)
    at _runTest (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\run.js:252:3)
    at _runTestsForDescribeBlock (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\run.js:126:9)
    at _runTestsForDescribeBlock (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\run.js:121:9)
    at _runTestsForDescribeBlock (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\run.js:121:9)
    at run (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\run.js:71:3)
    at runAndTransformResultsToJestFormat (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapterInit.js:122:21)
    at jestAdapter (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapter.js:79:19)
    at runTestInternal (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-runner\build\runTest.js:367:16)
    at runTest (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\node_modules\jest-runner\build\runTest.js:444:34)
PASS src/security/security.service.spec.ts (3350 MB heap size)
PASS src/interviews/interviews.service.spec.ts (5.616 s, 3403 MB heap size)
PASS src/pipeline/pipeline.controller.spec.ts (3426 MB heap size)
  ● Console

    console.log
      Getting pipelines for project: project-uuid-1

      at PipelineController.log [as findByProject] (pipeline/pipeline.controller.ts:34:15)

    console.log
      Found 1 pipeline(s) for project project-uuid-1

      at PipelineController.log [as findByProject] (pipeline/pipeline.controller.ts:36:15)

    console.log
      Getting pipelines for project: invalid-project-id

      at PipelineController.log [as findByProject] (pipeline/pipeline.controller.ts:34:15)

    console.error
      Error getting pipelines for project invalid-project-id: Project not found

    [0m [90m 37 |[39m       [36mreturn[39m result[33m;[39m
     [90m 38 |[39m     } [36mcatch[39m (error) {
    [31m[1m>[22m[39m[90m 39 |[39m       console[33m.[39merror([32m`Error getting pipelines for project ${projectId}:`[39m[33m,[39m error[33m.[39mmessage)[33m;[39m
     [90m    |[39m               [31m[1m^[22m[39m
     [90m 40 |[39m       [36mthrow[39m error[33m;[39m
     [90m 41 |[39m     }
     [90m 42 |[39m   }[0m

      at PipelineController.error [as findByProject] (pipeline/pipeline.controller.ts:39:15)
      at Object.<anonymous> (pipeline/pipeline.controller.spec.ts:163:7)

    console.log
      Getting pipelines for project: project-uuid-1

      at PipelineController.log [as findByProject] (pipeline/pipeline.controller.ts:34:15)

    console.log
      Getting pipeline with candidates: pipeline-uuid-1

      at PipelineController.log [as getPipelineWithCandidates] (pipeline/pipeline.controller.ts:52:15)

    console.log
      Pipeline found with 1 stages

      at PipelineController.log [as getPipelineWithCandidates] (pipeline/pipeline.controller.ts:54:15)

    console.log
      Getting pipeline with candidates: invalid-id

      at PipelineController.log [as getPipelineWithCandidates] (pipeline/pipeline.controller.ts:52:15)

PASS src/interviews/interviews.controller.spec.ts (8.179 s, 3445 MB heap size)
PASS src/calendar/calendar.controller.spec.ts (5.483 s, 3510 MB heap size)
PASS src/companies/companies.controller.spec.ts (3535 MB heap size)
PASS src/security/security.controller.spec.ts (3567 MB heap size)
PASS src/auth/auth.controller.spec.ts (3588 MB heap size)
PASS src/projects/analytics/projects-analytics.controller.spec.ts (17.92 s, 3442 MB heap size)
PASS src/candidates/candidates.controller.spec.ts (3486 MB heap size)
PASS src/projects/projects.service.spec.ts (3602 MB heap size)
  ● Console

    console.log
      Warning: Indexing all PDF objects

      at console (../node_modules/pdf-parse/lib/pdf.js/v1.10.100/build/webpack:/src/shared/util.js:276:5)

    console.log
      Warning: Indexing all PDF objects

      at console (../node_modules/pdf-parse/lib/pdf.js/v1.10.100/build/webpack:/src/shared/util.js:276:5)

    console.log
      Warning: Indexing all PDF objects

      at console (../node_modules/pdf-parse/lib/pdf.js/v1.10.100/build/webpack:/src/shared/util.js:276:5)

PASS src/platform-settings/platform-settings.controller.spec.ts (3464 MB heap size)
PASS src/projects/projects.controller.spec.ts (3454 MB heap size)
PASS src/admin/admin.service.spec.ts (3483 MB heap size)
PASS src/mail/mail-automation.controller.spec.ts (3503 MB heap size)
PASS src/configuration/configuration.controller.spec.ts (3539 MB heap size)
PASS src/admin/admin.controller.spec.ts (3562 MB heap size)
PASS src/mail/mail-template.controller.spec.ts (3578 MB heap size)
PASS src/admin/analytics/analytics.controller.spec.ts (3608 MB heap size)
PASS src/team-requests/team-requests.controller.spec.ts (3637 MB heap size)
PASS src/analysis/analysis.controller.spec.ts (3651 MB heap size)
PASS src/mail/mail.controller.spec.ts (3672 MB heap size)
PASS src/configuration/configuration.service.spec.ts (3688 MB heap size)
PASS src/api-keys/api-keys.controller.spec.ts (3697 MB heap size)
PASS src/public/public.controller.spec.ts (3476 MB heap size)
PASS src/auth/guards/guards.spec.ts (3489 MB heap size)
PASS src/calendar/calendar.service.spec.ts (3504 MB heap size)
[31m[Nest] 10836  - [39m24/09/2025 11:54:37 [31m  ERROR[39m [38;5;3m[StorageService] [39m[31mError uploading to Supabase:[39m
[31m[Nest] 10836  - [39m24/09/2025 11:54:37 [31m  ERROR[39m [38;5;3m[StorageService] [39mObject(1) {
  message: [32m'Upload failed'[39m
}
[31m[Nest] 10836  - [39m24/09/2025 11:54:37 [31m  ERROR[39m [38;5;3m[StorageService] [39m[31mError uploading file to Supabase:[39m
[31m[Nest] 10836  - [39m24/09/2025 11:54:37 [31m  ERROR[39m [38;5;3m[StorageService] [39mError: Upload failed: Upload failed
    at StorageService.uploadFile [90m(C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\[39msrc\storage\storage.service.ts:62:15[90m)[39m
    at Object.<anonymous> [90m(C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\[39msrc\storage\storage.service.spec.ts:315:7[90m)[39m
[31m[Nest] 10836  - [39m24/09/2025 11:54:37 [31m  ERROR[39m [38;5;3m[StorageService] [39m[31mError uploading file to Supabase:[39m
[31m[Nest] 10836  - [39m24/09/2025 11:54:37 [31m  ERROR[39m [38;5;3m[StorageService] [39mError: Network error
    at Object.<anonymous> [90m(C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\[39msrc\storage\storage.service.spec.ts:334:52[90m)[39m
[31m[Nest] 10836  - [39m24/09/2025 11:54:37 [31m  ERROR[39m [38;5;3m[StorageService] [39m[31mError deleting from Supabase:[39m
[31m[Nest] 10836  - [39m24/09/2025 11:54:37 [31m  ERROR[39m [38;5;3m[StorageService] [39mObject(1) {
  message: [32m'Delete failed'[39m
}
[31m[Nest] 10836  - [39m24/09/2025 11:54:37 [31m  ERROR[39m [38;5;3m[StorageService] [39m[31mError deleting file from Supabase:[39m
[31m[Nest] 10836  - [39m24/09/2025 11:54:37 [31m  ERROR[39m [38;5;3m[StorageService] [39mError: Delete failed: Delete failed
    at StorageService.deleteFile [90m(C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\[39msrc\storage\storage.service.ts:121:15[90m)[39m
    at Object.<anonymous> [90m(C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\[39msrc\storage\storage.service.spec.ts:476:7[90m)[39m
[31m[Nest] 10836  - [39m24/09/2025 11:54:37 [31m  ERROR[39m [38;5;3m[StorageService] [39m[31mError deleting file from Supabase:[39m
[31m[Nest] 10836  - [39m24/09/2025 11:54:37 [31m  ERROR[39m [38;5;3m[StorageService] [39mError: Network error
    at Object.<anonymous> [90m(C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\[39msrc\storage\storage.service.spec.ts:503:52[90m)[39m
PASS src/storage/storage.service.spec.ts (3527 MB heap size)
PASS src/api-keys/api-keys.service.spec.ts (3534 MB heap size)
PASS src/mail/mail-automation.service.spec.ts (3556 MB heap size)
PASS src/companies/companies.service.spec.ts (3562 MB heap size)
PASS src/ai/together-ai.service.spec.ts (3578 MB heap size)
PASS src/platform-settings/platform-settings.service.spec.ts (3589 MB heap size)
[31m[Nest] 10836  - [39m24/09/2025 11:54:44 [31m  ERROR[39m [38;5;3m[PerformanceTestService] [39m[31mError cleaning up test data:[39m
[31m[Nest] 10836  - [39m24/09/2025 11:54:44 [31m  ERROR[39m [38;5;3m[PerformanceTestService] [39mError: Cleanup failed
    at Object.<anonymous> [90m(C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\[39msrc\common\performance-test.service.spec.ts:225:56[90m)[39m
    at Promise.then.completed [90m(C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\[39mnode_modules\[4mjest-circus[24m\build\utils.js:298:28[90m)[39m
    at new Promise (<anonymous>)
    at callAsyncCircusFn [90m(C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\[39mnode_modules\[4mjest-circus[24m\build\utils.js:231:10[90m)[39m
    at _callCircusTest [90m(C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\[39mnode_modules\[4mjest-circus[24m\build\run.js:316:40[90m)[39m
    at _runTest [90m(C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\[39mnode_modules\[4mjest-circus[24m\build\run.js:252:3[90m)[39m
    at _runTestsForDescribeBlock [90m(C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\[39mnode_modules\[4mjest-circus[24m\build\run.js:126:9[90m)[39m
    at _runTestsForDescribeBlock [90m(C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\[39mnode_modules\[4mjest-circus[24m\build\run.js:121:9[90m)[39m
    at _runTestsForDescribeBlock [90m(C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\[39mnode_modules\[4mjest-circus[24m\build\run.js:121:9[90m)[39m
    at run [90m(C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\[39mnode_modules\[4mjest-circus[24m\build\run.js:71:3[90m)[39m
    at runAndTransformResultsToJestFormat [90m(C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\[39mnode_modules\[4mjest-circus[24m\build\legacy-code-todo-rewrite\jestAdapterInit.js:122:21[90m)[39m
    at jestAdapter [90m(C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\[39mnode_modules\[4mjest-circus[24m\build\legacy-code-todo-rewrite\jestAdapter.js:79:19[90m)[39m
    at runTestInternal [90m(C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\[39mnode_modules\[4mjest-runner[24m\build\runTest.js:367:16[90m)[39m
    at runTest [90m(C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\[39mnode_modules\[4mjest-runner[24m\build\runTest.js:444:34[90m)[39m
PASS src/common/performance-test.service.spec.ts (3602 MB heap size)
PASS src/mail/mail.service.spec.ts (3618 MB heap size)
PASS src/analysis/analysis.service.spec.ts (3631 MB heap size)
PASS src/pipeline/pipeline.service.spec.ts (3649 MB heap size)
PASS src/health/health.controller.spec.ts (3647 MB heap size)
-----------------------------------|---------|----------|---------|---------|--------------------------------------------------------------------------------------------------
File                               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s                                                                                
-----------------------------------|---------|----------|---------|---------|--------------------------------------------------------------------------------------------------
All files                          |   54.09 |    38.46 |   59.71 |   53.37 |                                                                                                  
 admin                             |   95.59 |    77.14 |    98.7 |   95.52 |                                                                                                  
  admin.controller.ts              |     100 |      100 |     100 |     100 |                                                                                                  
  admin.service.ts                 |   93.91 |    74.73 |    97.5 |   93.83 | 101,330-336,399-405,490,518,763,767,771                                                          
 admin/analytics                   |   15.04 |     8.13 |    9.61 |   14.53 |                                                                                                  
  analytics.controller.ts          |     100 |      100 |     100 |     100 |                                                                                                  
  analytics.service.ts             |    5.42 |        0 |       0 |     4.9 | 88-509                                                                                           
 ai                                |   35.23 |     15.3 |   63.15 |   33.99 |                                                                                                  
  together-ai.service.ts           |   35.23 |     15.3 |   63.15 |   33.99 | 175-612                                                                                          
 analysis                          |   94.89 |    89.47 |   94.44 |   94.44 |                                                                                                  
  analysis.controller.ts           |     100 |      100 |     100 |     100 |                                                                                                  
  analysis.service.ts              |   93.42 |    88.88 |   93.33 |   92.85 | 182,203-210                                                                                      
 api-keys                          |    67.2 |    27.77 |   68.88 |   63.96 |                                                                                                  
  api-key-model-config.service.ts  |    18.6 |        0 |       0 |   14.63 | 19-123                                                                                           
  api-keys.controller.ts           |     100 |      100 |     100 |     100 |                                                                                                  
  api-keys.service.ts              |   89.47 |    71.42 |   91.66 |   89.36 | 114-122,154                                                                                      
 auth                              |   41.14 |    20.63 |   63.41 |    40.6 |                                                                                                  
  auth.controller.ts               |   89.55 |    53.33 |      90 |   89.23 | 124-137                                                                                          
  auth.service.ts                  |   30.33 |    16.21 |   38.09 |   29.96 | 67-68,82-125,158-166,170-172,178-179,184-185,211-382,422-673,706-752,792,802-803,849-850,868-968 
 auth/decorators                   |   66.66 |      100 |   33.33 |      60 |                                                                                                  
  current-user.decorator.ts        |   42.85 |      100 |       0 |   42.85 | 5-6,12-13                                                                                        
  roles.decorator.ts               |     100 |      100 |     100 |     100 |                                                                                                  
 auth/guards                       |   89.58 |    76.92 |   66.66 |    87.8 |                                                                                                  
  company.guard.ts                 |     100 |      100 |     100 |     100 |                                                                                                  
  jwt-auth.guard.ts                |      50 |        0 |       0 |    37.5 | 7-17                                                                                             
  roles.guard.ts                   |     100 |      100 |     100 |     100 |                                                                                                  
 auth/strategies                   |       0 |        0 |       0 |       0 |                                                                                                  
  jwt.strategy.ts                  |       0 |        0 |       0 |       0 | 1-25                                                                                             
 calendar                          |     100 |      100 |     100 |     100 |                                                                                                  
  calendar.controller.ts           |     100 |      100 |     100 |     100 |                                                                                                  
  calendar.service.ts              |     100 |      100 |     100 |     100 |                                                                                                  
 candidates                        |   36.65 |    19.75 |   51.47 |   35.34 |                                                                                                  
  analysis-queue.service.ts        |    6.32 |        0 |       0 |    5.42 | 29-475                                                                                           
  candidates.controller.ts         |   79.45 |    82.35 |      75 |   79.71 | 78-81,192-215,225,230-234                                                                        
  candidates.service.ts            |   46.22 |    26.08 |   76.92 |   44.33 | 81-82,106-146,167-217,259-449,521,568,585-586                                                    
 common                            |   79.34 |    73.33 |   90.47 |   79.51 |                                                                                                  
  performance-test.service.ts      |   98.64 |    91.66 |      95 |    98.5 | 275                                                                                              
  static.controller.ts             |       0 |        0 |       0 |       0 | 1-32                                                                                             
 companies                         |   99.21 |    88.88 |     100 |   99.18 |                                                                                                  
  companies.controller.ts          |     100 |      100 |     100 |     100 |                                                                                                  
  companies.service.ts             |   98.92 |    85.71 |     100 |    98.9 | 242                                                                                              
 configuration                     |     100 |      100 |     100 |     100 |                                                                                                  
  configuration.controller.ts      |     100 |      100 |     100 |     100 |                                                                                                  
  configuration.service.ts         |     100 |      100 |     100 |     100 |                                                                                                  
 health                            |     100 |      100 |     100 |     100 |                                                                                                  
  health.controller.ts             |     100 |      100 |     100 |     100 |                                                                                                  
 integrations                      |    6.74 |        0 |       0 |    5.69 |                                                                                                  
  integrations.controller.ts       |       0 |        0 |       0 |       0 | 1-135                                                                                            
  integrations.service.ts          |   10.37 |        0 |       0 |    8.73 | 26-270                                                                                           
 interviews                        |   55.42 |     36.2 |   67.21 |   55.03 |                                                                                                  
  interviews.controller.ts         |     100 |      100 |     100 |     100 |                                                                                                  
  interviews.service.ts            |    41.5 |    31.48 |   44.44 |   40.66 | 101,136-146,183-204,215-253,272-305,339-344,364-462,499-528,534-535,543-631                      
 interviews/dto                    |     100 |      100 |      80 |     100 |                                                                                                  
  index.ts                         |     100 |      100 |      80 |     100 |                                                                                                  
 interviews/entities               |       0 |      100 |       0 |       0 |                                                                                                  
  index.ts                         |       0 |      100 |       0 |       0 | 1-3                                                                                              
 mail                              |   49.49 |    25.69 |   55.08 |   48.15 |                                                                                                  
  automation-event.service.ts      |       0 |        0 |       0 |       0 | 1-435                                                                                            
  mail-automation.controller.ts    |     100 |       75 |     100 |     100 | 220                                                                                              
  mail-automation.service.ts       |     100 |      100 |     100 |     100 |                                                                                                  
  mail-template.controller.ts      |     100 |      100 |     100 |     100 |                                                                                                  
  mail-template.service.ts         |   13.79 |        0 |       0 |   10.71 | 30-262                                                                                           
  mail.controller.ts               |     100 |      100 |     100 |     100 |                                                                                                  
  mail.service.ts                  |   26.61 |    13.63 |   27.27 |   25.73 | 103,110-464                                                                                      
 mail/subscribers                  |       0 |        0 |       0 |       0 |                                                                                                  
  automation.subscriber.ts         |       0 |        0 |       0 |       0 | 1-153                                                                                            
 notifications                     |    17.5 |        0 |       0 |   13.15 |                                                                                                  
  notifications.service.ts         |    17.5 |        0 |       0 |   13.15 | 9-160                                                                                            
 openrouter                        |   15.38 |        0 |       0 |   11.11 |                                                                                                  
  openrouter.service.ts            |   15.38 |        0 |       0 |   11.11 | 37-124                                                                                           
 pipeline                          |   50.91 |     12.5 |      50 |   50.47 |                                                                                                  
  pipeline.controller.ts           |   98.03 |       50 |   93.33 |   97.95 | 123                                                                                              
  pipeline.service.ts              |   36.52 |       10 |   27.58 |   36.19 | 177-575                                                                                          
 pipeline/dto                      |     100 |      100 |      75 |     100 |                                                                                                  
  index.ts                         |     100 |      100 |      75 |     100 |                                                                                                  
 pipeline/entities                 |       0 |      100 |       0 |       0 |                                                                                                  
  index.ts                         |       0 |      100 |       0 |       0 | 1-3                                                                                              
 platform-settings                 |     100 |       96 |     100 |     100 |                                                                                                  
  platform-settings.controller.ts  |     100 |       90 |     100 |     100 | 133                                                                                              
  platform-settings.service.ts     |     100 |      100 |     100 |     100 |                                                                                                  
 projects                          |   84.67 |    60.75 |   89.74 |   84.18 |                                                                                                  
  projects.controller.ts           |   92.85 |      100 |   77.77 |      92 | 140,144,149,159                                                                                  
  projects.service.ts              |   82.43 |    56.33 |     100 |   82.26 | 173,284,313-325,425,428,448-457,466,470,484-490,557-561,568,577,581,600-601,609,614,633-634      
 projects/analytics                |   12.98 |     8.75 |       8 |   12.26 |                                                                                                  
  projects-analytics.controller.ts |     100 |      100 |     100 |     100 |                                                                                                  
  projects-analytics.service.ts    |    5.18 |        0 |       0 |    4.61 | 85-500                                                                                           
 public                            |     100 |      100 |     100 |     100 |                                                                                                  
  public.controller.ts             |     100 |      100 |     100 |     100 |                                                                                                  
 scripts                           |       0 |      100 |       0 |       0 |                                                                                                  
  run-migrations.ts                |       0 |      100 |       0 |       0 | 1-33                                                                                             
 security                          |   96.05 |    93.25 |     100 |   95.91 |                                                                                                  
  security.controller.ts           |     100 |      100 |     100 |     100 |                                                                                                  
  security.service.ts              |      95 |    92.94 |     100 |   94.87 | 106,122,253,267-268,343                                                                          
 storage                           |   57.79 |    69.23 |   46.66 |   56.19 |                                                                                                  
  azure-storage.service.ts         |     9.8 |        0 |       0 |    6.12 | 6-108                                                                                            
  storage.service.ts               |     100 |      100 |     100 |     100 |                                                                                                  
 team-requests                     |   42.26 |        0 |   47.05 |   38.46 |                                                                                                  
  team-requests.controller.ts      |     100 |      100 |     100 |     100 |                                                                                                  
  team-requests.service.ts         |   16.41 |        0 |       0 |   13.84 | 19-212                                                                                           
 websocket                         |   13.84 |     12.5 |       0 |   11.11 |                                                                                                  
  websocket.gateway.ts             |   13.84 |     12.5 |       0 |   11.11 | 21-47,55-71,79-206                                                                               
-----------------------------------|---------|----------|---------|---------|--------------------------------------------------------------------------------------------------
Jest: "global" coverage threshold for statements (85%) not met: 54.09%
Jest: "global" coverage threshold for branches (85%) not met: 38.46%
Jest: "global" coverage threshold for lines (85%) not met: 53.37%
Jest: "global" coverage threshold for functions (85%) not met: 59.71%

Summary of all failing tests
FAIL auth/auth.service.spec.ts (48.173 s, 3280 MB heap size)
  ● AuthService › updateProfile › should throw BadRequestException when email is already taken

    expect(received).rejects.toThrow()

    Received promise resolved instead of rejected
    Resolved to value: {"message": "Profile updated successfully", "user": {"email": "updated@example.com", "id": "1", "name": "Updated Name", "role": "user", "updated_at": 2025-09-24T10:53:08.661Z}}

    [0m [90m 312 |[39m       })[33m;[39m
     [90m 313 |[39m
    [31m[1m>[22m[39m[90m 314 |[39m       [36mawait[39m expect(service[33m.[39mupdateProfile([32m'1'[39m[33m,[39m updateProfileDto))[33m.[39mrejects[33m.[39mtoThrow([33mBadRequestException[39m)[33m;[39m
     [90m     |[39m             [31m[1m^[22m[39m
     [90m 315 |[39m       expect(mockUserRepository[33m.[39mfindOne)[33m.[39mtoHaveBeenCalledTimes([35m2[39m)[33m;[39m
     [90m 316 |[39m     })[33m;[39m
     [90m 317 |[39m   })[33m;[39m[0m

      at expect (../node_modules/expect/build/index.js:113:15)
      at Object.<anonymous> (auth/auth.service.spec.ts:314:13)

FAIL candidates/candidates.service.spec.ts (3340 MB heap size)
  ● CandidatesService › findAll › should return paginated candidates without filters

    TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')

    [0m [90m  99 |[39m     [90m// Construction dynamique des conditions WHERE[39m
     [90m 100 |[39m     [36mconst[39m queryBuilder [33m=[39m [36mthis[39m[33m.[39mcandidateRepository[33m.[39mcreateQueryBuilder([32m'candidate'[39m)
    [31m[1m>[22m[39m[90m 101 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.project'[39m[33m,[39m [32m'project'[39m)
     [90m     |[39m                                                         [31m[1m^[22m[39m
     [90m 102 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.analyses'[39m[33m,[39m [32m'analyses'[39m)
     [90m 103 |[39m       [33m.[39mwhere([32m'project.company_id = :companyId'[39m[33m,[39m { companyId })[33m;[39m
     [90m 104 |[39m[0m

      at CandidatesService.findAll (candidates/candidates.service.ts:101:57)
      at Object.<anonymous> (candidates/candidates.service.spec.ts:241:36)

  ● CandidatesService › findAll › should apply search filter

    TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')

    [0m [90m  99 |[39m     [90m// Construction dynamique des conditions WHERE[39m
     [90m 100 |[39m     [36mconst[39m queryBuilder [33m=[39m [36mthis[39m[33m.[39mcandidateRepository[33m.[39mcreateQueryBuilder([32m'candidate'[39m)
    [31m[1m>[22m[39m[90m 101 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.project'[39m[33m,[39m [32m'project'[39m)
     [90m     |[39m                                                         [31m[1m^[22m[39m
     [90m 102 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.analyses'[39m[33m,[39m [32m'analyses'[39m)
     [90m 103 |[39m       [33m.[39mwhere([32m'project.company_id = :companyId'[39m[33m,[39m { companyId })[33m;[39m
     [90m 104 |[39m[0m

      at CandidatesService.findAll (candidates/candidates.service.ts:101:57)
      at Object.<anonymous> (candidates/candidates.service.spec.ts:263:21)

  ● CandidatesService › findAll › should apply status filter

    TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')

    [0m [90m  99 |[39m     [90m// Construction dynamique des conditions WHERE[39m
     [90m 100 |[39m     [36mconst[39m queryBuilder [33m=[39m [36mthis[39m[33m.[39mcandidateRepository[33m.[39mcreateQueryBuilder([32m'candidate'[39m)
    [31m[1m>[22m[39m[90m 101 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.project'[39m[33m,[39m [32m'project'[39m)
     [90m     |[39m                                                         [31m[1m^[22m[39m
     [90m 102 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.analyses'[39m[33m,[39m [32m'analyses'[39m)
     [90m 103 |[39m       [33m.[39mwhere([32m'project.company_id = :companyId'[39m[33m,[39m { companyId })[33m;[39m
     [90m 104 |[39m[0m

      at CandidatesService.findAll (candidates/candidates.service.ts:101:57)
      at Object.<anonymous> (candidates/candidates.service.spec.ts:272:21)

  ● CandidatesService › findAll › should apply excellent score filter

    TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')

    [0m [90m  99 |[39m     [90m// Construction dynamique des conditions WHERE[39m
     [90m 100 |[39m     [36mconst[39m queryBuilder [33m=[39m [36mthis[39m[33m.[39mcandidateRepository[33m.[39mcreateQueryBuilder([32m'candidate'[39m)
    [31m[1m>[22m[39m[90m 101 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.project'[39m[33m,[39m [32m'project'[39m)
     [90m     |[39m                                                         [31m[1m^[22m[39m
     [90m 102 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.analyses'[39m[33m,[39m [32m'analyses'[39m)
     [90m 103 |[39m       [33m.[39mwhere([32m'project.company_id = :companyId'[39m[33m,[39m { companyId })[33m;[39m
     [90m 104 |[39m[0m

      at CandidatesService.findAll (candidates/candidates.service.ts:101:57)
      at Object.<anonymous> (candidates/candidates.service.spec.ts:278:21)

  ● CandidatesService › findAll › should apply good score filter

    TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')

    [0m [90m  99 |[39m     [90m// Construction dynamique des conditions WHERE[39m
     [90m 100 |[39m     [36mconst[39m queryBuilder [33m=[39m [36mthis[39m[33m.[39mcandidateRepository[33m.[39mcreateQueryBuilder([32m'candidate'[39m)
    [31m[1m>[22m[39m[90m 101 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.project'[39m[33m,[39m [32m'project'[39m)
     [90m     |[39m                                                         [31m[1m^[22m[39m
     [90m 102 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.analyses'[39m[33m,[39m [32m'analyses'[39m)
     [90m 103 |[39m       [33m.[39mwhere([32m'project.company_id = :companyId'[39m[33m,[39m { companyId })[33m;[39m
     [90m 104 |[39m[0m

      at CandidatesService.findAll (candidates/candidates.service.ts:101:57)
      at Object.<anonymous> (candidates/candidates.service.spec.ts:284:21)

  ● CandidatesService › findAll › should apply average score filter

    TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')

    [0m [90m  99 |[39m     [90m// Construction dynamique des conditions WHERE[39m
     [90m 100 |[39m     [36mconst[39m queryBuilder [33m=[39m [36mthis[39m[33m.[39mcandidateRepository[33m.[39mcreateQueryBuilder([32m'candidate'[39m)
    [31m[1m>[22m[39m[90m 101 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.project'[39m[33m,[39m [32m'project'[39m)
     [90m     |[39m                                                         [31m[1m^[22m[39m
     [90m 102 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.analyses'[39m[33m,[39m [32m'analyses'[39m)
     [90m 103 |[39m       [33m.[39mwhere([32m'project.company_id = :companyId'[39m[33m,[39m { companyId })[33m;[39m
     [90m 104 |[39m[0m

      at CandidatesService.findAll (candidates/candidates.service.ts:101:57)
      at Object.<anonymous> (candidates/candidates.service.spec.ts:290:21)

  ● CandidatesService › findAll › should apply poor score filter

    TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')

    [0m [90m  99 |[39m     [90m// Construction dynamique des conditions WHERE[39m
     [90m 100 |[39m     [36mconst[39m queryBuilder [33m=[39m [36mthis[39m[33m.[39mcandidateRepository[33m.[39mcreateQueryBuilder([32m'candidate'[39m)
    [31m[1m>[22m[39m[90m 101 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.project'[39m[33m,[39m [32m'project'[39m)
     [90m     |[39m                                                         [31m[1m^[22m[39m
     [90m 102 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.analyses'[39m[33m,[39m [32m'analyses'[39m)
     [90m 103 |[39m       [33m.[39mwhere([32m'project.company_id = :companyId'[39m[33m,[39m { companyId })[33m;[39m
     [90m 104 |[39m[0m

      at CandidatesService.findAll (candidates/candidates.service.ts:101:57)
      at Object.<anonymous> (candidates/candidates.service.spec.ts:296:21)

  ● CandidatesService › findAll › should not apply filter for scoreFilter "all"

    TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')

    [0m [90m  99 |[39m     [90m// Construction dynamique des conditions WHERE[39m
     [90m 100 |[39m     [36mconst[39m queryBuilder [33m=[39m [36mthis[39m[33m.[39mcandidateRepository[33m.[39mcreateQueryBuilder([32m'candidate'[39m)
    [31m[1m>[22m[39m[90m 101 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.project'[39m[33m,[39m [32m'project'[39m)
     [90m     |[39m                                                         [31m[1m^[22m[39m
     [90m 102 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.analyses'[39m[33m,[39m [32m'analyses'[39m)
     [90m 103 |[39m       [33m.[39mwhere([32m'project.company_id = :companyId'[39m[33m,[39m { companyId })[33m;[39m
     [90m 104 |[39m[0m

      at CandidatesService.findAll (candidates/candidates.service.ts:101:57)
      at Object.<anonymous> (candidates/candidates.service.spec.ts:302:21)

  ● CandidatesService › findAll › should calculate pagination correctly for multiple pages

    TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')

    [0m [90m  99 |[39m     [90m// Construction dynamique des conditions WHERE[39m
     [90m 100 |[39m     [36mconst[39m queryBuilder [33m=[39m [36mthis[39m[33m.[39mcandidateRepository[33m.[39mcreateQueryBuilder([32m'candidate'[39m)
    [31m[1m>[22m[39m[90m 101 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.project'[39m[33m,[39m [32m'project'[39m)
     [90m     |[39m                                                         [31m[1m^[22m[39m
     [90m 102 |[39m       [33m.[39mleftJoinAndSelect([32m'candidate.analyses'[39m[33m,[39m [32m'analyses'[39m)
     [90m 103 |[39m       [33m.[39mwhere([32m'project.company_id = :companyId'[39m[33m,[39m { companyId })[33m;[39m
     [90m 104 |[39m[0m

      at CandidatesService.findAll (candidates/candidates.service.ts:101:57)
      at Object.<anonymous> (candidates/candidates.service.spec.ts:312:36)


Test Suites: 2 failed, 38 passed, 40 total
Tests:       10 failed, 1042 passed, 1052 total
Snapshots:   0 total
Time:        152.881 s, estimated 156 s
Ran all test suites.
