// src/app/components/product-form/product-form.component.ts

import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class ProductFormComponent implements OnChanges {
  @Input() productData: Product | null = null;
  @Output() formSubmit = new EventEmitter<Product>(); // Puede que necesites cambiar el tipo si a veces no envías 'id'
  @Output() formCancel = new EventEmitter<void>();

  productForm: FormGroup;
  private fb = inject(FormBuilder);

  constructor() {
    this.productForm = this.fb.group({
      id: [null], // El valor del formulario puede ser null
      name: ['', [Validators.required, Validators.maxLength(100)]],
      brand: ['', Validators.maxLength(50)],
      description: ['', Validators.maxLength(500)],
      category: ['', Validators.maxLength(50)],
      purchasePrice: [null, [Validators.required, Validators.min(0.01)]],
      profitPercentage: [null, [Validators.required, Validators.min(0), Validators.max(1)]]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productData'] && this.productData) {
      this.productForm.patchValue(this.productData);
    } else if (changes['productData'] && !this.productData) {
      this.productForm.reset({
        id: null, name: '', purchasePrice: null, profitPercentage: null // Usa null para valores numéricos opcionales o nuevos
      });
    }
  }

  get name() { return this.productForm.get('name'); }
  get purchasePrice() { return this.productForm.get('purchasePrice'); }
  get profitPercentage() { return this.productForm.get('profitPercentage'); }

  onSubmit(): void {
    if (this.productForm.valid) {
      const formValue = { ...this.productForm.value }; // Copia los valores del formulario

      // Prepara el objeto a enviar, excluyendo 'id' si es una creación
      const productToSend: Partial<Product> = { // Usamos Partial<Product> para permitir la omisión de 'id'
        name: formValue.name,
        brand: formValue.brand,
        description: formValue.description,
        category: formValue.category,
        // Asegúrate de que los números se conviertan correctamente si el input los da como string
        purchasePrice: typeof formValue.purchasePrice === 'string' ? parseFloat(formValue.purchasePrice) : formValue.purchasePrice,
        profitPercentage: typeof formValue.profitPercentage === 'string' ? parseFloat(formValue.profitPercentage) : formValue.profitPercentage,
      };

      // Si es una edición (es decir, hay un 'id' en el valor del formulario y no es null/0), incluye el id.
      // El valor de 'id' en el formulario viene de 'productData' cuando se edita.
      if (formValue.id) { // O podrías verificar this.productData && this.productData.id
        productToSend.id = formValue.id;
      }
      // Si 'formValue.id' es null o 0 (indicando un nuevo producto), la propiedad 'id'
      // no se añadirá al objeto 'productToSend'.

      console.log('Enviando producto (Opción C - sin ID para creación si aplica):', productToSend);
      this.formSubmit.emit(productToSend as Product); // Emitimos, el backend se encarga del resto.
                                                      // El 'as Product' es porque el servicio espera un Product completo,
                                                      // pero para la creación, el ID es opcional desde el cliente.
                                                      // Si el servicio también usa Partial<Product> para 'addProduct', sería más type-safe.
    } else {
      this.productForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.formCancel.emit();
  }
}