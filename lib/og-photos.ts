/**
 * Quais bolos aparecem no card de compartilhamento, e em que tamanho.
 *
 * Fixos e determinísticos: o WhatsApp cacheia o preview por URL, então
 * "os 4 primeiros do banco" daria um card que passa a mentir assim que o
 * catálogo muda. A escolha é estética — variedade de cor e textura.
 *
 * Vive aqui, e não nos dois lugares que usam, porque o script gera os
 * arquivos e o opengraph-image.tsx os lê. Se as listas divergirem, o build
 * quebra procurando um jpeg que ninguém gerou.
 */
export const OG_PHOTO_SLUGS = [
  "banana-canela",
  "cenoura-chocolate",
  "goiabada-queijo",
  "vulcao",
] as const;

// 4 fotos × 300 = 1200, a largura do card.
export const OG_PHOTO_SIZE = { width: 300, height: 420 } as const;
