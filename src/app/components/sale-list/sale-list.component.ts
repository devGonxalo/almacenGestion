import { Component, OnInit, OnDestroy, TemplateRef, inject,ViewChild } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Sale } from '../../models/sale.model';
import { SaleService } from '../../services/sale.service';
import { Subscription } from 'rxjs';
import { NgbModal, NgbModalRef, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { SaleFormComponent } from '../sale-form/sale-form.component'; // Importa el componente del formulario

@Component({
  selector: 'app-sale-list',
  standalone: true,
  imports: [CommonModule, NgbModalModule, SaleFormComponent, CurrencyPipe, DatePipe],
  templateUrl: './sale-list.component.html',
  styleUrls: ['./sale-list.component.scss']
})
export class SaleListComponent implements OnInit, OnDestroy {
  sales: Sale[] = [];
  private salesSubscription: Subscription = new Subscription();
  isLoading = false;
  errorMessage = '';
  modalErrorMessage = '';

  @ViewChild(SaleFormComponent) private saleFormComponentInstance!: SaleFormComponent; // Referencia al componente 

  private modalService = inject(NgbModal);
  private activeModal: NgbModalRef | undefined;

  constructor(private saleService: SaleService) {}

  ngOnInit(): void {
    this.loadSales();
  }


    // Este método es llamado por el botón "Registrar Venta" del modal
  triggerSaleFormSubmit(): void {
    if (this.saleFormComponentInstance) {
      this.saleFormComponentInstance.onSubmit(); // Llama al método onSubmit() del SaleFormComponent
    } else {
      console.error("SaleFormComponent instance no encontrada.");
      this.modalErrorMessage = "Error interno: no se puede enviar el formulario de venta.";
    }
  }


  


  loadSales(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.salesSubscription = this.saleService.getSales().subscribe({
      next: (data) => {
        this.sales = data.sort((a,b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()); // Ordenar por fecha descendente
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Falló la carga de ventas.';
        this.isLoading = false;
      }
    });
  }

  openNewSaleModal(content: TemplateRef<any>): void {
    this.modalErrorMessage = '';
    this.activeModal = this.modalService.open(content, { ariaLabelledBy: 'modal-new-sale-title', size: 'xl' }); // Modal extra grande
  }

  onSaleFormSubmit(saleRequest: any): void { // El tipo viene del output del SaleFormComponent
    this.isLoading = true; // Podría ser un spinner dentro del modal
    this.modalErrorMessage = '';
    this.saleService.addSale(saleRequest).subscribe({
      next: () => {
        this.loadSales();
        this.activeModal?.close();
        this.isLoading = false;
        // Mostrar mensaje de éxito (Toast)
      },
      error: (err) => {
        this.modalErrorMessage = err.message || 'Falló el registro de la venta.';
        this.isLoading = false;
      }
    });
  }
  
  getProductName(productId: number, sale: Sale): string {
    const item = sale.saleItems.find(si => si.productId === productId);
    return item?.product?.name ?? 'Producto no encontrado';
  }


  ngOnDestroy(): void {
    if (this.salesSubscription) {
      this.salesSubscription.unsubscribe();
    }
  }
}