# Third-party notices

## Projeto base: video-edit

Este plugin é uma adaptação de **video-edit** de Abhinav
https://github.com/loveforthegame/video-edit (commit 1205d8c) — MIT License.

Alterações no video-imovel:
- Transcrição em português por padrão (modelo multilíngue `ggml-small`, `-l pt`, `-sow`), idioma trocável por `VIDEO_EDIT_LANG`
- Palavras vazias e frases de regravação em português no corte automático
- Kit imobiliário (`template/src/imovel.tsx`, `components/IconesImovel.tsx`), marca do corretor (`marca.json`)
- Legendas estilo Reels palavra a palavra (`template/src/Legendas.tsx`, `engine/legendas.py`)
- Formatos 9:16, 1:1 e 16:9 (`template/src/formatos.ts`, `components/Fundo.tsx`)
- Gerador de vídeo de teste (`template/teste/`)
- Skill reescrita em português, com regra de não inventar dado do imóvel
- Narração: `engine/narrar.py` (edge-tts / Piper, instalados à parte, não incluídos), `components/Narracao.tsx`, vídeo em repetição no `Fundo`
- `DigitRoll.tsx`: espaços preservados (`white-space: pre`) para "R$ 850.000"

## engine/roughcut.py

Adapted from **leadgenman-video-skills** by Manthan Patel
https://github.com/manthanpatelll/leadgenman-video-skills — MIT License, Copyright (c) 2026 Manthan Patel.

Modifications in this repo:
- Portable `ffmpeg` invocation (was hardcoded `/usr/local/bin/ffmpeg`)
- Local whisper.cpp fallback via `engine/local_whisper.py` when `OPENAI_API_KEY` is not set
- `RC_SILENCE_MERGE` / `RC_MIN_CHUNK` environment overrides for short-form footage
- `numpy` added to dependencies; packaging fixed for `uv run`

## template/src/lib/DigitRoll.tsx, template/src/lib/helpers/motion.ts

From **video-shotcraft** — Apache License 2.0.
Used with one change (DigitRoll keeps spaces, `white-space: pre`). See the Apache-2.0 license text: http://www.apache.org/licenses/LICENSE-2.0

## Sound effects

No audio files are bundled. The skill resolves SFX at runtime from libraries already on the user's machine (e.g. their own `sfx/` folder). Users are responsible for the licenses of audio they supply.
