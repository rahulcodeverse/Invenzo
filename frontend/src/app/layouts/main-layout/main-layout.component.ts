import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzLayoutModule,
    NzMenuModule,
    NzIconModule,
    NzBreadCrumbModule,
    NzDropDownModule,
    NzAvatarModule
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit {
  isCollapsed = false;
  currentUser: User | null = null;

  menuItems = [
    {
      title: 'Dashboard',
      icon: 'dashboard',
      link: '/dashboard',
      roles: ['OWNER', 'MANAGER', 'STAFF', 'ACCOUNTANT']
    },
    {
      title: 'Products',
      icon: 'appstore',
      roles: ['OWNER', 'MANAGER', 'STAFF'],
      children: [
        { title: 'Products', link: '/products' },
        { title: 'Categories', link: '/products/categories' },
        { title: 'Brands', link: '/products/brands' },
        { title: 'Units', link: '/products/units' }
      ]
    },
    {
      title: 'Inventory',
      icon: 'inbox',
      roles: ['OWNER', 'MANAGER', 'STAFF'],
      children: [
        { title: 'Stock Overview', link: '/inventory/stock' },
        { title: 'Stock Transfer', link: '/inventory/transfers' },
        { title: 'Adjustments', link: '/inventory/adjustments' },
        { title: 'Movements', link: '/inventory/movements' }
      ]
    },
    {
      title: 'Purchases',
      icon: 'shopping-cart',
      roles: ['OWNER', 'MANAGER', 'STAFF'],
      children: [
        { title: 'Vendors', link: '/vendors' },
        { title: 'Purchase Orders', link: '/purchases/orders' },
        { title: 'GRN', link: '/purchases/grn' },
        { title: 'Invoices', link: '/purchases/invoices' },
        { title: 'Payments', link: '/purchases/payments' }
      ]
    },
    {
      title: 'Sales',
      icon: 'shopping',
      roles: ['OWNER', 'MANAGER', 'STAFF'],
      children: [
        { title: 'Customers', link: '/customers' },
        { title: 'Quotations', link: '/sales/quotations' },
        { title: 'Sales Orders', link: '/sales/orders' },
        { title: 'Delivery Notes', link: '/sales/delivery' },
        { title: 'Invoices', link: '/sales/invoices' },
        { title: 'Payments', link: '/sales/payments/new' }
      ]
    },
    {
      title: 'Accounting',
      icon: 'calculator',
      roles: ['OWNER', 'MANAGER', 'ACCOUNTANT'],
      children: [
        { title: 'Chart of Accounts', link: '/accounting/chart-of-accounts' },
        { title: 'Journal Entries', link: '/accounting/journal' },
        { title: 'Financial Reports', link: '/accounting/reports' }
      ]
    },
    {
      title: 'Reports',
      icon: 'bar-chart',
      roles: ['OWNER', 'MANAGER', 'ACCOUNTANT'],
      children: [
        { title: 'Sales Analytics', link: '/reports/sales' },
        { title: 'Inventory Analytics', link: '/reports/inventory' },
        { title: 'KPIs', link: '/reports/kpi' }
      ]
    },
    {
      title: 'Settings',
      icon: 'setting',
      roles: ['OWNER', 'MANAGER'],
      children: [
        { title: 'Users', link: '/settings/users' },
        { title: 'Warehouses', link: '/settings/warehouses' },
        { title: 'Company', link: '/settings/company' }
      ]
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  get filteredMenuItems() {
    return this.menuItems.filter(item =>
      !item.roles || this.hasRole(item.roles)
    );
  }

  get activeMenuItem() {
    const url = this.router.url.split('?')[0];
    return this.filteredMenuItems.find(item => {
      if (item.link && (url === item.link || url.startsWith(`${item.link}/`))) {
        return true;
      }

      return item.children?.some(child => url === child.link || url.startsWith(`${child.link}/`));
    }) || this.filteredMenuItems[0];
  }

  get activeChildren() {
    return this.activeMenuItem?.children || [];
  }

  get activeChildLink(): string | null {
    const url = this.router.url.split('?')[0];
    const matches = this.activeChildren
      .filter(child => url === child.link || url.startsWith(`${child.link}/`))
      .sort((a, b) => b.link.length - a.link.length);

    return matches[0]?.link || null;
  }

  isTopItemActive(item: any): boolean {
    return this.activeMenuItem === item;
  }

  isChildActive(link: string): boolean {
    return this.activeChildLink === link;
  }

  hasRole(roles: string[]): boolean {
    return this.authService.hasRole(roles);
  }

  logout(): void {
    this.authService.logout();
  }

  get userInitials(): string {
    if (!this.currentUser) return 'U';
    return `${this.currentUser.firstName[0]}${this.currentUser.lastName[0]}`.toUpperCase();
  }

  get userName(): string {
    if (!this.currentUser) return 'User';
    return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
  }
}

