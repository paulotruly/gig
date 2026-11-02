# Constituição

Regras que valem para todo o back-end. Mudar qualquer uma delas exige um registro em `decisoes/`.

## Dinheiro e regulação

1. **Sem custódia.** Nenhum endpoint inicia pagamento ou move dinheiro, e as integrações são somente leitura. Sem licença de ITP, a GiG só orienta e faz alocação virtual. ([01], [04], [09] §08)
2. **Valores monetários exatos.** Use `DECIMAL` no banco e texto decimal na API, nunca `FLOAT`. ([09] §05, §6.2)

## Dados e privacidade

3. **Isolamento por negócio.** Toda tabela de negócio tem `business_id`, e toda consulta filtra por ele. ([09] §05)
4. **Parceiro só vê agregados.** O acesso é restrito a `partner_metrics`, com usuário de banco somente leitura e número mínimo de negócios por indicador. Dados individuais nunca são vendidos. ([03], [09] §02, §05)
5. **Consentimento rastreável.** A tabela `consents` é só de inserção, e cada mudança de status é uma nova linha. O consentimento tem finalidade determinada e pode ser revogado. O worker confere o status antes de cada sincronização. ([04], [09] §05, §08)
6. **Dados mínimos.** Colete só o necessário para a finalidade informada. ([03])
7. **Logs sem dados pessoais.** Registre identificadores e eventos, nunca valores nem descrições de transações. ([09] §6.3)
8. **Segredos protegidos.** Segredos ficam em variáveis de ambiente, fora do git. Tokens de acesso são cifrados na aplicação, com a chave fora do banco. Senhas guardam só o hash. ([09] §05, §08)
9. **Auditoria.** Acessos e alterações sensíveis vão para `audit_log`. ([09] §05)
10. **Proteções por tipo de parceiro.** Os dados não podem servir para negar crédito a clientes vulneráveis, criar classificação punitiva de vulnerabilidade nem bloquear oportunidades de trabalho. A responsabilidade profissional das contabilidades deve ficar delimitada. ([04])

## Regras de negócio

11. **Uma só fonte de regras.** Classificação, previsão e orientação ficam só na API, e as rotas do Next.js não acessam o banco. ([09] §03)
12. **Funções puras.** Classificação e previsão recebem transações e devolvem o resultado, sem acessar o banco. ([09] §6.3)
13. **Explicabilidade.** Toda previsão guarda a versão das regras, e todo alerta guarda a regra e os dados usados. O usuário pode corrigir a classificação. ([03], [09] §05, §09)
14. **Faixas, não falsa precisão.** A previsão sempre sai em três cenários: conservador, provável e favorável. ([03], [09] §09)
15. **IA não calcula.** A IA generativa só redige e explica; os números vêm das regras. ([09] §09)
16. **Sem culpa.** Mensagens tratam mês fraco e mistura de contas como condição do negócio, não como falha de quem empreende. ([03])

## Engenharia

17. **Entrada validada.** Toda requisição é validada na borda da API, e as consultas são parametrizadas, sem concatenar SQL. ([09] §08)
18. **Worker idempotente.** Sincronização e recálculo rodam fora da API e podem ser reexecutados com segurança. ([09] §6.3)
19. **Serviços sem estado.** Web, API e worker não guardam estado; o que precisa persistir vai para o MySQL. ([09] §07)
20. **Migrações versionadas.** Toda mudança de esquema passa por migração no repositório. ([09] §06)
