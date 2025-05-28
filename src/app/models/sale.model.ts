import { Customer } from './customer.model';
import { Product } from './product.model';

export interface SaleItem {
  id?: number;
  productId: number;
  product?: Product; // Para mostrar info del producto
  quantity: number;
  unitPrice: number; // Precio al momento de la venta
  totalPrice?: number; // Calculado: quantity * unitPrice
}

export interface Sale {
  id: number;
  customerId: number;
  customer?: Customer; // Para mostrar info del cliente
  saleDate: string; // O Date, si prefieres convertirlo
  totalAmount: number;
  isPaid: boolean;
  saleItems: SaleItem[];
}

// DTO para crear una nueva venta (lo que se envía a la API)
export interface SaleItemRequestDto {
  productId: number;
  quantity: number;
  // unitPrice se tomará del producto al momento de crear la venta en el backend
}

export interface SaleRequestDto {
  customerId: number;
  isPaid: boolean;
  items: SaleItemRequestDto[];
}