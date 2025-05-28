import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Customer, DebtPaymentRequest, DebtPaymentResponse } from '../models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  // ¡MUY IMPORTANTE! AJUSTA ESTE PUERTO Y RUTA AL DE TU API
  private apiUrl = 'http://ntsnet:1001/api/customers'; // Cambia esto

  constructor(private http: HttpClient) { }

  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  getCustomer(id: number): Observable<Customer> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Customer>(url)
      .pipe(catchError(this.handleError));
  }

  addCustomer(customer: Partial<Customer>): Observable<Customer> { // Partial para permitir no enviar 'id'
    return this.http.post<Customer>(this.apiUrl, customer)
      .pipe(catchError(this.handleError));
  }

  updateCustomer(id: number, customer: Customer): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put(url, customer)
      .pipe(catchError(this.handleError));
  }

  deleteCustomer(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete(url)
      .pipe(catchError(this.handleError));
  }

  payDebt(customerId: number, paymentRequest: DebtPaymentRequest): Observable<DebtPaymentResponse> {
    const url = `${this.apiUrl}/${customerId}/paydebt`;
    return this.http.post<DebtPaymentResponse>(url, paymentRequest)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = '';
    let detailedErrors: any = null;

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error del lado del cliente: ${error.error.message}`;
    } else {
      errorMessage = `El servidor devolvió el código ${error.status}. Mensaje: ${error.message}`;
      if (error.error && typeof error.error === 'object') {
        if (error.error.title) {
          errorMessage += ` Título: ${error.error.title}`;
        }
        if (error.error.errors) {
          detailedErrors = error.error.errors;
          errorMessage += ` Detalles de validación: ${JSON.stringify(detailedErrors)}`;
        } else if (typeof error.error === 'string') {
           errorMessage += ` Cuerpo del error: ${error.error}`;
        }
      } else if (typeof error.error === 'string') {
        errorMessage += ` Cuerpo del error: ${error.error}`;
      }
    }

    console.error("--- DETALLE COMPLETO DEL ERROR HTTP (CustomerService) ---");
    console.error("Mensaje General:", errorMessage);
    if (detailedErrors) {
      console.error("Errores de Validación Específicos:", detailedErrors);
      for (const field in detailedErrors) {
        if (detailedErrors.hasOwnProperty(field)) {
          console.warn(`Campo '${field}': ${detailedErrors[field].join(', ')}`);
        }
      }
    }
    console.error("Objeto de Error Completo:", error);
    console.error("--- FIN DETALLE COMPLETO DEL ERROR HTTP (CustomerService) ---");

    let userFriendlyMessage = 'Ocurrió un error al procesar la solicitud del cliente.';
    if (error.error && error.error.title && error.error.title === "One or more validation errors occurred.") {
        userFriendlyMessage = "Por favor, corrija los errores de validación e intente de nuevo.";
    } else if (error.status === 0 || error.status === 503) { // 503 Service Unavailable
        userFriendlyMessage = "No se pudo conectar con el servidor. Verifique su conexión o que el servidor API esté en ejecución.";
    }

    return throwError(() => new Error(userFriendlyMessage));
  }
}