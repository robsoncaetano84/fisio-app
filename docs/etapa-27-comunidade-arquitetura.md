# Etapa 27 - Comunidade SYNAP

## Escopo atual

A comunidade foi iniciada como um novo app web isolado no monorepo e agora possui o primeiro backend real no NestJS do SYNAP. O app mobile ainda nao foi alterado nesta fatia; a integracao WebView fica preparada pelo fluxo SSO e pela URL `/sso/callback`.

```txt
apps/
  backend/          # modulo community, APIs REST, migration e SSO
  mobile/           # sem alteracoes nesta fatia
  community-web/    # novo app da comunidade
```

Essa decisao mantem a comunidade desacoplada na experiencia web, mas integrada ao backend principal para autenticacao, perfis, conteudo, reputacao, moderacao, auditoria, notificacoes, S3, Redis e IA.

## Stack inicial

- NextJS
- React
- TypeScript
- TailwindCSS
- SSR para SEO
- Tokens visuais alinhados ao SYNAP
- Build standalone para container
- Docker/Kubernetes-ready

## Frontend criado

App: `apps/community-web`

Telas iniciais:

- Home/feed com filtros saudaveis
- Categorias agrupadas por eixo tecnico
- Categoria por slug
- Tag tecnica por slug
- Discussao por slug
- Resposta local em discussao
- Busca global
- Contratos REST e modelagem PostgreSQL
- Nova discussao com referencias e anexos estruturados
- Perfil profissional
- Artigos compartilhados
- Detalhe de artigo por slug
- Referencias bibliograficas
- Detalhe de referencia por slug
- Compartilhamento local de recurso
- Salvos/bookmarks locais
- Notificacoes locais
- Colaboradores em destaque
- Contribuicoes, reputacao saudavel, niveis e badges
- Diretorio de profissionais
- IA responsavel preparada por contrato
- Diretrizes eticas e anonimizacao
- Denuncia local de conteudo
- Moderacao
- Painel admin
- Callback SSO preparado
- Sessao local e contrato de sincronizacao de perfil
- Health check `/api/health`
- Health check contratual `/api/community/health`
- OpenAPI estatico `/api/community/openapi`
- Regras de reputacao via `/api/community/contributions/rules`
- Status operacional e contratos de observabilidade
- Seguranca, RBAC e headers defensivos
- Estados globais de erro e 404
- Menu mobile com busca e navegacao principal

## Fallback da web

Quando a API real nao responde, o `community-web` ainda preserva fallback local para manter SEO, navegacao e demonstracao funcional:

- O feed usa dados de demonstracao quando a API nao responde.
- O feed suporta filtros `recent`, `relevant` e `unanswered`.
- A relevancia local considera score tecnico, respostas, recencia e discussoes que ainda precisam de apoio, sem priorizar polemica ou viralizacao artificial.
- Categorias usam fallback local com a taxonomia inicial completa do SYNAP.
- A pagina `/categorias` agrupa areas por especialidades clinicas, abordagens, discussao clinica, conhecimento cientifico, tecnologia e gestao.
- O formulario de nova discussao valida dados, reforca anonimização, salva rascunho/publicacao local em `localStorage` e prepara `references[]` e `attachmentsMetadata[]`.
- O callback `/sso/callback?token=...` troca o token temporario em `POST /api/community/session/exchange`, recebe cookie HttpOnly e remove o token bruto do navegador.
- A pagina `/sessao` mostra metadados seguros da ultima troca SSO e o contrato de sincronizacao de perfil.
- O editor exibe previa Markdown segura sem executar HTML.
- O perfil profissional usa fallback local para validar reputacao tecnica, badges e historico de contribuicao.
- O diretorio `/profissionais` lista perfis por busca, especialidade e ordenacao saudavel.
- A pagina `/contratos` documenta APIs REST e entidades PostgreSQL planejadas para o backend futuro.
- O endpoint `/api/community/openapi` expoe um documento OpenAPI 3.1 gerado a partir dos contratos planejados.
- A pagina `/ia` documenta contratos futuros para resumo, referencias, tags, moderacao e redacao tecnica, sem executar IA nesta etapa.
- Colaboradores em destaque usam fallback local para validar reputacao saudavel, niveis e reconhecimento nao competitivo.
- A pagina `/contribuicoes` documenta regras de pontuacao, niveis, badges, superficies de reconhecimento, penalidades revisadas e itens que nunca entram na reputacao.
- O endpoint `/api/community/contributions/rules` expoe o mesmo modelo de reputacao de forma versionada para futura troca pelo backend real.
- Artigos e referencias usam fallback local e contrato preparado para `/community/resources`.
- Detalhes publicos de artigos e referencias usam `GET /community/resources/:slug`.
- Detalhes de recursos incluem JSON-LD (`ScholarlyArticle`/`CreativeWork`) para SEO.
- Discussoes publicas incluem metadata dinamica, canonical URL, OpenGraph/Twitter e JSON-LD `DiscussionForumPosting`.
- Categorias e tags publicas incluem canonical URL e metadata social dinamica.
- Diretrizes publicas incluem canonical URL, OpenGraph e JSON-LD `WebPage`.
- A busca global combina discussoes, artigos, referencias, categorias, tags e perfis profissionais.
- Tags tecnicas possuem paginas em `/tags/:slug`, com discussoes e recursos relacionados.
- O formulario `/novo-recurso` valida artigo/referencia, salva rascunho e prepara envio local ate existir API.
- Anexos possuem contrato real de URL assinada em `POST /api/community/uploads/presign`; a UI local ainda pode registrar metadados quando a API estiver indisponivel.
- Discussões, artigos e referencias podem ser salvos localmente e revisados em `/salvos`.
- Denuncias possuem persistencia real em `community_moderation_reports`; o fallback local continua disponivel quando a API nao responde.
- O painel `/admin` organiza RBAC, auditoria, filas operacionais, SEO administrativo e contratos REST futuros.
- A pagina `/status` documenta health checks, metricas e logs esperados para operacao.
- A pagina `/seguranca` documenta headers ativos, RBAC, CSRF, rate limit e anti-spam planejados.
- Notificacoes locais aparecem no sino da navegacao e na pagina `/notificacoes`.
- Respostas em discussoes podem ser preparadas localmente com preview Markdown e confirmacao etica.
- A pagina `/diretrizes` centraliza regras de anonimizacao, conduta profissional e moderacao.
- Formularios de discussao, resposta e recurso reutilizam o aviso etico compacto.
- O app expoe `/api/health` para probes de container e orquestradores.
- O app expoe `/api/community/health` no backend para dependencias reais e `/api/community/health` no Next para probes/contrato local.
- Areas operacionais (`/admin`, `/contratos`, `/moderacao`, `/notificacoes`, `/nova-discussao`, `/novo-recurso`, `/salvos`, `/seguranca`, `/sessao`, `/sso`, `/status`) ficam fora do sitemap publico ou bloqueadas por robots.
- O app possui `not-found.tsx` e `error.tsx` para estados globais de erro, com contrato futuro de log `community.route.error`.
- O Next aplica headers defensivos globais: `nosniff`, `DENY`, `strict-origin-when-cross-origin`, `Permissions-Policy`, `COOP` e CSP em modo report-only.
- O shell possui menu mobile para busca, nova discussao, categorias, recursos, diretrizes, salvos e moderacao.
- Skeleton loaders cobrem o carregamento do feed, listas, discussoes e perfis.

## Backend implementado

Modulo: `apps/backend/src/modules/community`

Entregas desta fatia:

- `CommunityModule` registrado no `AppModule`.
- Entidades TypeORM `community_*` registradas em `DATABASE_ENTITIES`.
- Migration `1779700000000-CreateCommunityTables` com tabelas, FKs, indices, FTS e seed inicial de categorias/badges.
- Novo papel `MODERATOR` em `UserRole`.
- JWT aceitando `Authorization: Bearer` e cookie HttpOnly `synap_community_session`.
- SSO real:
  - `POST /api/auth/community-sso`
  - `POST /api/community/session/exchange`
- APIs REST persistentes:
  - categorias, tags, feed, posts, respostas, resposta util, recursos, perfis, bookmarks, reacoes, contribuicoes, notificacoes, busca, denuncias, admin overview e audit logs.
- RBAC real:
  - `USER`
  - `MODERATOR`
  - `ADMIN`
- Busca PostgreSQL Full Text Search em posts, recursos e perfis.
- Redis/cache opcional via `REDIS_URL` para categorias, tags e regras de reputacao.
- Upload S3 real por URL assinada quando `COMMUNITY_S3_*` estiver configurado.
- Moderacao persistente com denuncias, status, revisor e nota de resolucao.
- Logs de auditoria persistentes em `community_audit_logs`.
- Rate limiting real via `@Throttle` nos endpoints da comunidade.
- Anti-spam/privacidade inicial bloqueando termos sensiveis como CPF, RG, telefone, WhatsApp e Cartao SUS em conteudo publico.
- Notificacoes persistentes e envio push reaproveitando `NotificacoesService`.
- IA funcional para classificacao responsavel em `POST /api/community/ai/content/classification`, usando `OpenAiService` quando configurado.
- Teste automatizado `community.types.spec.ts` cobrindo reputacao saudavel e taxonomia inicial.

## Deploy inicial

- `apps/community-web/Dockerfile` usa build multi-stage e runtime non-root.
- `next.config.js` usa `output: 'standalone'`.
- `apps/community-web/deploy/k8s/community-web.yaml` inclui `ConfigMap`, `Deployment`, `Service`, `Ingress` e `HorizontalPodAutoscaler`.
- Probes de readiness/liveness usam `/api/health`.
- Variaveis preparadas: `COMMUNITY_API_URL`, `NEXT_PUBLIC_COMMUNITY_API_URL` e `NEXT_PUBLIC_COMMUNITY_URL`.

## Design

- Cores principais: `#2E7D5E`, `#5C6BC0`, `#FF7043`.
- Radius base: `8px`.
- Layout responsivo, limpo e focado em leitura.
- Navegacao mobile-first preparada para navegador e WebView.
- App mobile possui tela `CommunityWebViewScreen` em `/comunidade`, criando token em `POST /api/auth/community-sso` e abrindo `/sso/callback` dentro de WebView com cookie HttpOnly.
- Linguagem orientada a colaboracao, ciencia e etica profissional.

## Pendencias reais

Itens ainda nao concluidos nesta fatia:

1. Executar migration em um banco real de staging/producao.
2. Conectar formularios de nova discussao, respostas, recursos, denuncias e bookmarks diretamente aos endpoints autenticados.
3. Adicionar endpoint administrativo para promover/rebaixar `MODERATOR`.
4. Implementar ocultacao/suspensao de conteudo como acao de moderacao, alem da revisao de denuncia.
5. Criar metricas externas dedicadas para comunidade, alem de health/logs atuais.
6. Enviar eventos de erro client-side para endpoint backend.
7. Implementar CSP report endpoint persistente.
8. Integrar app mobile/WebView chamando `POST /api/auth/community-sso` e abrindo `community.synap.app/sso/callback`. Concluido no app mobile; falta validar em dispositivo com dominio/env de producao.
9. Validar S3 com bucket real e politica CORS.
10. Validar Redis em ambiente real.
11. Expandir IA para resumo de discussoes, sugestao de referencias e triagem de moderacao.
12. Criar testes de service/controller com banco de teste ou mocks de repositories.
13. Deploy cloud real com secrets, dominios, TLS e observabilidade externa.

## Fluxo SSO previsto

1. App SYNAP chama `POST /api/auth/community-sso`.
2. Backend emite token curto, one-time, com TTL de 60 segundos.
3. App abre `https://community.synap.app/sso/callback?token=...`.
4. NextJS troca o token por cookie `HttpOnly`, `Secure`, `SameSite=Lax`.
5. Usuario entra na comunidade sem novo login.

## Proximas etapas sem backend

1. Preparar testes visuais/componentes.
2. Configurar pipeline de build/push da imagem Docker do `community-web`.
3. Conectar anexos estruturados a upload S3 com URL assinada e moderacao.
4. Conectar `/novo-recurso` ao backend e moderacao.
5. Conectar denuncias locais ao backend com RBAC de moderador.
6. Conectar salvos/bookmarks ao usuario autenticado.
7. Conectar notificacoes ao backend e eventos da comunidade.
8. Conectar colaboradores em destaque ao backend e regras editoriais de reputacao.
9. Conectar `/contribuicoes` a regras versionadas, eventos de contribuicao, niveis e badges reais.
10. Conectar diretorio de profissionais ao backend e ao SSO.
11. Conectar contratos de IA ao backend com RBAC, rate limit, auditoria e revisao humana.
12. Conectar painel admin ao backend com RBAC real e logs de auditoria.
13. Conectar observabilidade a metricas, logs e alerta de erro client-side.
14. Conectar CSP report, rate limit e eventos de seguranca ao backend.
15. Trocar token SSO por cookie HttpOnly real e sincronizar perfil.
16. Promover o OpenAPI estatico para contrato versionado do backend real.
17. Definir migrations versionadas para as entidades `community_*`.
18. Definir contrato REST final para perfis, reputacao, recursos e badges.
