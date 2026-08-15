# PRD — Geo Core V1
## Fundação WebGIS open source derivável

**Versão:** 1.1  
**Status:** Planejamento revisado  
**Objetivo de execução:** Codex  
**Tipo de projeto:** Plataforma WebGIS open source reutilizável  
**Ambiente alvo:** VPS com Docker  
**Licenciamento desejado:** somente tecnologias open source

---

# 1. Visão do Produto

O **Geo Core V1** será uma fundação WebGIS genérica e reutilizável, criada para derivar futuras aplicações geográficas orientadas a diferentes problemas de negócio.

O objetivo inicial não é resolver um problema específico de geomarketing, agronegócio, mercado imobiliário ou qualquer outra vertical.

O objetivo é construir uma **casca funcional, configurável e tecnicamente bem estruturada**, capaz de receber módulos de negócio independentes sem exigir alterações profundas em seu núcleo.

O V1 não pretende ser um produto comercial completo, uma plataforma SaaS ou uma demonstração de alto impacto visual. Sua principal entrega é uma base de engenharia confiável, suficientemente funcional para provar seus contratos de extensão e permitir a criação recorrente de produtos geográficos.

A arquitetura deverá permitir evoluções como:

- GeoMarketing;
- análise de clientes;
- inteligência territorial;
- mercado imobiliário;
- agricultura e propriedades rurais;
- análise ambiental;
- telecomunicações;
- estudos territoriais;
- aplicações baseadas em dados públicos;
- outras soluções Location Intelligence.

O produto deverá ser executável e demonstrável mesmo sem qualquer módulo de negócio instalado. A demonstração deverá comprovar o funcionamento da fundação, e não simular uma solução vertical completa.

---

# 2. Princípio Fundamental

A arquitetura deve separar claramente:

```text
GEO CORE
   +
BUSINESS MODULE
   =
APPLICATION
```

Exemplos futuros:

```text
Geo Core
   +
GeoMarketing
   =
Market Intelligence App
```

```text
Geo Core
   +
Agro
   =
Farm Analysis App
```

O Geo Core não deverá conter regras específicas de nenhum desses negócios.

No V1, módulos serão compostos **em build time**, por meio de contratos TypeScript explícitos. Não haverá descoberta dinâmica, marketplace ou carregamento remoto de plugins.

---

# 3. Objetivos do V1

O Geo Core V1 deverá entregar uma aplicação WebGIS funcional contendo:

- interface moderna;
- mapa interativo;
- gerenciamento de camadas;
- legenda;
- popup;
- seleção simples de feições;
- informações do mapa;
- ferramentas GIS básicas;
- backend geoespacial;
- banco PostGIS;
- containerização;
- deploy em VPS;
- arquitetura preparada para extensão futura.

O principal resultado do V1 deverá ser a facilidade de derivação. A fundação deverá permitir:

- alterar nome, marca, cores e extent inicial sem editar componentes internos;
- adicionar uma camada configurada sem alterar Layer Manager, legenda ou popup;
- registrar um painel ou ferramenta externa sem modificar internamente o Application Shell;
- substituir dados de referência por dados de um cliente sem reestruturar frontend e backend;
- manter regras específicas de negócio fora do Core.

O V1 deverá ser suficientemente completo para ser utilizado como:

1. demonstração;
2. portfólio;
3. template;
4. base para novos produtos;
5. ponto inicial para módulos de negócio.

O V1 será distribuído inicialmente como um monorepo executável. Não haverá compromisso de publicação do Core como pacote independente antes de existir uma segunda aplicação real que justifique essa extração.

---

# 4. O que NÃO é objetivo do V1

O V1 deliberadamente não deverá implementar funcionalidades específicas ou que ainda não possuam necessidade de negócio comprovada.

Ficam fora do escopo inicial:

- geocoding;
- roteamento;
- drive time;
- upload de shapefile;
- upload de GeoPackage;
- upload de KML;
- processamento raster;
- processamento de imagens;
- filas assíncronas;
- Redis;
- Celery;
- microserviços;
- GeoServer;
- PMTiles;
- autenticação complexa;
- organizações;
- multi-tenant;
- cobrança;
- dashboards de negócio;
- modelos de IA;
- análise espacial avançada;
- edição avançada de geometrias;
- módulos de geomarketing;
- módulos de agricultura;
- módulos imobiliários.
- sistema de plugins em runtime;
- marketplace de extensões;
- publicação de pacotes npm ou Python;
- aplicação SaaS pronta para comercialização;
- paridade funcional entre desktop e mobile;
- otimização prematura para milhões de feições ou alta concorrência.

Essas funcionalidades deverão ser tratadas como **evoluções ou módulos futuros**, e não incorporadas prematuramente ao Core.

O suporte conceitual a novas fontes de dados não implica implementá-las no V1. O primeiro contrato de entrega espacial será GeoJSON consultado por viewport e com limites explícitos. Vector tiles serão avaliados quando um caso real ultrapassar esse contrato.

---

# 5. Stack Tecnológica

## Frontend

```text
React
TypeScript
Vite
MapLibre GL JS
Zustand
TanStack Query
Tailwind CSS
shadcn/ui
```

### Responsabilidades

React deverá controlar a aplicação e seus componentes.

TypeScript deverá ser obrigatório.

MapLibre GL JS será o motor cartográfico.

Zustand deverá controlar estado global relacionado principalmente ao mapa e interface.

TanStack Query deverá gerenciar comunicação e cache de dados provenientes da API.

Tailwind e shadcn/ui deverão fornecer a base visual da aplicação.

---

# 6. Backend

Stack:

```text
Python
FastAPI
SQLAlchemy
Pydantic
Alembic
```

Responsabilidades:

- configuração da aplicação;
- acesso ao banco;
- catálogo de camadas;
- consulta de dados;
- informações de feições;
- endpoints GIS básicos;
- health checks;
- futura integração com módulos de negócio.

---

# 7. Banco Geoespacial

Utilizar:

```text
PostgreSQL
+
PostGIS
```

O PostGIS será o datastore espacial principal.

O banco deverá ser preparado desde o início para:

- geometrias;
- índices espaciais;
- consultas espaciais;
- metadados de camadas;
- estilos;
- futuras entidades dos módulos.

---

# 8. Arquitetura de Deploy

A aplicação deverá rodar em containers Docker.

Arquitetura inicial:

```text
                    INTERNET
                        │
                     HTTPS
                        │
                      NGINX
                        │
          ┌─────────────┴─────────────┐
          │                           │
      FRONTEND                       API
 React + TypeScript               FastAPI
                                      │
                                      │
                                 PostgreSQL
                                  + PostGIS
```

Somente Nginx deverá possuir exposição pública.

PostgreSQL não deverá ser exposto diretamente à internet.

FastAPI deverá ser acessado externamente somente através do reverse proxy.

---

# 9. Estrutura Principal do Repositório

Criar um monorepo simples:

```text
geo-core/
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── core/
│   │   ├── components/
│   │   ├── modules/
│   │   └── config/
│   ├── public/
│   ├── tests/
│   ├── Dockerfile
│   └── package.json
│
├── backend/
│   ├── app/
│   ├── tests/
│   ├── Dockerfile
│   └── pyproject.toml
│
├── database/
│   ├── init/
│   └── seeds/
│
├── nginx/
│   └── nginx.conf
│
├── docs/
│   ├── adr/
│   ├── ARCHITECTURE.md
│   └── IMPLEMENTATION_PLAN.md
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

Não criar microserviços separados no V1.

As migrations do banco serão de responsabilidade do Alembic no backend. O diretório `database/` deverá conter apenas inicialização da instância PostGIS e dados de referência, evitando duas fontes de verdade para evolução do schema.

---

# 10. Arquitetura Frontend

Estrutura desejada:

```text
frontend/src/

├── app/
│   ├── App.tsx
│   ├── registry.ts
│   └── composition.ts
│
├── core/
│   ├── map/
│   ├── layers/
│   ├── legend/
│   ├── popup/
│   ├── selection/
│   └── tools/
│
├── components/
│   ├── ui/
│   └── gis/
│
├── modules/
│   └── reference/
│
├── layouts/
├── config/
├── hooks/
├── services/
├── stores/
├── types/
└── pages/
```

A separação entre:

```text
core
components
business modules
```

deverá ser preservada.

Responsabilidades:

- `app/`: composition root; conecta configuração, Core e módulos registrados;
- `core/`: capacidades geográficas reutilizáveis, sem regra de negócio;
- `components/`: componentes visuais compartilhados;
- `modules/`: consumidores dos contratos públicos do Core;
- `config/`: branding, mapa inicial, basemaps e feature flags da aplicação derivada.

O módulo `reference` existirá apenas para provar o contrato de extensão e poderá ser removido sem afetar o Core.

---

# 11. Application Shell

A interface deverá possuir aparência de plataforma GIS profissional.

Layout inicial:

```text
┌───────────────────────────────────────────────────────────┐
│ LOGO / Geo Core             Projeto          Tema / Menu │
├─────────────┬─────────────────────────────────────────────┤
│             │                                             │
│ SIDEBAR     │                                             │
│             │                                             │
│ Camadas     │                                             │
│ Legenda     │                  MAPA                       │
│             │                                             │
│             │                                             │
│             │                              TOOLBAR        │
│             │                                             │
├─────────────┴─────────────────────────────────────────────┤
│ Coordenadas │ Escala │ Zoom │ Informações                │
└───────────────────────────────────────────────────────────┘
```

Componentes:

- Header;
- Sidebar;
- MapViewport;
- FloatingToolbar;
- BottomStatusBar;
- Drawer;
- Modal;
- Tooltip;
- Notification/Toast;
- Loading state;
- Error state.

---

# 12. Tema

O V1 deverá possuir um tema visual consistente. Light Mode será o baseline.

Dark Mode poderá ser implementado na Fase 7 após o fluxo central estar validado. Quando implementado, a escolha deverá persistir localmente e os controles cartográficos deverão acompanhar o tema.

---

# 13. Responsividade

Prioridades:

```text
Desktop    obrigatório
Notebook   obrigatório
Tablet     funcional
Mobile     consulta funcional
```

No mobile, a sidebar poderá se transformar em Drawer.

Nenhum componente crítico deverá depender exclusivamente de resolução desktop.

---

# 14. Map Core

Criar uma abstração específica para o mapa.

Evitar que componentes da aplicação manipulem MapLibre de maneira espalhada.

Estrutura sugerida:

```text
MapCore
├── initialize()
├── destroy()
├── setCenter()
├── setZoom()
├── fitBounds()
├── addLayer()
├── removeLayer()
├── setLayerVisibility()
├── setLayerOpacity()
├── selectFeature()
└── clearSelection()
```

O objetivo é manter o restante da aplicação desacoplado da implementação específica do MapLibre.

A abstração deverá cobrir apenas capacidades usadas pela aplicação. Ela não deverá tentar reproduzir toda a API do MapLibre nem impedir acesso controlado à instância quando uma integração cartográfica realmente o exigir.

---

# 15. Configuração Central

Criar:

```text
app.config.ts
```

Exemplo conceitual:

```typescript
export const appConfig = {
  app: {
    name: "Geo Core",
    description: "Open Source WebGIS Foundation",
    logo: "/brand/logo.svg"
  },

  branding: {
    primaryColor: "#2563eb"
  },

  map: {
    center: [-46.63, -23.55],
    zoom: 10,
    minZoom: 2,
    maxZoom: 20
  },

  ui: {
    sidebar: true,
    legend: true,
    coordinates: true,
    scale: true,
    themeSwitcher: true
  },

  tools: {
    measurement: true,
    fullscreen: true
  }
}
```

Essa configuração deverá facilitar futuras aplicações derivadas.

A configuração deverá possuir schema validável, tipo TypeScript e versão explícita. Configurações inválidas deverão falhar de forma clara durante o desenvolvimento, em vez de produzir erros silenciosos na interface.

No V1, branding e capacidades serão definidos em build time. Valores que dependam do ambiente de deploy, como URL da API, deverão ser separados da configuração de produto.

---

# 16. Basemaps

Criar um Basemap Manager.

O fluxo central do V1 deverá suportar pelo menos um basemap open source. Um segundo estilo claro ou escuro será avaliado na Fase 7.

A implementação não deverá amarrar a aplicação a um provedor pago.

O Basemap Manager deverá permitir futuras fontes adicionais.

Todo basemap deverá declarar atribuição, termos de uso e limites aplicáveis. A existência de um endpoint público de tiles não implica permissão para uso irrestrito em produção.

---

# 17. Layer Manager

O Layer Manager será um dos principais componentes do Core.

Exemplo visual:

```text
CAMADAS

▾ Limites administrativos
   ☑ Estados
   ☑ Municípios

▾ Referências
   ☑ Rodovias
   ☐ Pontos

MAPA BASE

● OpenStreetMap
○ Claro
○ Escuro
```

Funcionalidades obrigatórias:

- agrupamento;
- expandir/recolher grupos;
- ativar/desativar;
- alterar ordem;
- opacidade;
- acesso aos metadados;
- identificação do tipo de camada;
- integração automática com legenda.

---

# 18. Modelo Genérico de Layer

Definir interface TypeScript para Layer.

Exemplo conceitual:

```typescript
interface LayerDefinition {
  id: string
  title: string
  description?: string
  groupId?: string
  attribution?: string

  source: {
    type: "geojson" | "vector"
    url?: string
    sourceLayer?: string
  }

  geometryType?: string
  featureIdField: string

  visible: boolean
  opacity: number

  minZoom?: number
  maxZoom?: number

  selectable?: boolean
  popup?: boolean
  legend?: boolean

  style?: LayerStyleDefinition
  popupConfig?: PopupConfiguration
}
```

Não criar modelos de camada específicos de negócio.

O contrato deverá distinguir propriedades de apresentação, capacidades e fonte de dados. `featureIdField` é obrigatório para permitir seleção e highlight estáveis. Os formatos efetivamente suportados no V1 deverão ser documentados; a presença de `vector` no contrato não obriga sua entrega pela API inicial.

---

# 19. Layer Groups

Camadas deverão poder pertencer a grupos.

Exemplo:

```text
Limites administrativos

├── Estados
├── Municípios
└── Distritos
```

O Layer Manager deverá interpretar os grupos dinamicamente.

---

# 20. Legend Engine

A legenda não deverá ser escrita diretamente na UI para cada camada.

Deverá existir estrutura genérica capaz de interpretar metadados de estilo.

Tipos iniciais:

- símbolo único;
- categórico;
- intervalos numéricos.

A legenda deverá ser exibida somente para camadas visíveis.

---

# 21. Feature Popup

Criar um componente genérico:

```text
FeaturePopup
```

Ele deverá receber configuração e atributos.

Exemplo:

```text
Município
──────────────
Nome: Campinas
UF: SP
População: ...
Área: ...
```

Nenhum campo específico deverá ficar hardcoded no componente.

O popup deverá poder futuramente ser customizado por módulo.

---

# 22. Feature Highlight

Ao clicar em uma feição:

1. identificar a feição;
2. armazenar seleção no estado;
3. destacar visualmente;
4. abrir popup.

Ao limpar seleção:

- remover highlight;
- fechar popup.

---

# 23. Seleção Básica

Implementar inicialmente:

- clique em uma feição;
- seleção única;
- highlight;
- limpar seleção.

Seleções múltiplas e seleção por polígono ficam fora do V1.

---

# 24. Ferramentas Cartográficas

Ferramentas obrigatórias do fluxo central:

- Zoom In;
- Zoom Out;
- Home / Default Extent;
- Fullscreen;

Ferramentas candidatas para a Fase 7:

- Measure Distance;
- Measure Area.

Ferramentas devem ser independentes da regra de negócio.

---

# 25. Barra de Status

Mostrar dinamicamente:

```text
Longitude
Latitude
Zoom
Escala aproximada
```

Exemplo:

```text
-46.6321 | -23.5504 | Zoom 12 | 1:25.000
```

---

# 26. Search

Busca simples de elementos da própria aplicação poderá ser implementada na Fase 7 caso continue prioritária após a validação do fluxo central.

O V1 não deverá depender de serviço de geocoding.

Pode incluir busca por:

- nome de camada;
- feições presentes nos dados de demonstração.

Geocoding externo ficará para uma evolução.

---

# 27. Extension Points

Esse é um requisito arquitetural obrigatório.

A interface deverá possuir locais reservados para módulos futuros.

Exemplos:

```text
SidebarExtension
ToolbarExtension
RightPanelExtension
BottomPanelExtension
MapOverlayExtension
```

Não criar um sistema completo de plugins.

Os módulos serão importados explicitamente pelo composition root e registrados em build time. O contrato mínimo deverá permitir contribuir com:

- identificação e versão do módulo;
- itens de navegação;
- painéis;
- ferramentas de mapa;
- camadas opcionais;
- inicialização e limpeza quando necessárias.

O objetivo é garantir que módulos futuros possam ser adicionados sem alterar internamente o Application Shell. O V1 deverá conter um módulo de referência mínimo para provar esse contrato, sem regra de negócio real.

---

# 28. Separação Core x Business

Nenhum componente do V1 deverá se chamar:

```text
CustomerPanel
FarmPanel
PropertyPanel
MarketPanel
```

Somente componentes genéricos.

Exemplo correto:

```text
LayerPanel
FeaturePanel
MapTool
DataPanel
```

Componentes específicos somente deverão surgir dentro das futuras aplicações verticais.

---

# 29. Backend — Estrutura

```text
backend/app/

├── main.py

├── api/
│   ├── health.py
│   ├── layers.py
│   └── features.py

├── core/
│   ├── config.py
│   ├── database.py
│   └── logging.py

├── models/
├── schemas/
├── repositories/
└── services/
```

Utilizar separação entre:

```text
route
service
repository
database
```

Evitar queries SQL diretamente dentro dos endpoints.

---

# 30. API Inicial

Implementar:

```text
GET /api/health
```

Resposta:

```json
{
  "status": "ok"
}
```

Implementar:

```text
GET /api/layers
```

Responsável pelo catálogo de camadas.

Implementar:

```text
GET /api/layers/{layer_id}
```

Retorna metadados da camada.

Implementar:

```text
GET /api/layers/{layer_id}/features
```

Retorna dados espaciais simples para a camada em GeoJSON.

O endpoint deverá:

- exigir ou aceitar uma `bbox` válida;
- possuir limite máximo de feições e tamanho de resposta;
- retornar apenas campos permitidos no catálogo;
- usar uma identificação estável por feição;
- declarar o CRS de saída, que será `EPSG:4326` no V1;
- informar claramente quando o limite for atingido;
- rejeitar layer IDs, nomes de tabela e filtros não cadastrados.

Paginação genérica, query livre e filtros arbitrários ficam fora do V1.

---

# 31. Banco — Schema Core

Criar schema:

```sql
core
```

Inicialmente:

```text
core.layers
core.layer_styles
```

## core.layers

Campos sugeridos:

```text
id
name
title
description
source_type
source_schema
source_table
geometry_column
feature_id_column
geometry_type
srid
visible_default
min_zoom
max_zoom
selectable
attribution
created_at
updated_at
```

Schema, tabela, coluna geométrica, coluna identificadora e campos publicáveis deverão ser cadastrados e validados. Nenhum identificador SQL deverá ser aceito diretamente de parâmetros fornecidos pelo cliente da API.

---

# 32. Dados de Demonstração

Adicionar um conjunto pequeno de dados públicos suficiente para validar os contratos do WebGIS.

Sugestão inicial:

```text
Estados brasileiros
Municípios de uma região ou UF
Pontos de demonstração
```

Preferencialmente utilizar dados oficiais públicos.

Os dados deverão possibilitar validação de:

- Point;
- Polygon;
- simbologia;
- popup;
- legenda;
- Layer Manager.

Os dados de referência não constituirão um módulo de negócio. Fonte, licença, data de obtenção e atribuição deverão ser documentadas e reproduzíveis.

---

# 33. Docker

Criar containers:

```text
frontend
backend
database
nginx
```

Executar todo ambiente local através de:

```bash
docker compose up -d
```

A aplicação deverá funcionar sem instalação manual de dependências no host.

---

# 34. Configuração por Environment

Criar:

```text
.env.example
```

Variáveis mínimas:

```text
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
DATABASE_URL

API_HOST
API_PORT

FRONTEND_URL

APP_ENV
APP_NAME
```

Nenhum segredo deverá ser versionado.

---

# 35. Nginx

Nginx deverá:

```text
/          → frontend
/api       → FastAPI
```

Posteriormente poderá receber:

```text
/tiles
```

caso Martin seja adicionado.

---

# 36. Segurança Inicial

Implementar pelo menos:

- banco não exposto;
- API atrás do Nginx;
- CORS configurável;
- variáveis sensíveis via environment;
- validação Pydantic;
- proteção contra query livre;
- limites de resposta;
- usuário de banco com privilégios mínimos para a API;
- rate limiting básico no ponto de entrada público;
- headers HTTP de segurança adequados;
- tratamento de erros sem stacktrace público.

Autenticação ficará fora do V1.

---

# 37. Logging

Backend deverá utilizar logging estruturado.

Registrar pelo menos:

```text
timestamp
level
request
route
status
duration
error
```

Evitar `print()` em produção.

---

# 38. Health Checks

Criar checks para:

```text
API
PostgreSQL
```

Docker Compose deverá utilizar healthchecks quando possível.

---

# 39. Error Handling

Frontend deverá possuir:

- Error Boundary;
- mensagens amigáveis;
- fallback visual;
- toast para erros de operação.

Backend deverá possuir handler global de exceções.

---

# 40. Estado Frontend

Utilizar Zustand para dados como:

```text
activeBasemap
visibleLayers
layerOrder
layerOpacity
selectedFeature
activeTool
sidebarState
theme
```

Evitar estado global para valores puramente locais de componentes.

---

# 41. Server State

Utilizar TanStack Query para:

```text
layers
layer metadata
features
health
```

Configurar:

- cache;
- loading;
- error;
- refetch control.

---

# 42. Qualidade de Código

Frontend:

```text
ESLint
Prettier
TypeScript strict mode
```

Backend:

```text
Ruff
Pytest
type hints
```

Nenhum PR deverá aceitar erros de lint.

---

# 43. Testes

## Frontend

Criar testes para componentes críticos:

- Layer Manager;
- Map configuration;
- Zustand stores;
- Legend;
- Popup.

Utilizar:

```text
Vitest
React Testing Library
```

## Backend

Utilizar:

```text
Pytest
```

Criar testes para:

- health;
- layers;
- validações;
- database connectivity;
- layer metadata.

---

# 44. E2E

Adicionar Playwright para pelo menos um fluxo:

```text
abre aplicação
→ mapa aparece
→ camada é habilitada
→ usuário clica em feição
→ popup aparece
```

---

# 45. Documentação

Criar:

```text
docs/
```

Arquivos iniciais:

```text
ARCHITECTURE.md
IMPLEMENTATION_PLAN.md
DEVELOPMENT.md
DEPLOYMENT.md
GIS_CORE.md
EXTENDING.md
adr/
```

---

# 46. README

README deverá explicar:

- objetivo;
- arquitetura;
- tecnologias;
- requisitos;
- execução local;
- configuração;
- Docker;
- screenshots;
- estrutura;
- como adicionar uma camada;
- como criar um módulo futuro.

---

# 47. Definition of Done — Geo Core V1

O V1 será considerado concluído quando:

### Fundação executável

- [ ] um clone limpo subir integralmente por Docker Compose;
- [ ] frontend, API, PostGIS e Nginx possuírem health checks adequados;
- [ ] build de produção funcionar sem dependências instaladas no host;
- [ ] configuração e segredos estiverem separados e documentados.

### Derivação

- [ ] nome, logo, cores e extent inicial puderem ser alterados por configuração;
- [ ] uma camada puder ser adicionada sem editar Layer Manager, legenda ou popup;
- [ ] uma segunda camada de outro tipo reutilizar os mesmos componentes genéricos;
- [ ] um módulo de referência registrar painel ou ferramenta sem modificar internamente o Application Shell;
- [ ] remover o módulo de referência não afetar o funcionamento do Core;
- [ ] nenhuma regra de negócio existir dentro do Core.

### Fluxo GIS de referência

- [ ] MapLibre e ao menos um basemap com atribuição estiverem operacionais;
- [ ] uma camada sair do PostGIS, passar pela API e ser renderizada no mapa;
- [ ] Layer Manager suportar grupos, visibilidade, ordem e opacidade;
- [ ] estilo e legenda utilizarem a mesma configuração de origem;
- [ ] popup genérico, seleção e highlight funcionarem por identidade estável;
- [ ] coordenadas, escala, home e fullscreen funcionarem;
- [ ] estados de loading, vazio e erro forem apresentados corretamente.

### Qualidade

- [ ] contratos centrais do frontend e endpoints principais possuírem testes;
- [ ] ao menos um fluxo ponta a ponta estiver automatizado;
- [ ] lint, type checking e testes passarem em CI;
- [ ] limites de consulta, validações e privilégios mínimos estiverem aplicados;
- [ ] documentação explicar execução, arquitetura, cadastro de camada e derivação de aplicação.

Light/Dark Mode, medições, busca, basemaps adicionais e refinamento mobile são objetivos posteriores ao fluxo central e não bloqueiam a validação inicial da fundação.

---

# 48. Fases de Implementação

Cada fase deverá terminar em um resultado verificável e somente avançará após revisão do gate correspondente. O checklist operacional detalhado está em `docs/IMPLEMENTATION_PLAN.md`.

## Fase 0 — Especificação e arquitetura

Revisar o PRD, documentar fronteiras, estrutura do repositório, decisões iniciais e plano de execução. Nenhum código de aplicação será criado.

## Fase 1 — Bootstrap executável

Inicializar Git, frontend, backend, PostGIS, Nginx, Docker Compose, environment, lint e testes mínimos.

Gate: um clone limpo sobe por Docker Compose e frontend, API e banco respondem.

## Fase 2 — Application Shell

Criar shell, configuração de branding, mapa ainda vazio, estados básicos e responsividade desktop-first.

Gate: branding e elementos habilitados mudam por configuração, sem editar componentes internos.

## Fase 3 — Map Core

Integrar MapLibre, mapa inicial configurável, basemap, home, fullscreen, escala e coordenadas.

Gate: o mapa funciona e sua instância não é manipulada de forma espalhada pela aplicação.

## Fase 4 — Primeira camada ponta a ponta

Implementar schema mínimo, dado de referência, catálogo, consulta GeoJSON por viewport, renderização, clique, seleção, highlight e popup.

Gate: uma feição percorre PostGIS, API e frontend por um contrato explícito e testado.

## Fase 5 — Sistema genérico de camadas

Generalizar grupos, visibilidade, ordem, opacidade, estilo, legenda, metadados e popup configurável. Adicionar uma segunda camada para validar o contrato.

Gate: a segunda camada não exige alterações nos componentes genéricos.

## Fase 6 — Prova de derivação

Implementar o registro em build time e um módulo de referência mínimo.

Gate: o módulo adiciona uma contribuição e pode ser removido sem alterar o Core ou o shell.

## Fase 7 — Ferramentas e acabamento

Avaliar e implementar, conforme prioridade, medição, segundo basemap, Light/Dark Mode, busca e refinamento responsivo.

## Fase 8 — Qualidade e entrega

Concluir CI, testes, logs, segurança, documentação, build de produção, deploy em VPS, HTTPS, volumes, restart policy, backup e teste de restauração.

---

# 49. Evoluções Futuras

Após estabilização do Geo Core V1, poderão surgir módulos independentes.

## GeoMarketing

Possíveis capacidades:

- clientes;
- concorrentes;
- potencial;
- segmentação;
- áreas de influência;
- indicadores territoriais.

## Agro

Possíveis capacidades:

- fazendas;
- talhões;
- desenho;
- culturas;
- produtividade;
- imagens;
- indicadores agrícolas.

## Real Estate

Possíveis capacidades:

- imóveis;
- empreendimentos;
- expansão urbana;
- concorrência;
- mercado.

## Platform V2

Possíveis funcionalidades:

- autenticação;
- usuários;
- workspaces;
- permissões;
- upload de datasets;
- catálogo de dados;
- vector tiles;
- Martin;
- PMTiles;
- edição avançada;
- processamento assíncrono;
- análise espacial;
- dashboards;
- IA.

Nenhuma dessas funcionalidades deverá ser antecipada sem necessidade real.

---

# 50. Princípios de Engenharia

O Codex deverá seguir estes princípios durante todo o desenvolvimento.

### 1. Core genérico

Não introduzir regras de negócio específicas no `core`.

### 2. Configuration over hardcode

Basemaps, layers, styles e recursos deverão ser configuráveis sempre que razoável.

### 3. Componentização

Componentes devem possuir responsabilidade clara.

### 4. Sem abstração prematura

Não criar frameworks internos complexos sem necessidade real.

### 5. Sem microserviços prematuros

Manter frontend, backend e datastore simples.

### 6. Open Source First

Não introduzir dependência obrigatória de:

- ArcGIS;
- Mapbox;
- Google Maps;
- Databricks;
- serviços SaaS pagos.

### 7. Production-minded

Mesmo o V1 deve possuir:

```text
Docker
logs
health
tests
config
documentation
error handling
```

### 8. Extensibilidade

Novos módulos devem poder aparecer sem desmontar o Geo Core.

### 9. UX importa

O produto deverá ser coerente, utilizável e possuir estados completos de interação, não apenas expor controles técnicos do MapLibre. Polimento comercial avançado não é objetivo do V1.

### 10. Não construir funcionalidade sem requisito

Toda funcionalidade relevante deverá responder a uma necessidade concreta.

---

# 51. Resultado Esperado

Ao final do projeto deverá existir algo que possa ser descrito da seguinte maneira:

> **Geo Core é uma fundação WebGIS open source reutilizável criada para acelerar o desenvolvimento de produtos baseados em inteligência geográfica. O Core fornece mapa, gerenciamento de camadas, interação geográfica, infraestrutura e componentes de interface, permitindo que novas aplicações sejam derivadas por configuração e pela incorporação de módulos específicos de negócio.**

A demonstração deverá funcionar mesmo sem qualquer módulo vertical.

O objetivo não é criar apenas um mapa na web nem antecipar uma plataforma completa.

O objetivo é possuir uma **fundação própria para criação recorrente de produtos geográficos**.

---

# 52. Instrução Inicial para o Codex

Antes de implementar qualquer funcionalidade:

1. Leia integralmente este PRD.
2. Leia `docs/ARCHITECTURE.md` e os ADRs aplicáveis.
3. Consulte o gate atual em `docs/IMPLEMENTATION_PLAN.md`.
4. Confirme que a mudança pertence à fase ativa.
5. Documente decisões técnicas relevantes sem transformar preferências triviais em ADRs.
6. Atualize o checklist de execução com evidências verificáveis.
7. Implemente uma fase de cada vez.
8. Não implemente recursos das fases futuras antecipadamente.
9. Não introduza dependências proprietárias.
10. Preserve rigorosamente a separação entre `Geo Core`, composition root e futuros `Business Modules`.

A primeira meta técnica deverá ser:

```text
git clone
↓
cp .env.example .env
↓
docker compose up -d
↓
abrir navegador
↓
Geo Core funcionando
```

A primeira meta de produto deverá ser:

> Ao executar e inspecionar o Geo Core, um desenvolvedor deve identificar uma fundação WebGIS funcional, compreensível e pronta para derivar novos produtos geográficos sem reestruturação ampla.
