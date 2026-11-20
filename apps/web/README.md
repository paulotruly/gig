# GiG (Greed is Great): front-end web

Front-end da plataforma de gestão financeira e educação empreendedora para MEIs, startups e pequenos negócios. A especificação da integração está em `specs/funcionalidades/018-integracao-do-front-end.md`.

## Como rodar

1. Suba a API (`npm run dev` na raiz), que atende na porta 3000.
2. Copie `.env.example` para `.env.local` se a API estiver em outro endereço.
3. Rode `npm run dev:web` na raiz e abra `http://localhost:3001`.

## Integração com a API

- O navegador chama `/api/...` na mesma origem. Em desenvolvimento, o Next encaminha para `API_INTERNAL_URL`; em produção, o Nginx faz o mesmo.
- A sessão fica no cookie `gig_session`, `httpOnly`: o JavaScript não lê nem guarda token. O `localStorage` guarda só preferências visuais (negócio escolhido e valores ocultos).
- Tipos e esquemas vêm de `@gig/shared/contracts`. O front não calcula valores oficiais: saldo projetado, runway, retirada segura e classificação vêm da API (regra 11 da constituição).
- Nunca use o prefixo `NEXT_PUBLIC_` para segredos: tudo com ele vai em texto puro para o navegador.

## Identidade visual

- **Lime principal:** `#D7FD3C` (destaques e botões de ação primária)
- **Lime suave:** `#F3FCE2`
- **Obsidian:** `#111827` (textos principais e cards de alta ênfase)
- **Fundo da aplicação:** `#F8FAF5`
- **Cartões:** `#FFFFFF`, bordas `#E6EFE2` e cantos `rounded-3xl`
- **Texto secundário:** `#64748B`

## Telas

1. **Entrada e cadastro:** conta, negócio, saldo atual e consentimento para ler extratos.
2. **Início:** saldo informado, retirada segura, fôlego, cenários, lançamentos recentes, próximo vencimento e alertas.
3. **Cenários:** os três cenários do motor de previsão, com runway e a explicação do cálculo.
4. **Transações:** lista paginada com correção da classificação PF e PJ.
5. **Compromissos:** despesas fixas e recebíveis.
6. **Trilhas:** as trilhas educativas e o registro de conclusão.
7. **WhatsApp:** demonstração do canal, com dados de exemplo.
