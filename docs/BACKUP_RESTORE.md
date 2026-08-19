# Backup e restauração do PostGIS

O backup do Geo Core é um arquivo lógico produzido por `pg_dump` no formato
customizado. Ele fica fora do volume Docker, acompanha um checksum SHA-256 e não
inclui ownership ou ACLs. O serviço de migration recria o papel runtime e seus
privilégios após a restauração.

## Premissas

- a stack de produção está configurada e o serviço `database` está saudável;
- `.env.production` passou por `scripts/validate-production-env.sh`;
- o diretório de destino não está dentro do volume do PostGIS;
- há espaço livre para o dump e para sua futura restauração;
- a cópia externa será criptografada e terá acesso restrito.

## Gerar um backup

Por padrão, os arquivos são gravados em `backups/`, diretório ignorado pelo Git:

```bash
sh scripts/backup-postgis.sh
```

Para usar um caminho persistente fora do checkout:

```bash
BACKUP_DIR=/var/backups/geo-core \
  sh scripts/backup-postgis.sh /caminho/seguro/.env.production
```

O script:

1. valida o ambiente de produção;
2. confirma que o container do banco está em execução;
3. executa `pg_dump --format=custom --no-owner --no-acl`;
4. valida o índice do arquivo com `pg_restore --list`;
5. move o arquivo temporário somente depois do dump completo;
6. gera o arquivo `.sha256` correspondente;
7. restringe ambos os arquivos ao usuário do sistema.

Exemplo de saída:

```text
/var/backups/geo-core/geo-core-20260819T140000Z.dump
/var/backups/geo-core/geo-core-20260819T140000Z.dump.sha256
```

## Validar sem alterar dados

O modo padrão da restauração somente verifica o ambiente, o checksum e a estrutura
do archive:

```bash
sh scripts/restore-postgis.sh \
  /var/backups/geo-core/geo-core-20260819T140000Z.dump
```

Esse comando não para serviços, não remove o banco e não restaura dados.

## Substituir o banco

Esta operação é destrutiva. Confirme primeiro que o dump e o checksum estão em
armazenamento independente da VPS e que o caminho aponta para o arquivo correto.

```bash
RESTORE_CONFIRMATION=replace:geo_core \
  sh scripts/restore-postgis.sh --replace \
  /var/backups/geo-core/geo-core-20260819T140000Z.dump
```

Use em `RESTORE_CONFIRMATION` o valor real de `POSTGRES_DB`. O script:

1. valida novamente checksum e archive;
2. interrompe API e gateway;
3. remove e recria somente o banco configurado;
4. executa `pg_restore --exit-on-error`;
5. reaplica migrations e privilégios mínimos;
6. reinicia API e gateway;
7. aguarda a API ficar saudável.

Se qualquer etapa falhar após o início da substituição, API e gateway permanecem
parados para evitar servir um banco parcialmente restaurado. Inspecione os logs e
repita o procedimento a partir de um backup válido.

## Ensaio automatizado de recuperação

Execute periodicamente e antes de releases relevantes:

```bash
sh scripts/test-backup-restore.sh
```

O ensaio usa um projeto Docker temporário e uma porta separada. Ele cria uma marca
exclusiva no banco, gera o backup, remove containers e o volume de origem, cria um
volume vazio, restaura o dump e verifica:

- versão e estado das migrations;
- duas entradas no catálogo;
- 39 polígonos e 39 pontos;
- SRID 4326;
- presença da marca existente apenas no backup;
- recusa de um arquivo adulterado e de uma confirmação com banco incorreto;
- recusa de escrita pelo usuário runtime;
- health, catálogo, GeoJSON, headers, limite de corpo e rate limiting.

O projeto, os arquivos e o volume temporários são removidos ao final, inclusive em
caso de falha. O script nunca utiliza o volume nomeado da stack de produção.

## Retenção e cópia externa

Política inicial sugerida, a ser ajustada ao RPO e ao crescimento do produto:

- um backup diário mantido por 7 dias;
- um backup semanal mantido por 4 semanas;
- pelo menos uma cópia criptografada fora da VPS;
- monitoramento da idade do último backup e do espaço disponível;
- ensaio de restauração mensal e antes de mudanças de infraestrutura.

Esta baseline não remove backups automaticamente. A retenção deverá ser ativada
somente quando o diretório e os critérios de expiração estiverem definidos no host,
evitando exclusões acidentais.

## Recuperação de desastre

Em uma VPS nova:

1. instale Docker e obtenha a mesma revisão do repositório;
2. recrie `.env.production` com os mesmos nomes de banco e papéis;
3. suba a stack para criar o volume novo;
4. copie o dump e o checksum de armazenamento externo;
5. valide o dump sem `--replace`;
6. execute a restauração com confirmação explícita;
7. rode `scripts/test-gateway.sh`;
8. valide domínio, TLS e logs antes de liberar tráfego.

Nunca execute `docker compose down -v` na stack real como parte de uma atualização
normal. Essa opção remove o volume do PostGIS e aparece apenas no ensaio isolado.
