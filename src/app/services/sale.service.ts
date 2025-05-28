import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Sale, SaleRequestDto } from '../models/sale.model';

@Injectable({
  providedIn: 'root'
})
export class SaleService {
  // ¡MUY IMPORTANTE! AJUSTA ESTE PUERTO Y RUTA AL DE TU API
  private apiUrl = 'http://ntsnet:1001/api/sales'; // Cambia esto

  constructor(private http: HttpClient) { }

  getSales(customerId?: number): Observable<Sale[]> {
    let params = new HttpParams();
    if (customerId) {
      params = params.append('customerId', customerId.toString());
    }
    return this.http.get<Sale[]>(this.apiUrl, { params })
      .pipe(
        // tap(data => console.log('Sales fetched:', data)),
        catchError(this.handleError)
      );
  }

  getSale(id: number): Observable<Sale> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Sale>(url)
      .pipe(catchError(this.handleError));
  }

  addSale(saleRequest: SaleRequestDto): Observable<Sale> {
    return this.http.post<Sale>(this.apiUrl, saleRequest)
      .pipe(catchError(this.handleError));
  }

  // Opcional: Cancelar Venta (requeriría un endpoint en la API)
  // cancelSale(id: number): Observable<any> {
  //   const url = `${this.apiUrl}/${id}/cancel`; // Ejemplo de endpoint
  //   return this.http.post(url, {})
  //     .pipe(catchError(this.handleError));
  // }

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

    console.error("--- DETALLE COMPLETO DEL ERROR HTTP (SaleService) ---");
    console.error("Mensaje General:", errorMessage);
    if (detailedErrors) {
      console.error("Errores de Validación Específicos:", detailedErrors);
      for (const field in detailedErrors) {
        if (detailedErrors.hasOwnProperty(field)) {
          // Los errores de Items podrían ser un array, ej. errors["Items[0].ProductId"]
          console.warn(`Campo '${field}': ${detailedErrors[field].join(', ')}`);
        }
      }
    }
    console.error("Objeto de Error Completo:", error);
    console.error("--- FIN DETALLE COMPLETO DEL ERROR HTTP (SaleService) ---");

    let userFriendlyMessage = 'Ocurrió un error al procesar la solicitud de venta.';
    if (error.error && error.error.title && error.error.title === "One or more validation errors occurred.") {
        userFriendlyMessage = "Por favor, corrija los errores de validación e intente de nuevo.";
        if (detailedErrors && detailedErrors.Items) { // Específico para errores en items de venta
            userFriendlyMessage += " Verifique los productos y cantidades."
        }
    } else if (error.status === 0 || error.status === 503) {
        userFriendlyMessage = "No se pudo conectar con el servidor. Verifique su conexión o que el servidor API esté en ejecución.";
    }


    return throwError(() => new Error(userFriendlyMessage));
  }
}