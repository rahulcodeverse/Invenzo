import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { MasterDataService } from '../../../../core/services/master-data.service';
import { Warehouse } from '../../../../core/models/master-data.model';
import { SalesOrder } from '../../models/sales.model';
import { SalesService } from '../../services/sales.service';

@Component({
  selector: 'app-delivery-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzAlertModule,
    NzButtonModule,
    NzCardModule,
    NzDatePickerModule,
    NzFormModule,
    NzGridModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzTableModule
  ],
  template: `
    <nz-card>
      <div class="page-header">
        <h2>New Delivery Note</h2>
        <p *ngIf="selectedOrder">Dispatch items for {{ selectedOrder.orderNumber }}</p>
      </div>

      <nz-alert nzType="info" nzMessage="Stock will be reduced when this delivery is saved."
        nzShowIcon style="margin-bottom: 24px;"></nz-alert>

      <form nz-form [formGroup]="form" nzLayout="vertical" (ngSubmit)="submit()">
        <div nz-row [nzGutter]="16">
          <div nz-col [nzSpan]="10">
            <nz-form-item>
              <nz-form-label nzRequired>Sales Order</nz-form-label>
              <nz-form-control nzErrorTip="Select a confirmed order">
                <nz-select formControlName="salesOrderId" nzShowSearch nzPlaceHolder="Select sales order"
                  (ngModelChange)="loadOrder($event)">
                  <nz-option *ngFor="let order of orders"
                    [nzLabel]="order.orderNumber + ' - ' + (order.customer?.name || '')"
                    [nzValue]="order.id"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="8">
            <nz-form-item>
              <nz-form-label nzRequired>Warehouse</nz-form-label>
              <nz-form-control nzErrorTip="Select warehouse">
                <nz-select formControlName="warehouseId" nzShowSearch nzPlaceHolder="Select warehouse">
                  <nz-option *ngFor="let warehouse of warehouses" [nzLabel]="warehouse.name" [nzValue]="warehouse.id"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="6">
            <nz-form-item>
              <nz-form-label>Delivery Date</nz-form-label>
              <nz-form-control>
                <nz-date-picker formControlName="deliveryDate" style="width:100%"></nz-date-picker>
              </nz-form-control>
            </nz-form-item>
          </div>
        </div>

        <nz-table [nzData]="items.controls" [nzShowPagination]="false" nzSize="small">
          <thead>
            <tr>
              <th>Product</th>
              <th nzAlign="right">Ordered</th>
              <th nzAlign="right">Delivered</th>
              <th nzAlign="right">Pending</th>
              <th nzAlign="right">Deliver Now</th>
              <th>Batch</th>
            </tr>
          </thead>
          <tbody formArrayName="items">
            <tr *ngFor="let item of items.controls; let i = index" [formGroupName]="i">
              <td>{{ item.get('productName')?.value }}</td>
              <td nzAlign="right">{{ item.get('orderedQty')?.value }}</td>
              <td nzAlign="right">{{ item.get('deliveredQty')?.value }}</td>
              <td nzAlign="right">{{ item.get('pendingQty')?.value }}</td>
              <td nzAlign="right">
                <nz-input-number formControlName="quantity" [nzMin]="0" [nzMax]="item.get('pendingQty')?.value"
                  style="width:120px"></nz-input-number>
              </td>
              <td>
                <input nz-input formControlName="batchNumber" placeholder="Optional" />
              </td>
            </tr>
          </tbody>
        </nz-table>

        <nz-form-item style="margin-top:16px">
          <nz-form-label>Notes</nz-form-label>
          <nz-form-control>
            <textarea nz-input formControlName="notes" [nzAutosize]="{minRows:2,maxRows:4}"></textarea>
          </nz-form-control>
        </nz-form-item>

        <div class="form-actions">
          <button nz-button type="button" (click)="cancel()">Cancel</button>
          <button nz-button nzType="primary" type="submit" [nzLoading]="saving" [disabled]="form.invalid || !hasDeliverableQty()">
            <span nz-icon nzType="save"></span>
            Save Delivery
          </button>
        </div>
      </form>
    </nz-card>
  `,
  styles: [`
    .page-header { margin-bottom:24px; }
    .page-header h2 { margin:0; font-size:24px; font-weight:600; }
    .page-header p { margin:4px 0 0; color:rgba(0,0,0,.45); }
    .form-actions { display:flex; justify-content:flex-end; gap:12px; margin-top:24px; padding-top:24px; border-top:1px solid #f0f0f0; }
  `]
})
export class DeliveryFormComponent implements OnInit {
  form: FormGroup;
  orders: SalesOrder[] = [];
  warehouses: Warehouse[] = [];
  selectedOrder: SalesOrder | null = null;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private salesService: SalesService,
    private masterDataService: MasterDataService,
    private route: ActivatedRoute,
    private router: Router,
    private message: NzMessageService
  ) {
    this.form = this.fb.group({
      salesOrderId: [null, Validators.required],
      warehouseId: [null, Validators.required],
      deliveryDate: [new Date()],
      notes: [''],
      items: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.salesService.getSalesOrders({ limit: 200, status: 'CONFIRMED' }).subscribe({
      next: res => {
        this.orders = res.data;
        const orderId = this.route.snapshot.queryParamMap.get('orderId');
        if (orderId) {
          this.form.patchValue({ salesOrderId: orderId });
          this.loadOrder(orderId);
        }
      }
    });

    this.masterDataService.getWarehouses().subscribe({
      next: res => { this.warehouses = res.data; }
    });
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  loadOrder(orderId: string): void {
    if (!orderId) {
      this.items.clear();
      this.selectedOrder = null;
      return;
    }

    this.salesService.getSalesOrderById(orderId).subscribe({
      next: res => {
        this.selectedOrder = res.data;
        this.items.clear();
        this.selectedOrder.items
          .filter(item => (item.quantity - (item.deliveredQty || 0)) > 0)
          .forEach(item => {
            const pendingQty = item.quantity - (item.deliveredQty || 0);
            this.items.push(this.fb.group({
              productId: [item.productId, Validators.required],
              productName: [item.product?.name || item.productId],
              orderedQty: [item.quantity],
              deliveredQty: [item.deliveredQty || 0],
              pendingQty: [pendingQty],
              quantity: [pendingQty, [Validators.required, Validators.min(0), Validators.max(pendingQty)]],
              batchNumber: ['']
            }));
          });
      }
    });
  }

  hasDeliverableQty(): boolean {
    return this.items.controls.some(item => Number(item.get('quantity')?.value || 0) > 0);
  }

  submit(): void {
    if (this.form.invalid || !this.hasDeliverableQty()) {
      return;
    }

    const value = this.form.value;
    const payload = {
      salesOrderId: value.salesOrderId,
      warehouseId: value.warehouseId,
      deliveryDate: value.deliveryDate,
      notes: value.notes,
      items: value.items
        .filter((item: any) => Number(item.quantity) > 0)
        .map((item: any) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          batchNumber: item.batchNumber || undefined
        }))
    };

    this.saving = true;
    this.salesService.createDeliveryNote(payload).subscribe({
      next: () => {
        this.message.success('Delivery note created');
        this.router.navigate(['/sales/delivery']);
      },
      error: () => { this.saving = false; },
      complete: () => { this.saving = false; }
    });
  }

  cancel(): void {
    this.router.navigate(['/sales/delivery']);
  }
}
