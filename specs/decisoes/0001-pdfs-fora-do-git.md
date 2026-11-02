# 0001: PDFs de origem fora do git

**Data:** 02/11/2026
**Situação:** aceita

## Contexto

Os PDFs de `docs/` trazem nomes e e-mails de integrantes da equipe, e o repositório `paulotruly/gig` é público.

## Decisão

Os PDFs ficam só na máquina local, ignorados pelo `.gitignore`. O conteúdo necessário para o desenvolvimento fica condensado em `specs/`, sem dados pessoais da equipe.

## Consequências

- Um clone novo não traz os PDFs, então eles precisam ser compartilhados por outro meio.
- Se o repositório virar privado, esta decisão pode ser revista.
