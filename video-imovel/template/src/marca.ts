import marcaJson from './marca.json';

/**
 * Identidade do corretor. A skill copia ~/.video-imovel/marca.json para cá antes
 * de renderizar. Campo vazio = elemento não aparece (nunca inventar dado).
 * logo: nome do arquivo dentro de public/ (ex.: "logo.png").
 */
export type Marca = {
  nome: string;
  creci: string;
  whatsapp: string;
  instagram: string;
  logo: string;
  cor: string;
  cor2: string;
  fonte: string;
};

export const marca: Marca = marcaJson as Marca;
