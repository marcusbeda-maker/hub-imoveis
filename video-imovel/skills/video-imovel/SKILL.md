---
name: video-imovel
description: "Edita vídeo de imóvel do começo ao fim, em português: vídeo bruto entra, vídeo pronto para Reels/Feed/YouTube sai. Narração com a voz do próprio vídeo, áudio gravado à parte, voz sintética pt-BR feminina ou masculina a partir de um roteiro, ou só texto na tela. Use com /video-imovel <arquivo> [formatos] [briefing]. Transcreve a narração localmente (whisper.cpp, sem chave de API), corta silêncios e regravações, coloca legendas estilo Reels palavra a palavra, cards de imóvel (preço, quartos, vagas, m², bairro, diferenciais, localização), selo, cartão do corretor e botão de WhatsApp, e renderiza em 9:16, 1:1 e/ou 16:9 no Remotion. Use quando pedirem para editar vídeo de imóvel, fazer Reels de apartamento/casa, colocar legenda em vídeo, ou transformar gravação bruta em anúncio."
---

# /video-imovel — do vídeo bruto ao anúncio pronto

Uma chamada, uma execução autônoma. O corretor entrega o vídeo bruto e, se
quiser, um briefing em texto livre. Você entrega o vídeo editado em cada
formato pedido, com legendas e gráficos rodando **por cima** do vídeo, e um
registro de cada decisão que tomou por ele.

Chamada:

```
/video-imovel <arquivo> [reels|feed|youtube|todos] [narração] [briefing livre]
```

Exemplos:
- `/video-imovel C:\videos\apto-bueno.mp4 reels,feed apartamento 3 quartos no Setor Bueno, R$ 850 mil, CTA WhatsApp`
- `/video-imovel C:\videos\tour.mp4 reels voz feminina roteiro: Aproveite a oportunidade de ter esse imóvel único pelo valor de 850 mil reais, aceita financiamento. Fale comigo agora!`
- `/video-imovel C:\videos\tour.mp4 todos narração C:\audios\minha-voz.m4a`
- `/video-imovel C:\videos\tour.mp4 reels só texto roteiro: C:\textos\roteiro.txt`

**Ninguém está olhando esta execução.** Você não pergunta, não para para
aprovação e não apresenta opções. Toda escolha vira inferência mais uma
suposição registrada. A seção Autonomia vale para todos os passos.

## Idioma

A narração é em **português do Brasil**, a menos que `VIDEO_EDIT_LANG` diga
outro idioma. Todo `whisper-cli` usa `-l pt` (ou `-l $VIDEO_EDIT_LANG`) e o
modelo multilíngue `ggml-small.bin`, **nunca** um modelo `.en`. Todo texto na
tela, o `decisions.md` e o relatório final são em português natural, com acento.

## Autonomia

1. **Nunca pergunte. Deduza e registre.** O que você perguntaria é decidido com
   base em evidência e escrito em `edit/decisions.md`, com a evidência e a
   alternativa descartada.
2. **Nenhuma checagem trava a execução.** Toda checagem tem um caminho de
   degradação: tentar com outros parâmetros, cair para a variante mais segura,
   ou entregar e declarar o defeito. "Parar e perguntar" nunca é um deles.
3. **Pare só por bloqueio, nunca por preferência.** Arquivo ilegível, ou
   `ffmpeg`/`whisper-cli` ausente que você não conseguiu instalar, é bloqueio:
   relate e pare. Briefing ausente, preset em dúvida, corte incerto — são
   preferências. Decida.
4. **Retome, não recomece.** Cada etapa grava um arquivo ligado ao hash do vídeo.
   Numa nova execução, reaproveite o que ainda vale.
5. **Declare as suposições no relatório final**, não no meio da execução.

## Regras de ouro (correção — inegociáveis)

1. **Nunca invente dado do imóvel.** Preço, metragem, quartos, suítes, vagas,
   bairro, andar, distâncias, condomínio: só entra na tela o que está no
   briefing, na narração ou num texto que já aparece no vídeo. Sem fonte, o
   campo fica de fora — o componente simplesmente não o mostra. Número
   entendido de forma ambígua na transcrição ("oitocentos e cinquenta" pode ser
   850 mil ou 850 reais de condomínio) vai para a tela só se o contexto da frase
   deixar claro; senão, fica de fora e é registrado em `decisions.md`.
2. **Leia `edit/footage.md` inteiro antes de montar o mapa de cenas.** Nunca use
   grep para achar só os tempos que você acha que precisa. Se passar de uma
   leitura, leia em sequência com `offset`/`limit` até cobrir todas as linhas.
3. **Nunca coloque gráfico numa célula marcada `F` ou `t` naquele instante.**
4. **A fala decide *quando*, a grade decide *onde*.** O tempo vem do whisper
   palavra a palavra; a posição vem do `footage.md`. Em conflito sobre posição,
   a grade vence.
5. **Preset vira números explícitos antes do uso.** Nada de tempo inventado na
   hora. O mesmo vale para o corte: use um preset de ritmo nomeado.
6. **A percepção fica em cache pelo hash do vídeo.** Só rode o scout de novo se
   o arquivo ou a taxa de amostragem mudar.
7. **Nunca resuma o `footage.md` para economizar contexto.** Se não couber,
   declare no relatório e use só o cabeçalho do modo A com comportamento de
   `confidence: low`.
8. **O QA afirma, não impressiona.** A checagem de render passa por asserções
   (células, caixas, colisões), nunca por "parece bom". Três passadas no máximo;
   depois entregue e declare o que ainda está errado.
9. **O scout nunca vê o briefing nem o plano.** A cegueira dele é o que torna a
   leitura confiável.

## Marca do corretor

A identidade fica em `~/.video-imovel/marca.json` (no Windows,
`%USERPROFILE%\.video-imovel\marca.json`) e o logo na mesma pasta:

```json
{
  "nome": "Nome do Corretor",
  "creci": "12345-F",
  "whatsapp": "62999998888",
  "instagram": "@usuario",
  "logo": "logo.png",
  "cor": "#1B6E4B",
  "cor2": "#C9A45C",
  "fonte": "'Montserrat', 'Segoe UI', Arial, sans-serif"
}
```

- Se o arquivo não existir, crie-o a partir de `template/src/marca.json`,
  registre em `decisions.md` que a marca está com valores padrão e **não use**
  `CorretorCard` nem o número no `WhatsAppCta` (nome "Seu Nome" na tela é
  defeito). Avise no relatório final como preencher.
- Campo vazio = elemento não aparece. Nunca invente CRECI, telefone ou @.
- `cor` e `cor2` sobrepõem as cores do preset (`presetDaMarca`).

## Narração — quatro modos

Decida o modo pelo comando; na dúvida, `propria`. Registre em `decisions.md`.

| Modo | Como pedir | O que acontece |
|---|---|---|
| **propria** (padrão) | nada, ou "minha voz" | A voz é o áudio do próprio vídeo. Fluxo normal: whisper, corte, legendas. |
| **arquivo** | "narração <caminho do áudio>" | Áudio gravado à parte pelo corretor (celular, gravador). Vai para `public/`, toca por cima do vídeo; o som do vídeo fica em 0,15. Legendas: whisper nesse áudio. |
| **sintetica** | "voz feminina" / "voz masculina" + roteiro | `engine/narrar.py` gera a voz em português a partir do roteiro. Legendas saem dos tempos da própria voz (não precisa de whisper com `--motor edge`). Som do vídeo em 0,15. |
| **texto** | "só texto" / "sem narração" + roteiro | Sem voz. O roteiro vira legenda no ritmo de leitura (`narrar.py --voz nenhuma`). Som do vídeo em 0,3 (ambiente). |

**Roteiro** (modos sintetica e texto): o texto depois de `roteiro:` no comando,
ou um arquivo `.txt` indicado. Sem roteiro, escreva um curto (até ~25 s de
fala) **só com dados da ficha** — nada inventado — e registre `roteiro: escrito
pelo agente` com o texto em `decisions.md`. Números: escreva como se fala
naturalmente ("850 mil reais"); o card mostra "R$ 850.000".

**Gerar a voz:**

```bash
python <plugin>/engine/narrar.py --roteiro edit/roteiro.txt --voz feminina  --saida edit/narracao   # pt-BR-FranciscaNeural
python <plugin>/engine/narrar.py --roteiro edit/roteiro.txt --voz masculina --saida edit/narracao   # pt-BR-AntonioNeural
python <plugin>/engine/narrar.py --roteiro edit/roteiro.txt --voz nenhuma   --saida edit/narracao   # só texto
```

- Motor padrão `edge` (vozes neurais da Microsoft, grátis, sem chave, precisa de
  internet). `--velocidade "+8%"` acelera um pouco — bom para Reels.
- Sem internet (`BLOCKER: edge-tts falhou`): `--motor piper` gera a voz
  **masculina** offline (`pt_BR-faber-medium`). Não existe voz feminina pt-BR
  oficial no Piper: nesse caso caia para `masculina` e registre, ou use
  `--modelo <voz.onnx>` se `~/.video-imovel/vozes/` tiver outra voz. Com piper,
  rode o whisper no `.wav` para ter as legendas.
- A saída `edit/narracao.json` tem o formato do whisper: entra direto em
  `legendas.py` (passo 5).

**Duração com narração:** o vídeo final dura a narração + ~1 s. Se o vídeo
bruto for mais curto, `<Fundo>` repete o vídeo (registre); se for mais longo,
o final é cortado no fim da narração. Nos modos arquivo/sintetica/texto **não
rode o corte bruto** (passo 3/4): o vídeo vira imagem de apoio e a narração
manda no tempo.

## Passo 0 — Dependências (resolva sem alarde, instale só o que falta)

No Windows, o jeito mais simples é o instalador do plugin, que faz tudo de uma vez:
`powershell -ExecutionPolicy Bypass -File "<plugin>\instalar-windows.ps1"`.

| Ferramenta | Checagem | Instalar (Windows) | Instalar (macOS/Linux) |
|---|---|---|---|
| Node.js 18+ | `node --version` | `winget install OpenJS.NodeJS.LTS` | `brew install node` / pacote da distro |
| ffmpeg | `ffmpeg -version` | `winget install Gyan.FFmpeg` | `brew install ffmpeg` / `apt install ffmpeg` |
| whisper-cli | `whisper-cli --help` | rode `instalar-windows.ps1` do plugin (baixa `whisper-bin-x64.zip` v1.8.3 do GitHub oficial e põe no PATH) | `brew install whisper-cpp` |
| uv (só se houver corte) | `uv --version` | `winget install astral-sh.uv` | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| Python 3.10+ (legendas) | `python --version` (no Windows, se falhar ou abrir a Microsoft Store, use `py`) | `winget install Python.Python.3.12` | já vem / pacote da distro |
| edge-tts (só modo sintetica) | `edge-tts --help` | `pip install edge-tts` | igual |
| piper-tts (só sem internet) | `python -m piper --help` | `pip install piper-tts` | igual |
| Modelo whisper multilíngue | `~/.cache/whisper-ggml/ggml-small.bin` existe | `curl -sL -o ~/.cache/whisper-ggml/ggml-small.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin` (crie a pasta antes; ~466 MB) | igual |

O Remotion não precisa de instalação global: o passo 6 roda `npm install` na
cópia de trabalho do `template/`.

Efeitos sonoros são opcionais e não vêm junto (licença). Ordem de busca: pasta
`sfx/` ao lado do vídeo → `~/.video-imovel/sfx/` → renderizar sem SFX (apague as
linhas `<Audio>`). Nunca trave por falta de SFX.

## Passo 1 — Entrada (sem perguntas)

**Formatos.** Do comando: `reels` (9:16, 1080x1920), `feed` (1:1, 1080x1080),
`youtube` (16:9, 1920x1080), ou `todos`. Sem indicação: o formato mais próximo
da proporção do vídeo bruto (vertical → reels; horizontal → youtube; quadrado →
feed). Registre a regra que decidiu.

**Briefing.** Extraia dele: tipo do imóvel e negócio (venda/aluguel), preço,
bairro/cidade, quartos, suítes, vagas, m², diferenciais, CTA. Sem briefing,
extraia da transcrição depois do passo 2 e registre `briefing: deduzido`.
Monte a **ficha** em `edit/ficha.md` com cada dado e a fonte dele (briefing,
narração com o tempo em segundos, ou texto na tela). Dado sem fonte não entra
na ficha (regra de ouro 1).

**Preset.** Decida pelo cabeçalho do modo A e pela ficha:

| Evidência | Preset | Visual |
|---|---|---|
| vídeo claro, apresentação do corretor ou tour do imóvel | **glass** | cartões translúcidos, molas suaves — o padrão |
| alto padrão, luxo, "exclusivo", valor alto, ritmo calmo | **minimal** | branco quase opaco, fio fino, serifa |
| vídeo escuro, noturno, tour com pouca luz | **dark-hud** | painéis escuros, borda luminosa |
| ritmo rápido, tom de oportunidade/"queima", fala alta | **neo-brutal** | branco sólido, contorno preto grosso, sombra dura |

Empate fica com `glass`. As cores vêm de `marca.json`; sem marca, do padrão do
preset.

## Passo 2 — Perceber (modo A) e transcrever

1. `ffprobe`: resolução, fps, duração, se tem áudio.
2. Despache **`video-imovel:footage-scout`** com o caminho do vídeo e `global`.
   Ele devolve `path=` / `rows=` / `samples=`. Leia `edit/footage.md` você mesmo.
   **Você nunca olha os quadros brutos.**
3. Extraia WAV 16 kHz mono e transcreva frases:
   `whisper-cli -m <modelo> -f audio.wav -l pt -osrt -ml 60`.
4. Música de fundo já existente: meça o RMS (`astats`) num intervalo sem fala.
   Se ≥ -30 dB, há música — não acrescente trilha, SFX discretos.

**Degradação:** `confidence: low` não para a execução. Encolhe a área de
gráficos — só células `.` durante toda a cena, preferindo as laterais.

## Passo 3 — Decidir o corte (sem checkpoint)

Corte só quando a evidência diz que é gravação bruta. Registre a decisão e a
evidência em `decisions.md`:

- Silêncios ≥ o limiar do preset de ritmo, ou regravações visíveis ("vou
  repetir", "errei", frase recomeçada) → cortar.
- Fala contínua, ou `burned_in_text` presente → não cortar.

| Ritmo | `RC_SILENCE_MERGE` | `RC_MIN_CHUNK` | Quando usar |
|---|---:|---:|---|
| calmo | 1.2 | 1.0 | alto padrão, tour longo, fala pausada |
| medido | 0.9 | 1.0 | explicação, apresentação de planta, bairro |
| ritmado | 0.6 | 0.6 | **padrão** — anúncio curto, Reels de corretor |
| energético | 0.3 | 0.4 | oportunidade, gancho rápido, vídeo muito curto |

`RC_SILENCE_MERGE` é limiar de *junção*: pausas menores que ele são absorvidas,
então **maior = mais calmo**. Nunca corte dentro de uma frase dita de forma
fluente; várias emendas numa frase só indicam erro na conta dos silêncios.

## Passo 4 — Corte bruto (só se decidido)

```bash
cd <plugin>/engine
RC_SILENCE_MERGE=<preset> RC_MIN_CHUNK=<preset> \
PYTHONPATH=. uv run --no-project --with "openai,rapidfuzz,numpy" python roughcut.py "<video>"
```

- Sem `OPENAI_API_KEY`, usa o whisper-cli local automaticamente (em português).
  Se houver `OPENAI_API_KEY` no ambiente ou `.env.local` na pasta, o áudio vai
  para a OpenAI e é cobrado — registre isso em `decisions.md`.
- Confirme que a transcrição de saída ainda tem a primeira e a última frase.
  **Degradação:** se o gancho ou o CTA sumiu, suba um preset mais calmo e rode
  de novo. Se sumir outra vez, fique com o vídeo sem corte e registre por quê.

## Passo 5 — Perceber o vídeo final (modo B), legendas e mapa de cenas

1. Despache **`video-imovel:footage-scout`** de novo, no vídeo *cortado*, taxa `1`.
   Confira `rows == samples`; se não bater, despache mais uma vez e siga com
   comportamento de `confidence: low`.
2. Leia `edit/footage.md` inteiro (regra de ouro 2).
3. Palavra a palavra no áudio que **fala** no vídeo final (o do vídeo em
   `propria`; o arquivo gravado em `arquivo`; o `.wav` em sintetica/piper). Em
   sintetica/edge e em texto, pule este item: use `edit/narracao.json`.
   `whisper-cli -m <modelo> -f audio-final.wav -l pt -ml 1 -sow -oj -of edit/palavras`
   (`-sow` separa por palavra, não por pedaço de palavra).
4. **Legendas:** ligadas por padrão. Desligue só se `burned_in_text` indicar
   legenda já queimada no vídeo (registre). Gere os dados:
   `python <plugin>/engine/legendas.py edit/palavras.json <trabalho>/src/legendas.data.ts`
   (ou `edit/narracao.json` nos modos sintetica/texto). No modo texto as
   legendas são o único conteúdo falado: nunca desligue.
   Corrija grafias de nomes próprios com `--corrigir "errado=Certo"` (bairro,
   empreendimento, rua) usando a ficha como referência. Nunca mexa nos tempos.
5. Converta as palavras em batidas (frases) com início/fim em quadros no fps do
   vídeo. Cada batida ganha **uma** cena que MOSTRA o que está sendo dito:
   preço dito → `ImovelCard`; bairro e o que tem perto → `Localizacao`;
   diferenciais listados → `Destaques` (um item surge quando é falado —
   ajuste `intervalo`); "pronto para morar", "aceita financiamento" → `Selo`;
   convite para contato → `WhatsAppCta` (+ `CorretorCard` se a marca estiver
   preenchida). Frase sem conteúdo visualizável fica sem cena — legenda basta.
6. Escolha a posição de cada cena (`v`: topo/meio/base, `h`:
   esquerda/centro/direita) só entre células livres durante toda a batida
   (regras 3 e 4). `meio` quase sempre cai no rosto de quem fala.

## Passo 6 — Montar e deixar o crítico escolher

1. Copie `template/` para uma pasta de trabalho. `npm install --no-audit --no-fund`.
2. Vídeo em `public/footage.mp4`; SFX em `public/sfx/`; `marca.json` em
   `src/marca.json`; logo em `public/<logo>`; áudio da narração (modos arquivo e
   sintetica) em `public/narracao.<ext>`.
3. Preencha `src/config.ts` com valores medidos (ffprobe): `FPS`, `ORIGEM`
   (largura, altura e quadros do vídeo), `DURACAO_FRAMES` (vídeo final; com
   narração, narração + ~1 s) e `NARRACAO` (modo, arquivo, volumeOriginal,
   quadro de início).
4. Escreva `src/Timeline.tsx` a partir de `src/Timeline.exemplo-imovel.tsx`
   (vídeo com a voz do corretor) ou `src/Timeline.exemplo-texto.tsx` (roteiro
   em texto ou voz sintética):
   - `<Fundo origem={ORIGEM} volume={NARRACAO.volumeOriginal} />` e `<Narracao />`
     sempre primeiro. Ele adapta o vídeo a cada
     formato: corta as bordas quando a proporção é parecida, ou centraliza com
     fundo desfocado quando é muito diferente (vertical em 16:9).
   - Cenas do kit imobiliário (`src/imovel.tsx`), que se adaptam a qualquer
     formato:
     - `ImovelCard` — rótulo, preço com contador, bairro, chips de quartos/suítes/vagas/m²/andar
     - `Destaques` — lista de diferenciais com check que se desenha
     - `Localizacao` — pin que cai e pulsa, bairro/cidade, proximidades com tempo
     - `Selo` — carimbo curto ("Pronto para morar", "Aceita financiamento")
     - `CorretorCard` — logo, nome, CRECI, @ (de `marca.json`)
     - `WhatsAppCta` — botão verde pulsando com toque e número da marca
   - `<Legendas p={p} palavras={LEGENDAS} />` por último, por cima de tudo.
   - As cenas genéricas de `src/scenes.tsx` (`NotificationStack`, `BrandCard`,
     `SideToggleCard`, `TaskAutomation`, `ApprovePanel`, `CtaPill`) foram
     desenhadas só para 1080x1920: use apenas quando o único formato for reels.
   - Cena nova no mesmo estilo quando a narração pedir algo que o kit não cobre:
     SVG feito à mão, `spring`, `dampedSettle`, tudo função pura do quadro,
     tamanhos multiplicados por `useLayout().u`.
5. `npm run checar` (verificação de tipos) precisa passar antes de renderizar.
6. **Produza 2 a 4 variantes**, diferentes em posição e escolha de cena — não em
   preset. Renderize só quadros parados (segundos, não minutos), um por cena,
   **em cada formato pedido**:
   `npx remotion still src/index.ts <Reels|Feed|YouTube> <saida>.png --frame <n>`
7. Despache **`video-imovel:edit-critic`** no modo `plan` com o briefing,
   `footage.md`, o manifesto e os quadros. Fique com a variante do `verdict`.
   **Degradação:** se a vencedora ainda tem falhas graves, corrija as cenas
   citadas e rode o crítico mais uma vez. Depois siga de qualquer jeito.

### Regras de layout

- A faixa de baixo é das **legendas**. Cards nunca entram nela; `v="base"` já
  fica acima dela.
- As margens seguras de cada formato já vêm de `useLayout()` (Reels: fora dos
  280 px de cima e 422 px de baixo). Não posicione texto importante fora delas.
- NUNCA cubra olhos ou boca. NUNCA cubra texto já queimado no vídeo.
- Áudio original intocado; SFX por cima com volume ≤ 0,45.
- Os gráficos rodam por cima do vídeo em movimento. Tela final parada sozinha é
  falha.
- Sempre algo se mexendo: entrada com spring, flutuação com `floatY`, saída
  antes do fim da sequência.

## Passo 7 — Renderizar e auditar (máx. 2 voltas de correção)

1. Para cada formato pedido:
   `npx remotion render src/index.ts <Reels|Feed|YouTube> <saida>-<formato>.mp4 --codec h264 --crf 17`
   (rode em segundo plano; demora minutos).
2. Despache **`video-imovel:edit-critic`** no modo `render` com `footage.md`, o
   manifesto e o mp4 do formato principal. Nos demais formatos, confira pelo
   menos um quadro parado por cena.
3. Em `verdict=fail`, corrija as cenas citadas e renderize de novo. No máximo
   duas voltas; depois entregue e copie os achados restantes no relatório.

## Passo 8 — Entregar

MP4s em `exports/final/` ao lado do vídeo bruto, nomeados
`<nome>-reels.mp4`, `<nome>-feed.mp4`, `<nome>-youtube.mp4`, junto com
`edit/decisions.md` e `edit/ficha.md`. Abra a pasta. Relate em português:
duração, formatos, modo de narração (e a voz usada), cenas montadas, preset e a
regra que o escolheu, o que foi cortado, os dados do imóvel mostrados **com a fonte de cada um**, toda
suposição feita, e qualquer achado do crítico que foi entregue mesmo assim. Não
cole transcrição nem conteúdo de arquivo no chat.

`edit/decisions.md` acumula entre execuções — acrescente, nunca sobrescreva.

## Testar sem vídeo

`template/teste/` gera um vídeo falso (sala + pessoa falando + relógio na tela):

```bash
cd <trabalho>
npm run teste:video            # public/footage.mp4 em 9:16
npm run teste:video:quadrado   # 1:1
npm run teste:video:horizontal # 16:9
npm run teste:imagem           # teste.png, um quadro
```

## O que não fazer

- **Inventar preço, metragem ou qualquer dado do imóvel.** Um número errado num
  anúncio é pior do que nenhum número. Vale também para o roteiro que você
  escreve para a voz sintética.
- **Deixar a voz sintética falando por cima da voz original** em volume alto.
  Nos modos arquivo/sintetica o som do vídeo fica em 0,15.
- **Perguntar qualquer coisa.** Não há usuário no circuito.
- **Olhar quadros brutos na conversa principal.** É trabalho do scout.
- **Ler `footage.md` pela metade.**
- **Passar o briefing para o scout.**
- **Deixar o crítico propor correção**, ou tomar o silêncio dele como aprovação.
- **Renderizar variantes inteiras para comparar.** Quadros parados respondem a
  mesma pergunta em segundos.
- **Decoração genérica.** Se a cena não mostra a frase que está por baixo dela,
  corte a cena.
- **Card na faixa das legendas** ou legenda por cima de texto já queimado.
- **Entregar em silêncio com defeito grave.** Entregar declarando o defeito,
  tudo bem; sem declarar, não.
- **Rodar a percepção de novo em vídeo que não mudou.**
