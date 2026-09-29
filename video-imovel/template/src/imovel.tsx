// Kit imobiliário: cenas prontas para vídeo de imóvel. Diferente de scenes.tsx
// (desenhado só para 1080x1920), estas cenas se adaptam a qualquer formato via
// useLayout(): posições em frações da tela e tamanhos multiplicados por `u`.
//
// REGRA: nenhuma cena inventa dado. Preço, metragem, quartos, bairro — só entra
// o que veio do briefing ou da narração. Campo ausente = elemento não aparece.
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { CSSProperties } from 'react';
import type { Preset } from './presets';
import { glass } from './presets';
import { Shine, fadeOut, floatY } from './components/Card';
import { CheckDraw, LogoMark } from './components/Icons';
import { Area, Banho, Cama, Carro, Chave, Pin, Predio, WhatsApp } from './components/IconesImovel';
import { DigitRoll } from './lib/DigitRoll';
import { dampedSettle } from './lib/helpers/motion';
import { useLayout, type Layout } from './formatos';
import { marca } from './marca';

/** Preset com as cores e a fonte da marca do corretor. */
export const presetDaMarca = (base: (a?: string, b?: string) => Preset = glass): Preset => {
  const p = base(marca.cor || undefined, marca.cor2 || undefined);
  const font = marca.fonte || p.font;
  return { ...p, font, card: (extra: CSSProperties = {}) => ({ ...p.card(extra), fontFamily: font }) };
};

/** 'meio' costuma cair no rosto de quem fala — só use se o footage.md marcar a faixa do meio como livre. */
export type Vertical = 'topo' | 'meio' | 'base';
export type Horizontal = 'esquerda' | 'centro' | 'direita';

/** Converte posição nomeada em estilo absoluto, respeitando as margens seguras. */
const posicionar = (L: Layout, v: Vertical, hz: Horizontal, largura: number): CSSProperties => {
  const s: CSSProperties = { position: 'absolute', width: largura };
  if (hz === 'esquerda') s.left = L.seguro.lado;
  else if (hz === 'direita') s.right = L.seguro.lado;
  else s.left = (L.w - largura) / 2;
  if (v === 'topo') s.top = L.seguro.topo;
  else if (v === 'meio') s.top = L.h * 0.36;
  else s.bottom = L.seguro.base + (L.vertical ? 260 : 190) * L.u; // acima da faixa de legendas
  return s;
};

const larguraCard = (L: Layout, fracaoVertical = 0.84) =>
  L.vertical ? L.w * fracaoVertical : L.horizontal ? L.w * 0.36 : L.w * 0.62;

const useEntrada = (delay: number, damping = 13) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, stiffness: 130 }, durationInFrames: 40 });
};

// ---------- ImovelCard: preço (contador) + tipo + bairro + chips de quartos/vagas/m² ----------
export type ItemImovel = { tipo: 'quartos' | 'suites' | 'banheiros' | 'vagas' | 'area' | 'andar'; valor: string };

const ICONE_ITEM = { quartos: Cama, suites: Banho, banheiros: Banho, vagas: Carro, area: Area, andar: Predio };
/** [singular, plural] */
const ROTULO_ITEM: Record<ItemImovel['tipo'], [string, string]> = {
  quartos: ['quarto', 'quartos'],
  suites: ['suíte', 'suítes'],
  banheiros: ['banheiro', 'banheiros'],
  vagas: ['vaga', 'vagas'],
  area: ['m²', 'm²'],
  andar: ['andar', 'andar'],
};
const rotuloItem = (it: ItemImovel) => ROTULO_ITEM[it.tipo][it.valor.trim() === '1' ? 0 : 1];

export const ImovelCard: React.FC<{
  p: Preset;
  dur: number;
  rotulo?: string; // "APARTAMENTO À VENDA"
  preco?: string; // "R$ 850.000" — só se foi dito/escrito
  local?: string; // "Setor Bueno · Goiânia"
  itens?: ItemImovel[];
  v?: Vertical;
  h?: Horizontal;
}> = ({ p, dur, rotulo, preco, local, itens = [], v = 'topo', h = 'centro' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const u = L.u;
  const s = useEntrada(4, 12);
  const out = fadeOut(frame, dur - 22);
  const largura = larguraCard(L);
  return (
    <AbsoluteFill>
      <div
        style={p.card({
          ...posicionar(L, v, h, largura),
          marginTop: floatY(frame, 3, 5 * u),
          padding: `${34 * u}px ${38 * u}px`,
          transform: `scale(${0.8 + s * 0.2}) translateY(${(1 - s) * 70 * u}px)`,
          opacity: s * out,
        })}
      >
        {rotulo && (
          <div style={{ fontSize: 24 * u, fontWeight: 800, letterSpacing: 3 * u, color: p.accent, textTransform: 'uppercase' }}>
            {rotulo}
          </div>
        )}
        {preco && (
          <div style={{ fontSize: 76 * u, fontWeight: 900, letterSpacing: -1 * u, marginTop: 6 * u, lineHeight: 1.1 }}>
            <DigitRoll value={preco} delay={14} fontSize={76 * u} color={p.ink} />
          </div>
        )}
        {local && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 * u, marginTop: 10 * u, fontSize: 30 * u, fontWeight: 700, opacity: 0.8 }}>
            <Pin size={32 * u} color={p.accent} stroke={2.2} />
            {local}
          </div>
        )}
        {itens.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 * u, marginTop: 22 * u }}>
            {itens.map((it, i) => {
              const c = spring({ frame: frame - (30 + i * 9), fps, config: { damping: 12 }, durationInFrames: 30 });
              const Icone = ICONE_ITEM[it.tipo];
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10 * u,
                    padding: `${10 * u}px ${18 * u}px`,
                    borderRadius: 999,
                    background: `${p.accent}22`,
                    border: `${2 * u}px solid ${p.accent}66`,
                    fontSize: 28 * u,
                    fontWeight: 800,
                    transform: `scale(${c})`,
                    opacity: c,
                  }}
                >
                  <Icone size={32 * u} color={p.accent} stroke={2.2} />
                  <span>
                    {it.valor} <span style={{ fontWeight: 600, opacity: 0.7 }}>{rotuloItem(it)}</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {p.name !== 'neo-brutal' && <Shine start={40} radius={p.radius} />}
      </div>
    </AbsoluteFill>
  );
};

// ---------- Destaques: lista de diferenciais com check que se desenha ----------
export const Destaques: React.FC<{
  p: Preset;
  dur: number;
  titulo?: string;
  itens: string[]; // "Varanda gourmet", "Lazer completo"… (máx. ~5)
  intervalo?: number; // frames entre um item e o próximo — alinhe com a narração
  v?: Vertical;
  h?: Horizontal;
}> = ({ p, dur, titulo, itens, intervalo = 16, v = 'topo', h = 'esquerda' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const u = L.u;
  const s = useEntrada(2, 13);
  const out = fadeOut(frame, dur - 22);
  const largura = L.vertical ? L.w * 0.72 : L.horizontal ? L.w * 0.34 : L.w * 0.58;
  const vindoDe = h === 'direita' ? 1 : -1;
  return (
    <AbsoluteFill>
      <div
        style={p.card({
          ...posicionar(L, v, h, largura),
          marginTop: floatY(frame, 7, 5 * u),
          padding: `${30 * u}px ${34 * u}px`,
          transform: `translateX(${(1 - s) * vindoDe * 600 * u}px)`,
          opacity: s * out,
        })}
      >
        {titulo && (
          <div style={{ fontSize: 24 * u, fontWeight: 800, letterSpacing: 3 * u, color: p.accent, textTransform: 'uppercase', marginBottom: 12 * u }}>
            {titulo}
          </div>
        )}
        {itens.map((txt, i) => {
          const d = 14 + i * intervalo;
          const c = spring({ frame: frame - d, fps, config: { damping: 13 }, durationInFrames: 28 });
          const tick = interpolate(frame, [d + 6, d + 24], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16 * u,
                marginTop: 10 * u,
                fontSize: 34 * u,
                fontWeight: 800,
                opacity: c,
                transform: `translateX(${(1 - c) * vindoDe * 40 * u}px)`,
              }}
            >
              <div
                style={{
                  width: 44 * u,
                  height: 44 * u,
                  borderRadius: 12 * u,
                  background: tick > 0.9 ? p.accent : `${p.accent}22`,
                  border: `${3 * u}px solid ${p.accent}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <CheckDraw size={30 * u} progress={tick} color={tick > 0.9 ? p.onAccent : p.accent} strokeWidth={6} />
              </div>
              {txt}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------- Localizacao: pin que cai e pulsa + bairro + proximidades ----------
export const Localizacao: React.FC<{
  p: Preset;
  dur: number;
  bairro: string;
  cidade?: string;
  proximidades?: { nome: string; tempo: string }[]; // { nome: 'Shopping Flamboyant', tempo: '5 min' }
  v?: Vertical;
  h?: Horizontal;
}> = ({ p, dur, bairro, cidade, proximidades = [], v = 'topo', h = 'centro' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const u = L.u;
  const s = useEntrada(4, 12);
  const out = fadeOut(frame, dur - 22);
  const queda = spring({ frame: frame - 10, fps, config: { damping: 9, stiffness: 160 }, durationInFrames: 36 });
  const pulso = ((frame - 40) % 45) / 45;
  const largura = larguraCard(L, 0.8);
  return (
    <AbsoluteFill>
      <div
        style={p.card({
          ...posicionar(L, v, h, largura),
          marginTop: floatY(frame, 4, 5 * u),
          padding: `${30 * u}px ${36 * u}px`,
          transform: `scale(${0.8 + s * 0.2})`,
          opacity: s * out,
        })}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 * u }}>
          <div style={{ transform: `translateY(${(1 - queda) * -120 * u}px)` }}>
            <Pin size={78 * u} color={p.accent} stroke={2} pulse={frame > 40 ? pulso : 0} />
          </div>
          <div>
            <div style={{ fontSize: 48 * u, fontWeight: 900, lineHeight: 1.1 }}>{bairro}</div>
            {cidade && <div style={{ fontSize: 28 * u, fontWeight: 600, opacity: 0.65 }}>{cidade}</div>}
          </div>
        </div>
        {proximidades.length > 0 && (
          <div style={{ marginTop: 18 * u, display: 'flex', flexDirection: 'column', gap: 10 * u }}>
            {proximidades.map((px, i) => {
              const c = spring({ frame: frame - (36 + i * 12), fps, config: { damping: 13 }, durationInFrames: 28 });
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 20 * u,
                    fontSize: 28 * u,
                    fontWeight: 700,
                    paddingTop: 10 * u,
                    borderTop: `${1.5 * u}px solid ${p.ink}1f`,
                    opacity: c,
                    transform: `translateY(${(1 - c) * 20 * u}px)`,
                  }}
                >
                  <span>{px.nome}</span>
                  <span style={{ color: p.accent, fontWeight: 900, whiteSpace: 'nowrap' }}>{px.tempo}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ---------- Selo: carimbo curto ("PRONTO PARA MORAR", "ACEITA FINANCIAMENTO") ----------
export const Selo: React.FC<{
  p: Preset;
  dur: number;
  texto: string;
  icone?: 'chave' | 'predio' | 'nenhum';
  v?: Vertical;
  h?: Horizontal;
}> = ({ p, dur, texto, icone = 'chave', v = 'topo', h = 'direita' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const u = L.u;
  const s = spring({ frame: frame - 4, fps, config: { damping: 8, stiffness: 180 }, durationInFrames: 30 });
  const out = fadeOut(frame, dur - 16, 16);
  const recuo = dampedSettle(frame - 16, 0.12, 0.18) * 6;
  const st = posicionar(L, v, h, 0);
  delete st.width;
  if (h === 'centro') {
    st.left = 0;
    st.right = 0;
    st.margin = '0 auto';
    st.width = 'fit-content';
  }
  return (
    <AbsoluteFill>
      <div
        style={{
          ...st,
          display: 'flex',
          alignItems: 'center',
          gap: 14 * u,
          padding: `${16 * u}px ${28 * u}px`,
          borderRadius: 14 * u,
          background: p.accent,
          color: p.onAccent,
          fontFamily: p.font,
          fontSize: 32 * u,
          fontWeight: 900,
          letterSpacing: 1.5 * u,
          textTransform: 'uppercase',
          border: `${3 * u}px solid rgba(255,255,255,0.85)`,
          boxShadow: `0 ${14 * u}px ${36 * u}px rgba(0,0,0,0.3)`,
          transform: `scale(${(2 - s) * s}) rotate(${-4 + recuo}deg)`,
          opacity: Math.min(1, s * 1.4) * out,
        }}
      >
        {icone === 'chave' && <Chave size={36 * u} color={p.onAccent} stroke={2.4} />}
        {icone === 'predio' && <Predio size={36 * u} color={p.onAccent} stroke={2.4} />}
        {texto}
      </div>
    </AbsoluteFill>
  );
};

// ---------- CorretorCard: logo + nome + CRECI + @instagram (dados de marca.json) ----------
export const CorretorCard: React.FC<{
  p: Preset;
  dur: number;
  v?: Vertical;
  h?: Horizontal;
}> = ({ p, dur, v = 'topo', h = 'centro' }) => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const u = L.u;
  const s = useEntrada(4, 12);
  const out = fadeOut(frame, dur - 22);
  const largura = larguraCard(L, 0.78);
  return (
    <AbsoluteFill>
      <div
        style={p.card({
          ...posicionar(L, v, h, largura),
          marginTop: floatY(frame, 2, 5 * u),
          padding: `${30 * u}px ${36 * u}px`,
          display: 'flex',
          alignItems: 'center',
          gap: 26 * u,
          transform: `scale(${0.75 + s * 0.25}) translateY(${(1 - s) * 60 * u}px)`,
          opacity: s * out,
        })}
      >
        {marca.logo ? (
          <Img src={staticFile(marca.logo)} style={{ height: 110 * u, maxWidth: 220 * u, objectFit: 'contain' }} />
        ) : (
          <LogoMark size={110 * u} color={p.accent} />
        )}
        <div>
          <div style={{ fontSize: 46 * u, fontWeight: 900, lineHeight: 1.1 }}>{marca.nome}</div>
          {marca.creci && <div style={{ fontSize: 26 * u, fontWeight: 700, opacity: 0.65, marginTop: 4 * u }}>CRECI {marca.creci}</div>}
          {marca.instagram && <div style={{ fontSize: 26 * u, fontWeight: 700, color: p.accent, marginTop: 4 * u }}>{marca.instagram}</div>}
        </div>
        {p.name !== 'neo-brutal' && <Shine start={26} radius={p.radius} />}
      </div>
    </AbsoluteFill>
  );
};

/** "62999998888" → "(62) 99999-8888". Mantém como está se não reconhecer. */
export const formatarTelefone = (n: string) => {
  const d = n.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return n;
};

// ---------- WhatsAppCta: botão verde pulsando + toque + número da marca ----------
export const WhatsAppCta: React.FC<{
  p: Preset;
  dur: number;
  texto?: string;
  mostrarNumero?: boolean;
  v?: Vertical;
}> = ({ p, dur, texto = 'Chama no WhatsApp', mostrarNumero = true, v = 'base' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const u = L.u;
  const s = useEntrada(2, 11);
  const out = fadeOut(frame, dur - 14, 14);
  const toque = 34;
  const aperto = dampedSettle(frame - toque, 0.16, 0.2);
  const onda = interpolate(frame, [toque, toque + 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const pulso = 1 + Math.sin(frame / 10) * 0.025;
  const numero = mostrarNumero && marca.whatsapp ? formatarTelefone(marca.whatsapp) : '';
  const nS = spring({ frame: frame - (toque + 14), fps, config: { damping: 12 }, durationInFrames: 30 });
  const largura = L.vertical ? L.w * 0.78 : L.horizontal ? L.w * 0.4 : L.w * 0.66;
  const verde = '#25D366';
  return (
    <AbsoluteFill>
      <div style={{ ...posicionar(L, v, 'centro', largura), transform: `scale(${s * pulso * (1 - aperto * 0.1)})`, opacity: s * out }}>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20 * u,
            padding: `${30 * u}px ${20 * u}px`,
            borderRadius: 999,
            background: `linear-gradient(135deg, ${verde}, #128C7E)`,
            border: `${3 * u}px solid rgba(255,255,255,0.9)`,
            boxShadow: `0 0 ${(40 + Math.sin(frame / 9) * 16) * u}px ${verde}99, 0 ${22 * u}px ${56 * u}px rgba(0,0,0,0.3)`,
            color: '#fff',
            fontFamily: p.font,
            fontSize: 48 * u,
            fontWeight: 900,
            textShadow: '0 2px 10px rgba(0,0,0,0.25)',
            overflow: 'hidden',
          }}
        >
          <WhatsApp size={64 * u} bg="transparent" />
          {texto}
          {onda > 0 && onda < 1 && (
            <span
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 40 * u,
                height: 40 * u,
                borderRadius: 999,
                border: `${4 * u}px solid rgba(255,255,255,0.9)`,
                transform: `translate(-50%,-50%) scale(${1 + onda * 14})`,
                opacity: 1 - onda,
              }}
            />
          )}
          <Shine start={toque + 4} dur={40} radius={999} />
        </div>
        {numero && (
          <div
            style={{
              marginTop: 18 * u,
              textAlign: 'center',
              fontFamily: p.font,
              fontSize: 40 * u,
              fontWeight: 900,
              color: '#fff',
              textShadow: `0 ${2 * u}px ${14 * u}px rgba(0,0,0,0.7)`,
              opacity: nS,
              transform: `translateY(${(1 - nS) * 20 * u}px)`,
            }}
          >
            {numero}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
