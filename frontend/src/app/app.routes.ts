import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'products',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/products/products/product-list/product-list.component')
                .then(m => m.ProductListComponent)
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./features/products/products/product-form/product-form.component')
                .then(m => m.ProductFormComponent)
          },
          {
            path: ':id/edit',
            loadComponent: () =>
              import('./features/products/products/product-form/product-form.component')
                .then(m => m.ProductFormComponent)
          },
          {
            path: 'categories',
            loadComponent: () =>
              import('./features/products/categories/category-list.component')
                .then(m => m.CategoryListComponent)
          },
          {
            path: 'brands',
            loadComponent: () =>
              import('./features/products/brands/brand-list.component')
                .then(m => m.BrandListComponent)
          },
          {
            path: 'units',
            loadComponent: () =>
              import('./features/products/units/unit-list.component')
                .then(m => m.UnitListComponent)
          }
        ]
      },
      {
        path: 'settings',
        children: [
          {
            path: 'users',
            loadComponent: () =>
              import('./features/settings/users/user-list.component')
                .then(m => m.UserListComponent)
          },
          {
            path: 'warehouses',
            loadComponent: () =>
              import('./features/settings/warehouses/warehouse-list.component')
                .then(m => m.WarehouseListComponent)
          },
          {
            path: 'company',
            loadComponent: () =>
              import('./features/settings/company/company-settings.component')
                .then(m => m.CompanySettingsComponent)
          },
          {
            path: '',
            redirectTo: 'users',
            pathMatch: 'full'
          }
        ]
      },
      {
        path: 'inventory',
        children: [
          {
            path: 'stock',
            loadComponent: () =>
              import('./features/inventory/stock-overview/stock-overview.component')
                .then(m => m.StockOverviewComponent)
          },
          {
            path: 'adjustments',
            loadComponent: () =>
              import('./features/inventory/stock-adjustment/stock-adjustment.component')
                .then(m => m.StockAdjustmentComponent)
          },
          {
            path: 'transfers',
            loadComponent: () =>
              import('./features/inventory/transfer-form/transfer-form.component')
                .then(m => m.TransferFormComponent)
          },
          {
            path: 'movements',
            loadComponent: () =>
              import('./features/inventory/movements/movement-list/movement-list.component')
                .then(m => m.MovementListComponent)
          },
          {
            path: '',
            redirectTo: 'stock',
            pathMatch: 'full'
          }
        ]
      },
      {
        path: 'sales',
        children: [
          {
            path: 'quotations',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./features/sales/quotations/quotation-list/quotation-list.component')
                    .then(m => m.QuotationListComponent)
              },
              {
                path: 'new',
                loadComponent: () =>
                  import('./features/sales/quotations/quotation-form/quotation-form.component')
                    .then(m => m.QuotationFormComponent)
              },
              {
                path: ':id/edit',
                loadComponent: () =>
                  import('./features/sales/quotations/quotation-form/quotation-form.component')
                    .then(m => m.QuotationFormComponent)
              }
            ]
          },
          {
            path: 'orders',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./features/sales/orders/sales-order-list/sales-order-list.component')
                    .then(m => m.SalesOrderListComponent)
              },
              {
                path: 'new',
                loadComponent: () =>
                  import('./features/sales/orders/sales-order-form/sales-order-form.component')
                    .then(m => m.SalesOrderFormComponent)
              },
              {
                path: ':id',
                loadComponent: () =>
                  import('./features/sales/orders/sales-order-form/sales-order-form.component')
                    .then(m => m.SalesOrderFormComponent)
              }
            ]
          },
          {
            path: 'invoices',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./features/sales/invoices/invoice-list/invoice-list.component')
                    .then(m => m.InvoiceListComponent)
              },
              {
                path: 'new',
                loadComponent: () =>
                  import('./features/sales/invoices/invoice-form/invoice-form.component')
                    .then(m => m.InvoiceFormComponent)
              },
              {
                path: ':id',
                loadComponent: () =>
                  import('./features/sales/invoices/invoice-form/invoice-form.component')
                    .then(m => m.InvoiceFormComponent)
              }
            ]
          },
          {
            path: 'delivery',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./features/sales/delivery/delivery-list/delivery-list.component')
                    .then(m => m.DeliveryListComponent)
              },
              {
                path: 'new',
                loadComponent: () =>
                  import('./features/sales/delivery/delivery-form/delivery-form.component')
                    .then(m => m.DeliveryFormComponent)
              }
            ]
          },
          {
            path: 'payments',
            children: [
              {
                path: 'new',
                loadComponent: () =>
                  import('./features/sales/payments/payment-form/payment-form.component')
                    .then(m => m.PaymentFormComponent)
              }
            ]
          }
        ]
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./features/sales/customers/customer-list.component')
            .then(m => m.CustomerListComponent)
      },
      {
        path: 'vendors',
        loadComponent: () =>
          import('./features/purchases/vendors/vendor-list.component')
            .then(m => m.VendorListComponent)
      },
      {
        path: 'purchases',
        children: [
          {
            path: 'orders',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./features/purchases/purchase-orders/po-list.component')
                    .then(m => m.PoListComponent)
              },
              {
                path: 'new',
                loadComponent: () =>
                  import('./features/purchases/purchase-orders/po-form.component')
                    .then(m => m.PoFormComponent)
              },
              {
                path: ':id',
                loadComponent: () =>
                  import('./features/purchases/purchase-orders/po-form.component')
                    .then(m => m.PoFormComponent)
              }
            ]
          },
          {
            path: 'grn',
            loadComponent: () =>
              import('./features/purchases/grn/grn-list.component')
                .then(m => m.GrnListComponent)
          },
          {
            path: 'invoices',
            loadComponent: () =>
              import('./features/purchases/invoices/purchase-invoice-list.component')
                .then(m => m.PurchaseInvoiceListComponent)
          },
          {
            path: 'payments',
            loadComponent: () =>
              import('./features/purchases/payments/vendor-payment-list.component')
                .then(m => m.VendorPaymentListComponent)
          },
          { path: '', redirectTo: 'orders', pathMatch: 'full' }
        ]
      },
      {
        path: 'manufacturing',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/manufacturing/production-dashboard.component')
                .then(m => m.ProductionDashboardComponent)
          },
          {
            path: 'boms',
            loadComponent: () =>
              import('./features/manufacturing/bom-list.component')
                .then(m => m.BomListComponent)
          },
          {
            path: 'work-orders',
            loadComponent: () =>
              import('./features/manufacturing/work-order-list.component')
                .then(m => m.WorkOrderListComponent)
          }
        ]
      },
      {
        path: 'accounting',
        children: [
          {
            path: 'journal',
            loadComponent: () =>
              import('./features/accounting/journal/journal-list.component')
                .then(m => m.JournalListComponent)
          },
          {
            path: 'chart-of-accounts',
            loadComponent: () =>
              import('./features/accounting/chart-of-accounts/chart-of-accounts.component')
                .then(m => m.ChartOfAccountsComponent)
          },
          {
            path: 'reports',
            loadComponent: () =>
              import('./features/accounting/reports/financial-reports.component')
                .then(m => m.FinancialReportsComponent)
          },
          { path: '', redirectTo: 'journal', pathMatch: 'full' }
        ]
      },
      {
        path: 'reports',
        children: [
          {
            path: 'sales',
            loadComponent: () =>
              import('./features/reports/sales-analytics/sales-analytics.component')
                .then(m => m.SalesAnalyticsComponent)
          },
          {
            path: 'inventory',
            loadComponent: () =>
              import('./features/reports/inventory-analytics/inventory-analytics.component')
                .then(m => m.InventoryAnalyticsComponent)
          },
          {
            path: 'kpi',
            loadComponent: () =>
              import('./features/reports/kpi-dashboard/kpi-dashboard.component')
                .then(m => m.KpiDashboardComponent)
          },
          {
            path: 'gst',
            loadComponent: () =>
              import('./features/reports/gst-report/gst-report.component')
                .then(m => m.GstReportComponent)
          },
          { path: '', redirectTo: 'kpi', pathMatch: 'full' }
        ]
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];
