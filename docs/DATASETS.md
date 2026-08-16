# Dados de referência

## Municípios da Região Metropolitana de São Paulo

Esta camada é uma referência pública pequena para provar o fluxo completo do Geo Core. Ela não representa uma regra de negócio do Core.

### Proveniência

- organização: Instituto Brasileiro de Geografia e Estatística — IBGE;
- recorte: Região Metropolitana de São Paulo, identificador `04901`;
- composição: 39 municípios e seus códigos oficiais;
- geometria: API de Malhas Geográficas v3, recorte municipal de São Paulo com qualidade `maxima`;
- nomes e composição metropolitana: API de Localidades v1;
- consulta e congelamento do snapshot: 2026-08-15;
- arquivo versionado: `backend/migrations/data/ibge_rmsp_municipalities.geojson`.

Fontes oficiais:

- [API de Malhas Geográficas v3](https://servicodados.ibge.gov.br/api/docs/malhas?versao=3);
- [API de Localidades v1](https://servicodados.ibge.gov.br/api/docs/localidades).

O IBGE descreve as malhas simplificadas como apropriadas para aplicações web. O snapshot é carregado pela migration e, portanto, a execução local não depende da disponibilidade das APIs externas.

### Uso e atribuição

O material técnico do IBGE informa que seus dados podem ser usados, copiados, modificados e compartilhados, inclusive comercialmente, desde que a fonte seja mantida. A interface e o catálogo exibem `Fonte: IBGE — Malhas Geográficas v3 e Localidades v1`.

Referência: [Acesso e uso de dados geoespaciais — IBGE](https://loja.ibge.gov.br/manual-tecnico-em-geociencias-acesso-e-uso-de-dados-geoespaciais.html).

### Medição e limite

Medição feita no ambiente integrado em 2026-08-15, consultando toda a extensão inicial `-47.35,-24.05,-45.92,-23.05`:

- 39 feições retornadas;
- 223.223 bytes no GeoJSON sem compressão HTTP;
- nenhum truncamento com `limit=50`;
- truncamento confirmado com `limit=10`.

O limite máximo da camada foi definido em 50 feições. Ele comporta as 39 feições do snapshot com 28% de margem e mantém a resposta projetada abaixo de aproximadamente 286 KB caso a complexidade média das geometrias permaneça semelhante. O limite é uma política do catálogo e não pode ser aumentado pelo cliente.

Essa medição é específica da camada de referência. Camadas derivadas precisam medir seu próprio volume e migrar para vector tiles quando a densidade ou a complexidade não couberem nesse orçamento.

## Pontos municipais da Região Metropolitana de São Paulo

A segunda camada é derivada no PostGIS a partir do mesmo snapshot do IBGE. Para cada município, a migration calcula `ST_PointOnSurface(geometry)`, garantindo um ponto situado no interior do polígono.

- tabela: `reference.rmsp_municipality_points`;
- geometria: `Point`, SRID 4326;
- quantidade persistida: 39 feições;
- identidade: mesmo código IBGE da camada de municípios;
- índice espacial: GiST;
- finalidade: provar uma segunda geometria e simbologia sem adicionar comportamento específico ao Core.

Esses pontos são representativos e derivados dos polígonos; não devem ser interpretados como coordenadas oficiais das sedes municipais.
