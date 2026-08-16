# Geo Core

Fundação WebGIS open source para derivar aplicações geográficas por configuração e composição de módulos.

O projeto está em implementação incremental. A Fase 2 entrega o Application Shell configurável; MapLibre, mapa real e camadas pertencem às fases seguintes.

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
- centro e níveis de zoom futuros do mapa;
- visibilidade de sidebar, toolbar e status bar;
- seções genéricas habilitadas.

Configuração inválida interrompe a inicialização com erro explícito. Segredos e valores do ambiente de deploy não devem ser adicionados a esse arquivo.

## Documentação

- [PRD](geo-core-v1-prd.md)
- [Arquitetura](docs/ARCHITECTURE.md)
- [Plano de implementação](docs/IMPLEMENTATION_PLAN.md)
- [Decisões arquiteturais](docs/adr/)

## Estado

Consulte o gate ativo e as evidências em [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md).
