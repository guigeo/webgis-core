# ADR-0001 — Composição de módulos em build time

**Status:** aceito  
**Data:** 2026-08-15

## Contexto

O Geo Core precisa receber funcionalidades específicas de futuros produtos sem acoplar regras de negócio ao núcleo. Ainda não existe uma segunda aplicação real que justifique um sistema de plugins, pacotes publicados ou compatibilidade de runtime entre versões.

## Decisão

Módulos serão imports explícitos registrados pelo composition root durante o build da aplicação.

O Core oferecerá contratos tipados para contribuições como painéis, navegação, ferramentas e camadas. Não haverá descoberta dinâmica, download remoto, marketplace ou isolamento de plugins no V1.

## Consequências

### Positivas

- implementação e depuração simples;
- type checking entre Core e módulo;
- tree shaking e build único;
- nenhuma infraestrutura de distribuição de plugins;
- fronteira testável sem framework interno complexo.

### Negativas

- habilitar ou remover um módulo exige novo build;
- módulos precisam ser compatíveis com a versão do código-fonte usada pela aplicação;
- não existe isolamento de falhas entre plugins de terceiros.

## Critério de revisão

Reavaliar quando houver pelo menos duas aplicações reais, necessidade comprovada de atualização independente ou carregamento de extensões sem rebuild.

