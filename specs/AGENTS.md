# AGENTS.md — Formato de Specs

Antes de implementar qualquer feature, crie um arquivo `specs/<nome-da-feature>.md` seguindo esta estrutura:

---

## Estrutura do arquivo

```md
# <Nome da Feature>

## Contexto
O que existe hoje e por que essa feature é necessária.

## Decisão de Arquitetura
Abordagem escolhida e por quê. Inclua alternativas descartadas se relevante.

## Comportamento detalhado
Como a feature se comporta do ponto de vista do usuário e do sistema.

## Arquitetura de arquivos
Quais arquivos criar/modificar e suas responsabilidades.

## Contratos de interface
Props, tipos, assinaturas de funções públicas — tudo que outras partes do código vão consumir.

## To-dos de implementação
Checklist ordenada e agrupada por arquivo/responsabilidade.

## Notas
Gotchas, edge cases e decisões que não ficam óbvias no código.
```

---

## Regras

- **Status das decisões** (tabela com perguntas e respostas) pode ser adicionado no topo quando houver ambiguidades resolvidas durante o planejamento.
- Seções opcionais podem ser omitidas se não se aplicarem.
- Código de exemplo nos contratos deve ser suficiente para implementar sem ambiguidade.
- To-dos devem ser granulares o bastante para serem commitados individualmente.
