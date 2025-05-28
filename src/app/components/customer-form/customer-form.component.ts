import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Customer } from '../../models/customer.model';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './customer-form.component.html',
  styleUrls: ['./customer-form.component.scss']
})
export class CustomerFormComponent implements OnChanges {
  @Input() customerData: Customer | null = null;
  @Output() formSubmit = new EventEmitter<Partial<Customer>>(); // Partial para creación
  @Output() formCancel = new EventEmitter<void>();

  customerForm: FormGroup;
  private fb = inject(FormBuilder);

  constructor() {
    this.customerForm = this.fb.group({
      id: [null],
      name: ['', [Validators.required, Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      address: ['', Validators.maxLength(200)],
      phone: ['', Validators.maxLength(20)],
      email: ['', [Validators.email, Validators.maxLength(100)]]
      // currentDebt no se edita aquí, es informativo
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['customerData'] && this.customerData) {
      this.customerForm.patchValue(this.customerData);
    } else if (changes['customerData'] && !this.customerData) {
      this.customerForm.reset({ id: null, name: '', lastName: '' });
    }
  }

  get name() { return this.customerForm.get('name'); }
  get lastName() { return this.customerForm.get('lastName'); }
  get email() { return this.customerForm.get('email'); }

  onSubmit(): void {
    if (this.customerForm.valid) {
      const formValue = { ...this.customerForm.value };
      const customerToSend: Partial<Customer> = {
        name: formValue.name,
        lastName: formValue.lastName,
        address: formValue.address,
        phone: formValue.phone,
        email: formValue.email,
      };

      if (formValue.id) { // Si es edición
        customerToSend.id = formValue.id;
      }
      // No enviamos currentDebt, la API lo gestiona

      this.formSubmit.emit(customerToSend);
    } else {
      this.customerForm.markAllAsTouched();
    }
  }

  onCancelClick(): void {
    this.formCancel.emit();
  }
}