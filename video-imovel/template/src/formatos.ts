import { useVideoConfig } from 'remotion';

/** Formatos de saída. A skill renderiza a composição de cada formato pedido. */
export const FORMATOS = {
  Reels: { width: 1080, height: 1920, rotulo: '9:16 Reels / Stories / TikTok' },
  Feed: { width: 1080, height: 1080, rotulo: '1:1 Feed' },
  YouTube: { width: 1920, height: 1080, rotulo: '16:9 YouTube' },
} as const;

export type NomeFormato = keyof typeof FORMATOS;

export type Layout = {
  w: number;
  h: number;
  /** unidade: 1 = 1px num quadro de 1080 no lado menor. Multiplique tamanhos por u. */
  u: number;
  vertical: boolean;
  horizontal: boolean;
  /** margens seguras (interface do Instagram/TikTok/YouTube cobre essas faixas) */
  seguro: { topo: number; base: number; lado: number };
};

export const useLayout = (): Layout => {
  const { width: w, height: h } = useVideoConfig();
  const u = Math.min(w, h) / 1080;
  const vertical = h > w * 1.2;
  const horizontal = w > h * 1.2;
  const seguro = vertical
    ? { topo: 280, base: 422, lado: 60 } // zonas seguras do Reels em 1080x1920
    : horizontal
      ? { topo: 70, base: 110, lado: 110 }
      : { topo: 70, base: 90, lado: 60 };
  return { w, h, u, vertical, horizontal, seguro };
};
