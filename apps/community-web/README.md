# SYNAP Comunidade Web

Aplicação web da comunidade profissional do SYNAP.

## Stack

- NextJS
- React
- TypeScript
- TailwindCSS
- SSR para SEO

## Variáveis

- `COMMUNITY_API_URL`: URL server-side do backend, por exemplo `https://api.synap.app/api`.
- `NEXT_PUBLIC_COMMUNITY_API_URL`: URL pública do backend para ambientes onde o server-side usa a mesma origem.
- `NEXT_PUBLIC_COMMUNITY_URL`: URL canônica da comunidade, por exemplo `https://community.synap.app`.

## Scripts

```bash
npm run dev
npm run build
npm run validate:critical
```

## Deploy

O app gera build standalone do NextJS para container.

```bash
docker build -t synap/community-web .
docker run --rm -p 3001:3000 synap/community-web
```

Health check:

```bash
curl http://localhost:3001/api/health
```

Manifests Kubernetes:

```bash
kubectl apply -f apps/community-web/deploy/k8s/community-web.yaml
```

## Rotas iniciais

- `/`: feed principal SSR com filtros `recent`, `relevant` e `unanswered`.
- `/api/health`: health check para container, probes e orquestradores.
- `/api/community/health`: health check local do contrato da API da comunidade e dependencias planejadas.
- `/api/community/openapi`: documento OpenAPI 3.1 estatico com os contratos REST planejados.
- `/api/community/contributions/rules`: regras versionadas de reputacao saudavel, niveis, badges e salvaguardas.
- `/admin`: painel administrativo preparado para RBAC, auditoria, SEO, operacao e contratos futuros.
- `/busca`: busca global por discussoes, recursos, categorias, tags e perfis.
- `/contratos`: contratos REST e modelagem PostgreSQL planejada.
- `/categorias`: lista agrupada de categorias oficiais por eixo tecnico.
- `/tags/[slug]`: feed por tag tecnica com discussoes, artigos e referencias.
- `/discussoes/[slug]`: visualizacao de discussao com Markdown seguro, metadata dinamica e JSON-LD.
- `/discussoes/[slug]`: tambem permite preparar respostas locais com validacao etica.
- `/nova-discussao`: criacao local com rascunho, validacao etica, previa Markdown, referencias estruturadas e metadados de anexos.
- `/perfil/equipe-synap`: perfil profissional mockado para validar reputacao tecnica e badges.
- `/artigos`: artigos e materiais cientificos compartilhados.
- `/artigos/[slug]`: detalhe publico e indexavel de artigo compartilhado.
- `/referencias`: referencias bibliograficas e guias de apoio.
- `/referencias/[slug]`: detalhe publico e indexavel de referencia bibliografica.
- `/novo-recurso`: formulario local para compartilhar artigo ou referencia.
- `/notificacoes`: centro local de notificacoes com lidas/nao lidas.
- `/salvos`: lista local de discussões, artigos e referências salvos.
- `/colaboradores`: destaques de contribuicao tecnica, niveis e reputacao saudavel.
- `/contribuicoes`: regras de reputacao saudavel, pontuacao, niveis, badges e salvaguardas anti-competicao.
- `/profissionais`: diretorio SSR de perfis profissionais com filtros por busca e especialidade.
- `/ia`: arquitetura de IA responsavel com contratos futuros e guardrails clinicos.
- `/diretrizes`: diretrizes eticas, anonimizacao e conduta profissional.
- `/moderacao`: painel local de denuncias e revisao de moderacao.
- `/seguranca`: controles e contratos de seguranca, RBAC, CSRF, rate limit e headers.
- `/sessao`: estado local do SSO e contratos de sincronizacao de perfil.
- `/sso/callback`: rota preparada para receber token temporario do SSO.
- `/status`: status operacional noindex com contratos de health checks, metricas e logs.

## SEO

- SSR nas rotas publicas.
- Sitemap e robots gerados pelo NextJS.
- Areas operacionais (`/admin`, `/contratos`, `/moderacao`, `/notificacoes`, `/nova-discussao`, `/novo-recurso`, `/salvos`, `/seguranca`, `/sessao`, `/sso`, `/status`) ficam fora do indice.
- Canonical URLs em categorias, tags e discussoes.
- OpenGraph/Twitter metadata em discussoes, categorias e tags.
- JSON-LD `DiscussionForumPosting` nas discussoes.
- JSON-LD `WebPage` nas diretrizes da comunidade.
- JSON-LD `WebPage` na pagina de IA responsavel.
- JSON-LD `ScholarlyArticle`/`CreativeWork` nos recursos compartilhados.

## UX responsiva

- Header desktop com busca e navegacao completa em telas largas.
- Menu mobile com busca, links principais, nova discussao e acessos rapidos.
- Navegacao preparada para WebView e telas pequenas.

## Contratos preparados

- Discussao: `references[]` para DOI, fonte, URL e nota clinica.
- Discussao: `attachmentsMetadata[]` para PDF, imagem, video e link externo.
- Upload futuro: os anexos devem usar URL assinada S3 antes da publicacao.
- Observabilidade: contratos para health checks, metricas, logs e eventos de erro.
- Seguranca: headers defensivos ativos e contratos para RBAC, CSRF, rate limit e anti-spam.
- Sessao: contrato de SSO com token curto, cookie HttpOnly futuro e sincronizacao de perfil.
- Backend futuro: contratos REST e entidades PostgreSQL em `/contratos`.
- Reputacao: modelo publico em `/contribuicoes` com regras positivas, penalidades revisadas, niveis, badges e superficies de destaque.
- Reputacao: API local `GET /api/community/contributions/rules` preparada para substituir por backend versionado.
- OpenAPI: documento JSON gerado a partir dos contratos em `/api/community/openapi`.
