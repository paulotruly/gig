# 020: login com Google

**Situação:** `em andamento`
**Depende de:** 004
**Referências:** `specs/contrato-api.md`, `specs/constituicao.md` (regras 7, 8 e 9), [decisão 0004](../decisoes/0004-implantacao-puxada-pelo-servidor.md)

## Objetivo

Quem usa o GiG pode entrar e criar a conta com o Google, sem criar senha. Isso reduz o atrito do primeiro acesso para MEIs e pequenos negócios.

## Requisitos

- R1: `GET /auth/google` redireciona para o Google pelo fluxo de código de autorização com PKCE (S256), `state` e `nonce`, pedindo os escopos `openid email profile`.
- R2: `state`, `nonce` e `code_verifier` ficam num cookie `httpOnly` de 10 minutos, `SameSite=Lax`, com caminho `/api/auth/google`. O cookie vale para uma tentativa e é apagado no retorno.
- R3: `GET /auth/google/callback` confere o `state`, troca o código no endpoint de token do Google (servidor a servidor, com o segredo do cliente) e valida o `id_token`: `iss` igual a `https://accounts.google.com` ou `accounts.google.com`, `aud` igual ao `GOOGLE_CLIENT_ID`, `exp` no futuro, `nonce` igual ao do cookie e `email_verified` verdadeiro. Como o token chega direto do Google por TLS, a assinatura não precisa ser conferida (OpenID Connect Core §3.1.3.7).
- R4: com o `id_token` válido, a API procura o usuário pelo `sub` do Google. Se não achar, procura pelo e-mail: achando, vincula o `sub` à conta e registra `user.google_link` no `audit_log`. Se não houver conta, cria uma com nome e e-mail do Google, sem senha, e registra `user.register` com o método `google`.
- R5: depois disso, a API abre a sessão como no `POST /auth/login`, registra `session.login` com o método `google` e redireciona para `APP_BASE_URL`.
- R6: em qualquer falha (cancelamento no Google, `state` divergente, token inválido, e-mail não verificado), a API redireciona para `APP_BASE_URL/?erro=google`, sem abrir sessão. O log registra só o motivo, sem e-mail, nome ou token (regra 7).
- R7: conta sem senha não entra pelo `POST /auth/login`, que responde o mesmo `invalid_credentials` de senha errada.
- R8: `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` são opcionais (vazio vale como ausente). Sem eles, `GET /auth/google` responde 404 `google_disabled`, e `GET /auth/providers` responde `{ "google": false }`.
- R9: a URL de retorno é `APP_BASE_URL + /api/auth/google/callback`, a mesma cadastrada no Google Cloud.
- R10: a tela de entrada e a de cadastro mostram "Entrar com Google" quando `GET /auth/providers` indica `google: true`, e uma mensagem de erro quando a URL tem `?erro=google`.

## Fora do escopo

- Definir ou redefinir senha em conta criada pelo Google.
- Desvincular o Google da conta.
- Outros provedores (Apple, Microsoft).
- Login com Google para parceiros: eles continuam criados por comando, mas um parceiro pode entrar com o Google se o e-mail for o mesmo (R4).

## Critérios de aceite

- [x] C1: dado o Google configurado, quando abro `GET /auth/google`, então sou redirecionado ao Google com `code_challenge_method=S256`, `state` e `nonce`, e recebo o cookie da tentativa.
- [x] C2: dado um `id_token` válido de e-mail novo, quando o Google me devolve ao callback, então a conta é criada sem senha, a sessão é aberta e sou levado ao `APP_BASE_URL`.
- [x] C3: dado um usuário com senha e o mesmo e-mail, quando entro com o Google, então o `sub` é vinculado, o `audit_log` registra `user.google_link`, e depois entro dos dois jeitos.
- [x] C4: dado `state` divergente, `nonce` divergente, `aud` errado ou `email_verified` falso, quando chego ao callback, então nenhuma sessão é aberta e sou redirecionado com `?erro=google`.
- [x] C5: dada uma conta criada pelo Google, quando tento `POST /auth/login` com qualquer senha, então recebo `invalid_credentials`.
- [x] C6: sem `GOOGLE_CLIENT_ID`, `GET /auth/providers` responde `google: false`, e `GET /auth/google` responde 404.

## Plano técnico

- Banco: migração que torna `users.password_hash` opcional e adiciona `users.google_sub` (`VARCHAR(255)`, único, opcional).
- API: `apps/api/src/modules/google-auth.ts` com as rotas e uma dependência injetável `googleOAuth` (troca de código), para os testes de integração não chamarem o Google. A abertura de sessão de `auth.ts` passa a ser compartilhada.
- Config: `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` em `config.ts`, `.env.example` e `docker-compose.yml`.
- Contratos: `GET /auth/providers` em `packages/shared` e em `specs/contrato-api.md`.
- Web: botão e mensagem de erro em `apps/web/src/components/auth/AuthScreen.tsx`.
- Sem dependência nova: `fetch` do Node para o token, `node:crypto` para PKCE, `state` e `nonce`.

## Tarefas

- [x] T1: migração e esquema Prisma.
- [x] T2: config, contratos e `GET /auth/providers`.
- [x] T3: rotas do Google, vínculo, criação e auditoria, com testes de integração.
- [x] T4: `POST /auth/login` recusa conta sem senha.
- [x] T5: botão e erro na tela de entrada.
- [ ] T6: cliente OAuth no Google Cloud e segredo no `.env` do servidor.

## Notas

O cliente OAuth é do tipo "Aplicativo da Web", com a origem `https://gigreat.online` e o retorno `https://gigreat.online/api/auth/google/callback`. Para desenvolvimento local, cadastre também `http://localhost:3001` e `http://localhost:3001/api/auth/google/callback`.

### Implementação e verificação

T1 a T5 implementadas. C1 a C6 têm cobertura em `apps/api/test/integration/google-auth.test.ts`; a execução contra MySQL fica para o CI. T6 permanece manual e não foi executada.

O método Google é registrado como `targetType: "google"`, pois o formato existente de `audit` não possui metadados livres. O cookie da tentativa tem assinatura HMAC e expiração conferida no servidor. Um vínculo Google existente não é substituído por outro `sub`; falhas concorrentes de vínculo seguem o redirecionamento de erro. Criação, vínculo, sessão e auditoria são transacionais.
