# Pendências

Lacunas e conflitos encontrados nos documentos. Ao resolver um item, remova-o daqui e registre a decisão em `decisoes/` quando for relevante.

## Lacunas

| ID | Pendência | Afeta |
|---|---|---|
| P-01 | Não há endpoint de cadastro de usuário nem de criação de negócio | 003, 004 |
| P-02 | Não há tabela para compromissos fixos e recebíveis, embora os cenários e a retirada segura dependam deles | 002, 008, 009 |
| P-03 | O contrato de exemplo da previsão não tem runway, embora o endpoint prometa esse dado | 009 |
| P-04 | O parceiro faz login, mas `users` só modela o dono do negócio | 003, 014 |
| P-05 | A etiqueta da classificação (pessoal, empresa, imposto, fornecedor, retirada) não corresponde às colunas `categoria` e `origem` de `transactions` | 002, 007 |
| P-06 | O runway não está definido quando a queima líquida é zero ou negativa (divisão por zero) | 009 |
| P-07 | Faltam parâmetros: histórico mínimo para prever, número de meses recentes, limites dos alertas, limite mínimo de negócios por indicador e formato do arquivo de extrato | 006, 009, 011, 014 |
| P-08 | Não está definido como acessar o Open Finance (participação regulada ou intermediário), e o limite jurídico da automação continua em aberto desde [01] | 015 |
| P-09 | Não há tabela para eventos de uso, sessão ou renovação e importações de extrato | 002, 003, 006, 016 |
| P-10 | Não está claro qual serviço envia alertas: o worker dispara, mas a API é quem responde pelo WhatsApp | 011, 013 |
| P-13 | O backlog não tem item para provisionamento (`docker-compose.yml`, Dockerfiles e Nginx), embora [09] §11 o coloque como segundo passo | Backlog |

## Conflitos

| ID | Conflito | Afeta |
|---|---|---|
| P-11 | Quem paga. [07], mais recente que [03] e [04], cita incubadoras, aceleradoras, comunidades e investidores. [03], [04] e a tabela `partners` de [09] citam bancos, contabilidades, aceleradoras e plataformas. Isso define os tipos de parceiro | 002, 014 |

## Decisões a tomar

| ID | Decisão | Afeta |
|---|---|---|
| P-12 | Servidor local só no piloto ou também na operação; canal inicial (WhatsApp, app web ou ambos) | 013 |

## Limite da leitura dos documentos

Os PDFs foram extraídos como texto. Os diagramas das páginas 2 e 8 de [09] não foram lidos, embora o texto ao redor explique as duas arquiteturas. Vale conferi-los ao especificar a 001.
