# ADR-0002 — GeoJSON limitado como entrega espacial inicial

**Status:** aceito  
**Data:** 2026-08-15

## Contexto

O primeiro fluxo precisa provar PostGIS → API → mapa sem introduzir um servidor de tiles antes de conhecermos volume, densidade e requisitos dos produtos derivados. Retornar datasets completos em GeoJSON, porém, criaria um contrato inseguro e que não escala.

## Decisão

O V1 começará com GeoJSON consultado por viewport e limitado pela API.

A consulta terá `layer_id` cadastrado, `bbox` validada, limite máximo, allowlist de campos, identidade estável e saída em `EPSG:4326`. A API indicará quando o resultado for truncado.

Os limites numéricos serão definidos e medidos durante a Fase 4, usando os dados de referência e o ambiente alvo, em vez de serem arbitrados nesta etapa documental.

## Consequências

### Positivas

- fluxo inicial menor e fácil de inspecionar;
- seleção e popup usam atributos disponíveis no cliente;
- evita operar mais um serviço antes de existir demanda;
- mantém o PostGIS como fonte geográfica principal.

### Negativas

- camadas densas poderão exigir múltiplas requisições ou truncamento;
- geometrias complexas ainda podem gerar respostas grandes;
- não atende antecipadamente datasets de grande escala.

## Critério de revisão

Introduzir MVT/Martin, PMTiles ou outra estratégia quando medições mostrarem que o orçamento de resposta é insuficiente, ou quando um produto derivado exigir volumes incompatíveis com GeoJSON por viewport.

