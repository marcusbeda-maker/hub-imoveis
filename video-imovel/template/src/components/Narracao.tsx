import { Audio, Sequence, staticFile } from 'remotion';
import { NARRACAO } from '../config';

/** Toca a narração (gravada à parte ou sintética) conforme config.ts. */
export const Narracao: React.FC = () => {
  if (!NARRACAO.arquivo || (NARRACAO.modo !== 'arquivo' && NARRACAO.modo !== 'sintetica')) return null;
  return (
    <Sequence from={NARRACAO.inicio}>
      <Audio src={staticFile(NARRACAO.arquivo)} />
    </Sequence>
  );
};
