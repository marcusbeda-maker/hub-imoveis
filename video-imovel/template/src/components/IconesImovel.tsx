// Ícones do kit imobiliário. SVG puro, traço arredondado, cor por prop.
// Todos desenham em uma caixa 24x24 e escalam por `size`.

type P = { size?: number; color?: string; stroke?: number };

const Svg: React.FC<P & { children: React.ReactNode }> = ({ size = 40, color = '#111', stroke = 2, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    {children}
  </svg>
);

/** Quartos */
export const Cama: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M3 18V7" />
    <path d="M21 18v-5a3 3 0 0 0-3-3h-7v6" />
    <path d="M3 14h18" />
    <circle cx="7" cy="11" r="1.6" />
  </Svg>
);

/** Banheiros / suítes */
export const Banho: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2z" />
    <path d="M6 12V6a2 2 0 0 1 3.4-1.4" />
    <path d="M8 19l-1 2M16 19l1 2" />
  </Svg>
);

/** Vagas de garagem */
export const Carro: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M5 16V11l2-5h10l2 5v5" />
    <path d="M3 16h18v2H3z" />
    <circle cx="7.5" cy="13" r="1" />
    <circle cx="16.5" cy="13" r="1" />
  </Svg>
);

/** Área (m²) */
export const Area: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </Svg>
);

/** Localização */
export const Pin: React.FC<P & { pulse?: number }> = ({ pulse = 0, ...p }) => (
  <Svg {...p}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
    {pulse > 0 && <ellipse cx="12" cy="21" rx={2 + pulse * 6} ry={0.6 + pulse * 1.5} opacity={1 - pulse} />}
  </Svg>
);

/** Chave (entrega, pronto para morar) */
export const Chave: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx="8" cy="15" r="4" />
    <path d="M11 12l9-9M17 6l2 2M15 8l2 2" />
  </Svg>
);

/** Prédio / condomínio */
export const Predio: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M4 21V5l8-2v18M12 8h8v13" />
    <path d="M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2" />
    <path d="M2 21h20" />
  </Svg>
);

/** Logo do WhatsApp (balão + telefone), preenchido */
export const WhatsApp: React.FC<{ size?: number; color?: string; bg?: string }> = ({
  size = 48,
  color = '#fff',
  bg = '#25D366',
}) => (
  <svg width={size} height={size} viewBox="0 0 32 32" style={{ flexShrink: 0 }}>
    <path
      d="M16 3C8.8 3 3 8.7 3 15.8c0 2.5.7 4.9 2 7L3.6 28.5l5.9-1.5A13 13 0 0 0 16 28.6c7.2 0 13-5.7 13-12.8S23.2 3 16 3z"
      fill={bg}
      stroke={color}
      strokeWidth="1.6"
    />
    <path
      d="M11.6 9.6c-.3-.7-.6-.7-.9-.7h-.8c-.3 0-.7.1-1 .5-.4.4-1.3 1.3-1.3 3.1s1.4 3.6 1.5 3.9c.2.3 2.6 4.2 6.5 5.7 3.2 1.3 3.9 1 4.6.9.7-.1 2.2-.9 2.5-1.8.3-.9.3-1.6.2-1.8-.1-.2-.4-.3-.8-.5l-2.7-1.3c-.4-.1-.6-.2-.9.2l-1.2 1.5c-.2.3-.4.3-.8.1-.4-.2-1.6-.6-3-1.9-1.1-1-1.9-2.2-2.1-2.6-.2-.4 0-.6.2-.8l.6-.7c.2-.2.3-.4.4-.7.1-.3.1-.5 0-.7l-1-2.7z"
      fill={color}
    />
  </svg>
);
