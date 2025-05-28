import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms'; // Para el modal de pago
import { Customer, DebtPaymentRequest} from '../../models/customer.model';
import { CustomerService } from '../../services/customer.service';
import { Subscription } from 'rxjs';
import { NgbModal, NgbModalRef, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { CustomerFormComponent } from '../customer-form/customer-form.component'; // Importa el componente del formulario

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModalModule, CustomerFormComponent], // Asegúrate que CustomerFormComponent esté aquí
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.scss']
})
export class CustomerListComponent implements OnInit, OnDestroy {
  customers: Customer[] = [];
  private customerSubscription: Subscription = new Subscription();
  isLoading = false;
  errorMessage = ''; // Mensaje de error general para la lista
  modalErrorMessage = ''; // Mensaje de error para los modales

  private modalService = inject(NgbModal);
  private activeModal: NgbModalRef | undefined;
  currentCustomer: Customer | null = null;
  customerToDelete: Customer | null = null;

  // Para el modal de pago de deuda
  customerForPayment: Customer | null = null;
  debtPaymentForm: FormGroup;
  private fb = inject(FormBuilder);


  @ViewChild(CustomerFormComponent) customerFormComponent!: CustomerFormComponent;


  constructor(private customerService: CustomerService) {
     this.debtPaymentForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]]
    });
  }

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.customerSubscription = this.customerService.getCustomers().subscribe({
      next: (data) => {
        this.customers = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Falló la carga de clientes.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  openAddCustomerModal(content: TemplateRef<any>): void {
    this.currentCustomer = null; // Para indicar que es nuevo
    this.modalErrorMessage = '';
    this.activeModal = this.modalService.open(content, { ariaLabelledBy: 'modal-customer-title', size: 'lg' });
  }

  openEditCustomerModal(content: TemplateRef<any>, customer: Customer): void {
    this.currentCustomer = { ...customer };
    this.modalErrorMessage = '';
    this.activeModal = this.modalService.open(content, { ariaLabelledBy: 'modal-customer-title', size: 'lg' });
  }

  // Método para que el botón del modal dispare el submit del formulario hijo
  triggerCustomerFormSubmit(): void {
    if (this.customerFormComponent) {
      this.customerFormComponent.onSubmit();
    }
  }

  onCustomerFormSubmit(customerData: Partial<Customer>): void {
    this.isLoading = true;
    this.modalErrorMessage = '';
    const customerToSave: Customer = customerData as Customer; // Asumimos que si tiene ID es Customer completo

    if (customerToSave.id) { // Editar
      this.customerService.updateCustomer(customerToSave.id, customerToSave).subscribe({
        next: () => this.handleSuccess('Cliente actualizado exitosamente.'),
        error: (err) => this.handleErrorInModal(err, 'Falló la actualización del cliente.')
      });
    } else { // Añadir
      this.customerService.addCustomer(customerData).subscribe({ // Enviamos Partial<Customer>
        next: () => this.handleSuccess('Cliente añadido exitosamente.'),
        error: (err) => this.handleErrorInModal(err, 'Falló al añadir el cliente.')
      });
    }
  }

  openDeleteConfirmModal(content: TemplateRef<any>, customer: Customer): void {
    this.customerToDelete = customer;
    this.modalErrorMessage = '';
    this.activeModal = this.modalService.open(content, { ariaLabelledBy: 'modal-delete-confirm-title', centered: true });
  }

  confirmDelete(): void {
    if (this.customerToDelete && this.customerToDelete.id) {
      this.isLoading = true; // Puede ser un spinner diferente para el modal
      this.modalErrorMessage = '';
      this.customerService.deleteCustomer(this.customerToDelete.id).subscribe({
        next: () => {
          this.handleSuccess('Cliente eliminado exitosamente.');
          this.customerToDelete = null;
        },
        error: (err) => this.handleErrorInModal(err, 'Falló la eliminación del cliente.', true) // true to close modal anyway
      });
    }
  }

  openPayDebtModal(content: TemplateRef<any>, customer: Customer): void {
    this.customerForPayment = customer;
    this.debtPaymentForm.reset({ amount: null });
    if (customer.currentDebt && customer.currentDebt > 0) {
         this.debtPaymentForm.get('amount')?.setValidators([
            Validators.required,
            Validators.min(0.01),
            Validators.max(customer.currentDebt) // Máximo es la deuda actual
        ]);
    } else {
         this.debtPaymentForm.get('amount')?.setValidators([
            Validators.required,
            Validators.min(0.01)
        ]);
    }
    this.debtPaymentForm.get('amount')?.updateValueAndValidity();
    this.modalErrorMessage = '';
    this.activeModal = this.modalService.open(content, { ariaLabelledBy: 'modal-pay-debt-title', centered: true });
  }

  onPayDebtSubmit(): void {
    if (!this.customerForPayment || !this.customerForPayment.id || !this.debtPaymentForm.valid) {
      this.debtPaymentForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.modalErrorMessage = '';
    const paymentRequest: DebtPaymentRequest = { amount: this.debtPaymentForm.value.amount };

    this.customerService.payDebt(this.customerForPayment.id, paymentRequest).subscribe({
      next: (response) => {
        // Actualizar la deuda del cliente en la lista local o recargar todo
        const customerInList = this.customers.find(c => c.id === this.customerForPayment?.id);
        if (customerInList) {
          customerInList.currentDebt = response.newDebt;
        }
        this.handleSuccess('Pago registrado exitosamente.');
      },
      error: (err) => this.handleErrorInModal(err, 'Falló el registro del pago.')
    });
  }


  private handleSuccess(successMessage: string): void {
    this.loadCustomers();
    this.activeModal?.close();
    this.isLoading = false;
    // Aquí podrías usar un servicio de Toast para mostrar 'successMessage'
    console.log(successMessage);
  }

  private handleErrorInModal(error: any, defaultMessage: string, closeModalOnError: boolean = false): void {
    this.modalErrorMessage = error.message || defaultMessage;
    this.isLoading = false;
    if (closeModalOnError) {
        this.activeModal?.close();
    }
    console.error(error);
  }

  ngOnDestroy(): void {
    if (this.customerSubscription) {
      this.customerSubscription.unsubscribe();
    }
  }
}