// Legendas estilo Reels: poucas palavras por vez, palavra falada em destaque.
// Os dados vêm de legendas.data.ts (gerado por engine/legendas.py).
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Preset } from './presets';
import { useLayout } from './formatos';

export type Palavra = { t: string; i: number; f: number };

/** Agrupa palavras em "telas" curtas: quebra por pausa, pontuação ou tamanho. */
export const paginar = (palavras: Palavra[], maxPalavras: number, maxLetras: number): Palavra[][] => {
  const paginas: Palavra[][] = [];
  let atual: Palavra[] = [];
  const letras = () => atual.reduce((n, p) => n + p.t.length + 1, 0);
  palavras.forEach((p, k) => {
    const anterior = palavras[k - 1];
    const pausa = anterior ? p.i - anterior.f : 0;
    const fimDeFrase = anterior ? /[.!?…]$/.test(anterior.t) : false;
    if (atual.length && (atual.length >= maxPalavras || letras() + p.t.length > maxLetras || pausa > 0.45 || fimDeFrase)) {
      paginas.push(atual);
      atual = [];
    }
    atual.push(p);
  });
  if (atual.length) paginas.push(atual);
  return paginas;
};

export const Legendas: React.FC<{
  p: Preset;
  palavras: Palavra[];
  estilo?: 'destaque' | 'caixa' | 'simples';
  maiusculas?: boolean;
  /** distância extra da base, em px de 1080 (sobe a legenda se algo ocupa a base) */
  elevar?: number;
}> = ({ p, palavras, estilo = 'destaque', maiusculas = true, elevar = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const u = L.u;
  const t = frame / fps;
  const paginas = paginar(palavras, L.horizontal ? 6 : 4, L.horizontal ? 38 : 22);
  const pag = paginas.find((pg, k) => {
    const prox = paginas[k + 1];
    const fim = prox ? Math.min(prox[0].i, pg[pg.length - 1].f + 0.6) : pg[pg.length - 1].f + 0.6;
    return t >= pg[0].i - 0.05 && t < fim;
  });
  if (!pag) return null;
  const entradaPag = spring({ frame: frame - Math.round(pag[0].i * fps), fps, config: { damping: 14, stiffness: 200 }, durationInFrames: 12 });
  const tamanho = (L.horizontal ? 58 : 68) * u;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: L.seguro.lado,
          right: L.seguro.lado,
          bottom: L.seguro.base + elevar * u,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: `${6 * u}px ${16 * u}px`,
          fontFamily: p.font,
          fontSize: tamanho,
          fontWeight: 900,
          lineHeight: 1.15,
          textTransform: maiusculas ? 'uppercase' : 'none',
          transform: `translateY(${(1 - entradaPag) * 24 * u}px)`,
          opacity: entradaPag,
        }}
      >
        {pag.map((w, k) => {
          const falando = t >= w.i && t < w.f + 0.05;
          const jaFalou = t >= w.i;
          const pop = spring({ frame: frame - Math.round(w.i * fps), fps, config: { damping: 10, stiffness: 260 }, durationInFrames: 10 });
          const destaque = estilo !== 'simples' && falando;
          return (
            <span
              key={k}
              style={{
                color: estilo === 'destaque' && destaque ? p.accent2 : '#fff',
                background: estilo === 'caixa' && destaque ? p.accent : 'transparent',
                borderRadius: 12 * u,
                padding: `0 ${10 * u}px`,
                WebkitTextStroke: `${(estilo === 'caixa' && destaque ? 0 : 7) * u}px #000`,
                paintOrder: 'stroke fill',
                textShadow: `0 ${4 * u}px ${14 * u}px rgba(0,0,0,0.55)`,
                opacity: jaFalou || estilo === 'simples' ? 1 : 0.55,
                transform: `scale(${destaque ? 1 + 0.08 * pop : 1})`,
                display: 'inline-block',
              }}
            >
              {w.t}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
