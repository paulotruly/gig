# GiG (Greed is Great) - Front-end Web

Front-end da plataforma de gestão financeira e educação empreendedora para MEIs, startups e pequenos negócios.

## Identidade Visual & Cores (Design System)

Baseado no padrão de cores da GiG:

- **Lime Neon Principal:** `#D7FD3C` (Destaques, botões de ação primária, anéis de progresso)
- **Lime Hover:** `#C5F82A`
- **Lime Suave / Fundo de Destaque:** `#F3FCE2`
- **Dark Obsidian (Contraste):** `#111827` (Textos principais, cards escuros de alta ênfase como Metas)
- **Fundo da Aplicação:** `#F8FAF5`
- **Superfície dos Cartões:** `#FFFFFF` com bordas sutis `#E6EFE2` e cantos arredondados (`rounded-3xl` / 24px)
- **Texto Secundário / Apoio:** `#64748B`

## Telas Implementadas

1. **Início (Dashboard):** Visão geral idêntica ao mockup, com Saldo atual (`R$ 4.220,00`), Receitas (`R$ 8.230,00`), Despesas (`R$ 4.010,00`), card flutuante do DAS MEI, card dark obsidian com donut circular 70% de metas, fluxo de caixa e cálculo de Retirada Segura.
2. **Cenários & Runway:** Os 3 cenários do motor de previsão da GiG (Conservador, Provável e Favorável) com runway em meses e explicação transparente do cálculo.
3. **Transações (PF/PJ):** Classificação inteligente com separação entre vida pessoal e empresa, alerta de contas misturadas e modal de extrato OFX/CSV.
4. **Metas & Compromissos:** Gestão de despesas fixas (DAS, aluguel, contador) e recebíveis agendados.
5. **Trilhas Educativas:** As 4 trilhas práticas de 3 minutos integradas aos dados da empresa (Fluxo de caixa, Separar contas, Impostos e DAS, Runway para startups).
6. **WhatsApp Copilot:** Simulador do canal de atendimento proativo da GiG.

## Integração com a API

Os tipos e esquemas de validação são importados de `@gig/shared/contracts` conforme especificado em `specs/arquitetura.md` (regra 11).
