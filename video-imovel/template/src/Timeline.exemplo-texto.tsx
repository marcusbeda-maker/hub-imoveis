// EXEMPLO de Timeline no modo "só texto" (sem voz) — 14 s, 30 fps.
// Roteiro: "Aproveite a oportunidade de ter esse imóvel único pelo valor de 850 mil
// reais, aceita financiamento, além da ótima localização. Fale comigo agora!"
// Tempos vindos de engine/narrar.py --voz nenhuma (ritmo de leitura).
// Sem bairro no roteiro -> sem card de Localizacao (não inventar dado).
import { AbsoluteFill, Sequence } from 'remotion';
import { Fundo } from './components/Fundo';
import { Narracao } from './components/Narracao';
import { NARRACAO, ORIGEM } from './config';
import { ImovelCard, Selo, WhatsAppCta, presetDaMarca } from './imovel';
import { Legendas } from './Legendas';
import { LEGENDAS } from './legendas.data';
import { glass } from './presets';

const p = presetDaMarca(glass);

export const Timeline: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Fundo origem={ORIGEM} volume={NARRACAO.volumeOriginal} />
    <Narracao />

    {/* "aproveite a oportunidade ... pelo valor de 850 mil reais" (1,5 s – 6,6 s) */}
    <Sequence from={42} durationInFrames={156}>
      <ImovelCard p={p} dur={156} rotulo="Oportunidade única" preco="R$ 850.000" />
    </Sequence>

    {/* "aceita financiamento" (6,7 s) */}
    <Sequence from={200} durationInFrames={88}>
      <Selo p={p} dur={88} texto="Aceita financiamento" icone="chave" v="topo" h="centro" />
    </Sequence>

    {/* "além da ótima localização" (9,7 s) — sem bairro no roteiro, só o selo */}
    <Sequence from={290} durationInFrames={50}>
      <Selo p={p} dur={50} texto="Ótima localização" icone="predio" v="topo" h="centro" />
    </Sequence>

    {/* "fale comigo agora!" (11,4 s) */}
    <Sequence from={340} durationInFrames={80}>
      <WhatsAppCta p={p} dur={80} texto="Fale comigo agora" />
    </Sequence>

    <Legendas p={p} palavras={LEGENDAS} />
  </AbsoluteFill>
);
