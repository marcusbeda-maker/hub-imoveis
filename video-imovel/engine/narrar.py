"""Narração a partir de texto (roteiro) — voz sintética em português, ou só texto.

Uso:
    python narrar.py --roteiro roteiro.txt --voz feminina  --saida edit/narracao
    python narrar.py --roteiro roteiro.txt --voz masculina --saida edit/narracao
    python narrar.py --roteiro roteiro.txt --voz nenhuma   --saida edit/narracao   # só texto na tela
    python narrar.py --texto "Olha esse apartamento..." --voz feminina --saida edit/narracao

Motores (--motor):
    edge   (padrão) vozes neurais da Microsoft pelo serviço online do Edge. Grátis,
           sem chave, precisa de internet. feminina = pt-BR-FranciscaNeural,
           masculina = pt-BR-AntonioNeural. Aceita também --voz <ID> de outra voz
           (lista: edge-tts --list-voices). Requer: pip install edge-tts
    piper  offline, roda no computador. masculina = pt_BR-faber-medium (baixa sozinho
           ~60 MB na primeira vez). Não há voz feminina pt-BR oficial no Piper; para
           usar outra, passe --modelo <arquivo.onnx>. Requer: pip install piper-tts

Saídas (prefixo --saida):
    <saida>.mp3 (edge) ou <saida>.wav (piper)   o áudio da narração
    <saida>.json   tempos palavra a palavra no mesmo formato do whisper-cli, para
                   entrar direto em legendas.py. Com piper não sai: rode o whisper
                   no .wav (a skill faz isso).
Imprime uma linha final: motor= voz= audio= palavras= duracao=
"""

import argparse
import asyncio
import json
import os
import re
import subprocess
import sys
import wave

VOZES_EDGE = {"feminina": "pt-BR-FranciscaNeural", "masculina": "pt-BR-AntonioNeural"}
VOZES_PIPER = {"masculina": "pt_BR-faber-medium"}
TICKS = 10_000_000  # edge-tts mede tempo em unidades de 100 ns


def normalizar(p):
    return re.sub(r"[^\w]", "", p.lower())


def alinhar(fronteiras, roteiro):
    """Casa as palavras faladas (sem pontuação) com as do roteiro (com pontuação).

    fronteiras: [(texto, inicio_s, fim_s)]. Tokens do roteiro sem fala própria
    (ex.: "R$", "–") são grudados na palavra seguinte, para aparecerem na legenda.
    """
    tokens = roteiro.split()
    saida, k, pendente = [], 0, []
    for texto, i, f in fronteiras:
        alvo = normalizar(texto)
        achou = None
        for j in range(k, min(k + 4, len(tokens))):
            if normalizar(tokens[j]) == alvo or (alvo and normalizar(tokens[j]).startswith(alvo)):
                achou = j
                break
        if achou is None:
            saida.append({"t": texto, "i": i, "f": f})
            continue
        pendente += tokens[k:achou]
        palavra = " ".join(pendente + [tokens[achou]])
        pendente, k = [], achou + 1
        # palavra dita em vários pedaços (ex.: número longo) vem em fronteiras seguidas
        if saida and saida[-1].get("_tok") == achou:
            saida[-1]["f"] = f
            continue
        saida.append({"t": palavra, "i": i, "f": f, "_tok": achou})
    if k < len(tokens) and saida:
        saida[-1]["t"] += " " + " ".join(tokens[k:])  # sobra no fim (pontuação solta)
    for p in saida:
        p.pop("_tok", None)
    return saida


def escrever_json_whisper(palavras, destino):
    seg = [
        {"offsets": {"from": int(p["i"] * 1000), "to": int(p["f"] * 1000)}, "text": " " + p["t"]}
        for p in palavras
    ]
    with open(destino, "w", encoding="utf-8") as f:
        json.dump({"transcription": seg}, f, ensure_ascii=False, indent=1)


async def _edge(texto, voz, velocidade, destino_mp3):
    import edge_tts  # noqa: import só quando usado

    com = edge_tts.Communicate(texto, voz, rate=velocidade, boundary="WordBoundary")
    fronteiras = []
    with open(destino_mp3, "wb") as f:
        async for chunk in com.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                i = chunk["offset"] / TICKS
                fronteiras.append((chunk["text"], i, i + chunk["duration"] / TICKS))
    return fronteiras


def narrar_edge(texto, voz, velocidade, saida):
    try:
        import edge_tts  # noqa: F401
    except ImportError:
        sys.exit("BLOCKER: edge-tts não instalado. Rode: pip install edge-tts")
    mp3 = saida + ".mp3"
    try:
        fronteiras = asyncio.run(_edge(texto, voz, velocidade, mp3))
    except Exception as e:  # sem internet, serviço fora do ar, voz inexistente
        sys.exit(f"BLOCKER: edge-tts falhou ({type(e).__name__}: {e}). Sem internet? Tente --motor piper.")
    if not fronteiras:
        sys.exit("BLOCKER: edge-tts não devolveu tempos de palavra.")
    palavras = alinhar(fronteiras, texto)
    escrever_json_whisper(palavras, saida + ".json")
    return mp3, palavras, palavras[-1]["f"]


def narrar_piper(texto, voz, modelo, velocidade, saida):
    if modelo is None:
        nome = VOZES_PIPER.get(voz)
        if nome is None:
            sys.exit(
                "BLOCKER: o Piper não tem voz pt-BR feminina oficial. Use --motor edge "
                "(precisa de internet) ou passe --modelo <voz.onnx>."
            )
        pasta = os.path.expanduser("~/.cache/piper-voices")
        modelo = os.path.join(pasta, nome + ".onnx")
        if not os.path.exists(modelo):
            os.makedirs(pasta, exist_ok=True)
            r = subprocess.run([sys.executable, "-m", "piper.download_voices", nome, "--download-dir", pasta])
            if r.returncode != 0 or not os.path.exists(modelo):
                sys.exit(f"BLOCKER: não consegui baixar a voz {nome} do Piper.")
    wav = saida + ".wav"
    # velocidade "+10%" -> length_scale 1/1.10 (menor = mais rápido)
    m = re.match(r"^([+-]\d+)%$", velocidade)
    escala = 1 / (1 + int(m.group(1)) / 100) if m else 1.0
    r = subprocess.run(
        [sys.executable, "-m", "piper", "-m", modelo, "-f", wav, "--length-scale", f"{escala:.3f}",
         "--sentence-silence", "0.25"],
        input=texto, text=True, capture_output=True,
    )
    if r.returncode != 0 or not os.path.exists(wav):
        sys.exit(f"BLOCKER: piper falhou: {r.stderr.strip()[-400:]}")
    with wave.open(wav) as w:
        dur = w.getnframes() / w.getframerate()
    return wav, None, dur


def so_texto(texto, saida, inicio=0.5, palavras_por_segundo=2.4):
    """Sem voz: tempos pela velocidade de leitura, com respiro na pontuação."""
    t, palavras = inicio, []
    for tok in texto.split():
        d = max(0.28, len(tok) / 12) / (palavras_por_segundo / 2.4)
        palavras.append({"t": tok, "i": t, "f": t + d})
        t += d
        if re.search(r"[.!?…]$", tok):
            t += 0.7
        elif re.search(r"[,;:]$", tok):
            t += 0.3
    escrever_json_whisper(palavras, saida + ".json")
    return None, palavras, palavras[-1]["f"] if palavras else 0


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    fonte = ap.add_mutually_exclusive_group(required=True)
    fonte.add_argument("--roteiro", help="arquivo .txt com o texto da narração")
    fonte.add_argument("--texto", help="texto da narração direto no comando")
    ap.add_argument("--voz", default="feminina", help="feminina | masculina | nenhuma | ID de voz do motor")
    ap.add_argument("--motor", default="edge", choices=["edge", "piper"])
    ap.add_argument("--modelo", help="(piper) caminho de outra voz .onnx")
    ap.add_argument("--velocidade", default="+0%", help='ex.: "+8%%" mais rápido, "-10%%" mais devagar')
    ap.add_argument("--saida", required=True, help="prefixo dos arquivos de saída, ex.: edit/narracao")
    a = ap.parse_args()

    if a.roteiro:
        with open(a.roteiro, encoding="utf-8") as f:
            texto = f.read()
    else:
        texto = a.texto
    texto = " ".join(texto.split())
    if not texto:
        sys.exit("BLOCKER: roteiro vazio.")
    os.makedirs(os.path.dirname(os.path.abspath(a.saida)), exist_ok=True)

    if a.voz == "nenhuma":
        audio, palavras, dur = so_texto(texto, a.saida)
        motor, voz = "nenhum", "nenhuma"
    elif a.motor == "edge":
        voz = VOZES_EDGE.get(a.voz, a.voz)
        audio, palavras, dur = narrar_edge(texto, voz, a.velocidade, a.saida)
        motor = "edge"
    else:
        voz = a.voz
        audio, palavras, dur = narrar_piper(texto, a.voz, a.modelo, a.velocidade, a.saida)
        motor = "piper"

    n = len(palavras) if palavras is not None else "rodar-whisper"
    print(f"motor={motor} voz={voz} audio={audio or '-'} palavras={n} duracao={dur:.2f}")


if __name__ == "__main__":
    main()
