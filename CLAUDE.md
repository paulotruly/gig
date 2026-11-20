# GiG (Greed is Great): back-end

Plataforma de gestão financeira e educação empreendedora para MEIs, startups e pequenos negócios. O repositório é um monorepo com todo o produto, e este trabalho cuida do back-end (`apps/api`, `apps/worker` e `packages/shared`). O `apps/web` é de outra frente de trabalho. O projeto segue desenvolvimento orientado a especificações: `specs/` é a fonte da verdade.

## Início de cada sessão

Leia `specs/estado.md` e, se houver funcionalidade em andamento, o arquivo dela. Leia o resto só quando a tarefa pedir.

| Para | Leia |
|---|---|
| Saber onde paramos e o próximo passo | `specs/estado.md` |
| Conferir regras invioláveis | `specs/constituicao.md` |
| Entender produto, públicos e modelo de negócio | `specs/produto.md` |
| Ver stack, módulos e infraestrutura | `specs/arquitetura.md` |
| Mexer em tabelas e migrações | `specs/modelo-de-dados.md` |
| Mexer em endpoints | `specs/contrato-api.md` |
| Mexer em classificação, previsão ou alertas | `specs/motor-de-previsao.md` |
| Escolher o que fazer | `specs/backlog.md` |
| Ver lacunas, conflitos e decisões em aberto | `specs/pendencias.md` |
| Entender uma decisão já tomada | `specs/decisoes/` |
| Especificar uma funcionalidade | `specs/funcionalidades/_modelo.md` |

Os PDFs de `docs/` ficam só na máquina local, fora do git. Abra um PDF apenas se as especificações não responderem à dúvida e, ao encontrar a resposta, registre-a na especificação.

## Fluxo de trabalho

1. Escreva a especificação em `specs/funcionalidades/NNN-nome.md`.
2. Implemente seguindo as tarefas dela.
3. No mesmo commit, marque as tarefas e atualize `specs/estado.md`.
4. Se uma regra mudar, altere a especificação antes do código.
5. Se a mudança for uma decisão relevante, registre-a em `specs/decisoes/`.

Não trate como definido o que está marcado como `proposto`, `a validar` ou `em conflito`. Se isso bloquear a tarefa, registre em `specs/pendencias.md` e pergunte.

## Branches

- `task_<NNN>`: uma branch por tarefa, com o número da especificação (por exemplo, `task_021`), criada a partir da `dev`. Todo desenvolvimento começa aqui.
- `dev`: testes.
- `main`: versão principal, implantada automaticamente no servidor ([decisão 0004](specs/decisoes/0004-implantacao-puxada-pelo-servidor.md)).

O fluxo é `task_<NNN>` → `dev` → `main`, em passos separados: a tarefa entra na `dev` com o CI verde, e a `dev` só vai para a `main` com o CI verde nela. Só promova para `dev` ou `main` quando for pedido. Ao concluir uma entrega, crie uma tag anotada `NNN-nome` no commit final. A antiga branch `tasks` saiu do fluxo.

## Commits

Use Conventional Commits em pt-br, no imperativo da terceira pessoa:

- `feat(previsao): adiciona cálculo do cenário conservador`
- `fix(consentimentos): impede sincronização após revogação`
- `docs(specs): atualiza modelo de dados`

## Escrita

- Tudo em pt-br, seguindo a norma padrão da língua portuguesa.
- Títulos, descrições, legendas e READMEs usam "Dessa forma", nunca "Dessa Forma". Nomes próprios e siglas mantêm as maiúsculas.
- A regra vale para texto. Identificadores de código seguem a convenção técnica, como `businessId` e `business_id`.

## Repositório público

O repositório `paulotruly/gig` é público. Não versione segredos, dados de clientes nem dados pessoais da equipe.
