# Motor de previsão e orientação

Fonte: [09] §09. Status geral: `proposto`, a testar no protótipo. Implementação nos módulos `classification` e `forecasting` da API, com execução pelo worker.

O motor transforma extratos em três respostas: quanto sobra, por quanto tempo o caixa aguenta e o que fazer agora.

## 1. Classificação PF-PJ

Cada transação recebe uma etiqueta: pessoal, empresa, imposto, fornecedor ou retirada. A classificação usa regras e aprende com as correções do usuário. A separação é gradual, no ritmo do negócio. A relação com as colunas da tabela está em aberto (P-05).

## 2. Previsão em cenários

Projeta três faixas de saldo para as próximas semanas.

| Cenário | Premissa de receita | Premissa de despesa |
|---|---|---|
| Conservador | Piores meses recentes do próprio negócio | Compromissos fixos e vencimentos já conhecidos |
| Provável | Mediana do histórico, ajustada por recebimentos a prazo já previstos | Padrão recente de gastos por categoria |
| Favorável | Melhores meses recentes | Padrão recente, sem gastos extraordinários |

## 3. Runway para startups

Calculado sobre cada cenário:

```
runway (meses) = caixa disponível / queima líquida mensal
queima líquida = despesas - receitas
```

**Referências de mercado:** 12 a 18 meses no pré-seed e 24 a 36 meses na Série A. O caso de queima zero ou negativa está em aberto (P-06).

## 4. Retirada segura

É o que sobra no cenário conservador depois de provisionar DAS, fornecedores e compromissos fixos.

## 5. Orientação contextual

Regras de decisão, como "saldo conservador fica negativo em 15 dias", disparam mensagens por WhatsApp ou no app, com a trilha relacionada. Cada mensagem informa os dados e a regra usados e permite corrigir a classificação.

## Técnica

Status: `a validar`.

- **Início:** regras e estatística simples (medianas, quantis e sazonalidade mensal), coerentes com poucos dados por cliente e com a explicabilidade.
- **Depois:** aprendizado de máquina, quando houver histórico agregado suficiente.
- **IA generativa:** só na camada de linguagem, para redigir e explicar.

## Testes obrigatórios

- Unidade: os três cenários, o runway e a retirada segura, como funções puras.
- Reprodução: a mesma entrada e a mesma versão das regras geram o mesmo resultado.
- Bordas: histórico curto, mês sem receita, queima zero ou negativa e correções do usuário.

## Parâmetros em aberto

Histórico mínimo, número de meses recentes e limites de disparo dos alertas (P-07).
