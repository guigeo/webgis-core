# ADR 0003 — Basemap padrão de demonstração

- Status: Aceita
- Data: 2026-08-15

## Contexto

O Map Core precisa de um basemap funcional, sem chave de API, para desenvolvimento local e demonstrações da fundação. Ao mesmo tempo, aplicações derivadas poderão ser entregues a clientes e não devem assumir que um endpoint público possui capacidade, SLA ou autorização para uso comercial irrestrito.

## Decisão

Usar o OpenStreetMap Standard como basemap padrão da fundação, com estas restrições explícitas:

- uso voltado a desenvolvimento, demonstração e tráfego interativo modesto;
- atribuição visível a OpenStreetMap contributors;
- nenhuma funcionalidade de prefetch, download em massa ou uso offline;
- URL, tile size, zoom máximo, atribuição e termos declarados na configuração validada;
- revisão obrigatória do provedor e da capacidade antes de uma aplicação derivada entrar em produção.

A troca futura do serviço deverá ocorrer por configuração ou por um Basemap Manager, sem alterar o adaptador de lifecycle do mapa.

## Consequências

- a fundação funciona sem credencial externa no ambiente inicial;
- demonstrações dependem de um serviço best-effort e de conexão com a internet;
- indisponibilidade de tiles não significa indisponibilidade da API ou do PostGIS;
- produtos derivados com tráfego relevante deverão contratar um provedor compatível ou hospedar seus próprios tiles;
- termos do provedor continuam sendo uma responsabilidade explícita de cada derivação.

## Referências

- <https://operations.osmfoundation.org/policies/tiles/>
- <https://www.openstreetmap.org/copyright>
