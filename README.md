# Geo Core

Fundação WebGIS open source para derivar aplicações geográficas por configuração e composição de módulos.

O projeto está em implementação incremental. A Fase 7 adiciona ferramentas genéricas e configuráveis de medição de distância e área sobre o mapa, preservando a composição modular comprovada na fase anterior.

## Requisitos

- Git;
- Docker com Docker Compose v2.

Não é necessário instalar Node.js, Python ou PostgreSQL no host para executar o ambiente integrado.

> A imagem oficial `postgis/postgis` usada nesta baseline publica arquitetura AMD64. Em Apple Silicon, o Docker Desktop executa esse container por emulação, configurada por `POSTGIS_PLATFORM` no `.env`.

## Execução local

```bash
cp .env.example .env
docker compose up -d --build
```

Acesse:

- aplicação: <http://localhost:8080>;
- health da API: <http://localhost:8080/api/health>;
- documentação OpenAPI: <http://localhost:8080/api/docs>.

Na inicialização, o backend executa `alembic upgrade head`. A primeira migration cadastra e carrega os 39 municípios da Região Metropolitana de São Paulo a partir de um snapshot público do IBGE versionado no repositório.

O painel de camadas permite controlar visibilidade, opacidade e ordem. Definições de grupo, estilo, campos do popup, metadados e atribuição vêm do catálogo da API; os componentes não conhecem os nomes das camadas ou tabelas.

A toolbar permite medir distâncias e áreas por cliques no mapa. O desenho e o resultado são temporários, calculados no browser sobre a esfera terrestre e nunca persistidos no PostGIS. Use **Recomeçar medição**, **Encerrar medição** ou a tecla `Esc` para limpar a ferramenta.

Para acompanhar os serviços:

```bash
docker compose ps
docker compose logs -f
```

Para encerrar sem remover os dados do PostGIS:

```bash
docker compose down
```

Ao alterar dependências do frontend durante o desenvolvimento, sincronize o volume local antes de reiniciar o serviço:

```bash
docker compose run --rm frontend npm ci
docker compose up -d frontend nginx
```

## Verificações

Frontend, dentro do container:

```bash
docker compose exec frontend npm run lint
docker compose exec frontend npm run format:check
docker compose exec frontend npm test
docker compose exec frontend npm run build
```

Backend, dentro do container:

```bash
docker compose exec backend ruff check .
docker compose exec backend ruff format --check .
docker compose exec backend pytest
```

## Estrutura atual

```text
frontend/       React + TypeScript + Vite
backend/        FastAPI + SQLAlchemy + Alembic
database/       inicialização do PostGIS e futuros dados de referência
nginx/          reverse proxy local
docs/           arquitetura, ADRs e plano de implementação
```

## Configuração da aplicação

A configuração de produto fica em `frontend/src/config/app.config.ts` e é validada por Zod na inicialização. Ela controla:

- nome, sigla, descrição e logo;
- cores primária e de destaque;
- centro, zoom e extensão inicial do mapa;
- basemap, atribuição e referência aos termos de uso;
- visibilidade de sidebar, toolbar e status bar;
- seções genéricas habilitadas;
- módulos habilitados no produto;
- disponibilidade independente das medições de distância e área.

Os módulos disponíveis são registrados em `frontend/src/app/modules.ts`. O módulo `reference` possui os dois IDs de camada do IBGE; remover `reference` da lista `modules` da configuração retira essas camadas da interface sem apagar seus dados persistidos.

Configuração inválida interrompe a inicialização com erro explícito. Segredos e valores do ambiente de deploy não devem ser adicionados a esse arquivo.

### Basemap padrão

O basemap CARTO Positron está configurado para desenvolvimento e demonstração, com atribuição visível a CARTO e OpenStreetMap. Ele não deve ser tratado como infraestrutura de produção garantida: aplicações derivadas precisam revisar licenciamento, capacidade e termos compatíveis com o tráfego esperado.

Antes de entregar uma aplicação derivada em produção, avalie o volume previsto e configure um provedor compatível ou tiles próprios. A URL, a atribuição e os termos ficam centralizados em `map.basemap`; não os espalhe pelos componentes.

## Documentação

- [PRD](geo-core-v1-prd.md)
- [Arquitetura](docs/ARCHITECTURE.md)
- [Plano de implementação](docs/IMPLEMENTATION_PLAN.md)
- [Dados de referência](docs/DATASETS.md)
- [Como derivar e criar módulos](docs/DERIVATION.md)
- [Decisões arquiteturais](docs/adr/)

## Estado

Consulte o gate ativo e as evidências em [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md).
