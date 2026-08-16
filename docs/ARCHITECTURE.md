# Arquitetura — Geo Core V1

**Status:** baseline da Etapa 0  
**Última revisão:** 2026-08-16

## 1. Objetivo arquitetural

O Geo Core V1 é uma fundação WebGIS executável e derivável. A arquitetura deve permitir criar aplicações geográficas por configuração e composição de módulos, preservando o núcleo genérico.

O V1 otimiza primeiro para:

- clareza das fronteiras;
- facilidade de execução local;
- baixo custo de derivação;
- substituição progressiva de componentes;
- fluxo geográfico completo, ainda que pequeno.

O V1 não otimiza antecipadamente para multi-tenancy, plugins em runtime, distribuição como biblioteca, milhões de feições ou alta disponibilidade.

## 2. Invariantes

Estas regras não deverão ser violadas sem uma decisão arquitetural explícita:

1. O Core não conhece entidades ou regras de negócio.
2. A aplicação é montada em um composition root explícito.
3. Módulos dependem dos contratos públicos do Core; o Core não depende de módulos.
4. Componentes visuais genéricos não conhecem nomes de tabelas do banco.
5. A API somente consulta fontes e campos previamente cadastrados.
6. Estilo e legenda derivam da mesma configuração.
7. Seleção de feição depende de uma identidade estável.
8. Configuração de produto e configuração de ambiente são conceitos distintos.
9. Toda extensão implementada deverá possuir pelo menos um consumidor que prove seu contrato.
10. Uma abstração somente será expandida quando existir um caso de uso concreto.

## 3. Visão de containers

```text
Browser
   │
   │ HTTP/HTTPS
   ▼
Nginx
   ├── /      ──► frontend estático
   └── /api   ──► FastAPI
                       │
                       ▼
                 PostgreSQL/PostGIS

Migration service (one-shot) ──► PostgreSQL/PostGIS
```

No desenvolvimento, todos os serviços serão iniciados por Docker Compose. Somente o Nginx será publicado no fluxo integrado. O banco não será exposto em produção.

O serviço efêmero de migration é o único consumidor da credencial administrativa da aplicação. Ele provisiona o papel de runtime, executa Alembic e recalcula as concessões após cada evolução do catálogo. O processo persistente da API recebe apenas a credencial de runtime.

## 4. Visão lógica do frontend

```text
Application configuration ─┐
                            ├──► Composition Root ──► Application Shell
Registered modules ─────────┘             │
                                          ▼
                              Public contracts of Core
                                ├── Map
                                ├── Layers
                                ├── Legend
                                ├── Popup
                                ├── Selection
                                └── Tools
```

### 4.1 Composition root

`frontend/src/app/` é o único local responsável por montar a aplicação. Ele:

- lê a configuração validada;
- registra módulos importados explicitamente;
- conecta providers, shell e rotas;
- entrega contribuições dos módulos aos extension points.

Não haverá descoberta dinâmica de módulos no V1.

### 4.2 Core

`frontend/src/core/` contém comportamentos geográficos reutilizáveis e seus contratos públicos. O Core poderá depender de bibliotecas de infraestrutura, como MapLibre e TanStack Query, mas nunca de `modules/`.

O adaptador de mapa deverá encapsular lifecycle e operações recorrentes sem tentar reproduzir toda a API do MapLibre. Integrações especializadas poderão acessar uma capability controlada, quando necessário e documentado.

As medições de distância e área usam métodos explícitos do adaptador e GeoJSON temporário. Cálculo geodésico, formatação, estado React e apresentação MapLibre permanecem separados; nenhuma geometria de medição é enviada à API ou persistida.

### 4.3 Componentes

`frontend/src/components/` contém componentes compartilhados:

- `ui/`: componentes visuais sem semântica GIS;
- `gis/`: apresentações genéricas que consomem contratos do Core.

Componentes não deverão buscar dados diretamente se essa responsabilidade pertencer a um serviço ou hook de domínio do Core.

### 4.4 Módulos

`frontend/src/modules/` contém extensões compostas em build time. A Fase 6 consolidou o menor contrato necessário observado no Core:

```typescript
interface CatalogLayerContribution {
  layerId: string;
}

interface WebGisModule {
  id: string;
  version: string;
  layers?: readonly CatalogLayerContribution[];
  setup?: () => void | (() => void);
}
```

O módulo declara ownership por IDs do catálogo, sem duplicar `LayerDefinition`. O registro rejeita módulos ausentes ou duplicados e impede que dois módulos possuam a mesma camada. Setup ocorre na ordem da composição; cleanup, na ordem inversa.

`frontend/src/app/modules.ts` importa os módulos disponíveis. `app.config.ts` escolhe seus IDs habilitados. Remover `reference` da configuração elimina suas contribuições da interface e limpa o estado de seleção, sem editar Core, shell ou backend. Os dados persistidos podem permanecer dormentes no PostGIS.

Novos extension points serão adicionados somente quando uma aplicação derivada demonstrar necessidade concreta; navegação, painéis e ferramentas não foram antecipados.

### 4.5 Estado

- Estado local permanece no componente.
- Estado de servidor pertence ao TanStack Query.
- Estado de interação compartilhada pertence ao Zustand.
- Estado efêmero de uma ferramenta ativa, como medição, permanece no hook do mapa enquanto não houver consumidor externo.
- A instância do MapLibre não deverá ser serializada nem duplicada no store.
- O store guarda intenção da aplicação, como camada visível e seleção; o adaptador sincroniza essa intenção com o mapa.

## 5. Configuração

Existirão dois canais de configuração:

### 5.1 Configuração de produto

Versionada com a aplicação derivada e validada por schema:

- nome, logo e cores;
- mapa e extent inicial;
- basemaps;
- capacidades habilitadas;
- módulos registrados;
- defaults de interface.

### 5.2 Configuração de ambiente

Fornecida no deploy:

- URL/base path da API;
- credenciais e URL do banco;
- modo de execução;
- políticas de CORS e logging;
- segredos.

Segredos nunca poderão fazer parte da configuração enviada ao browser.

## 6. Backend

```text
HTTP route
   ▼
Application service
   ▼
Repository / spatial query
   ▼
PostGIS
```

Essa separação é uma direção, não uma exigência de uma classe por arquivo. Endpoints simples poderão chamar um serviço pequeno; repositories existirão quando isolarem acesso a dados ou queries espaciais relevantes.

Responsabilidades principais:

- `api/`: HTTP, status codes e serialização;
- `core/`: settings, conexão, logging e erros transversais;
- `schemas/`: contratos de entrada e saída;
- `services/`: casos de uso e políticas;
- `repositories/`: acesso ao catálogo e consultas espaciais;
- `models/`: mapeamento persistente quando necessário.

Toda requisição recebe um identificador de correlação validado ou gerado pela API. O middleware devolve esse valor em `X-Request-ID`, registra método, caminho, status e duração em JSON e converte exceções inesperadas em uma resposta HTTP 500 genérica que contém apenas o identificador público. Tracebacks permanecem restritos aos logs internos.

Alembic será a única fonte de verdade para migrations de schema da aplicação.

O papel de runtime é `NOSUPERUSER`, `NOCREATEDB`, `NOCREATEROLE`, `NOREPLICATION`, `NOBYPASSRLS` e `NOINHERIT`. Ele possui `USAGE` somente em `core` e nos schemas referenciados pelo catálogo, `SELECT` em `core.layers` e nas tabelas cadastradas, sem escrita, sequences ou criação de objetos. Identificadores provenientes do catálogo são escapados como identificadores SQL antes das concessões.

## 7. Catálogo e fluxo de dados

O catálogo transforma uma fonte PostGIS previamente cadastrada em uma `LayerDefinition` segura para o frontend.

```text
core.layers
   │ metadata + allowlist
   ▼
Layer API ──► LayerDefinition ──► Layer Manager / Map / Legend / Popup

Viewport bbox
   ▼
Feature API ──► bounded GeoJSON ──► Map source
```

O contrato inicial de feições deverá definir:

- `layer_id` opaco;
- `bbox` validada;
- limite máximo;
- campos publicáveis;
- `feature_id` estável;
- saída em `EPSG:4326`;
- indicação de truncamento.

Parâmetros externos nunca poderão determinar diretamente schema, tabela, coluna ou fragmento SQL.

`LayerDefinition` também é a fonte única de apresentação da camada. O contrato discrimina a simbologia por `kind` — inicialmente `fill` e `circle` — e publica grupo, ordem inicial, opacidade, campos do popup, metadados e atribuição. O Layer Manager, a legenda, o popup e o adaptador de mapa interpretam esse mesmo contrato; nenhum deles cria condicionais por identificador ou nome de camada.

Visibilidade, opacidade, ordem, estado de carregamento e seleção pertencem ao store compartilhado. TanStack Query mantém o GeoJSON de cada viewport como estado de servidor, enquanto o adaptador encapsula a sincronização dessas intenções com o MapLibre.

GeoJSON é suficiente para o primeiro contrato desde que o volume de referência e o limite de resposta sejam medidos. Vector tiles serão introduzidos quando medições ou um produto derivado comprovarem a necessidade; consulte [ADR-0002](adr/0002-entrega-espacial-inicial.md).

## 8. Estrutura alvo do repositório

```text
webgis-core/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── core/
│   │   ├── components/
│   │   ├── config/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── modules/
│   │   │   └── reference/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── stores/
│   │   └── types/
│   ├── tests/
│   ├── Dockerfile
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   ├── migrations/
│   ├── tests/
│   ├── Dockerfile
│   └── pyproject.toml
├── database/
│   ├── init/
│   └── seeds/
├── nginx/
├── docs/
│   ├── adr/
│   ├── ARCHITECTURE.md
│   └── IMPLEMENTATION_PLAN.md
├── docker-compose.yml
├── .env.example
└── README.md
```

Essa estrutura é a baseline, não um objetivo de criar diretórios vazios. Cada diretório deverá surgir somente quando possuir conteúdo real.

## 9. Regras de dependência

```text
modules ──► public core contracts
app     ──► core + modules + shared components
core    ──► shared components + infrastructure libraries
core    ──X modules
shared  ──X business modules
```

No backend, API não deverá conter query SQL. Models e repositories não deverão importar a camada HTTP.

## 10. Segurança e operação

O baseline inclui:

- API atrás do Nginx;
- banco sem exposição pública;
- usuário de consulta com privilégio mínimo;
- validação de todos os parâmetros espaciais;
- catálogo como allowlist;
- limites de resposta e rate limiting;
- erros públicos sem stacktrace;
- logs estruturados e request ID;
- health checks separados para processo e dependências.

O gateway aplica limites por endereço de origem antes da API: taxa e burst, conexões simultâneas, corpo máximo e timeouts. Respostas bloqueadas usam HTTP 429 em JSON, `Retry-After` e identificador próprio. Headers CSP, anti-framing, `nosniff`, referrer, permissions e isolamento cross-origin são emitidos com `always`, inclusive para respostas de erro. HSTS fica reservado ao perfil HTTPS de produção.

A CSP de desenvolvimento contém a exceção mínima necessária ao React Refresh do Vite. O perfil de produção deverá servir artefatos estáticos e remover `unsafe-inline`; aplicações derivadas precisam declarar na allowlist os hosts de basemap e demais integrações externas.

Autenticação não fará parte do V1, mas o shell e a API não deverão assumir que todo recurso será eternamente público.

## 11. Estratégia de testes

Prioridades:

1. contratos de configuração e camadas;
2. sincronização entre estado e mapa;
3. allowlist e limites das consultas espaciais;
4. fluxo PostGIS → API → mapa;
5. registro e remoção do módulo de referência;
6. smoke test do ambiente integrado.

Testes não deverão depender de detalhes internos do MapLibre quando puderem validar o contrato público.

## 12. Evolução esperada

- Uma segunda aplicação real determinará se o Core deve virar pacote versionado.
- Volume real determinará a adoção de MVT/Martin ou PMTiles.
- Necessidade de usuário determinará autenticação e autorização.
- Necessidade operacional determinará observabilidade e alta disponibilidade adicionais.
- Necessidade de cliente determinará edição, upload, análise espacial e processamento assíncrono.

## 13. Decisões registradas

- [ADR-0001 — Composição de módulos em build time](adr/0001-composicao-de-modulos.md)
- [ADR-0002 — GeoJSON limitado como entrega espacial inicial](adr/0002-entrega-espacial-inicial.md)
