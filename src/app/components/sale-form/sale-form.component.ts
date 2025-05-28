// src/app/components/sale-form/sale-form.component.ts
import { Component, OnInit, Output, EventEmitter, inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms'; // Añade AbstractControl
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Subscription } from 'rxjs';

import { SaleRequestDto, SaleItemRequestDto } from '../../models/sale.model';
import { Customer } from '../../models/customer.model';
import { Product } from '../../models/product.model';
import { CustomerService } from '../../services/customer.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-sale-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe],
  templateUrl: './sale-form.component.html',
  styleUrls: ['./sale-form.component.scss']
})
export class SaleFormComponent implements OnInit, OnDestroy {
  // ... (otras propiedades y constructor sin cambios) ...
  @Output() formSubmit = new EventEmitter<SaleRequestDto>();
  @Output() formCancel = new EventEmitter<void>();

  saleForm: FormGroup;
  customers: Customer[] = [];
  products: Product[] = [];

  isLoadingCustomers = false;
  isLoadingProducts = false;
  errorMessage = '';

  private customerSubscription: Subscription = new Subscription();
  private productSubscription: Subscription = new Subscription();
  
  private fb = inject(FormBuilder);
  private customerService = inject(CustomerService);
  private productService = inject(ProductService);

  constructor() {
    this.saleForm = this.fb.group({
      customerId: [null, Validators.required],
      isPaid: [true, Validators.required],
      items: this.fb.array([], Validators.required)
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.isLoadingCustomers = true;
    this.customerSubscription.add(
      this.customerService.getCustomers().subscribe({
        next: (data) => {
          this.customers = data;
          this.isLoadingCustomers = false;
        },
        error: (err) => {
          this.errorMessage = 'Error cargando clientes: ' + err.message;
          this.isLoadingCustomers = false;
        }
      })
    );

    this.isLoadingProducts = true;
    this.productSubscription.add(
      this.productService.getProducts().subscribe({
        next: (data) => {
          this.products = data;
          this.isLoadingProducts = false;
        },
        error: (err) => {
          this.errorMessage = 'Error cargando productos: ' + err.message;
          this.isLoadingProducts = false;
        }
      })
    );
  }

  get itemsFormArray(): FormArray {
    return this.saleForm.get('items') as FormArray;
  }

  createItemFormGroup(productId: number = 0, quantity: number = 1): FormGroup {
    return this.fb.group({
      productId: [productId, Validators.required],
      quantity: [quantity, [Validators.required, Validators.min(1)]]
    });
  }

  addItem(): void {
    if (this.products.length > 0) {
        this.itemsFormArray.push(this.createItemFormGroup());
    } else {
        this.errorMessage = "No hay productos disponibles para añadir.";
    }
  }

  removeItem(index: number): void {
    this.itemsFormArray.removeAt(index);
  }

  getProductById(productId: number): Product | undefined {
    return this.products.find(p => p.id === productId);
  }
  
  // CAMBIO AQUÍ: Acepta AbstractControl
  getItemSubtotal(itemControl: AbstractControl): number {
    const itemGroup = itemControl as FormGroup; // Casting dentro del método
    const productId = itemGroup.get('productId')?.value;
    const quantity = itemGroup.get('quantity')?.value;
    const product = this.getProductById(productId);
    return product && product.salePrice && quantity ? product.salePrice * quantity : 0;
  }

  calculateGrandTotal(): number {
    let total = 0;
    this.itemsFormArray.controls.forEach(control => {
      // No necesitas hacer casting aquí si getItemSubtotal acepta AbstractControl
      total += this.getItemSubtotal(control);
    });
    return total;
  }

  getAvailableProductsForItem(currentItemIndex?: number): Product[] {
    const selectedProductIds = this.itemsFormArray.controls
      .map((control, index) => (index !== currentItemIndex ? (control as FormGroup).get('productId')?.value : null))
      .filter(id => id != null);

    return this.products.filter(p => !selectedProductIds.includes(p.id));
  }

  onSubmit(): void {
    this.errorMessage = '';
    if (this.saleForm.invalid) {
      this.saleForm.markAllAsTouched();
      if (this.saleForm.get('customerId')?.errors?.['required']) {
        this.errorMessage = 'Debe seleccionar un cliente.';
      } else if (this.itemsFormArray.length === 0) {
        this.errorMessage = 'Debe añadir al menos un producto a la venta.';
      } else {
        this.errorMessage = 'Por favor, complete todos los campos requeridos correctamente.';
      }
      this.itemsFormArray.controls.forEach((itemCtrl, index) => {
        if (itemCtrl.invalid) {
          this.errorMessage += ` Error en el ítem ${index + 1}.`;
        }
      });
      return;
    }

    const saleRequest: SaleRequestDto = {
      customerId: this.saleForm.value.customerId,
      isPaid: this.saleForm.value.isPaid,
      items: this.saleForm.value.items.map((item: any) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity)
      }))
    };
    this.formSubmit.emit(saleRequest);
  }

  onCancelClick(): void {
    this.formCancel.emit();
  }

  ngOnDestroy(): void {
    this.customerSubscription.unsubscribe();
    this.productSubscription.unsubscribe();
  }
}