frontend> cd ..
PS C:\Users\stage.dsi.pmo\Desktop\dev\rh-next> cd frontend-admin
PS C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\frontend-admin> npx tsc --noEmit
src/app/analytics/[id]/page.tsx:166:50 - error TS2322: Type 'Dispatch<SetStateAction<"pdf" | "excel">>' is not assignable to type '(value: string) => void'.
  Types of parameters 'value' and 'value' are incompatible.
    Type 'string' is not assignable to type 'SetStateAction<"pdf" | "excel">'.

166                     <Select value={exportFormat} onValueChange={setExportFormat}>
                                                     ~~~~~~~~~~~~~

  node_modules/@radix-ui/react-select/dist/index.d.mts:26:5
    26     onValueChange?(value: string): void;
           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    The expected type comes from property 'onValueChange' which is declared here on type 'IntrinsicAttributes & SelectSharedProps & { value?: string | undefined; defaultValue?: string | undefined; onValueChange?(value: string): void; }'

src/app/analytics/[id]/page.tsx:335:48 - error TS7006: Parameter 'point' implicitly has an 'any' type.

335                       {timeline.slice(-5).map((point, index) => (
                                                   ~~~~~

src/app/analytics/[id]/page.tsx:335:55 - error TS7006: Parameter 'index' implicitly has an 'any' type.

335                       {timeline.slice(-5).map((point, index) => (
                                                          ~~~~~

src/app/analytics/[id]/page.tsx:361:41 - error TS7006: Parameter 'candidate' implicitly has an 'any' type.

361                     {topCandidates.map((candidate, index) => (
                                            ~~~~~~~~~

src/app/analytics/[id]/page.tsx:361:52 - error TS7006: Parameter 'index' implicitly has an 'any' type.

361                     {topCandidates.map((candidate, index) => (
                                                       ~~~~~

src/app/analytics/[id]/page.tsx:578:38 - error TS7006: Parameter 'insight' implicitly has an 'any' type.

578                       {insights.map((insight, index) => (
                                         ~~~~~~~

src/app/analytics/[id]/page.tsx:578:47 - error TS7006: Parameter 'index' implicitly has an 'any' type.

578                       {insights.map((insight, index) => (
                                                  ~~~~~

src/app/analytics/[id]/page.tsx:598:35 - error TS7006: Parameter 'risk' implicitly has an 'any' type.

598                       {risks.map((risk, index) => (
                                      ~~~~

src/app/analytics/[id]/page.tsx:598:41 - error TS7006: Parameter 'index' implicitly has an 'any' type.

598                       {risks.map((risk, index) => (
                                            ~~~~~

src/components/admin/api-keys/model-config-dialog.test.tsx:2:18 - error TS2305: Module '"@testing-library/react"' has no exported member 'screen'.

2 import { render, screen } from '@testing-library/react'
                   ~~~~~~

src/components/admin/api-keys/model-config-dialog.test.tsx:11:3 - error TS2353: Object literal may only specify known properties, and 'model' does not exist in type 'ApiKey'.

11   model: 'test-model',
     ~~~~~

src/components/admin/api-keys/model-config-dialog.test.tsx:48:40 - error TS2339: Property 'toBeInTheDocument' does not exist on type 'Assertion<any>'.

48     expect(screen.getByRole('dialog')).toBeInTheDocument()
                                          ~~~~~~~~~~~~~~~~~

src/components/admin/api-keys/model-config-dialog.test.tsx:60:46 - error TS2339: Property 'toBeInTheDocument' does not exist on type 'Assertion<any>'.

60     expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
                                                ~~~~~~~~~~~~~~~~~

src/components/admin/api-keys/model-config-dialog.test.tsx:72:46 - error TS2339: Property 'toBeInTheDocument' does not exist on type 'Assertion<any>'.

72     expect(screen.getByText('Test API Key')).toBeInTheDocument()
                                                ~~~~~~~~~~~~~~~~~

src/components/admin/settings/automation-form.tsx:80:78 - error TS2339: Property 'data' does not exist on type 'MailTemplate[]'.

80   console.log('🔍 [AUTOMATION DEBUG] Templates.data.data:', templates?.data?.data);
                                                                                ~~~~

src/components/admin/settings/automation-form.tsx:81:81 - error TS2339: Property 'data' does not exist on type 'MailTemplate[]'.

81   console.log('🔍 [AUTOMATION DEBUG] Is array:', Array.isArray(templates?.data?.data));
                                                                                   ~~~~

src/components/admin/settings/automation-form.tsx:82:65 - error TS2339: Property 'data' does not exist on type 'MailTemplate[]'.

82   console.log('🔍 [AUTOMATION DEBUG] Length:', templates?.data?.data?.length);
                                                                   ~~~~

src/components/admin/settings/automation-form.tsx:258:54 - error TS2339: Property 'data' does not exist on type 'MailTemplate[]'.

258                   ) : Array.isArray(templates?.data?.data) && templates.data.data.length > 0 ? (
                                                         ~~~~

src/components/admin/settings/automation-form.tsx:258:78 - error TS2339: Property 'data' does not exist on type 'MailTemplate[]'.

258                   ) : Array.isArray(templates?.data?.data) && templates.data.data.length > 0 ? (
                                                                                 ~~~~

src/components/admin/settings/automation-form.tsx:259:36 - error TS2339: Property 'data' does not exist on type 'MailTemplate[]'.

259                     templates.data.data.map((template: any) => (
                                       ~~~~

src/components/admin/settings/mail-settings.tsx:111:97 - error TS7006: Parameter 'c' implicitly has an 'any' type.

111     mutationFn: (id: string) => adminApi.toggleMailConfiguration(id, !configs?.data?.data?.find(c => c.id === id)?.is_active),
                                                                                                    ~

src/components/admin/settings/mail-settings.tsx:249:45 - error TS7006: Parameter 'c' implicitly has an 'any' type.

249   const defaultConfig = configurations.find(c => c.is_default);
                                                ~

src/components/admin/settings/mail-settings.tsx:250:47 - error TS7006: Parameter 'c' implicitly has an 'any' type.

250   const activeConfigs = configurations.filter(c => c.is_active);
                                                  ~

src/components/admin/settings/mail-settings.tsx:346:32 - error TS7006: Parameter 'config' implicitly has an 'any' type.

346           {configurations.map((config) => (
                                   ~~~~~~

src/components/admin/settings/mail-templates.tsx:71:29 - error TS2339: Property 'getTemplateVariables' does not exist on type '{ getGlobalStats: () => Promise<AxiosResponse<GlobalStats, any>>; getCompaniesStats: () => Promise<AxiosResponse<CompanyStats[], any>>; ... 79 more ...; getLoginAuditStats: (dateFrom?: string | undefined, dateTo?: string | undefined) => Promise<...>; }'.

71     queryFn: () => adminApi.getTemplateVariables(),
                               ~~~~~~~~~~~~~~~~~~~~

src/components/admin/settings/mail-templates.tsx:199:23 - error TS7006: Parameter 'variable' implicitly has an 'any' type.

199     variables.forEach(variable => {
                          ~~~~~~~~

src/components/admin/settings/mail-templates.tsx:246:59 - error TS2339: Property 'data' does not exist on type 'TemplateType[]'.

246                       {Array.isArray(templateTypes?.data?.data) && templateTypes.data.data.map((type: any) => (
                                                              ~~~~

src/components/admin/settings/mail-templates.tsx:246:87 - error TS2339: Property 'data' does not exist on type 'TemplateType[]'.

246                       {Array.isArray(templateTypes?.data?.data) && templateTypes.data.data.map((type: any) => (
                                                                                          ~~~~

src/components/admin/settings/mail-templates.tsx:469:56 - error TS2339: Property 'data' does not exist on type 'MailTemplate[]'.

469   const templatesList = Array.isArray(templates?.data?.data) ? templates.data.data : [];
                                                           ~~~~

src/components/admin/settings/mail-templates.tsx:469:79 - error TS2339: Property 'data' does not exist on type 'MailTemplate[]'.

469   const templatesList = Array.isArray(templates?.data?.data) ? templates.data.data : [];
                                                                                  ~~~~

src/components/admin/settings/mail-templates.tsx:470:48 - error TS7006: Parameter 't' implicitly has an 'any' type.

470   const activeTemplates = templatesList.filter(t => t.is_active);
                                                   ~

src/components/admin/settings/mail-templates.tsx:471:49 - error TS7006: Parameter 't' implicitly has an 'any' type.

471   const defaultTemplates = templatesList.filter(t => t.is_default);
                                                    ~

src/components/admin/settings/mail-templates.tsx:586:31 - error TS7006: Parameter 'template' implicitly has an 'any' type.

586           {templatesList.map((template) => (
                                  ~~~~~~~~

src/components/admin/settings/mail-templates.tsx:597:47 - error TS2339: Property 'data' does not exist on type 'TemplateType[]'.

597                         {templateTypes?.data?.data?.find(t => t.value === template.template_type)?.label || template.template_type}
                                                  ~~~~

src/components/admin/settings/mail-templates.tsx:597:58 - error TS7006: Parameter 't' implicitly has an 'any' type.

597                         {templateTypes?.data?.data?.find(t => t.value === template.template_type)?.label || template.template_type}
                                                             ~

src/components/admin/settings/visual-identity-settings.tsx:135:12 - error TS2304: Cannot find name 'colorValue'.

135     return colorValue.startsWith('#') ? colorValue : '#6366f1';
               ~~~~~~~~~~

src/components/admin/settings/visual-identity-settings.tsx:135:41 - error TS2304: Cannot find name 'colorValue'.

135     return colorValue.startsWith('#') ? colorValue : '#6366f1';
                                            ~~~~~~~~~~

src/components/admin/settings/visual-identity-settings.tsx:342:62 - error TS18046: 'error' is of type 'unknown'.

342         console.error('❌ [VISUAL IDENTITY] Error response:', error.response);
                                                                 ~~~~~

src/components/admin/settings/visual-identity-settings.tsx:343:60 - error TS18046: 'error' is of type 'unknown'.

343         console.error('❌ [VISUAL IDENTITY] Error status:', error.response?.status);
                                                               ~~~~~

src/components/admin/settings/visual-identity-settings.tsx:344:58 - error TS18046: 'error' is of type 'unknown'.

344         console.error('❌ [VISUAL IDENTITY] Error data:', error.response?.data);
                                                             ~~~~~

src/components/admin/settings/visual-identity-settings.tsx:490:23 - error TS2339: Property 'response' does not exist on type 'Error'.

490               {error?.response?.data?.message && <br />}
                          ~~~~~~~~

src/components/admin/settings/visual-identity-settings.tsx:491:23 - error TS2339: Property 'response' does not exist on type 'Error'.

491               {error?.response?.data?.message}
                          ~~~~~~~~

src/components/theme-provider.tsx:5:41 - error TS2307: Cannot find module 'next-themes/dist/types' or its corresponding type declarations.

5 import { type ThemeProviderProps } from "next-themes/dist/types";
                                          ~~~~~~~~~~~~~~~~~~~~~~~~


Found 43 errors in 7 files.

Errors  Files
     9  src/app/analytics/[id]/page.tsx:166
     5  src/components/admin/api-keys/model-config-dialog.test.tsx:2
     6  src/components/admin/settings/automation-form.tsx:80
     4  src/components/admin/settings/mail-settings.tsx:111
    11  src/components/admin/settings/mail-templates.tsx:71
     7  src/components/admin/settings/visual-identity-settings.tsx:135
     1  src/components/theme-provider.tsx:5
PS C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\frontend-admin> 