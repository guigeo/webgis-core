# Como derivar o Geo Core

O Geo Core separa dados publicados, contratos genéricos e composição de produto. Uma aplicação derivada escolhe quais módulos entram no build sem alterar o Map Core, o Layer Manager ou o Application Shell.

## Como a composição funciona

1. O backend publica definições genéricas em `core.layers` e entrega o catálogo pela API.
2. Cada módulo frontend declara os IDs de catálogo que possui.
3. `frontend/src/app/modules.ts` registra explicitamente os módulos disponíveis.
4. `frontend/src/config/app.config.ts` escolhe os módulos habilitados no produto.
5. O registro entrega ao shell apenas as camadas contribuídas pelos módulos habilitados.

O módulo `reference` demonstra esse fluxo com as camadas `ibge-rmsp-municipalities` e `ibge-rmsp-municipality-points`. As definições visuais continuam no catálogo da API; o módulo não duplica estilo, popup, fonte ou metadados.

## Criar um módulo

Crie `frontend/src/modules/meu-modulo/index.ts` usando o contrato público do Core:

```typescript
import type { WebGisModule } from '../../core/modules/contracts'

export const meuModulo = {
  id: 'meu-modulo',
  version: '1.0.0',
  layers: [{ layerId: 'minha-camada-publicada' }],
} satisfies WebGisModule
```

O ID da camada precisa existir no catálogo entregue por `GET /api/layers`. Para publicar um novo dataset, adicione sua tabela e seu registro de catálogo por migration, mantendo SQL fora da API e nomes físicos do banco fora do frontend.

Registre o módulo disponível somente no composition root:

```typescript
// frontend/src/app/modules.ts
import { meuModulo } from '../modules/meu-modulo'

const availableModules = [referenceModule, meuModulo]
```

Habilite-o na configuração de produto:

```typescript
// frontend/src/config/app.config.ts
modules: ['reference', 'meu-modulo']
```

O registro falha na inicialização quando há módulo ausente, ID de módulo duplicado ou duas extensões tentando possuir a mesma camada.

## Setup e cleanup opcionais

Use `setup` apenas quando o módulo realmente precisar conectar um recurso ao lifecycle da aplicação:

```typescript
export const meuModulo = {
  id: 'meu-modulo',
  version: '1.0.0',
  setup: () => {
    const unsubscribe = subscribeToSomething()
    return () => unsubscribe()
  },
} satisfies WebGisModule
```

O Core executa os setups na ordem da composição e os cleanups na ordem inversa. Se um setup falhar, os módulos já iniciados são limpos antes de o erro ser propagado.

## Remover um módulo

Remova o ID de `modules` em `app.config.ts`. Depois do rebuild, suas camadas deixam o Layer Manager e o mapa, e seleção/estado associados são limpos. Não é necessário editar componentes internos.

Os registros e geometrias podem permanecer no PostGIS sem aparecer no produto. Remover fisicamente esses dados é uma decisão de migration e lifecycle do dataset, não uma responsabilidade do frontend.

## Limites desta fase

A composição é estática e acontece no build. Não há download remoto, marketplace, carregamento dinâmico, isolamento de plugins ou compatibilidade entre builds independentes.
