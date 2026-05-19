import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { AppNotification, NotificationService } from '../../core/services/notification.service';
import { InvenzoTheme, ThemeService } from '../../core/services/theme.service';

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
    NzAvatarModule,
    NzBadgeModule,
    NzButtonModule
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit {
  isCollapsed = false;
  currentUser: User | null = null;
  notifications: AppNotification[] = [];
  unreadCount = 0;

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
      title: 'Manufacturing',
      icon: 'build',
      roles: ['OWNER', 'MANAGER', 'STAFF'],
      children: [
        { title: 'Production', link: '/manufacturing' },
        { title: 'MRP Planning', link: '/manufacturing/mrp' },
        { title: 'Purchase Indents', link: '/manufacturing/indents' },
        { title: 'BOMs', link: '/manufacturing/boms' },
        { title: 'Work Orders', link: '/manufacturing/work-orders' }
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
        { title: 'Payments', link: '/sales/payments' }
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
        { title: 'GST Reports', link: '/reports/gst' },
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
        { title: 'Company', link: '/settings/company' },
        { title: 'Audit Trail', link: '/settings/audit' }
      ]
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    readonly themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadNotifications();
      }
    });
  }

  loadNotifications(): void {
    this.notificationService.getNotifications({ page: 1, limit: 8 }).subscribe({
      next: res => {
        this.notifications = res.data;
      }
    });

    this.notificationService.getUnreadCount().subscribe({
      next: res => {
        this.unreadCount = res.data.count;
      }
    });
  }

  markNotificationRead(notification: AppNotification): void {
    if (notification.isRead) return;

    this.notificationService.markRead(notification.id).subscribe({
      next: () => {
        notification.isRead = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
    });
  }

  markAllNotificationsRead(): void {
    this.notificationService.markAllRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map(notification => ({ ...notification, isRead: true }));
        this.unreadCount = 0;
      }
    });
  }

  getNotificationColor(type: AppNotification['type']): string {
    return {
      LOW_STOCK: '#c56a1a',
      EXPIRY_ALERT: '#cf1322',
      PAYMENT_REMINDER: '#9a4f12',
      ORDER_UPDATE: '#20312a',
      SYSTEM: '#6f675f'
    }[type];
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

  get activeChildTitle(): string {
    const activeLink = this.activeChildLink;
    const childTitle = this.activeChildren.find(child => child.link === activeLink)?.title || '';
    return childTitle === this.activeMenuItem?.title ? '' : childTitle;
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

  setTheme(theme: InvenzoTheme): void {
    this.themeService.setTheme(theme);
  }
}

