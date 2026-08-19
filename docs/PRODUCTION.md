# Execução em produção

Esta baseline executa o frontend como arquivos estáticos no Nginx, mantém apenas a
API e o PostGIS como processos de aplicação e não publica o banco. O gateway escuta
em `127.0.0.1:8080` por padrão para ser colocado atrás do terminador HTTPS do host.

## Pré-requisitos

- Docker Engine com Docker Compose v2;
- um domínio apontado para o servidor;
- um proxy HTTPS no host ou na camada de infraestrutura;
- espaço persistente e monitorado para o volume do PostGIS.

O encerramento da configuração TLS é um gate separado da Fase 8. O procedimento
validado de recuperação está em [BACKUP_RESTORE.md](BACKUP_RESTORE.md). Não exponha
esta baseline à internet antes de configurar TLS e armazenar ao menos um backup fora
da VPS.

## Preparar o ambiente

Crie o arquivo local, que é ignorado pelo Git:

```bash
cp .env.production.example .env.production
```

Substitua `APP_ORIGIN` pelo endereço HTTPS final e gere duas senhas independentes.
O formato hexadecimal evita a necessidade de escapar caracteres nas URLs montadas
pelo Compose:

```bash
openssl rand -hex 32
openssl rand -hex 32
```

Valide o arquivo antes do primeiro start:

```bash
sh scripts/validate-production-env.sh
```

O validador rejeita o domínio de exemplo, senhas de exemplo, senhas curtas,
caracteres que precisariam de URL encoding e uma origem sem HTTPS.

## Construir e iniciar

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.prod.yml \
  up -d --build
```

O serviço `migrate` deve terminar com código `0`. Esse processo provisiona o papel
de leitura da API, aplica as migrations e recalcula os privilégios. Os demais
serviços usam `restart: unless-stopped`.

Confirme o estado e o fluxo HTTP local:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
curl -fsS http://127.0.0.1:8080/api/health
curl -fsS http://127.0.0.1:8080/api/layers
```

O frontend é compilado dentro da imagem `geo-core-gateway`. Não existem Vite,
bind mounts de código ou dependências de desenvolvimento na stack resultante. A
CSP de produção remove scripts inline e conexões WebSocket usadas pelo hot reload.

## Operação

Para acompanhar logs:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f
```

Para reconstruir após uma atualização do código:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.prod.yml \
  up -d --build --remove-orphans
```

Para encerrar preservando o volume do banco:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml down
```

Não use `down -v` em produção: essa opção remove o volume persistente do PostGIS.

## Fronteira HTTPS

Com `APP_BIND_ADDRESS=127.0.0.1`, somente processos do próprio host alcançam a
porta HTTP. O proxy HTTPS deverá:

- obter e renovar o certificado do domínio;
- redirecionar HTTP para HTTPS;
- encaminhar tráfego para `127.0.0.1:8080`;
- preservar `Host`, `X-Forwarded-For` e `X-Forwarded-Proto`;
- aplicar HSTS somente depois que o domínio e a renovação estiverem validados.

Essa configuração será validada no deploy da VPS alvo antes de o gate da V1 ser
considerado concluído.
