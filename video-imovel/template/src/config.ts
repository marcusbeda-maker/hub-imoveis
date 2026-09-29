// Preenchido pela skill antes de renderizar — valores medidos com ffprobe.
export const FPS = 30;
/** duração do vídeo FINAL. Com narração: a maior entre o vídeo e a narração + ~1 s. */
export const DURACAO_FRAMES = 450;
/** resolução e duração do vídeo bruto (public/footage.mp4) */
export const ORIGEM = { width: 1080, height: 1920, frames: 450 };

/**
 * Narração:
 *  - modo "propria": a voz é o próprio áudio do vídeo (padrão). arquivo = null.
 *  - modo "arquivo": áudio gravado à parte pelo corretor, em public/.
 *  - modo "sintetica": voz gerada por engine/narrar.py (feminina/masculina), em public/.
 *  - modo "texto": sem voz; só texto na tela. arquivo = null.
 * volumeOriginal: volume do som do vídeo por baixo (0 = mudo, 1 = normal).
 */
export const NARRACAO: {
  modo: 'propria' | 'arquivo' | 'sintetica' | 'texto';
  arquivo: string | null;
  volumeOriginal: number;
  inicio: number; // quadro em que a narração começa
} = { modo: 'propria', arquivo: null, volumeOriginal: 1, inicio: 0 };
