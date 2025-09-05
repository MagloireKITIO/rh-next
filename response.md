
./src/app/users/page.tsx:506:92
Type error: Type 'string' is not assignable to type '"super_admin" | "admin" | "hr" | "user"'.

  504 |                     <Select
  505 |                       value={selectedUser.role}
> 506 |                       onValueChange={(value: string) => setSelectedUser({ ...selectedUser, role: value })}
      |                                                                                            ^
  507 |                     >
  508 |                       <SelectTrigger>
  509 |                         <SelectValue />
Next.js build worker exited with code: 1 and signal: null
PS C:\Users\stage.dsi.pmo\Desktop\dev\rh-next\frontend-admin>   npx tsc --noEmit
src/components/admin/api-keys/openrouter-models-dialog.tsx:44:31 - error TS2339: Property 'response' does not exist on type 'Error'.

44       toast.error(modelsError.response?.data?.message || 'Erreur lors du chargement des modèles');
                                 ~~~~~~~~

src/components/admin/settings/mail-automations-tab.tsx:108:19 - error TS2448: Block-scoped variable 'loadData' used before its declaration.

108   }, [activeView, loadData]);
                      ~~~~~~~~

  src/components/admin/settings/mail-automations-tab.tsx:110:9
    110   const loadData = useCallback(async () => {
                ~~~~~~~~
    'loadData' is declared here.

src/components/admin/settings/mail-automations-tab.tsx:108:19 - error TS2454: Variable 'loadData' is used before being assigned.

108   }, [activeView, loadData]);
                      ~~~~~~~~

src/components/admin/settings/mail-automations-tab.tsx:123:22 - error TS2345: Argument of type 'Company[]' is not assignable to parameter of type 'SetStateAction<Company[]>'.
  Type 'import("C:/Users/stage.dsi.pmo/Desktop/dev/rh-next/frontend-admin/src/lib/api-client").Company[]' is not assignable to type 'Company[]'.
    Type 'Company' is missing the following properties from type 'Company': users_count, automations_count, total_sent, success_rate

123         setCompanies(allCompaniesResponse.data);
                         ~~~~~~~~~~~~~~~~~~~~~~~~~

src/components/admin/settings/mail-automations-tab.tsx:305:72 - error TS2345: Argument of type '"templates" | "overview" | "configs"' is not assignable to parameter of type 'SetStateAction<"companies" | "overview" | "automations">'.
  Type '"templates"' is not assignable to type 'SetStateAction<"companies" | "overview" | "automations">'.       

305       <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'overview' | 'templates' | 'configs')} className="space-y-6">
                                                                           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/components/admin/settings/mail-config-form.tsx:108:42 - error TS2769: No overload matches this call.
  Overload 1 of 3, '(options: DefinedInitialDataOptions<unknown, Error, unknown, (string | undefined)[]>, queryClient?: QueryClient | undefined): DefinedUseQueryResult<unknown, Error>', gave the following error.
    Object literal may only specify known properties, and 'cacheTime' does not exist in type 'DefinedInitialDataOptions<unknown, Error, unknown, (string | undefined)[]>'.
  Overload 2 of 3, '(options: UndefinedInitialDataOptions<AxiosResponse<any, any>, Error, AxiosResponse<any, any>, (string | undefined)[]>, queryClient?: QueryClient | undefined): UseQueryResult<...>', gave the following error.
    Type '() => Promise<AxiosResponse<any, any>> | Promise<{ data: never[]; }>' is not assignable to type 'unique symbol | QueryFunction<AxiosResponse<any, any>, (string | undefined)[], never> | undefined'.
      Type '() => Promise<AxiosResponse<any, any>> | Promise<{ data: never[]; }>' is not assignable to type 'QueryFunction<AxiosResponse<any, any>, (string | undefined)[], never>'.
        Type 'Promise<AxiosResponse<any, any>> | Promise<{ data: never[]; }>' is not assignable to type 'AxiosResponse<any, any> | Promise<AxiosResponse<any, any>>'.
          Type 'Promise<{ data: never[]; }>' is not assignable to type 'AxiosResponse<any, any> | Promise<AxiosResponse<any, any>>'.
            Type 'Promise<{ data: never[]; }>' is not assignable to type 'Promise<AxiosResponse<any, any>>'.     
              Type '{ data: never[]; }' is missing the following properties from type 'AxiosResponse<any, any>': status, statusText, headers, config
  Overload 3 of 3, '(options: UseQueryOptions<AxiosResponse<any, any>, Error, AxiosResponse<any, any>, (string | undefined)[]>, queryClient?: QueryClient | undefined): UseQueryResult<...>', gave the following error.
    Type '() => Promise<AxiosResponse<any, any>> | Promise<{ data: never[]; }>' is not assignable to type 'unique symbol | QueryFunction<AxiosResponse<any, any>, (string | undefined)[], never> | undefined'.
      Type '() => Promise<AxiosResponse<any, any>> | Promise<{ data: never[]; }>' is not assignable to type 'QueryFunction<AxiosResponse<any, any>, (string | undefined)[], never>'.
        Type 'Promise<AxiosResponse<any, any>> | Promise<{ data: never[]; }>' is not assignable to type 'AxiosResponse<any, any> | Promise<AxiosResponse<any, any>>'.
          Type 'Promise<{ data: never[]; }>' is not assignable to type 'AxiosResponse<any, any> | Promise<AxiosResponse<any, any>>'.
            Type 'Promise<{ data: never[]; }>' is not assignable to type 'Promise<AxiosResponse<any, any>>'.     
              Type '{ data: never[]; }' is missing the following properties from type 'AxiosResponse<any, any>': status, statusText, headers, config

108   const { isSuccess: assignedSuccess } = useQuery({
                                             ~~~~~~~~

  node_modules/@tanstack/query-core/build/modern/hydration-D0MPgBG9.d.ts:608:5
    608     queryFn?: QueryFunction<TQueryFnData, TQueryKey, TPageParam> | SkipToken;
            ~~~~~~~
    The expected type comes from property 'queryFn' which is declared here on type 'UndefinedInitialDataOptions<AxiosResponse<any, any>, Error, AxiosResponse<any, any>, (string | undefined)[]>'
  node_modules/@tanstack/query-core/build/modern/hydration-D0MPgBG9.d.ts:608:5
    608     queryFn?: QueryFunction<TQueryFnData, TQueryKey, TPageParam> | SkipToken;
            ~~~~~~~
    The expected type comes from property 'queryFn' which is declared here on type 'UseQueryOptions<AxiosResponse<any, any>, Error, AxiosResponse<any, any>, (string | undefined)[]>'

src/components/admin/settings/mail-config-form.tsx:264:59 - error TS2345: Argument of type '{ provider_type: "smtp" | "gmail" | "outlook" | "sendgrid"; company_id: null; smtp_host: string | undefined; smtp_port: number | undefined; smtp_user: string | undefined; smtp_password: string | undefined; ... 7 more ...; is_default: boolean; }' is not assignable to parameter of type 'MailConfiguration'.
  Types of property 'provider_type' are incompatible.
    Type '"smtp" | "sendgrid" | "gmail" | "outlook"' is not assignable to type '"smtp" | "sendgrid" | "mailgun" | "aws_ses" | "supabase"'.
      Type '"gmail"' is not assignable to type '"smtp" | "sendgrid" | "mailgun" | "aws_ses" | "supabase"'.       

264       const result = await saveConfigMutation.mutateAsync(configToSave);
                                                              ~~~~~~~~~~~~

src/components/admin/settings/mail-config-form.tsx:288:21 - error TS1196: Catch clause variable type annotation must be 'any' or 'unknown' if specified.

288     } catch (error: Error & { response?: { data?: { message?: string } } }) {
                        ~~~~~

src/components/admin/settings/mail-config-form.tsx:461:42 - error TS2339: Property 'data' does not exist on type 'Company[]'.

461                       {(companies?.data?.data || companies?.data || []).map((company: { id: string; name: string }) => (
                                             ~~~~

src/components/admin/settings/mail-config-form.tsx:533:23 - error TS2322: Type '"smtp" | "sendgrid" | "gmail" | "outlook"' is not assignable to type '"smtp" | "sendgrid" | "mailgun" | "aws_ses" | "supabase"'.
  Type '"gmail"' is not assignable to type '"smtp" | "sendgrid" | "mailgun" | "aws_ses" | "supabase"'.

533                       provider_type: provider.id as 'smtp' | 'gmail' | 'outlook' | 'sendgrid'
                          ~~~~~~~~~~~~~

src/components/admin/settings/mail-config-list.tsx:71:3 - error TS2304: Cannot find name 'useEffect'.

71   useEffect(() => {
     ~~~~~~~~~

src/components/admin/settings/mail-config-list.tsx:87:3 - error TS2304: Cannot find name 'useEffect'.

87   useEffect(() => {
     ~~~~~~~~~

src/components/admin/settings/mail-config-list.tsx:94:3 - error TS2304: Cannot find name 'useEffect'.

94   useEffect(() => {
     ~~~~~~~~~

src/components/admin/settings/mail-config-list.tsx:108:3 - error TS2304: Cannot find name 'useEffect'.

108   useEffect(() => {
      ~~~~~~~~~

src/components/admin/settings/mail-config-list.tsx:115:3 - error TS2304: Cannot find name 'useEffect'.

115   useEffect(() => {
      ~~~~~~~~~

src/components/admin/settings/mail-config-list.tsx:129:3 - error TS2304: Cannot find name 'useEffect'.

129   useEffect(() => {
      ~~~~~~~~~

src/components/admin/settings/mail-config-list.tsx:136:3 - error TS2304: Cannot find name 'useEffect'.

136   useEffect(() => {
      ~~~~~~~~~

src/components/admin/settings/mail-template-form.tsx:160:21 - error TS1196: Catch clause variable type annotation must be 'any' or 'unknown' if specified.

160     } catch (error: Error & { response?: { data?: { message?: string } } }) {
                        ~~~~~

src/components/ui/navbar.tsx:9:34 - error TS2307: Cannot find module '@/hooks/use-notifications' or its corresponding type declarations.

9 import { useNotifications } from "@/hooks/use-notifications";
                                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/components/ui/navbar.tsx:88:63 - error TS2339: Property 'active' does not exist on type '{ href: string; label: string; id?: undefined; } | { href: string; label: string; id: string; }'.
  Property 'active' does not exist on type '{ href: string; label: string; id?: undefined; }'.

88               const isActive = pathname === item.href || item.active;
                                                                 ~~~~~~

src/components/ui/navbar.tsx:145:65 - error TS2339: Property 'active' does not exist on type '{ href: string; label: string; id?: undefined; } | { href: string; label: string; id: string; }'.
  Property 'active' does not exist on type '{ href: string; label: string; id?: undefined; }'.

145                 const isActive = pathname === item.href || item.active;
                                                                    ~~~~~~

src/components/ui/navbar.tsx:180:21 - error TS2367: This comparison appears to be unintentional because the types '"dashboard"' and '"landing"' have no overlap.

180                     variant === "landing" ? "text-white" : "text-slate-700 dark:text-slate-300"
                        ~~~~~~~~~~~~~~~~~~~~~

src/components/ui/notifications-dropdown.tsx:9:34 - error TS2307: Cannot find module '@/hooks/use-notifications' or its corresponding type declarations.

9 import { useNotifications } from "@/hooks/use-notifications";
                                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/components/ui/user-menu.tsx:25:17 - error TS2339: Property 'signOut' does not exist on type 'AuthContextType'.

25   const { user, signOut, loading } = useAuth();
                   ~~~~~~~

src/contexts/auth-context.tsx:72:21 - error TS1196: Catch clause variable type annotation must be 'any' or 'unknown' if specified.

72     } catch (error: Error & { response?: { data?: { message?: string } } }) {
                       ~~~~~


Found 25 errors in 9 files.

Errors  Files
     1  src/components/admin/api-keys/openrouter-models-dialog.tsx:44
     4  src/components/admin/settings/mail-automations-tab.tsx:108
     5  src/components/admin/settings/mail-config-form.tsx:108
     7  src/components/admin/settings/mail-config-list.tsx:71
     1  src/components/admin/settings/mail-template-form.tsx:160
     4  src/components/ui/navbar.tsx:9
     1  src/components/ui/notifications-dropdown.tsx:9
     1  src/components/ui/user-menu.tsx:25
     1  src/contexts/auth-context.tsx:72