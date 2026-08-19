# AGENTS.md

## Projeto

Geo Core é uma fundação WebGIS derivável por configuração e composição explícita
de módulos. Preserve as fronteiras descritas em `docs/ARCHITECTURE.md` e registre o
avanço das fases em `docs/IMPLEMENTATION_PLAN.md`.

## Estrutura

- `frontend/`: React, TypeScript, Vite, MapLibre, TanStack Query e Zustand.
- `backend/`: FastAPI, SQLAlchemy, Alembic e acesso ao PostGIS.
- `database/`: inicialização do PostgreSQL/PostGIS.
- `nginx/`: gateway HTTP de desenvolvimento e produção.
- `scripts/`: smoke tests e rotinas operacionais.
- `docs/`: arquitetura, decisões, derivação e operação.

## Regras arquiteturais

- O Core não conhece entidades ou regras de negócio.
- Módulos dependem dos contratos públicos do Core; o Core não depende de módulos.
- A composição de módulos ocorre explicitamente em `frontend/src/app/`.
- Componentes genéricos não conhecem nomes físicos de schemas ou tabelas.
- A API somente consulta fontes e campos cadastrados no catálogo.
- Nunca monte identificadores ou fragmentos SQL diretamente com entrada externa.
- Estilo, legenda e popup devem derivar da mesma `LayerDefinition`.
- Use Alembic como única fonte de verdade para mudanças persistentes de schema.
- Não amplie contratos ou extension points sem um consumidor concreto.

## Desenvolvimento

Use Docker Compose para o ambiente integrado:

```bash
cp .env.example .env
docker compose up -d --build
```

O serviço `migrate` terminar com código `0` é esperado. Não exponha o PostGIS e não
entregue a credencial administrativa ao backend persistente.

## Verificações obrigatórias

Frontend:

```bash
cd frontend
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

Backend:

```bash
cd backend
ruff check .
ruff format --check .
pytest
```

Integração:

```bash
docker compose config --quiet
sh scripts/test-gateway.sh
```

Mudanças em produção, banco ou recuperação também devem executar:

```bash
docker compose --env-file .env.production.example -f docker-compose.prod.yml config --quiet
sh scripts/test-backup-restore.sh
```

## Produção e segurança

- Nunca versione `.env`, `.env.production`, dumps, checksums ou segredos.
- Use `docker-compose.prod.yml` para produção; ele não deve conter bind mounts de código.
- Mantenha o gateway em loopback quando houver um terminador HTTPS no host.
- Não reintroduza scripts inline ou WebSockets do Vite na CSP de produção.
- Preserve o usuário runtime não-root e somente leitura no PostGIS.
- Não execute `docker compose down -v` na stack de produção.
- Restauração destrutiva exige `--replace` e `RESTORE_CONFIRMATION` vinculada ao banco.
- Testes destrutivos devem usar projeto e volume Docker exclusivos e removê-los ao final.

## Disciplina de mudanças

- Não misture refactors não relacionados com a entrega atual.
- Atualize documentação e evidências quando um gate de fase avançar.
- Preserve mudanças preexistentes do usuário.
- Antes de commit, revise `git status`, `git diff` e execute os checks proporcionais ao risco.
- Mensagens de commit devem ser curtas, no formato convencional usado pelo histórico.
