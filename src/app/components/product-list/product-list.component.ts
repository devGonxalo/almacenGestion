import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, inject } from '@angular/core';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { Subscription } from 'rxjs';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap'; // Si usas ng-bootstrap
import { ProductFormComponent } from '../product-form/product-form.component';
import { CommonModule } from '@angular/common';

// O si usas Bootstrap directamente:
// import { Modal } from 'bootstrap';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
  imports: [CommonModule, ProductFormComponent], // Si usas standalone components
  standalone: true // Si usas standalone components
})

export class ProductListComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  private productSubscription: Subscription = new Subscription();
  isLoading = false;
  errorMessage = '';

  // Para modales de Bootstrap directamente (requiere import 'bootstrap' y manejarlo)
   @ViewChild('productModal') productModalElement!: TemplateRef<any>; // Para el contenido del modal
  @ViewChild('deleteConfirmModal') deleteConfirmModalElement!: TemplateRef<any>;
  @ViewChild(ProductFormComponent) productFormComponent!: ProductFormComponent;
  private bsProductModal: any; // Instancia del Modal de Bootstrap
  private bsDeleteModal: any;

  // Para ng-bootstrap
  private modalService = inject(NgbModal); // Inyecta NgbModal si lo usas
  private activeModal: NgbModalRef | undefined;
  currentProduct: Product | null = null; // Para editar o añadir
  productToDelete: Product | null = null;


  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();

    // Si usas Bootstrap directamente para modales (inicializar al mostrar)
    // this.bsProductModal = new Modal(document.getElementById('productFormModal')!);
    // this.bsDeleteModal = new Modal(document.getElementById('deleteProductConfirmModal')!);
  }

  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.productSubscription = this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Failed to load products.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  openAddProductModal(content: TemplateRef<any>): void {
    this.currentProduct = { name: '', purchasePrice: 0, profitPercentage: 0 }; // Nuevo producto
    this.activeModal = this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title', size: 'lg' });
  }

  openEditProductModal(content: TemplateRef<any>, product: Product): void {
    this.currentProduct = { ...product }; // Copia para evitar modificar la lista directamente
    this.activeModal = this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title', size: 'lg' });
  }

  openDeleteConfirmModal(content: TemplateRef<any>, product: Product): void {
    this.productToDelete = product;
    this.activeModal = this.modalService.open(content, { ariaLabelledBy: 'modal-confirm-title', centered: true });
  }

  triggerProductFormSubmit(): void {
    if (this.productFormComponent) {
      this.productFormComponent.onSubmit(); // Llama al método onSubmit del formulario hijo
    }
  }
  onProductFormSubmit(product: Product): void {
    this.isLoading = true;
    this.errorMessage = '';
    if (product.id) { // Editar
      this.productService.updateProduct(product.id, product).subscribe({
        next: () => {
          this.loadProducts(); // Recargar lista
          if (this.activeModal) {
            this.activeModal.close();
          }
          this.isLoading = false;
          // Mostrar mensaje de éxito (ej. con un servicio de Toast)
        },
        error: (err) => {
          this.errorMessage = err.message || 'Failed to update product.';
          this.isLoading = false;
          // No cerrar el modal si hay error, para que el usuario vea el mensaje
        }
      });
    } else { // Añadir
      this.productService.addProduct(product).subscribe({
        next: () => {
          this.loadProducts();
          if (this.activeModal) {
            this.activeModal.close();
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.message || 'Failed to add product.';
          this.isLoading = false;
        }
      });
    }
  }

  confirmDelete(): void {
    if (this.productToDelete && this.productToDelete.id) {
      this.isLoading = true;
      this.productService.deleteProduct(this.productToDelete.id).subscribe({
        next: () => {
          this.loadProducts();
          if (this.activeModal) {
            this.activeModal.close();
          }
          this.productToDelete = null;
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.message || 'Failed to delete product.';
          if (this.activeModal) {
            this.activeModal.close();
          }
          this.isLoading = false;
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.productSubscription) {
      this.productSubscription.unsubscribe();
    }
  }
}