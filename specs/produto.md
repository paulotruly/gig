# Produto

## Resumo

A GiG (Greed is Great) é uma plataforma de gestão financeira e educação empreendedora. Ela lê o extrato do negócio com consentimento, classifica as transações, prevê o caixa em três cenários e orienta por app web e WhatsApp.

- **Proposta de valor:** saiba hoje quanto o seu negócio terá amanhã e aprenda a decidir no momento em que precisa.
- **Conceito:** o copiloto financeiro que os apps de IA já são para a pessoa física, agora para o CNPJ.
- **Missão:** ajudar MEIs, startups e pequenos negócios a organizar suas finanças e aprender a empreender com clareza.
- **Visão:** ser a principal plataforma de apoio ao pequeno empreendedor brasileiro.
- **Valores:** clareza, acessibilidade, autonomia e educação prática.

## Problema

- 61% dos pequenos negócios pagam despesas da empresa com a conta pessoal.
- 68% dos MEIs não preveem o saldo do mês seguinte.
- 29% das startups encerram atividade por falta de caixa.
- Planilhas e ERPs exigem registro contínuo e são abandonados quando o mês aperta.

## O que o produto responde

- Quanto é seguro retirar para a vida pessoal.
- Quanto reservar para DAS, fornecedores e compromissos fixos.
- O que priorizar pagar ou cobrar.
- Como atravessar um mês de baixa e se reorganizar após um imprevisto.
- Quanto tempo o caixa aguenta no ritmo atual.

## Diferencial

Nenhum concorrente mapeado combina leitura automática via Open Finance PJ, cenários de caixa e runway e orientação no momento da decisão. Contas PJ movimentam, ERPs exigem registro e assistentes executam ou consultam.

## Usuários

Os perfis são definidos pela situação vivida, não pelo porte formal, e um negócio pode mudar de perfil.

| Perfil | Necessidade central |
|---|---|
| MEI em sobrevivência | Saber se sobra caixa no mês seguinte e separar as contas aos poucos |
| MEI ou ME em crescimento | Rotina de caixa compatível com o aumento de volume |
| Startup pré-seed ou seed | Visibilidade contínua de runway e queima de caixa |
| Prestador de serviço B2B recorrente | Prever recebíveis a prazo e priorizar cobranças |

**Faixas de porte:** MEI até R$ 81 mil/ano; micro e pequenas empresas de R$ 81 mil a R$ 4,8 milhões/ano. **Primeiros usuários:** MEIs de Recife que usam a conta pessoal para a empresa e startups de aceleradoras locais.

## Modelo de negócio

O modelo é B2B2C: o empreendedor não paga, e organizações parceiras licenciam a GiG por negócio ativo/mês. Depois, startups maiores poderiam contratar assinatura direta. A monetização vem de software, jornadas e indicadores agregados, nunca da venda de dados individuais. Os tipos de parceiro estão em conflito (P-11).

## Métricas

| Etapa | Métrica |
|---|---|
| Aquisição e confiança | % que conecta a conta do negócio |
| Ativação | Vê a primeira previsão na primeira semana |
| Retenção (principal) | Abre a GiG toda semana; ativos semanais após 30 e 90 dias |
| Aprendizado | % que conclui ao menos uma trilha |
| Impacto | Redução de meses com caixa negativo |
| Receita | Parceiros em piloto, contratos pagos e clientes ativos por parceiro |

**Métricas técnicas:** erro médio da previsão em relação ao saldo real, % de transações classificadas sem correção, latência p95 da API e falhas de sincronização por dia.

## Hipóteses a validar

- O maior valor é saber quanto é seguro retirar e comprometer, sem acompanhar cada lançamento.
- Um canal de baixo esforço terá mais adesão que ERPs e planilhas.
- Open Finance PJ dispensa o registro manual, sem custódia e em conformidade com a LGPD.
- Parceiros pagam por software de intervenção e indicadores agregados.

## Mapa dos documentos de origem

Os PDFs ficam em `docs/`, só na máquina local.

| Documento | Conteúdo | Relevância para o back-end |
|---|---|---|
| [09] Conceitos e aspectos técnicos | Stack, dados, API, infraestrutura, segurança, motor e testes | Alta |
| [03] Pessoas, causas e consequências | Princípios da experiência, parceiros, usuários e hipóteses | Média |
| [04] Mercado, concorrência e segmento | Restrições legais, perfis e proteções por parceiro | Média |
| [06] Estratégias | Foco, atividades e métricas | Média |
| [07] Lean Startup Canvas | Solução, canais, receita e métricas-chave | Média |
| [01] Desafio, lacunas e tendências | Restrições regulatórias e lacunas | Baixa |
| [02] Achados iniciais | Dados de pesquisa e alternativas existentes | Baixa |
| [05] Relevância e justificativa | Problemas e oportunidades | Baixa |
| [08] Missão, visão e valores | Identidade | Baixa |
| [00] Disclaimer | Mudança do público-alvo para negócios | Baixa |
| [01] Negócios na internet | Análise do Nubank: simplicidade e transparência | Baixa |

Há dois documentos com o prefixo [01]. Nas especificações, [01] se refere a "Desafio, lacunas e tendências". As referências E01 a E08 dos PDFs são os entregáveis de mesmo número.
