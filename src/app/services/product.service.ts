import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  // ¡MUY IMPORTANTE! AJUSTA ESTE PUERTO AL DE TU API
  private apiUrl = 'http://NTSNET:1001/api/products'; // Cambia esto

  constructor(private http: HttpClient) { }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl)
      .pipe(
        // tap(data => console.log('Products: ', JSON.stringify(data))), // Para depurar
        catchError(this.handleError)
      );
  }

  getProduct(id: number): Observable<Product> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Product>(url)
      .pipe(
        // tap(data => console.log('Product: ', JSON.stringify(data))),
        catchError(this.handleError)
      );
  }

  addProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product)
      .pipe(
        // tap(data => console.log('Added Product: ', JSON.stringify(data))),
        catchError(this.handleError)
      );
  }

  updateProduct(id: number, product: Product): Observable<any> { // La API devuelve NoContent (204)
    const url = `${this.apiUrl}/${id}`;
    return this.http.put(url, product) // No se espera un cuerpo en la respuesta para PUT
      .pipe(
        // tap(() => console.log('Updated Product id=' + id)),
        catchError(this.handleError)
      );
  }

  deleteProduct(id: number): Observable<any> { // La API devuelve NoContent (204)
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete(url)
      .pipe(
        // tap(() => console.log('Deleted Product id=' + id)),
        catchError(this.handleError)
      );
  }

      private handleError(error: HttpErrorResponse) {
        let errorMessage = '';
        let detailedErrors: any = null; // Para almacenar los errores de validación específicos

        if (error.error instanceof ErrorEvent) {
          // Error del lado del cliente o de red
          errorMessage = `Error del lado del cliente: ${error.error.message}`;
        } else {
          // El backend devolvió un código de error
          errorMessage = `El servidor devolvió el código ${error.status}. Mensaje: ${error.message}`;

          // Intenta extraer los detalles de ValidationProblemDetails
          if (error.error && typeof error.error === 'object') {
            if (error.error.title) {
              errorMessage += ` Título: ${error.error.title}`; // Esto ya lo tienes
            }
            // Aquí está la parte importante para los detalles de validación
            if (error.error.errors) {
              detailedErrors = error.error.errors;
              errorMessage += ` Detalles de validación: ${JSON.stringify(detailedErrors)}`;
            } else if (typeof error.error === 'string') {
               // A veces el error puede ser solo un string si no es ValidationProblemDetails
               errorMessage += ` Cuerpo del error: ${error.error}`;
            }
          } else if (typeof error.error === 'string') {
            errorMessage += ` Cuerpo del error: ${error.error}`;
          }
        }

        // Imprime el error completo en la consola para una mejor depuración
        console.error("--- DETALLE COMPLETO DEL ERROR HTTP ---");
        console.error("Mensaje General:", errorMessage);
        if (detailedErrors) {
          console.error("Errores de Validación Específicos:", detailedErrors);
          // Podrías iterar sobre detailedErrors para un formato más legible
          for (const field in detailedErrors) {
            if (detailedErrors.hasOwnProperty(field)) {
              console.warn(`Campo '${field}': ${detailedErrors[field].join(', ')}`);
            }
          }
        }
        console.error("Objeto de Error Completo:", error); // Imprime todo el objeto HttpErrorResponse
        console.error("--- FIN DETALLE COMPLETO DEL ERROR HTTP ---");


        // Devuelve un observable con un mensaje de error orientado al usuario.
        // Podrías personalizar este mensaje basado en `detailedErrors` si lo deseas.
        let userFriendlyMessage = 'Ocurrió un error al procesar la solicitud.';
        if (error.error && error.error.title && error.error.title === "One or more validation errors occurred.") {
            userFriendlyMessage = "Por favor, corrija los errores de validación e intente de nuevo.";
            if(detailedErrors){
                // Opcional: construir un mensaje más específico para el usuario
                // userFriendlyMessage += " Detalles: " + Object.keys(detailedErrors).join(', ');
            }
        } else if (error.status === 0) {
            userFriendlyMessage = "No se pudo conectar con el servidor. Verifique su conexión de red o que el servidor API esté en ejecución.";
        }

        return throwError(() => new Error(userFriendlyMessage)); // Esto es lo que el componente recibirá
      }
}