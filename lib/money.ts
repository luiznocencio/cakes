/** Formata um valor em centavos como moeda BR: 1800 → "R$ 18,00". */
export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
