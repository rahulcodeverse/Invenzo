import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ManufacturingService } from './services/manufacturing.service';

@Component({
  selector: 'app-bom-list',
  standalone: true,
  imports: [CommonModule, NzCardModule, NzTableModule, NzTagModule],
  template: `
    <div class="page-header">
      <h2>Bill of Materials</h2>
      <p>Define finished goods, raw materials, wastage, and routing steps.</p>
    </div>
    <nz-card>
      <nz-table [nzData]="boms" [nzLoading]="loading">
        <thead>
          <tr><th>BOM No.</th><th>Name</th><th>Finished Good</th><th>Version</th><th>Materials</th><th>Routing</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let bom of boms">
            <td><strong>{{ bom.bomNumber }}</strong></td>
            <td>{{ bom.name }}</td>
            <td>{{ bom.product?.name }}<br><small>{{ bom.product?.sku }}</small></td>
            <td>{{ bom.version }}</td>
            <td><nz-tag nzColor="gold">{{ bom.items?.length || 0 }} items</nz-tag></td>
            <td><nz-tag nzColor="orange">{{ bom.routingSteps?.length || 0 }} steps</nz-tag></td>
          </tr>
        </tbody>
      </nz-table>
    </nz-card>
  `,
  styles: [`.page-header{margin-bottom:20px}.page-header h2{margin:0;font-size:24px;font-weight:750}.page-header p{margin:4px 0 0;color:#6f675f}`],
})
export class BomListComponent implements OnInit {
  loading = false;
  boms: any[] = [];

  constructor(private manufacturingService: ManufacturingService) {}

  ngOnInit(): void {
    this.loading = true;
    this.manufacturingService.getBoms().subscribe({
      next: res => { this.boms = res.data?.data ?? res.data ?? []; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
