# 🏠 video-imovel — vídeo de imóvel do bruto ao pronto

Plugin do Claude Code, em português. Você entrega o vídeo gravado e, se quiser,
uma frase de briefing. Ele devolve o vídeo editado para **Reels (9:16)**,
**Feed (1:1)** e/ou **YouTube (16:9)**, com:

- **Legendas estilo Reels** palavra a palavra, com a palavra falada em destaque
- **Cards de imóvel**: preço com contador, bairro, quartos, suítes, vagas, m²
- **Diferenciais** com check animado, **localização** com pin e proximidades
- **Selo** ("Pronto para morar", "Aceita financiamento")
- **Cartão do corretor** (logo, nome, CRECI, @) e **botão de WhatsApp** com o número
- Corte automático de silêncios e regravações
- **Narração em 4 modos**: sua voz no vídeo, áudio gravado à parte, **voz
  sintética pt-BR feminina ou masculina** a partir de um roteiro, ou só texto

Tudo roda no seu computador: a transcrição é local (whisper.cpp), sem chave de
API e sem mandar o vídeo para lugar nenhum.

> **Regra do plugin:** nenhum dado do imóvel é inventado. Preço, metragem,
> quartos etc. só aparecem se estiverem no briefing ou na sua fala.

## Instalar

Dentro do Claude Code:

```
/plugin marketplace add marcusbeda-maker/video-imovel
/plugin install video-imovel@video-imovel
```

Na primeira execução ele instala o que faltar (Node.js, ffmpeg, whisper-cpp,
uv) e baixa o modelo de transcrição multilíngue (~466 MB, uma vez só).

## Configurar sua marca (uma vez)

Crie `%USERPROFILE%\.video-imovel\marca.json` (Windows) ou
`~/.video-imovel/marca.json` (macOS/Linux) e ponha o logo na mesma pasta:

```json
{
  "nome": "Seu Nome",
  "creci": "12345-F",
  "whatsapp": "62999998888",
  "instagram": "@seuusuario",
  "logo": "logo.png",
  "cor": "#1B6E4B",
  "cor2": "#C9A45C",
  "fonte": "'Montserrat', 'Segoe UI', Arial, sans-serif"
}
```

Campo vazio não aparece no vídeo. Sem esse arquivo, o vídeo sai sem cartão do
corretor e sem número no botão de WhatsApp.

## Usar

```
/video-imovel C:\videos\apto.mp4
/video-imovel C:\videos\apto.mp4 reels,feed apartamento 3 quartos no Setor Bueno, R$ 850 mil, CTA WhatsApp
/video-imovel C:\videos\casa.mp4 todos casa alto padrão, 4 suítes, Alphaville
```

Saída em `exports/final/` ao lado do vídeo, mais `edit/decisions.md` (tudo o
que ele decidiu e por quê) e `edit/ficha.md` (cada dado mostrado e de onde veio).

## Narração

| Modo | Exemplo de comando |
|---|---|
| Sua voz (no próprio vídeo) | `/video-imovel apto.mp4 reels` |
| Áudio gravado à parte | `/video-imovel apto.mp4 reels narração C:\audios\minha-voz.m4a` |
| Voz feminina | `/video-imovel apto.mp4 reels voz feminina roteiro: Aproveite a oportunidade...` |
| Voz masculina | `/video-imovel apto.mp4 reels voz masculina roteiro: C:\textos\roteiro.txt` |
| Só texto | `/video-imovel apto.mp4 reels só texto roteiro: Aproveite a oportunidade...` |

Vozes sintéticas (grátis, sem chave, precisam de internet), pelo
[edge-tts](https://github.com/rany2/edge-tts):
**Francisca** (feminina, `pt-BR-FranciscaNeural`) e **Antonio** (masculina,
`pt-BR-AntonioNeural`). Sem internet, a voz masculina offline é a
`pt_BR-faber-medium` do [Piper](https://github.com/OHF-Voice/piper1-gpl) — o
Piper não tem voz feminina pt-BR oficial.

> O edge-tts usa o serviço de leitura em voz alta do navegador Edge, que não é
> uma API oficial da Microsoft para uso comercial. Para anúncios em volume, a
> alternativa oficial é o Azure Speech (as mesmas vozes, com chave e cota
> grátis mensal) ou um serviço pago como a ElevenLabs.

### Instalar as vozes (passo a passo, Windows)

No PowerShell:

```powershell
pip install edge-tts
edge-tts --voice pt-BR-FranciscaNeural --text "Aproveite a oportunidade de ter esse imóvel único pelo valor de 850 mil reais, aceita financiamento, além da ótima localização. Fale comigo agora!" --write-media "$env:USERPROFILE\Desktop\voz-feminina.mp3"
edge-tts --voice pt-BR-AntonioNeural --text "Aproveite a oportunidade de ter esse imóvel único pelo valor de 850 mil reais, aceita financiamento, além da ótima localização. Fale comigo agora!" --write-media "$env:USERPROFILE\Desktop\voz-masculina.mp3"
```

Os dois MP3 aparecem na Área de Trabalho. As vozes do edge-tts não são
baixadas: são geradas online na hora.

Voz offline (opcional, só masculina):

```powershell
pip install piper-tts
python -m piper.download_voices pt_BR-faber-medium --download-dir "$env:USERPROFILE\.cache\piper-voices"
```

## Testar sem gravar nada

O template traz um gerador de vídeo falso (sala + pessoa + relógio na tela):

```bash
cd template
npm install
npm run teste:video      # cria public/footage.mp4 (9:16, 15 s)
npm run reels            # renderiza o exemplo de imóvel em saida-reels.mp4
npm run feed
npm run youtube
```

## Estrutura

```
video-imovel/
├── .claude-plugin/            # plugin.json + marketplace.json
├── skills/video-imovel/SKILL.md   # o passo a passo que o agente segue
├── agents/
│   ├── footage-scout.md       # lê os quadros e marca rosto/texto numa grade 3x3 (não vê o briefing)
│   └── edit-critic.md         # crítico que tenta reprovar a edição
├── engine/
│   ├── perceive.sh            # amostrador de quadros
│   ├── roughcut.py            # corte de silêncios e regravações
│   ├── local_whisper.py       # whisper.cpp local, em português
│   └── legendas.py            # JSON do whisper → legendas do vídeo
└── template/                  # projeto Remotion
    ├── src/imovel.tsx         # kit imobiliário
    ├── src/Legendas.tsx       # legendas estilo Reels
    ├── src/formatos.ts        # 9:16, 1:1, 16:9 e margens seguras
    ├── src/components/Fundo.tsx   # adapta o vídeo a cada formato
    ├── src/Timeline.exemplo-imovel.tsx
    └── teste/                 # gerador de vídeo de teste
```

## Idioma

Português por padrão. Para vídeo em outro idioma, defina `VIDEO_EDIT_LANG`
(ex.: `en`, `es`) antes de rodar.

## Licenças

- Código: MIT. Adaptação do [video-edit](https://github.com/loveforthegame/video-edit)
  de Abhinav (MIT) — detalhes em `THIRD_PARTY_NOTICES.md`.
- **Remotion** (usado para renderizar) tem licença própria: grátis para pessoa
  física e empresas de até 3 funcionários, inclusive para uso comercial; empresas
  maiores precisam de licença paga. Veja
  [LICENSE do Remotion](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
