npm test -- src/security/security.service.spec.ts

> rh-backend@1.0.0 test
> cross-env NODE_OPTIONS="--max-old-space-size=4096" jest --runInBand src/security/security.service.spec.ts

[Nest] 20300  - 23/09/2025 09:35:59   ERROR [SecurityService] Error analyzing suspicious activity: Cannot read properties of undefined (reading 'some')
[Nest] 20300  - 23/09/2025 09:35:59   ERROR [SecurityService] Failed to log login attempt: Database connection failed
Error: Database connection failed
    at Object.<anonymous> (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.spec.ts:246:21)
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
  console.log
    🔍 [SECURITY SERVICE] getLoginAuditLogs called with companyId: company-123

      at SecurityService.getLoginAuditLogs (security/security.service.ts:59:15)

  console.log                                                                                                                                                             
    🔍 [SECURITY SERVICE] Query: { page: 1, limit: 10 }                                                                                                                   

      at SecurityService.getLoginAuditLogs (security/security.service.ts:60:15)

  console.log                                                                                                                                                             
    🔍 [SECURITY SERVICE] Total records in login_audit table: 100                                                                                                         

      at SecurityService.getLoginAuditLogs (security/security.service.ts:78:15)

  console.log                                                                                                                                                             
    🔍 [SECURITY SERVICE] Records for company company-123 : 100                                                                                                           

      at SecurityService.getLoginAuditLogs (security/security.service.ts:89:15)

[Nest] 20300  - 23/09/2025 09:35:59   ERROR [SecurityService] Failed to get login audit logs: Cannot read properties of undefined (reading 'leftJoinAndSelect')
TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')                                                                                              
    at SecurityService.getLoginAuditLogs (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.ts:82:17)                                      
    at Object.<anonymous> (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.spec.ts:283:22)
  console.log
    🔍 [SECURITY SERVICE] getLoginAuditLogs called with companyId: null

      at SecurityService.getLoginAuditLogs (security/security.service.ts:59:15)

  console.log                                                                                                                                                             
    🔍 [SECURITY SERVICE] Query: { page: 1, limit: 10 }                                                                                                                   

      at SecurityService.getLoginAuditLogs (security/security.service.ts:60:15)

  console.log                                                                                                                                                             
    🔍 [SECURITY SERVICE] Total records in login_audit table: 100                                                                                                         

      at SecurityService.getLoginAuditLogs (security/security.service.ts:78:15)

  console.log                                                                                                                                                             
    🔍 [SECURITY SERVICE] Records for company null : 100                                                                                                                  

      at SecurityService.getLoginAuditLogs (security/security.service.ts:89:15)

[Nest] 20300  - 23/09/2025 09:35:59   ERROR [SecurityService] Failed to get login audit logs: Cannot read properties of undefined (reading 'leftJoinAndSelect')
TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')                                                                                              
    at SecurityService.getLoginAuditLogs (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.ts:82:17)                                      
    at Object.<anonymous> (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.spec.ts:305:22)
  console.log
    🔍 [SECURITY SERVICE] getLoginAuditLogs called with companyId: company-123

      at SecurityService.getLoginAuditLogs (security/security.service.ts:59:15)

  console.log                                                                                                                                                             
    🔍 [SECURITY SERVICE] Query: { status: 'failed' }                                                                                                                     

      at SecurityService.getLoginAuditLogs (security/security.service.ts:60:15)

  console.log                                                                                                                                                             
    🔍 [SECURITY SERVICE] Total records in login_audit table: 100                                                                                                         

      at SecurityService.getLoginAuditLogs (security/security.service.ts:78:15)

  console.log                                                                                                                                                             
    🔍 [SECURITY SERVICE] Records for company company-123 : 100                                                                                                           

      at SecurityService.getLoginAuditLogs (security/security.service.ts:89:15)

[Nest] 20300  - 23/09/2025 09:35:59   ERROR [SecurityService] Failed to get login audit logs: Cannot read properties of undefined (reading 'leftJoinAndSelect')
TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')                                                                                              
    at SecurityService.getLoginAuditLogs (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.ts:82:17)                                      
    at Object.<anonymous> (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.spec.ts:321:7)
  console.log
    🔍 [SECURITY SERVICE] getLoginAuditLogs called with companyId: company-123

      at SecurityService.getLoginAuditLogs (security/security.service.ts:59:15)

  console.log                                                                                                                                                             
    🔍 [SECURITY SERVICE] Query: { email_attempt: 'test@example.com' }                                                                                                    

      at SecurityService.getLoginAuditLogs (security/security.service.ts:60:15)

  console.log                                                                                                                                                             
    🔍 [SECURITY SERVICE] Total records in login_audit table: 100                                                                                                         

      at SecurityService.getLoginAuditLogs (security/security.service.ts:78:15)

  console.log                                                                                                                                                             
    🔍 [SECURITY SERVICE] Records for company company-123 : 100                                                                                                           

      at SecurityService.getLoginAuditLogs (security/security.service.ts:89:15)

[Nest] 20300  - 23/09/2025 09:35:59   ERROR [SecurityService] Failed to get login audit logs: Cannot read properties of undefined (reading 'leftJoinAndSelect')
TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')                                                                                              
    at SecurityService.getLoginAuditLogs (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.ts:82:17)
    at Object.<anonymous> (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.spec.ts:334:7)
  console.log
    🔍 [SECURITY SERVICE] getLoginAuditLogs called with companyId: company-123

      at SecurityService.getLoginAuditLogs (security/security.service.ts:59:15)

  console.log                                                                                                                                                             
    🔍 [SECURITY SERVICE] Query: { ip_address: '192.168.1.1' }                                                                                                            

      at SecurityService.getLoginAuditLogs (security/security.service.ts:60:15)

  console.log                                                                                                                                                             
    🔍 [SECURITY SERVICE] Total records in login_audit table: 100                                                                                                         

      at SecurityService.getLoginAuditLogs (security/security.service.ts:78:15)

  console.log                                                                                                                                                             
    🔍 [SECURITY SERVICE] Records for company company-123 : 100                                                                                                           

      at SecurityService.getLoginAuditLogs (security/security.service.ts:89:15)

[Nest] 20300  - 23/09/2025 09:35:59   ERROR [SecurityService] Failed to get login audit logs: Cannot read properties of undefined (reading 'leftJoinAndSelect')
TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')                                                                                              
    at SecurityService.getLoginAuditLogs (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.ts:82:17)                                      
    at Object.<anonymous> (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.spec.ts:348:7)
  console.log
    🔍 [SECURITY SERVICE] getLoginAuditLogs called with companyId: company-123

      at SecurityService.getLoginAuditLogs (security/security.service.ts:59:15)

  console.log                                                                                                                                                             
    🔍 [SECURITY SERVICE] Query: { date_from: '2024-01-01', date_to: '2024-01-31' }                                                                                       

      at SecurityService.getLoginAuditLogs (security/security.service.ts:60:15)

  console.log                                                                                                                                                             
    🔍 [SECURITY SERVICE] Total records in login_audit table: 100                                                                                                         

      at SecurityService.getLoginAuditLogs (security/security.service.ts:78:15)

  console.log                                                                                                                                                             
    🔍 [SECURITY SERVICE] Records for company company-123 : 100                                                                                                           

      at SecurityService.getLoginAuditLogs (security/security.service.ts:89:15)

[Nest] 20300  - 23/09/2025 09:35:59   ERROR [SecurityService] Failed to get login audit logs: Cannot read properties of undefined (reading 'leftJoinAndSelect')
TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')                                                                                              
    at SecurityService.getLoginAuditLogs (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.ts:82:17)                                      
    at Object.<anonymous> (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.spec.ts:364:7)
  console.log
    🔍 [SECURITY SERVICE] getLoginAuditLogs called with companyId: company-123

      at SecurityService.getLoginAuditLogs (security/security.service.ts:59:15)

  console.log                                                                                                                                                             
    🔍 [SECURITY SERVICE] Query: { is_suspicious: true }                                                                                                                  

      at SecurityService.getLoginAuditLogs (security/security.service.ts:60:15)

  console.log                                                                                                                                                             
    🔍 [SECURITY SERVICE] Total records in login_audit table: 100                                                                                                         

      at SecurityService.getLoginAuditLogs (security/security.service.ts:78:15)

  console.log                                                                                                                                                             
    🔍 [SECURITY SERVICE] Records for company company-123 : 100                                                                                                           

      at SecurityService.getLoginAuditLogs (security/security.service.ts:89:15)

[Nest] 20300  - 23/09/2025 09:35:59   ERROR [SecurityService] Failed to get login audit logs: Cannot read properties of undefined (reading 'leftJoinAndSelect')
TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')                                                                                              
    at SecurityService.getLoginAuditLogs (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.ts:82:17)                                      
    at Object.<anonymous> (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.spec.ts:381:7)
  console.log
    🔍 [SECURITY SERVICE] getLoginAuditLogs called with companyId: company-123

      at SecurityService.getLoginAuditLogs (security/security.service.ts:59:15)

  console.log                                                                                                                                                             
    🔍 [SECURITY SERVICE] Query: { search: 'test search' }                                                                                                                

      at SecurityService.getLoginAuditLogs (security/security.service.ts:60:15)

  console.log                                                                                                                                                             
    🔍 [SECURITY SERVICE] Total records in login_audit table: 100                                                                                                         

      at SecurityService.getLoginAuditLogs (security/security.service.ts:78:15)

  console.log                                                                                                                                                             
    🔍 [SECURITY SERVICE] Records for company company-123 : 100                                                                                                           

      at SecurityService.getLoginAuditLogs (security/security.service.ts:89:15)

[Nest] 20300  - 23/09/2025 09:36:00   ERROR [SecurityService] Failed to get login audit logs: Cannot read properties of undefined (reading 'leftJoinAndSelect')
TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')                                                                                              
    at SecurityService.getLoginAuditLogs (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.ts:82:17)                                      
    at Object.<anonymous> (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.spec.ts:395:7)
  console.log
    🔍 [SECURITY SERVICE] getLoginAuditLogs called with companyId: company-123

      at SecurityService.getLoginAuditLogs (security/security.service.ts:59:15)

  console.log                                                                                                                                                             
    🔍 [SECURITY SERVICE] Query: { page: 3, limit: 20 }                                                                                                                   

      at SecurityService.getLoginAuditLogs (security/security.service.ts:60:15)

  console.log                                                                                                                                                             
    🔍 [SECURITY SERVICE] Total records in login_audit table: 100                                                                                                         

      at SecurityService.getLoginAuditLogs (security/security.service.ts:78:15)

  console.log                                                                                                                                                             
    🔍 [SECURITY SERVICE] Records for company company-123 : 100                                                                                                           

      at SecurityService.getLoginAuditLogs (security/security.service.ts:89:15)

[Nest] 20300  - 23/09/2025 09:36:00   ERROR [SecurityService] Failed to get login audit logs: Cannot read properties of undefined (reading 'leftJoinAndSelect')
TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')                                                                                              
    at SecurityService.getLoginAuditLogs (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.ts:82:17)                                      
    at Object.<anonymous> (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.spec.ts:409:22)
  console.log
    🔍 [SECURITY SERVICE] getLoginAuditLogs called with companyId: company-123

      at SecurityService.getLoginAuditLogs (security/security.service.ts:59:15)

  console.log                                                                                                                                                             
    🔍 [SECURITY SERVICE] Query: {}                                                                                                                                       

      at SecurityService.getLoginAuditLogs (security/security.service.ts:60:15)

  console.log                                                                                                                                                             
    🔍 [SECURITY SERVICE] Total records in login_audit table: 100                                                                                                         

      at SecurityService.getLoginAuditLogs (security/security.service.ts:78:15)

  console.log                                                                                                                                                             
    🔍 [SECURITY SERVICE] Records for company company-123 : 100                                                                                                           

      at SecurityService.getLoginAuditLogs (security/security.service.ts:89:15)

[Nest] 20300  - 23/09/2025 09:36:00   ERROR [SecurityService] Failed to get login audit logs: Cannot read properties of undefined (reading 'leftJoinAndSelect')
TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')                                                                                              
    at SecurityService.getLoginAuditLogs (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.ts:82:17)                                      
    at Object.<anonymous> (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.spec.ts:421:7)
  console.log
    🔍 [SECURITY SERVICE] getLoginAuditStats called with companyId: company-123

      at SecurityService.getLoginAuditStats (security/security.service.ts:184:15)

[Nest] 20300  - 23/09/2025 09:36:00   ERROR [SecurityService] Failed to get login audit stats: Cannot read properties of undefined (reading 'andWhere')
TypeError: Cannot read properties of undefined (reading 'andWhere')                                                                                                       
    at SecurityService.getLoginAuditStats (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.ts:213:29)                                    
    at Object.<anonymous> (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.spec.ts:437:36)
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
  console.log
    🔍 [SECURITY SERVICE] getLoginAuditStats called with companyId: null

      at SecurityService.getLoginAuditStats (security/security.service.ts:184:15)

  console.log                                                                                                                                                             
    🔍 [SECURITY SERVICE] Super admin stats - showing ALL stats                                                                                                           

      at SecurityService.getLoginAuditStats (security/security.service.ts:191:17)

[Nest] 20300  - 23/09/2025 09:36:00   ERROR [SecurityService] Failed to get login audit stats: Cannot read properties of undefined (reading 'andWhere')
TypeError: Cannot read properties of undefined (reading 'andWhere')                                                                                                       
    at SecurityService.getLoginAuditStats (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.ts:213:29)                                    
    at Object.<anonymous> (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.spec.ts:459:36)
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
  console.log
    🔍 [SECURITY SERVICE] getLoginAuditStats called with companyId: company-123

      at SecurityService.getLoginAuditStats (security/security.service.ts:184:15)

[Nest] 20300  - 23/09/2025 09:36:00   ERROR [SecurityService] Failed to get login audit stats: Cannot read properties of undefined (reading 'andWhere')
TypeError: Cannot read properties of undefined (reading 'andWhere')                                                                                                       
    at SecurityService.getLoginAuditStats (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.ts:213:29)                                    
    at Object.<anonymous> (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.spec.ts:476:21)
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
  console.log
    🔍 [SECURITY SERVICE] getLoginAuditStats called with companyId: company-123

      at SecurityService.getLoginAuditStats (security/security.service.ts:184:15)

[Nest] 20300  - 23/09/2025 09:36:00   ERROR [SecurityService] Failed to get login audit stats: Cannot read properties of undefined (reading 'andWhere')
TypeError: Cannot read properties of undefined (reading 'andWhere')                                                                                                       
    at SecurityService.getLoginAuditStats (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.ts:213:29)                                    
    at Object.<anonymous> (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.spec.ts:491:36)
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
  console.log
    🔍 [SECURITY SERVICE] getLoginAuditStats called with companyId: company-123

      at SecurityService.getLoginAuditStats (security/security.service.ts:184:15)

[Nest] 20300  - 23/09/2025 09:36:00   ERROR [SecurityService] Failed to get login audit stats: Cannot read properties of undefined (reading 'andWhere')
TypeError: Cannot read properties of undefined (reading 'andWhere')                                                                                                       
    at SecurityService.getLoginAuditStats (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.ts:213:29)                                    
    at Object.<anonymous> (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.spec.ts:500:36)
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
  console.log
    🔍 [SECURITY SERVICE] getLoginAuditStats called with companyId: company-123

      at SecurityService.getLoginAuditStats (security/security.service.ts:184:15)

[Nest] 20300  - 23/09/2025 09:36:00   ERROR [SecurityService] Failed to get login audit stats: Cannot read properties of undefined (reading 'andWhere')
TypeError: Cannot read properties of undefined (reading 'andWhere')                                                                                                       
    at SecurityService.getLoginAuditStats (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.ts:213:29)                                    
    at Object.<anonymous> (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.spec.ts:510:28)
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
[Nest] 20300  - 23/09/2025 09:36:00   ERROR [SecurityService] Failed to update session duration: Update failed
Error: Update failed
    at Object.<anonymous> (C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\backend\src\security\security.service.spec.ts:532:21)                                               
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
 FAIL  src/security/security.service.spec.ts (16.775 s, 1806 MB heap size)
  SecurityService
    logLoginAttempt                                                                                                                                                       
      × should successfully log a login attempt (36 ms)                                                                                                                   
      × should parse user agent correctly for mobile device (8 ms)                                                                                                        
      √ should detect suspicious activity - multiple failed attempts (9 ms)                                                                                               
      √ should detect suspicious activity - new geolocation (15 ms)                                                                                                       
      √ should detect suspicious activity - off-hours login (17 ms)                                                                                                       
      √ should detect IP geolocation inconsistency (15 ms)                                                                                                                
      √ should handle missing user agent gracefully (12 ms)                                                                                                               
      √ should handle database errors gracefully (18 ms)                                                                                                                  
    getLoginAuditLogs                                                                                                                                                     
      × should return paginated audit logs for a company (51 ms)                                                                                                          
      × should handle super admin (null companyId) case (30 ms)                                                                                                           
      × should apply status filter (21 ms)                                                                                                                                
      × should apply email search filter (27 ms)                                                                                                                          
      × should apply IP address filter (15 ms)                                                                                                                            
      × should apply date range filter (16 ms)                                                                                                                            
      × should apply suspicious activity filter (15 ms)                                                                                                                   
      × should apply general search filter (27 ms)                                                                                                                        
      × should handle pagination correctly (21 ms)                                                                                                                        
      × should handle database errors gracefully (33 ms)                                                                                                                  
    getLoginAuditStats                                                                                                                                                    
      × should return login audit statistics for a company (13 ms)                                                                                                        
      × should handle super admin stats (null companyId) (12 ms)                                                                                                          
      × should apply date range filter when provided (18 ms)                                                                                                              
      × should calculate success rate correctly (18 ms)                                                                                                                   
      × should handle zero attempts gracefully (14 ms)                                                                                                                    
      × should handle database errors gracefully (11 ms)                                                                                                                  
    updateSessionDuration                                                                                                                                                 
      √ should update session duration successfully (20 ms)                                                                                                               
      √ should handle update errors gracefully (12 ms)                                                                                                                    
    User Agent Parsing                                                                                                                                                    
      √ should parse user agent correctly: Chrome on Windows (4 ms)                                                                                                       
      × should parse user agent correctly: Safari on iOS (15 ms)                                                                                                          
      × should parse user agent correctly: Safari on iOS (15 ms)                                                                                                          
      √ should parse user agent correctly: Chrome on macOS (16 ms)                                                                                                        
      √ should parse user agent correctly: Chrome on Linux (16 ms)                                                                                                        
      √ should parse user agent correctly: Firefox on Android (19 ms)                                                                                                     
      √ should parse user agent correctly: Edge on Windows (11 ms)                                                                                                        
    Private IP Detection                                                                                                                                                  
      √ should correctly identify 10.0.0.1 as private (16 ms)                                                                                                             
      √ should correctly identify 172.16.0.1 as private (7 ms)                                                                                                            
      √ should correctly identify 172.31.255.255 as private (8 ms)                                                                                                        
      √ should correctly identify 192.168.1.1 as private (14 ms)
      √ should correctly identify 127.0.0.1 as private (14 ms)                                                                                                            
      √ should correctly identify 169.254.1.1 as private (17 ms)                                                                                                          
      √ should correctly identify 8.8.8.8 as public (15 ms)                                                                                                               
      √ should correctly identify 173.0.0.1 as public (16 ms)                                                                                                             
      √ should correctly identify 192.167.1.1 as public (3 ms)                                                                                                            
                                                                                                                                                                          
  ● SecurityService › logLoginAttempt › should successfully log a login attempt                                                                                           
                                                                                                                                                                          
    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: ObjectContaining {"browser": "Chrome", "company_id": "company-123", "device_type": "desktop", "email_attempt": "test@example.com", "ip_address": "192.168.1.1", "is_suspicious": false, "location_city": "Paris", "location_country": "France", "operating_system": "Windows", "session_token": "session-token-123", "status": "success", "suspicious_reasons": "", "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36", "user_id": "user-123"}
    Received: {"browser": "Chrome", "company_id": "company-123", "device_type": "desktop", "email_attempt": "test@example.com", "ip_address": "192.168.1.1", "is_suspicious": true, "location_city": "Paris", "location_country": "France", "operating_system": "Windows", "session_token": "session-token-123", "status": "success", "suspicious_reasons": "Incohérence entre IP privée et géolocalisation", "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36", "user_id": "user-123"}

    Number of calls: 1

      106 |       const result = await service.logLoginAttempt(mockLoginAttemptDto);
      107 |
    > 108 |       expect(loginAuditRepository.create).toHaveBeenCalledWith(
          |                                           ^
      109 |         expect.objectContaining({
      110 |           ...mockLoginAttemptDto,
      111 |           device_type: DeviceType.DESKTOP,

      at Object.<anonymous> (security/security.service.spec.ts:108:43)

  ● SecurityService › logLoginAttempt › should parse user agent correctly for mobile device

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: ObjectContaining {"browser": "Safari", "device_type": "mobile", "operating_system": "iOS"}
    Received: {"browser": "Safari", "company_id": "company-123", "device_type": "mobile", "email_attempt": "test@example.com", "ip_address": "192.168.1.1", "is_suspicious": true, "location_city": "Paris", "location_country": "France", "operating_system": "macOS", "session_token": "session-token-123", "status": "success", "suspicious_reasons": "Incohérence entre IP privée et géolocalisation", "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1", "user_id": "user-123"}

    Number of calls: 1

      134 |       await service.logLoginAttempt(mobileDto);
      135 |
    > 136 |       expect(loginAuditRepository.create).toHaveBeenCalledWith(
          |                                           ^
      137 |         expect.objectContaining({
      138 |           device_type: DeviceType.MOBILE,
      139 |           browser: 'Safari',

      at Object.<anonymous> (security/security.service.spec.ts:136:43)

  ● SecurityService › getLoginAuditLogs › should return paginated audit logs for a company

    TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')

      80 |       // Check records for this company
      81 |       let companyRecords;
    > 82 |       if (companyId === null || companyId === undefined) {
         |                 ^
      83 |         companyRecords = totalRecords; // Super admin voit tout
      84 |       } else {
      85 |         companyRecords = await this.loginAuditRepository.count({

      at SecurityService.getLoginAuditLogs (security/security.service.ts:82:17)
      at Object.<anonymous> (security/security.service.spec.ts:283:22)

  ● SecurityService › getLoginAuditLogs › should handle super admin (null companyId) case

    TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')

      80 |       // Check records for this company
      81 |       let companyRecords;
    > 82 |       if (companyId === null || companyId === undefined) {
         |                 ^
      83 |         companyRecords = totalRecords; // Super admin voit tout
      84 |       } else {
      85 |         companyRecords = await this.loginAuditRepository.count({

      at SecurityService.getLoginAuditLogs (security/security.service.ts:82:17)
      at Object.<anonymous> (security/security.service.spec.ts:305:22)

  ● SecurityService › getLoginAuditLogs › should apply status filter

    TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')

      80 |       // Check records for this company
      81 |       let companyRecords;
    > 82 |       if (companyId === null || companyId === undefined) {
         |                 ^
      83 |         companyRecords = totalRecords; // Super admin voit tout
      84 |       } else {
      85 |         companyRecords = await this.loginAuditRepository.count({

      at SecurityService.getLoginAuditLogs (security/security.service.ts:82:17)
      at Object.<anonymous> (security/security.service.spec.ts:321:7)

  ● SecurityService › getLoginAuditLogs › should apply email search filter

    TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')

      80 |       // Check records for this company
      81 |       let companyRecords;
    > 82 |       if (companyId === null || companyId === undefined) {
         |                 ^
      83 |         companyRecords = totalRecords; // Super admin voit tout
      84 |       } else {
      85 |         companyRecords = await this.loginAuditRepository.count({

      at SecurityService.getLoginAuditLogs (security/security.service.ts:82:17)
      at Object.<anonymous> (security/security.service.spec.ts:334:7)

  ● SecurityService › getLoginAuditLogs › should apply IP address filter

    TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')

      80 |       // Check records for this company
      81 |       let companyRecords;
    > 82 |       if (companyId === null || companyId === undefined) {
         |                 ^
      83 |         companyRecords = totalRecords; // Super admin voit tout
      84 |       } else {
      85 |         companyRecords = await this.loginAuditRepository.count({

      at SecurityService.getLoginAuditLogs (security/security.service.ts:82:17)
      at Object.<anonymous> (security/security.service.spec.ts:348:7)

  ● SecurityService › getLoginAuditLogs › should apply date range filter

    TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')

      80 |       // Check records for this company
      81 |       let companyRecords;
    > 82 |       if (companyId === null || companyId === undefined) {
         |                 ^
      83 |         companyRecords = totalRecords; // Super admin voit tout
      84 |       } else {
      85 |         companyRecords = await this.loginAuditRepository.count({

      at SecurityService.getLoginAuditLogs (security/security.service.ts:82:17)
      at Object.<anonymous> (security/security.service.spec.ts:364:7)

  ● SecurityService › getLoginAuditLogs › should apply suspicious activity filter

    TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')

      80 |       // Check records for this company
      81 |       let companyRecords;
    > 82 |       if (companyId === null || companyId === undefined) {
         |                 ^
      83 |         companyRecords = totalRecords; // Super admin voit tout
      84 |       } else {
      85 |         companyRecords = await this.loginAuditRepository.count({

      at SecurityService.getLoginAuditLogs (security/security.service.ts:82:17)
      at Object.<anonymous> (security/security.service.spec.ts:381:7)

  ● SecurityService › getLoginAuditLogs › should apply general search filter

    TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')

      80 |       // Check records for this company
      81 |       let companyRecords;
    > 82 |       if (companyId === null || companyId === undefined) {
         |                 ^
      83 |         companyRecords = totalRecords; // Super admin voit tout
      84 |       } else {
      85 |         companyRecords = await this.loginAuditRepository.count({

      at SecurityService.getLoginAuditLogs (security/security.service.ts:82:17)
      at Object.<anonymous> (security/security.service.spec.ts:395:7)

  ● SecurityService › getLoginAuditLogs › should handle pagination correctly

    TypeError: Cannot read properties of undefined (reading 'leftJoinAndSelect')

      80 |       // Check records for this company
      81 |       let companyRecords;
    > 82 |       if (companyId === null || companyId === undefined) {
         |                 ^
      83 |         companyRecords = totalRecords; // Super admin voit tout
      84 |       } else {
      85 |         companyRecords = await this.loginAuditRepository.count({

      at SecurityService.getLoginAuditLogs (security/security.service.ts:82:17)
      at Object.<anonymous> (security/security.service.spec.ts:409:22)

  ● SecurityService › getLoginAuditLogs › should handle database errors gracefully

    expect(received).rejects.toThrow(expected)

    Expected message: "Database query failed"
    Received message: "Cannot read properties of undefined (reading 'leftJoinAndSelect')"

          80 |       // Check records for this company
          81 |       let companyRecords;
        > 82 |       if (companyId === null || companyId === undefined) {
             |                 ^
          83 |         companyRecords = totalRecords; // Super admin voit tout
          84 |       } else {
          85 |         companyRecords = await this.loginAuditRepository.count({

          at SecurityService.getLoginAuditLogs (src/security/security.service.ts:82:17)
          at Object.<anonymous> (src/security/security.service.spec.ts:421:7)

      419 |       mockQueryBuilder.getManyAndCount.mockRejectedValue(error);
      420 |
    > 421 |       await expect(service.getLoginAuditLogs('company-123', {})).rejects.toThrow(error);
          |                                                                          ^
      422 |     });
      423 |   });
      424 |

      at Object.toThrow (../node_modules/expect/build/index.js:218:22)
      at Object.<anonymous> (security/security.service.spec.ts:421:74)

  ● SecurityService › getLoginAuditStats › should return login audit statistics for a company

    TypeError: Cannot read properties of undefined (reading 'andWhere')

      211 |       ] = await Promise.all([
      212 |         queryBuilder.getCount(),
    > 213 |         queryBuilder.clone().andWhere('audit.status = :status', { status: LoginStatus.SUCCESS }).getCount(),
          |                             ^
      214 |         queryBuilder.clone().andWhere('audit.status = :status', { status: LoginStatus.FAILED }).getCount(),
      215 |         queryBuilder.clone().andWhere('audit.is_suspicious = true').getCount(),
      216 |         queryBuilder.clone().select('COUNT(DISTINCT audit.user_id)').getRawOne().then(r => parseInt(r.count)),

      at SecurityService.getLoginAuditStats (security/security.service.ts:213:29)
      at Object.<anonymous> (security/security.service.spec.ts:437:36)

  ● SecurityService › getLoginAuditStats › should handle super admin stats (null companyId)

    TypeError: Cannot read properties of undefined (reading 'andWhere')

      211 |       ] = await Promise.all([
      212 |         queryBuilder.getCount(),
    > 213 |         queryBuilder.clone().andWhere('audit.status = :status', { status: LoginStatus.SUCCESS }).getCount(),
          |                             ^
      214 |         queryBuilder.clone().andWhere('audit.status = :status', { status: LoginStatus.FAILED }).getCount(),
      215 |         queryBuilder.clone().andWhere('audit.is_suspicious = true').getCount(),
      216 |         queryBuilder.clone().select('COUNT(DISTINCT audit.user_id)').getRawOne().then(r => parseInt(r.count)),

      at SecurityService.getLoginAuditStats (security/security.service.ts:213:29)
      at Object.<anonymous> (security/security.service.spec.ts:459:36)

  ● SecurityService › getLoginAuditStats › should apply date range filter when provided

    TypeError: Cannot read properties of undefined (reading 'andWhere')

      211 |       ] = await Promise.all([
      212 |         queryBuilder.getCount(),
    > 213 |         queryBuilder.clone().andWhere('audit.status = :status', { status: LoginStatus.SUCCESS }).getCount(),
          |                             ^
      214 |         queryBuilder.clone().andWhere('audit.status = :status', { status: LoginStatus.FAILED }).getCount(),
      215 |         queryBuilder.clone().andWhere('audit.is_suspicious = true').getCount(),
      216 |         queryBuilder.clone().select('COUNT(DISTINCT audit.user_id)').getRawOne().then(r => parseInt(r.count)),

      at SecurityService.getLoginAuditStats (security/security.service.ts:213:29)
      at Object.<anonymous> (security/security.service.spec.ts:476:21)

  ● SecurityService › getLoginAuditStats › should calculate success rate correctly

    TypeError: Cannot read properties of undefined (reading 'andWhere')

      211 |       ] = await Promise.all([
      212 |         queryBuilder.getCount(),
    > 213 |         queryBuilder.clone().andWhere('audit.status = :status', { status: LoginStatus.SUCCESS }).getCount(),
          |                             ^
      214 |         queryBuilder.clone().andWhere('audit.status = :status', { status: LoginStatus.FAILED }).getCount(),
      215 |         queryBuilder.clone().andWhere('audit.is_suspicious = true').getCount(),
      216 |         queryBuilder.clone().select('COUNT(DISTINCT audit.user_id)').getRawOne().then(r => parseInt(r.count)),

      at SecurityService.getLoginAuditStats (security/security.service.ts:213:29)
      at Object.<anonymous> (security/security.service.spec.ts:491:36)

  ● SecurityService › getLoginAuditStats › should handle zero attempts gracefully

    TypeError: Cannot read properties of undefined (reading 'andWhere')

      211 |       ] = await Promise.all([
      212 |         queryBuilder.getCount(),
    > 213 |         queryBuilder.clone().andWhere('audit.status = :status', { status: LoginStatus.SUCCESS }).getCount(),
          |                             ^
      214 |         queryBuilder.clone().andWhere('audit.status = :status', { status: LoginStatus.FAILED }).getCount(),
      215 |         queryBuilder.clone().andWhere('audit.is_suspicious = true').getCount(),
      216 |         queryBuilder.clone().select('COUNT(DISTINCT audit.user_id)').getRawOne().then(r => parseInt(r.count)),

      at SecurityService.getLoginAuditStats (security/security.service.ts:213:29)
      at Object.<anonymous> (security/security.service.spec.ts:500:36)

  ● SecurityService › getLoginAuditStats › should handle database errors gracefully

    expect(received).rejects.toThrow(expected)

    Expected message: "Database statistics query failed"
    Received message: "Cannot read properties of undefined (reading 'andWhere')"

          211 |       ] = await Promise.all([
          212 |         queryBuilder.getCount(),
        > 213 |         queryBuilder.clone().andWhere('audit.status = :status', { status: LoginStatus.SUCCESS }).getCount(),
              |                             ^
          214 |         queryBuilder.clone().andWhere('audit.status = :status', { status: LoginStatus.FAILED }).getCount(),
          215 |         queryBuilder.clone().andWhere('audit.is_suspicious = true').getCount(),
          216 |         queryBuilder.clone().select('COUNT(DISTINCT audit.user_id)').getRawOne().then(r => parseInt(r.count)),

          at SecurityService.getLoginAuditStats (src/security/security.service.ts:213:29)
          at Object.<anonymous> (src/security/security.service.spec.ts:510:28)

      508 |       mockQueryBuilder.getCount.mockRejectedValue(error);
      509 |
    > 510 |       await expect(service.getLoginAuditStats('company-123')).rejects.toThrow(error);
          |                                                                       ^
      511 |     });
      512 |   });
      513 |

      at Object.toThrow (../node_modules/expect/build/index.js:218:22)
      at Object.<anonymous> (security/security.service.spec.ts:510:71)

  ● SecurityService › getLoginAuditStats › should handle database errors gracefully

    Database statistics query failed

      505 |
      506 |     it('should handle database errors gracefully', async () => {
    > 507 |       const error = new Error('Database statistics query failed');
          |                     ^
      508 |       mockQueryBuilder.getCount.mockRejectedValue(error);
      509 |
      510 |       await expect(service.getLoginAuditStats('company-123')).rejects.toThrow(error);

      at Object.<anonymous> (security/security.service.spec.ts:507:21)

  ● SecurityService › User Agent Parsing › should parse user agent correctly: Safari on iOS

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: ObjectContaining {"browser": "Safari", "device_type": "mobile", "operating_system": "iOS"}
    Received: {"browser": "Safari", "company_id": "company-123", "device_type": "mobile", "email_attempt": "test@example.com", "ip_address": "192.168.1.1", "is_suspicious": false, "operating_system": "macOS", "status": "success", "suspicious_reasons": "", "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1", "user_id": "user-123"}

    Number of calls: 1

      589 |         await service.logLoginAttempt(dto);
      590 |
    > 591 |         expect(loginAuditRepository.create).toHaveBeenCalledWith(
          |                                             ^
      592 |           expect.objectContaining({
      593 |             device_type: expected.deviceType,
      594 |             browser: expected.browser,

      at Object.<anonymous> (security/security.service.spec.ts:591:45)

  ● SecurityService › User Agent Parsing › should parse user agent correctly: Safari on iOS

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: ObjectContaining {"browser": "Safari", "device_type": "tablet", "operating_system": "iOS"}
    Received: {"browser": "Safari", "company_id": "company-123", "device_type": "mobile", "email_attempt": "test@example.com", "ip_address": "192.168.1.1", "is_suspicious": false, "operating_system": "macOS", "status": "success", "suspicious_reasons": "", "user_agent": "Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1", "user_id": "user-123"}

    Number of calls: 1

      589 |         await service.logLoginAttempt(dto);
      590 |
    > 591 |         expect(loginAuditRepository.create).toHaveBeenCalledWith(
          |                                             ^
      592 |           expect.objectContaining({
      593 |             device_type: expected.deviceType,
      594 |             browser: expected.browser,

      at Object.<anonymous> (security/security.service.spec.ts:591:45)

Test Suites: 1 failed, 1 total                                                                                                                                            
Tests:       20 failed, 22 passed, 42 total                                                                                                                               
Snapshots:   0 total
Time:        17.344 s, estimated 114 s
Ran all test suites matching /src\\security\\security.service.spec.ts/i.