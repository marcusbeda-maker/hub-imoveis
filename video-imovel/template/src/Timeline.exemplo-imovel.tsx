// EXEMPLO de Timeline de imóvel (15s, 30fps), funciona em Reels, Feed e YouTube.
// Copie para Timeline.tsx e reescreva as Sequences conforme a narração do SEU vídeo.
// Todo número de frame deve vir dos tempos palavra a palavra do whisper.
// Todo dado do imóvel deve vir do briefing ou da narração — nunca inventado.
import { AbsoluteFill, Sequence } from 'remotion';
import { Fundo } from './components/Fundo';
import { NARRACAO, ORIGEM } from './config';
import { Narracao } from './components/Narracao';
import { CorretorCard, Destaques, ImovelCard, Localizacao, Selo, WhatsAppCta, presetDaMarca } from './imovel';
import { Legendas } from './Legendas';
import { LEGENDAS } from './legendas.data';
import { glass } from './presets';

const p = presetDaMarca(glass);

export const Timeline: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Fundo origem={ORIGEM} volume={NARRACAO.volumeOriginal} />
    <Narracao />

    {/* "Apartamento de três quartos no Setor Bueno por oitocentos e cinquenta mil" */}
    <Sequence from={15} durationInFrames={120}>
      <ImovelCard
        p={p}
        dur={120}
        rotulo="Apartamento à venda"
        preco="R$ 850.000"
        local="Setor Bueno · Goiânia"
        itens={[
          { tipo: 'quartos', valor: '3' },
          { tipo: 'suites', valor: '1' },
          { tipo: 'vagas', valor: '2' },
          { tipo: 'area', valor: '98' },
        ]}
      />
    </Sequence>

    {/* "pertinho do Parque Vaca Brava e do Goiânia Shopping" */}
    <Sequence from={140} durationInFrames={105}>
      <Localizacao
        p={p}
        dur={105}
        bairro="Setor Bueno"
        cidade="Goiânia · GO"
        proximidades={[
          { nome: 'Parque Vaca Brava', tempo: '3 min' },
          { nome: 'Goiânia Shopping', tempo: '5 min' },
        ]}
      />
    </Sequence>

    {/* "varanda gourmet, lazer completo e pronto para morar" */}
    <Sequence from={250} durationInFrames={100}>
      <Destaques p={p} dur={100} titulo="Diferenciais" itens={['Varanda gourmet', 'Lazer completo', 'Portaria 24h']} />
    </Sequence>
    <Sequence from={300} durationInFrames={50}>
      <Selo p={p} dur={50} texto="Pronto para morar" v="base" h="direita" />
    </Sequence>

    {/* "me chama no WhatsApp" — CTA por cima do vídeo rodando, nunca tela final parada */}
    <Sequence from={355} durationInFrames={95}>
      <CorretorCard p={p} dur={95} />
      <WhatsAppCta p={p} dur={95} />
    </Sequence>

    <Legendas p={p} palavras={LEGENDAS} />
  </AbsoluteFill>
);
