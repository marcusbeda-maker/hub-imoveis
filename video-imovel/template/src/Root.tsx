import { Composition } from 'remotion';
import { Timeline } from './Timeline';
import { DURACAO_FRAMES, FPS } from './config';
import { FORMATOS } from './formatos';

// Uma composição por formato. Renderize só as pedidas:
//   npx remotion render src/index.ts Reels   saida-reels.mp4
//   npx remotion render src/index.ts Feed    saida-feed.mp4
//   npx remotion render src/index.ts YouTube saida-youtube.mp4
export const Root: React.FC = () => (
  <>
    {Object.entries(FORMATOS).map(([id, f]) => (
      <Composition key={id} id={id} component={Timeline} durationInFrames={DURACAO_FRAMES} fps={FPS} width={f.width} height={f.height} />
    ))}
  </>
);
