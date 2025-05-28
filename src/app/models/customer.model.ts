export interface Customer {
  id?: number;
  name: string;
  lastName: string;
  address?: string;
  phone?: string;
  email?: string;
  currentDebt?: number; // Generalmente, esto lo devuelve la API, no se envía al crear/editar cliente.
}

// DTO para la solicitud de pago de deuda
export interface DebtPaymentRequest {
  amount: number;
}

// Modelo para la respuesta del pago de deuda (si tu API lo devuelve)
export interface DebtPaymentResponse {
  message: string;
  newDebt: number;
}