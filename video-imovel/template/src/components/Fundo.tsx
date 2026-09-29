import { AbsoluteFill, Loop, OffthreadVideo, staticFile, useVideoConfig } from 'remotion';
import { useLayout } from '../formatos';

/**
 * Vídeo bruto como fundo, adaptado ao formato de saída.
 * modo "preencher": corta as bordas para ocupar a tela toda (bom quando a proporção é parecida).
 * modo "desfoque": vídeo inteiro no centro com uma cópia desfocada atrás (ex.: vídeo vertical num 16:9).
 * Se a composição for mais longa que o vídeo (narração maior), o vídeo repete.
 */
export const Fundo: React.FC<{
  arquivo?: string;
  origem: { width: number; height: number; frames?: number };
  modo?: 'auto' | 'preencher' | 'desfoque';
  volume?: number;
}> = (props) => {
  const { durationInFrames } = useVideoConfig();
  const f = props.origem.frames;
  if (f && f < durationInFrames) {
    return (
      <Loop durationInFrames={f}>
        <FundoSimples {...props} />
      </Loop>
    );
  }
  return <FundoSimples {...props} />;
};

const FundoSimples: React.FC<{
  arquivo?: string;
  origem: { width: number; height: number };
  modo?: 'auto' | 'preencher' | 'desfoque';
  volume?: number;
}> = ({ arquivo = 'footage.mp4', origem, modo = 'auto', volume = 1 }) => {
  const { w, h } = useLayout();
  const src = staticFile(arquivo);
  const razaoOrigem = origem.width / origem.height;
  const razaoSaida = w / h;
  const diferenca = Math.max(razaoOrigem, razaoSaida) / Math.min(razaoOrigem, razaoSaida);
  // até ~35% de diferença de proporção, cortar fica natural; acima disso, corta demais
  const m = modo === 'auto' ? (diferenca <= 1.35 ? 'preencher' : 'desfoque') : modo;

  if (m === 'preencher') {
    return (
      <AbsoluteFill style={{ background: '#000' }}>
        <OffthreadVideo src={src} volume={volume} muted={volume === 0} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <OffthreadVideo
        src={src}
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'blur(40px) brightness(0.55) saturate(1.2)',
          transform: 'scale(1.15)',
        }}
      />
      <AbsoluteFill>
        <OffthreadVideo src={src} volume={volume} muted={volume === 0} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
