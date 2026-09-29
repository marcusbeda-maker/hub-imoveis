// Gerador de vídeo de TESTE: uma "sala" com uma "pessoa" falando e um relógio
// na tela. Serve para testar o plugin sem gravar nada. Não entra no vídeo final.
//
//   npm run teste:video              -> public/footage.mp4 em 9:16 (15 s)
//   npm run teste:video:horizontal   -> public/footage.mp4 em 16:9
//   npm run teste:video:quadrado     -> public/footage.mp4 em 1:1
//   npm run teste:imagem             -> teste.png (um quadro, para conferir)
//
// Duração: acrescente --frames=0-299 (10 s a 30 fps) etc. ao comando.
import { AbsoluteFill, Composition, registerRoot, useCurrentFrame, useVideoConfig } from 'remotion';

const Sala: React.FC = () => {
  const f = useCurrentFrame();
  const { fps, width: w, height: h } = useVideoConfig();
  const u = Math.min(w, h) / 1080;
  const fala = Math.abs(Math.sin(f / 3)) * (Math.sin(f / 23) > -0.3 ? 1 : 0); // boca mexendo em trechos
  const cx = w / 2 + Math.sin(f / 50) * 30 * u; // pessoa balança de leve
  const topoPessoa = h * 0.36;
  const seg = (f / fps).toFixed(1);
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg,#6d7f96 0%,#b9b3a6 55%,#8a7a68 100%)', overflow: 'hidden' }}>
      {/* janela com luz */}
      <div
        style={{
          position: 'absolute',
          left: w * 0.08 + Math.sin(f / 90) * 20 * u,
          top: h * 0.16,
          width: w * 0.34,
          height: h * 0.24,
          background: 'linear-gradient(135deg,#f4f6f8,#cfd9e3)',
          border: `${18 * u}px solid #5a6473`,
        }}
      />
      {/* quadro na parede */}
      <div style={{ position: 'absolute', right: w * 0.1, top: h * 0.2, width: w * 0.18, height: h * 0.12, background: '#c9a45c', border: `${10 * u}px solid #3b332c` }} />
      {/* sofá */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: h * 0.68, height: h * 0.14, background: '#463c37', borderRadius: `${40 * u}px ${40 * u}px 0 0` }} />
      {/* piso */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: h * 0.82, bottom: 0, background: 'repeating-linear-gradient(90deg,#9c7b5b 0 90px,#8d6e50 90px 180px)' }} />
      {/* pessoa: corpo + cabeça + olhos + boca */}
      <div style={{ position: 'absolute', left: cx - 190 * u, top: topoPessoa + 260 * u, width: 380 * u, height: 520 * u, borderRadius: `${180 * u}px ${180 * u}px ${30 * u}px ${30 * u}px`, background: '#2f5d8a' }} />
      <div style={{ position: 'absolute', left: cx - 120 * u, top: topoPessoa, width: 240 * u, height: 290 * u, borderRadius: '50%', background: '#d6a887' }}>
        <div style={{ position: 'absolute', left: 60 * u, top: 110 * u, width: 26 * u, height: 26 * u, borderRadius: '50%', background: '#222' }} />
        <div style={{ position: 'absolute', right: 60 * u, top: 110 * u, width: 26 * u, height: 26 * u, borderRadius: '50%', background: '#222' }} />
        <div style={{ position: 'absolute', left: 80 * u, top: 190 * u, width: 80 * u, height: (8 + fala * 30) * u, borderRadius: 40 * u, background: '#7a2e2e' }} />
      </div>
      {/* relógio: confere sincronia de cenas e legendas */}
      <div style={{ position: 'absolute', left: 24 * u, bottom: 24 * u, padding: `${6 * u}px ${14 * u}px`, background: 'rgba(0,0,0,0.55)', color: '#fff', fontFamily: 'monospace', fontSize: 30 * u, borderRadius: 8 * u }}>
        TESTE {seg}s · quadro {f}
      </div>
    </AbsoluteFill>
  );
};

const base = { component: Sala, durationInFrames: 450, fps: 30 };

registerRoot(() => (
  <>
    <Composition id="VideoTeste" {...base} width={1080} height={1920} />
    <Composition id="VideoTesteQuadrado" {...base} width={1080} height={1080} />
    <Composition id="VideoTesteHorizontal" {...base} width={1920} height={1080} />
  </>
));
