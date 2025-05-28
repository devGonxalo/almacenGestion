import { Routes } from '@angular/router';
import { ProductListComponent } from './components/product-list/product-list.component';
import { CustomerListComponent } from './components/customer-list/customer-list.component';
import { SaleListComponent } from './components/sale-list/sale-list.component';

export const routes: Routes = [
  { path: 'products', component: ProductListComponent },
  { path: 'customers', component: CustomerListComponent },
  { path: 'sales', component: SaleListComponent },
  { path: '', redirectTo: '/products', pathMatch: 'full' }, // Redirige a productos por defecto
  { path: '**', redirectTo: '/products' } // Ruta comodín para páginas no encontradas
];