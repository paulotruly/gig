# 0003: padrões para as lacunas do MVP

**Data:** 04/11/2026
**Situação:** aceita

## Contexto

O [09] propõe endpoints e tabelas, mas deixa lacunas nas pendências P-01 a P-11 e P-14. O usuário pediu a implementação de todo o [09] e aprovou os padrões abaixo em 04/11/2026. As integrações externas ficam simuladas, porque dependem de contas e definições fora do código.

## Decisão

Aprovadas diretamente pelo usuário:

- **Escopo:** todo o [09]. WhatsApp com adaptador simulado e Open Finance só como interface.
- **Parâmetros (P-03, P-06, P-07):** histórico mínimo de 3 meses, janela de 6 meses, alerta quando o saldo conservador fica negativo em até 15 dias, mínimo de 5 negócios por indicador e extrato em CSV e OFX. O runway entra no contrato e vem nulo, com aviso, quando a queima é zero ou negativa.
- **Acesso (P-01, P-04, P-14):** cadastro aberto para empreendedor, uma só tabela `users`, com vínculo por papel (dono, contador ou parceiro). O contador só envia extrato de negócio em que foi autorizado, e o parceiro só vê agregados. Sessão no banco, com cookie `httpOnly`.
- **Parceiros (P-11):** banco, contabilidade, aceleradora, incubadora, plataforma, comunidade e investidor. A prioridade comercial continua em aberto.

Decorrentes, propostas na implementação e a revisar pelo usuário:

- **Etiqueta (P-05):** nova coluna `label` em `transactions`. A origem pessoal ou empresa é derivada da etiqueta e não é gravada.
- **Compromissos (P-02):** tabela `commitments`, com despesas fixas e recebíveis.
- **Eventos e sessões (P-09):** tabelas `usage_events`, `sessions` e `statement_imports`.
- **Alertas (P-10):** o worker cria e envia os alertas; a API só responde às mensagens recebidas pelo webhook.
- **Saldo inicial:** o saldo atual é o saldo informado pelo dono somado às transações posteriores à data informada. O [09] não diz de onde vem o caixa disponível.
- **Agregados:** só entram negócios com consentimento ativo para essa finalidade.
- **Premissas de despesa:** ver `motor-de-previsao.md`. Os compromissos conhecidos são um piso em todos os cenários, para o conservador nunca projetar menos despesa que o provável.

## Consequências

- Os valores ficam em um só lugar, ligados à versão das regras, e podem mudar sem alterar o cálculo.
- O WhatsApp e o Open Finance reais exigem novos adaptadores, sem mudar o núcleo.
- As tabelas só de inserção usam gatilhos no banco. O usuário de migração precisa de permissão para criá-los.
