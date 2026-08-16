# Plano de Implementação — Geo Core V1

**Status geral:** Fase 8 em andamento
**Gate atual:** consolidar qualidade automatizada e preparar a entrega
**Última atualização:** 2026-08-16

## 1. Forma de trabalho

O projeto avançará uma fase por vez.

Para cada fase:

1. confirmar escopo e fora de escopo;
2. listar arquivos e dependências previstos;
3. implementar a menor fatia que satisfaça o gate;
4. executar testes e verificações;
5. registrar evidências e decisões relevantes;
6. revisar o resultado antes de iniciar a fase seguinte;
7. manter a fase em um commit identificável, a partir da inicialização do Git.

Itens posteriores não deverão ser antecipados apenas porque são fáceis de incluir no momento.

## 2. Estado das fases

| Fase                              | Estado       | Gate                                                     |
| --------------------------------- | ------------ | -------------------------------------------------------- |
| 0 — Especificação e arquitetura   | Concluída    | baseline documental aprovada                             |
| 1 — Bootstrap executável          | Concluída    | ambiente integrado sobe por Docker Compose               |
| 2 — Application Shell             | Concluída    | branding e shell controlados por configuração            |
| 3 — Map Core                      | Concluída    | mapa funcional com acesso organizado à instância         |
| 4 — Primeira camada ponta a ponta | Concluída    | PostGIS → API → mapa → seleção → popup                   |
| 5 — Sistema genérico de camadas   | Concluída    | segunda camada não altera componentes genéricos          |
| 6 — Prova de derivação            | Concluída    | módulo pode ser adicionado e removido sem alterar o Core |
| 7 — Ferramentas e acabamento      | Concluída    | capacidades priorizadas funcionam por configuração       |
| 8 — Qualidade e entrega           | Não iniciada | CI, documentação e build/deploy validados                |

## 3. Fase 0 — Especificação e arquitetura

### Escopo

- [x] reposicionar o PRD como fundação derivável;
- [x] declarar objetivos e não objetivos do V1;
- [x] definir fronteiras entre Core, composition root e módulos;
- [x] propor estrutura alvo do repositório;
- [x] registrar composição de módulos em build time;
- [x] registrar GeoJSON limitado como entrega espacial inicial;
- [x] definir fases e gates;
- [x] obter aprovação da baseline documental.

### Fora de escopo

- inicializar Git;
- criar frontend ou backend;
- escolher versões exatas de dependências;
- criar containers;
- obter ou carregar dados geográficos.

### Gate

A baseline deverá responder sem ambiguidade:

- o que pertence ao Core;
- onde a aplicação é composta;
- como módulos futuros entram;
- como a primeira camada será entregue;
- qual resultado encerra cada fase.

## 4. Fase 1 — Bootstrap executável

### Escopo previsto

- [x] inicializar repositório Git e arquivos básicos;
- [x] criar frontend React + TypeScript + Vite;
- [x] criar backend FastAPI;
- [x] configurar PostgreSQL + PostGIS;
- [x] configurar Nginx como entrada única;
- [x] criar Dockerfiles e Docker Compose de desenvolvimento;
- [x] criar `.env.example` sem segredos;
- [x] adicionar health da API e verificação do banco;
- [x] configurar lint, type checking e testes smoke;
- [x] criar README mínimo de execução.

### Fora de escopo

- MapLibre;
- UI definitiva;
- catálogo de camadas;
- migrations de domínio além da conectividade mínima;
- deploy em VPS.

### Gate verificável

Em um clone limpo:

```bash
cp .env.example .env
docker compose up -d --build
```

deverá disponibilizar frontend, `/api/health` e conexão saudável com o PostGIS pelo Nginx.

## 5. Fase 2 — Application Shell

### Escopo previsto

- [x] criar Header, Sidebar, MapViewport vazio, Toolbar e StatusBar;
- [x] criar estados de loading, erro e vazio;
- [x] definir configuração tipada e validada;
- [x] configurar nome, logo, cores, extent e capacidades habilitadas;
- [x] implementar responsividade desktop-first e consulta funcional em telas menores;
- [x] adicionar testes da configuração e do shell.

### Fora de escopo

- mapa real;
- camadas;
- módulos de negócio;
- refinamento completo de mobile;
- Dark Mode, salvo se não ampliar o gate.

### Gate verificável

Duas configurações de teste deverão mudar branding e elementos habilitados sem editar componentes internos.

## 6. Fase 3 — Map Core

### Escopo previsto

- [x] integrar MapLibre;
- [x] implementar lifecycle controlado;
- [x] ler center, zoom, min/max zoom e extent da configuração;
- [x] adicionar um basemap com atribuição;
- [x] implementar home, fullscreen, escala e coordenadas;
- [x] testar contratos do adaptador sem acoplar testes a detalhes internos.

### Fora de escopo

- dados PostGIS;
- seleção;
- legenda;
- medições;
- três ou mais basemaps.

### Gate verificável

O mapa deverá iniciar, reagir à configuração e ser destruído sem vazamentos aparentes. Acesso à instância não deverá estar espalhado entre componentes.

## 7. Fase 4 — Primeira camada ponta a ponta

### Escopo previsto

- [x] definir migration inicial de `core.layers` e estilo associado;
- [x] cadastrar uma camada e carregar dados públicos de referência;
- [x] documentar fonte, licença e atribuição;
- [x] criar API de catálogo;
- [x] criar API GeoJSON por `bbox` com allowlist e limite;
- [x] definir limite numérico a partir de medição;
- [x] renderizar a camada no MapLibre;
- [x] implementar clique, seleção, highlight e popup;
- [x] testar o fluxo e casos de limite/erro.

### Fora de escopo

- Layer Manager completo;
- filtros arbitrários;
- busca;
- vector tiles;
- múltiplas camadas.

### Gate verificável

Uma feição deverá percorrer PostGIS → API → MapLibre e possuir identidade estável para seleção e popup.

## 8. Fase 5 — Sistema genérico de camadas

### Escopo previsto

- [x] consolidar `LayerDefinition` a partir da Fase 4;
- [x] implementar grupos, visibilidade, ordem e opacidade;
- [x] implementar estados de carregamento e erro por camada;
- [x] compartilhar a configuração entre estilo e legenda;
- [x] tornar popup configurável por campos;
- [x] adicionar metadados e atribuição;
- [x] adicionar segunda camada com geometria ou simbologia diferente;
- [x] testar Layer Manager, legenda e popup.

### Gate verificável

A segunda camada deverá funcionar sem condicionais específicas nos componentes genéricos.

## 9. Fase 6 — Prova de derivação

### Escopo previsto

- [x] definir a forma mínima final de `WebGisModule`;
- [x] implementar registro explícito no composition root;
- [x] implementar extension point realmente necessário;
- [x] criar módulo `reference` sem regra de negócio;
- [x] testar registro, contribuição, cleanup e remoção;
- [x] documentar como iniciar um módulo derivado.

### Fora de escopo

- runtime de plugins;
- marketplace;
- publicação em registry;
- carregamento remoto;
- compatibilidade entre builds independentes.

### Gate verificável

Adicionar e remover o módulo de referência deverá exigir mudanças apenas na composição/configuração, sem editar internamente Core e Application Shell.

## 10. Fase 7 — Ferramentas e acabamento

Os itens serão priorizados ao chegar nesta fase; não são todos obrigatórios antecipadamente.

- [x] medição de distância;
- [x] medição de área;
- [ ] segundo basemap;
- [ ] Light/Dark Mode;
- [ ] busca interna;
- [ ] refinamento de tablet/mobile;
- [ ] acessibilidade e navegação por teclado;
- [ ] melhorias visuais.

Cada capacidade implementada deverá possuir feature flag ou configuração quando fizer sentido para aplicações derivadas.

## 11. Fase 8 — Qualidade e entrega

### Escopo previsto

- [ ] consolidar testes unitários, integração e E2E;
- [x] configurar CI para lint, types, testes e build;
- [x] estruturar logs, request ID e erros públicos;
- [x] aplicar usuário de banco com privilégios mínimos;
- [ ] configurar limites, rate limiting e headers de segurança;
- [ ] concluir documentação de desenvolvimento e derivação;
- [ ] criar configuração de produção;
- [ ] preparar HTTPS, volumes e restart policy;
- [ ] documentar e testar backup/restauração do PostGIS;
- [ ] validar deploy na VPS alvo.

### Gate verificável

Uma pessoa que não participou da implementação deverá conseguir executar, compreender e derivar a fundação usando a documentação, com a pipeline verde.

## 12. Registro de evidências

Ao concluir cada fase, adicionar nesta seção:

- commit ou tag;
- comandos de verificação;
- testes executados;
- screenshots quando a fase tiver resultado visual;
- limitações conhecidas;
- decisões ou ADRs criados.

### Fase 0

- commit: `5bd16ed` (`docs: define Geo Core V1 foundation`);
- PRD revisado: `geo-core-v1-prd.md`;
- arquitetura: `docs/ARCHITECTURE.md`;
- decisões: `docs/adr/0001-composicao-de-modulos.md` e `docs/adr/0002-entrega-espacial-inicial.md`;
- código criado: nenhum.

### Fase 1

- commit: `f7fccce` (`chore: bootstrap integrated development environment`);
- `docker compose config --quiet`: aprovado;
- `docker compose build`: frontend e backend construídos;
- `docker compose up -d`: database, backend, frontend e Nginx saudáveis;
- `GET /`: HTTP 200 via Nginx;
- `GET /api/health`: HTTP 200 com `{"status":"ok","database":"ok"}`;
- `GET /api/openapi.json`: HTTP 200 via Nginx;
- frontend: ESLint, Prettier, 2 testes Vitest e build de produção aprovados;
- backend: Ruff lint/format, 2 testes Pytest e conexão Alembic aprovados;
- `npm audit`: nenhuma vulnerabilidade conhecida reportada;
- limitação conhecida: a imagem oficial `postgis/postgis:17-3.5` é AMD64 e usa emulação do Docker Desktop em Apple Silicon;
- MapLibre, Application Shell, catálogo de camadas e migrations de domínio não foram antecipados.

### Fase 2

- branch: `agent/application-shell`;
- commit: `4caf04f` (`feat: add configurable application shell`);
- configuração de produto validada por Zod e injetada por provider;
- branding dinâmico por CSS variables, sem alteração dos componentes do shell;
- Header, Sidebar recolhível, MapViewport vazio, Toolbar, StatusBar e drawer móvel implementados;
- estados de loading, indisponibilidade e vazio implementados;
- server state de health migrado para TanStack Query;
- Tailwind CSS e primitives no padrão shadcn/Radix adicionados;
- frontend: ESLint, Prettier, 8 testes Vitest e build de produção aprovados no container;
- `npm audit`: nenhuma vulnerabilidade conhecida reportada;
- database, backend, frontend e Nginx saudáveis;
- `GET /`: HTTP 200 via Nginx e `GET /api/health`: API/PostGIS em estado `ok`;
- inspeção visual automatizada indisponível porque não havia navegador conectado à sessão; shell mantido em `http://localhost:8080` para revisão;
- MapLibre, camadas, ferramentas GIS reais, Dark Mode e busca não foram antecipados.

### Fase 3

- branch: `agent/map-core`;
- commit: `080dc5f` (`feat: add configurable map core`);
- MapLibre GL JS 6.3 integrado por um adaptador único em `core/map`;
- lifecycle, estado de carregamento/erro, vista inicial, enquadramento e fullscreen encapsulados pelo contrato do adaptador;
- centro, zoom, limites, extensão inicial e basemap lidos da configuração validada;
- CARTO Positron configurado com atribuição a CARTO e OpenStreetMap e termos de uso explícitos;
- decisão de uso do basemap registrada em `docs/adr/0003-basemap-padrao-de-demonstracao.md`;
- zoom, escala métrica, coordenadas do cursor e escala aproximada exibidos na interface;
- frontend no container: ESLint, Prettier, 11 testes Vitest e build de produção aprovados;
- database, backend, frontend e Nginx saudáveis;
- `GET /`: HTTP 200 e `GET /api/health`: API/PostGIS em estado `ok`;
- endpoint do tile respondeu HTTP 200 quando solicitado com User-Agent e Referer de aplicação web;
- inspeção visual automatizada indisponível porque não havia navegador conectado à sessão; revisão manual disponível em `http://localhost:8080`;
- limitação conhecida: o build concentra MapLibre e aplicação em um bundle JS de aproximadamente 1,36 MB minificado; code splitting será avaliado quando houver rotas ou módulos que permitam separação útil;
- dados PostGIS, camadas de negócio, seleção, legenda e medição não foram antecipados.

### Fase 4

- branch: `agent/first-layer`;
- commit: `81aa253` (`feat: add first end-to-end reference layer`), publicado em `origin/agent/first-layer`;
- migration `20260815_0001` cria `core.layers`, a tabela espacial de referência e o índice GiST;
- snapshot oficial do IBGE com 39 municípios da Região Metropolitana de São Paulo carregado automaticamente;
- catálogo publica estilo, campos permitidos, atribuição e licença sem expor nomes físicos do banco;
- consulta GeoJSON exige `bbox` EPSG:4326 válida, respeita allowlist, ordena por identidade estável e informa truncamento;
- resposta completa na extensão inicial: 39 feições e 223.223 bytes sem compressão, usando a qualidade máxima do IBGE; limite máximo definido em 50;
- frontend consulta por viewport, renderiza o estilo do catálogo e apresenta seleção, highlight e popup configurado pelos campos publicáveis;
- frontend: ESLint, Prettier, 17 testes Vitest e build de produção aprovados;
- backend: Ruff e 23 testes Pytest aprovados;
- stack reconstruída com database, backend, frontend e Nginx saudáveis;
- `GET /api/health`: HTTP 200; catálogo: HTTP 200; consulta espacial: 39 feições; truncamento com limite 10 confirmado; bbox invertida: HTTP 422;
- inspeção visual automatizada indisponível porque não havia navegador conectado à sessão; aplicação disponível em `http://localhost:8080` para revisão manual do clique e popup;
- fora do escopo preservado: sem Layer Manager completo, filtros arbitrários, busca, vector tiles ou segunda camada.

### Fase 5

- branch: `agent/layer-system`;
- migration `20260815_0002` amplia `core.layers` com grupo, ordem, opacidade e metadados de apresentação;
- `LayerDefinition` consolidada com estilos discriminados `fill` e `circle` e campos de popup `title`, `detail` ou `hidden`;
- segunda camada persistida em `reference.rmsp_municipality_points`, com 39 pontos SRID 4326 derivados por `ST_PointOnSurface` e índice GiST;
- store Zustand centraliza visibilidade, opacidade, ordem, loading/erro e seleção sem armazenar a instância do MapLibre;
- cada camada possui consulta TanStack Query e lifecycle independentes por viewport;
- Layer Manager implementa grupos, liga/desliga, reordenação, opacidade, estado e metadados;
- legenda e popup derivam da mesma definição usada pelo adaptador do mapa;
- teste integrado prova que duas camadas do catálogo percorrem os componentes genéricos sem lógica específica no shell;
- frontend: ESLint, Prettier, 22 testes Vitest e build de produção aprovados;
- backend: Ruff e 24 testes Pytest aprovados;
- stack reconstruída com database, backend, frontend e Nginx saudáveis;
- catálogo: duas camadas HTTP 200; camada de pontos: 39 feições persistidas, tipo `Point`, SRID 4326 e 38 pontos dentro da extensão inicial;
- inspeção visual automatizada indisponível porque não havia navegador conectado à sessão; aplicação disponível em `http://localhost:8080` para revisão manual;
- revisão visual e funcional aprovada em 2026-08-15;
- fora do escopo preservado: sem filtros arbitrários, busca, vector tiles ou regras de negócio específicas.

### Fase 6

- branch: `agent/derivation-proof`;
- contrato público mínimo `WebGisModule` define identidade, versão, contribuições de IDs do catálogo e lifecycle opcional;
- `frontend/src/app/modules.ts` atua como composition root explícito, enquanto `app.config.ts` escolhe módulos habilitados;
- módulo `reference` possui as duas camadas IBGE sem duplicar estilo, popup ou metadados do catálogo;
- registro valida módulos ausentes/duplicados e ownership exclusivo de cada camada;
- provider conecta setup e cleanup ao lifecycle React, com cleanup reverso e idempotente;
- remoção do módulo entrega catálogo vazio ao shell e limpa estado/seleção sem alterar componentes genéricos;
- guia `docs/DERIVATION.md` documenta criação, registro, habilitação, cleanup e remoção de módulos;
- frontend: ESLint, Prettier, 32 testes Vitest e build de produção aprovados;
- backend permanece genérico e sem alterações; Ruff e 24 testes Pytest continuam aprovados;
- stack com database, backend, frontend e Nginx saudáveis; aplicação e health respondem HTTP 200;
- revisão funcional aprovada em 2026-08-15, sem regressão visual ou de interação;
- fora do escopo preservado: sem runtime de plugins, marketplace, registry ou carregamento remoto.

### Fase 7 — recorte de medição

- branch: `agent/measurement-tools`;
- capacidades `measureDistance` e `measureArea` controlam separadamente os botões da toolbar;
- cálculo geodésico puro usa distância Haversine acumulada e área esférica, com formatação métrica em metros/quilômetros;
- adaptador MapLibre mantém fonte e camadas GeoJSON temporárias para vértices, linha e polígono;
- medição bloqueia seleção de feições enquanto ativa e pode ser reiniciada, encerrada pelo painel ou cancelada com `Esc`;
- estado permanece efêmero no hook do mapa e nunca é enviado à API ou ao PostGIS;
- frontend: ESLint, Prettier, 44 testes Vitest e build de produção aprovados;
- backend permanece sem alterações; Ruff e 24 testes Pytest continuam aprovados;
- revisão funcional das medições aprovada em 2026-08-16;
- fora deste recorte: segundo basemap, tema, busca e demais refinamentos continuam pendentes para priorização.

### Fase 8 — recorte inicial de CI

- branch: `agent/quality-ci`;
- workflow `.github/workflows/ci.yml` acionado em pull requests e atualizações da `main`;
- frontend e backend executados em jobs independentes, com cancelamento de execuções obsoletas;
- frontend em Node.js 22: Prettier, ESLint, TypeScript, Vitest e build de produção;
- backend em Python 3.13: Ruff lint, Ruff format e Pytest;
- permissões do workflow restritas a leitura do conteúdo do repositório;
- validação local e nos containers aprovada: 44 testes Vitest, 24 testes Pytest, lint, formatação, TypeScript e build;
- database, backend, frontend e Nginx saudáveis; aplicação HTTP 200 e API/PostGIS em estado `ok`;
- limitação conhecida preservada: o bundle principal ainda gera o aviso de tamanho acima de 500 kB;
- próximos itens da fase após a CI: observabilidade, privilégios mínimos, limites e headers, documentação de produção, backup/restauração e deploy na VPS.

### Fase 8 — observabilidade HTTP

- branch: `agent/request-observability`;
- middleware valida ou gera `X-Request-ID` e o devolve em todas as respostas;
- CORS expõe o identificador para consumidores no browser;
- logs HTTP em JSON incluem request ID, método, caminho, status e duração;
- logs operacionais do Uvicorn usam o mesmo formato e o access log duplicado fica desabilitado;
- exceções inesperadas geram HTTP 500 com mensagem genérica e identificador de correlação, mantendo detalhes e traceback apenas nos logs;
- nível mínimo de log configurável por `LOG_LEVEL`;
- backend: Ruff, formatação e 29 testes Pytest aprovados;
- validação integrada: request ID fornecido atravessou Nginx/API, retornou no header e apareceu no log JSON correspondente.

### Fase 8 — privilégio mínimo no PostGIS

- branch: `agent/database-least-privilege`;
- serviço efêmero `migrate` concentra credencial administrativa, provisionamento e Alembic;
- backend persistente conecta somente como `geo_core_app`;
- papel runtime sem superusuário, criação de roles/databases, replication, bypass de RLS ou inheritance;
- concessões recalculadas a partir do catálogo: `USAGE` nos schemas e `SELECT` apenas em `core.layers` e nas fontes cadastradas;
- nenhuma permissão de escrita, sequence ou criação de objetos nos schemas da aplicação;
- compatibilidade validada sobre o volume PostGIS existente, sem recriação ou perda de dados;
- 39 testes unitários aprovados e teste de integração PostGIS confirma identidade e permissões efetivas;
- CI passa a iniciar PostGIS, executar migrations/concessões e validar o usuário runtime em toda alteração.
