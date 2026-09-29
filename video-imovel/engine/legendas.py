"""Converte o JSON do whisper-cli (palavra a palavra) em src/legendas.data.ts.

Uso:
    whisper-cli -m <modelo> -f audio.wav -l pt -ml 1 -sow -oj -of <saida>
    python legendas.py <saida>.json <template>/src/legendas.data.ts [--corrigir "errado=certo" ...]

- Junta pedaços que o whisper separou no meio de uma palavra (token sem espaço
  inicial é continuação da palavra anterior).
- Descarta marcações que não são fala: [BLANK_AUDIO], (música), [risos]...
- --corrigir troca grafias (nome de bairro, de empreendimento) sem mexer nos tempos.
  Compara ignorando maiúsculas e pontuação nas pontas da palavra.
Só usa a biblioteca padrão do Python.
"""

import argparse
import json
import re
import sys

NAO_FALA = re.compile(r"^\s*[\[\(].*[\]\)]\s*$")


def carregar_segmentos(caminho):
    with open(caminho, encoding="utf-8") as f:
        dados = json.load(f)
    return dados.get("transcription", [])


def para_palavras(segmentos):
    palavras = []
    for seg in segmentos:
        texto = seg.get("text", "")
        if not texto.strip() or NAO_FALA.match(texto):
            continue
        i = seg["offsets"]["from"] / 1000.0
        f = seg["offsets"]["to"] / 1000.0
        continua = palavras and not texto[:1].isspace() and not texto[:1] in "\"'“("
        if continua:
            palavras[-1]["t"] += texto.strip()
            palavras[-1]["f"] = max(palavras[-1]["f"], f)
            continue
        for k, parte in enumerate(texto.split()):
            # segmento com várias palavras: divide o tempo proporcionalmente
            n = len(texto.split())
            passo = (f - i) / n
            palavras.append({"t": parte, "i": i + k * passo, "f": i + (k + 1) * passo})
    # garante ordem e fim >= início
    palavras.sort(key=lambda p: p["i"])
    for p in palavras:
        p["f"] = max(p["f"], p["i"] + 0.05)
    return palavras


def aplicar_correcoes(palavras, correcoes):
    mapa = {}
    for c in correcoes:
        if "=" not in c:
            sys.exit(f"--corrigir precisa ser errado=certo, recebi: {c}")
        errado, certo = c.split("=", 1)
        mapa[errado.strip().lower()] = certo.strip()
    if not mapa:
        return palavras
    for p in palavras:
        m = re.match(r"^(\W*)(.*?)(\W*)$", p["t"])
        pre, nucleo, pos = m.group(1), m.group(2), m.group(3)
        if nucleo.lower() in mapa:
            p["t"] = pre + mapa[nucleo.lower()] + pos
    return palavras


def escrever_ts(palavras, destino):
    linhas = [
        "// GERADO por engine/legendas.py a partir do whisper (palavra a palavra).",
        "// i = início, f = fim, em segundos no vídeo final. Não edite à mão, exceto para",
        "// corrigir grafia (nomes de bairro, de empreendimento) — nunca os tempos.",
        "import type { Palavra } from './Legendas';",
        "",
        "export const LEGENDAS: Palavra[] = [",
    ]
    for p in palavras:
        linhas.append(f"  {{ t: {json.dumps(p['t'], ensure_ascii=False)}, i: {p['i']:.3f}, f: {p['f']:.3f} }},")
    linhas.append("];")
    with open(destino, "w", encoding="utf-8") as f:
        f.write("\n".join(linhas) + "\n")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("json_whisper")
    ap.add_argument("destino_ts")
    ap.add_argument("--corrigir", action="append", default=[], metavar="ERRADO=CERTO")
    a = ap.parse_args()
    palavras = aplicar_correcoes(para_palavras(carregar_segmentos(a.json_whisper)), a.corrigir)
    if not palavras:
        sys.exit("BLOCKER: o whisper não devolveu nenhuma palavra (áudio mudo ou idioma errado?)")
    escrever_ts(palavras, a.destino_ts)
    print(f"palavras={len(palavras)} inicio={palavras[0]['i']:.2f}s fim={palavras[-1]['f']:.2f}s destino={a.destino_ts}")


if __name__ == "__main__":
    main()
