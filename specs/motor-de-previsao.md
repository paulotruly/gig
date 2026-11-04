# Motor de previsão e orientação

Fonte: [09] §09 e [decisão 0003](decisoes/0003-padroes-para-as-lacunas-do-mvp.md). Status geral: `definido` para o MVP, a testar no protótipo. As funções puras ficam em `packages/shared`, com execução pelo worker.

O motor transforma extratos em três respostas: quanto sobra, por quanto tempo o caixa aguenta e o que fazer agora.

## 1. Classificação PF-PJ

Cada transação recebe uma etiqueta: pessoal, empresa, imposto, fornecedor ou retirada. A classificação usa regras e aprende com as correções do usuário. A separação é gradual, no ritmo do negócio. As etiquetas pessoal e retirada têm origem pessoal; as demais têm origem empresa.

## 2. Previsão em cenários

Projeta três faixas de saldo para as próximas semanas.

| Cenário | Premissa de receita | Premissa de despesa |
|---|---|---|
| Conservador | Primeiro quartil dos meses da janela, sem recebíveis | Padrão recente, com os compromissos conhecidos como piso |
| Provável | Mediana da janela, com os recebíveis previstos como piso | Padrão recente por categoria, com os compromissos como piso |
| Favorável | Terceiro quartil da janela, com os recebíveis como piso | Padrão recente sem gastos extraordinários, com os compromissos como piso |

**Regras de cálculo:**

- A janela usa os últimos 6 meses completos, e o mês sem receita conta como zero. Com menos de 3 meses completos, não há previsão.
- O horizonte é de 28 dias, e os valores mensais são proporcionais a 30 dias.
- Compromissos e recebíveis entram na data de vencimento; o restante se distribui igualmente pelos dias.
- Etiquetas pessoal e retirada ficam fora do padrão de receitas e despesas, mas contam no saldo atual.
- Gasto extraordinário é a transação acima de 3 vezes a mediana da sua categoria, em categorias com ao menos 3 transações.
- O [09] descreve a despesa conservadora só como compromissos conhecidos. Usar o padrão recente como base impede que o conservador projete menos despesa que o provável.

## 3. Runway para startups

Calculado sobre cada cenário:

```
runway (meses) = caixa disponível / queima líquida mensal
queima líquida = despesas - receitas
```

**Referências de mercado:** 12 a 18 meses no pré-seed e 24 a 36 meses na Série A. Com queima zero ou negativa, o runway fica nulo e o status vale `not_burning`. Com caixa zero ou negativo e queima positiva, o runway é zero.

## 4. Retirada segura

É o que sobra no cenário conservador depois de provisionar DAS, fornecedores e compromissos fixos. Corresponde ao menor saldo diário projetado no horizonte, nunca abaixo de zero, para a retirada não deixar o caixa negativo em nenhum dia.

## 5. Orientação contextual

Regras de decisão, como "saldo conservador fica negativo em 15 dias", disparam mensagens por WhatsApp ou no app, com a trilha relacionada. Cada mensagem informa os dados e a regra usados e permite corrigir a classificação.

**Regras de alerta:**

| Regra | Dispara quando | Trilha |
|---|---|---|
| `conservative_negative_soon` | Saldo conservador negativo em até 15 dias | `fluxo-de-caixa` |
| `likely_negative_in_horizon` | Saldo provável negativo no horizonte | `fluxo-de-caixa` |
| `low_runway` | Startup com runway provável abaixo de 12 meses | `runway` |
| `mixed_accounts` | Ao menos 20% das saídas da janela com origem pessoal | `separar-contas` |

## Técnica

Status: `a validar`.

- **Início:** regras e estatística simples (medianas, quantis e sazonalidade mensal), coerentes com poucos dados por cliente e com a explicabilidade.
- **Depois:** aprendizado de máquina, quando houver histórico agregado suficiente.
- **IA generativa:** só na camada de linguagem, para redigir e explicar.

## Testes obrigatórios

- Unidade: os três cenários, o runway e a retirada segura, como funções puras.
- Reprodução: a mesma entrada e a mesma versão das regras geram o mesmo resultado.
- Bordas: histórico curto, mês sem receita, queima zero ou negativa e correções do usuário.

## Parâmetros

Ficam em `packages/shared/src/rules/params.ts`, ligados à versão das regras. Mudar um valor exige nova versão.
