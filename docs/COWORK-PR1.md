# Roteiro para o Cowork: testar e publicar o PR #1 do hub-imoveis

PR: https://github.com/marcusbeda-maker/hub-imoveis/pull/1
Branch: `claude/logo-3d-flutuante-moldura-moib2m` → `main`. Sem conflitos.

## O que o PR muda

1. **Logos 3D** em `public/logo/`: só arquivos de imagem novos, nada muda nas telas.
2. **Login obrigatório nas funções `/api/*` da Vercel** (`imoveis-site`, `insta-proxy`, `grupos-proxy`, `sync-proxy`).
   Antes, quem soubesse o endereço podia, sem login, publicar no Instagram e no Facebook, mexer nos grupos de
   WhatsApp, disparar o sync do Notion e ler a base de imóveis. Agora, sem login, a resposta é **401**.
3. **Conexão com a VPS 2 pelo endereço novo** `https://api.marcusbedacorretor.com`, já que a porta antiga 5999 foi
   fechada em 08/09. Isso vale para as abas Grupos e Sincronizar e para os botões Parceiro e Drive.
4. **Skill `/brag-slim`** em `.claude/skills/`, para o Claude gerar vídeos. Não afeta o site.

## Regras para o Cowork

- **Não publicar nada de verdade.** No teste de "Publicar IG/FB", ir só até a tela de confirmação e **cancelar**.
- Não alterar a VPS, o Firebase nem as chaves. A chave `AIzaSy…` em `api/_auth.js` é a chave pública do app web,
  a mesma que já aparece no navegador. Não é segredo.
- Se algum teste falhar, **não fazer o merge**: anotar a aba, a mensagem e um print, e avisar o Marcus.

## Passo 1: conferir a Vercel (projeto hub-imoveis), antes do merge

Em **Settings → Environment Variables**, conferir que estas variáveis existem e estão marcadas em
**Production** e em **Preview**:

| Variável | Para quê | Obrigatória |
|---|---|---|
| `NOTION_TOKEN` | aba Imóveis Site | sim |
| `INSTA_API_KEY` | botões Publicar IG/FB | sim |
| `HUB_EMAILS_PERMITIDOS` | limita o acesso a e-mails específicos (separados por vírgula) | não: só se o Marcus pedir |
| `SYNC_API_BASE` | só se o endereço da VPS 2 mudar (padrão `https://api.marcusbedacorretor.com`) | não |

Se precisou marcar **Preview** em alguma variável, abra **Deployments**, faça **Redeploy** da versão de teste do PR
e espere até aparecer "Ready".

## Passo 2: testar a versão de teste (Preview), antes do merge

Abra o link **Preview** no comentário da Vercel dentro do PR, ou
https://hub-imoveis-git-claude-logo-3d-1760d4-marcusbeda-3230s-projects.vercel.app.
Se aparecer o login da Vercel, entre com a conta do Marcus.

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | Entrar no Hub com o login do Marcus | Abre normalmente |
| 2 | Aba **Imóveis Site** | A lista de imóveis do Notion carrega |
| 3 | Num imóvel: **📄 PDF** | Abre o PDF |
| 4 | Num imóvel: **🚀 Publicar IG** | Mostra a prévia e pede confirmação → **CANCELAR** |
| 5 | Aba **📋 Grupos** | Lista os grupos monitorados (pode levar alguns segundos) |
| 6 | Aba **🔄 Notion Sync** | Mostra a "Última atualização" (não precisa clicar em Atualizar) |
| 7 | Num imóvel: **🤝 Parceiro** ou **📁 Drive** | Responde sem erro de conexão |
| 8 | Numa **janela anônima**, abrir `<link-do-preview>/api/imoveis-site` | Aparece `{"erro":"nao autenticado"}`. É a trava funcionando |

## Passo 3: merge

No PR #1, clicar em **Merge pull request** → **Confirm merge**. A Vercel publica sozinha em produção em 1 a 2 minutos.

## Passo 4: depois do merge, no Hub de produção

Repetir os testes 1, 2, 5, 6 e 8 no endereço de produção do Hub na Vercel. O teste 8 deve continuar dando "nao autenticado".

## Se algo quebrar depois do merge

1. Na Vercel, abra **Deployments**, escolha a publicação anterior ao merge e clique em **⋯ → Promote to Production**.
   O Hub volta ao que era em segundos.
2. Avise o Marcus com print. Depois, no GitHub, use o botão **Revert** no PR #1 para desfazer o código.

## O que relatar ao Marcus no fim

- Variáveis conferidas (e se marcou Preview em alguma).
- Resultado de cada teste (✅ ou ❌ com a mensagem).
- Se o merge foi feito e se a produção passou nos testes do passo 4.
