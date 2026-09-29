# video-imovel — contexto do projeto (leia antes de mexer)

Plugin do Claude Code, do Marcus Béda (corretor, pessoa física), para editar
vídeo de imóvel em português: `/video-imovel <video> [formatos] [narração] [briefing]`.

## Origem e decisões (29/09/2026)
- Base: `loveforthegame/video-edit` commit `1205d8c` (MIT). Código auditado em
  29/09/2026: sem rede escondida, sem acesso a segredos. Só usa OpenAI se houver
  `OPENAI_API_KEY` no ambiente ou `.env.local` na pasta do vídeo.
- Remotion: licença grátis para pessoa física (é o caso do Marcus). Empresa com
  4+ funcionários precisa de licença paga.
- Repositório destino: `marcusbeda-maker/video-imovel` (público). Em 29/09/2026 a
  integração do Claude não tinha permissão para criar repositório (403); cópia
  provisória no branch `claude/zealous-bardeen-p276cx` do `hub-imoveis`, pasta
  `video-imovel/`.
- Regra de ouro: **nunca inventar dado de imóvel** (preço, m², quartos, bairro).
  Só o que está no briefing, na fala ou no roteiro; cada dado vai para
  `edit/ficha.md` com a fonte.

## O que foi feito
1. Português: whisper multilíngue `ggml-small`, `-l pt`, `-sow`; palavras vazias e
   frases de regravação em pt no corte (`engine/roughcut.py`). `VIDEO_EDIT_LANG` troca.
2. Kit imobiliário (`template/src/imovel.tsx`): ImovelCard, Destaques,
   Localizacao, Selo, CorretorCard, WhatsAppCta. Marca em `~/.video-imovel/marca.json`.
3. Legendas estilo Reels (`template/src/Legendas.tsx`, `engine/legendas.py`).
4. Formatos Reels 9:16 / Feed 1:1 / YouTube 16:9 (`formatos.ts`, `components/Fundo.tsx`).
5. Narração em 4 modos (`engine/narrar.py`, `components/Narracao.tsx`, `config.ts`):
   própria, arquivo gravado, sintética (edge-tts: pt-BR-FranciscaNeural feminina,
   pt-BR-AntonioNeural masculina; Piper offline só masculina pt_BR-faber-medium),
   só texto.
6. Gerador de vídeo de teste (`template/teste/`, `npm run teste:video`).
7. Instalador Windows (`instalar-windows.ps1`).

## Testado / não testado (29/09/2026, na nuvem)
- Testado: typecheck, render completo Reels, prints nos 3 formatos, legendas,
  marca preenchida, vídeo repetindo sob narração longa, modo só texto com a fala
  "Aproveite a oportunidade ... 850 mil reais, aceita financiamento ... Fale comigo agora!".
- NÃO testado: voz real do edge-tts/Piper (rede da nuvem bloqueava), vídeo real
  de ponta a ponta, `instalar-windows.ps1` (sem PowerShell na nuvem).

## Pendências
- Criar o repositório `video-imovel` no GitHub e subir (ou mover do hub-imoveis).
- Marcus preencher `%USERPROFILE%\.video-imovel\marca.json` (nome, CRECI, WhatsApp, @, logo, cores).
- Primeiro teste real no notebook; ouvir as vozes Francisca/Antonio.
- Ideias futuras: Azure Speech oficial ou ElevenLabs (voz clonada do Marcus).

## Onde fica no notebook
- Plugin instalado: `%USERPROFILE%\.claude\plugins-local\video-imovel`
- Marca e whisper: `%USERPROFILE%\.video-imovel\`
- Modelo whisper: `%USERPROFILE%\.cache\whisper-ggml\ggml-small.bin`
