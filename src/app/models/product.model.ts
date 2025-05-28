export interface Product {
  id?: number; // Opcional para productos nuevos
  name: string;
  brand?: string;
  description?: string;
  category?: string;
  purchasePrice: number;
  profitPercentage: number;
  salePrice?: number; // Calculado en el backend, pero útil para mostrar
}