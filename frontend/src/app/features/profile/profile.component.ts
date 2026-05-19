import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { AuthService } from '../../core/services/auth.service';
import { InvenzoTheme, ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    NzAvatarModule,
    NzButtonModule,
    NzCardModule,
    NzDescriptionsModule,
    NzIconModule,
    NzTagModule,
  ],
  template: `
    <div class="profile-page">
      <section class="profile-hero">
        <nz-avatar [nzText]="userInitials" [nzSize]="72"></nz-avatar>
        <div>
          <p class="eyebrow">My Account</p>
          <h1>{{ userName }}</h1>
          <span>{{ user?.email }}</span>
        </div>
      </section>

      <div class="profile-grid">
        <nz-card>
          <h2>Profile Details</h2>
          <nz-descriptions [nzColumn]="1" nzSize="middle">
            <nz-descriptions-item nzTitle="Name">{{ userName }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="Email">{{ user?.email || '-' }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="Role">
              <nz-tag [nzColor]="roleColor">{{ user?.role || '-' }}</nz-tag>
            </nz-descriptions-item>
            <nz-descriptions-item nzTitle="Status">
              <nz-tag [nzColor]="user?.isActive ? 'success' : 'default'">
                {{ user?.isActive ? 'Active' : 'Inactive' }}
              </nz-tag>
            </nz-descriptions-item>
          </nz-descriptions>
        </nz-card>

        <nz-card>
          <h2>Appearance</h2>
          <div class="theme-list">
            <button
              *ngFor="let theme of themeService.themes"
              nz-button
              type="button"
              class="theme-option"
              [class.active]="theme.id === themeService.activeTheme"
              (click)="setTheme(theme.id)"
            >
              <span class="theme-swatch" [ngClass]="theme.id"></span>
              <span>{{ theme.label }}</span>
              <span *ngIf="theme.id === themeService.activeTheme" nz-icon nzType="check"></span>
            </button>
          </div>
        </nz-card>
      </div>
    </div>
  `,
  styles: [`
    .profile-page {
      display: grid;
      gap: 18px;
    }

    .profile-hero {
      display: flex;
      align-items: center;
      gap: 18px;
      padding: 24px;
      border: 1px solid var(--invenzo-border);
      border-radius: 8px;
      background: var(--invenzo-surface);
      box-shadow: 0 10px 28px var(--invenzo-shadow);
    }

    .profile-hero nz-avatar {
      background: var(--invenzo-primary);
      color: #fff;
      font-size: 24px;
      font-weight: 850;
    }

    .eyebrow {
      margin: 0 0 4px;
      color: var(--invenzo-primary-dark);
      font-size: 12px;
      font-weight: 850;
      text-transform: uppercase;
    }

    h1,
    h2 {
      margin: 0;
      color: var(--invenzo-ink);
      font-weight: 850;
    }

    h1 {
      font-size: 30px;
      line-height: 1.15;
    }

    h2 {
      margin-bottom: 16px;
      font-size: 18px;
    }

    .profile-hero span {
      color: var(--invenzo-muted);
    }

    .profile-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(320px, 420px);
      gap: 18px;
    }

    .theme-list {
      display: grid;
      gap: 10px;
    }

    .theme-option {
      display: grid;
      grid-template-columns: 18px minmax(0, 1fr) 18px;
      align-items: center;
      gap: 10px;
      width: 100%;
      height: 44px;
      border-color: var(--invenzo-border);
      color: var(--invenzo-ink);
      font-weight: 750;
      text-align: left;
      background: var(--invenzo-surface);
    }

    .theme-option.active,
    .theme-option:hover {
      border-color: var(--invenzo-primary);
      background: var(--invenzo-primary-soft);
    }

    .theme-swatch {
      width: 18px;
      height: 18px;
      border: 1px solid var(--invenzo-border);
      border-radius: 50%;
    }

    .theme-swatch.teal-light {
      background: linear-gradient(135deg, rgb(14, 138, 139) 0 50%, #f4efe5 50% 100%);
    }

    .theme-swatch.teal-dark {
      background: linear-gradient(135deg, rgb(14, 138, 139) 0 50%, #000 50% 100%);
    }

    .theme-swatch.copper-smooth {
      background: linear-gradient(135deg, #c56a1a 0 50%, #f4f0ea 50% 100%);
    }

    @media (max-width: 860px) {
      .profile-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class ProfileComponent {
  readonly user = this.authService.getCurrentUser();

  constructor(
    private readonly authService: AuthService,
    readonly themeService: ThemeService,
  ) {}

  setTheme(theme: InvenzoTheme): void {
    this.themeService.setTheme(theme);
  }

  get userName(): string {
    if (!this.user) return 'User';
    return `${this.user.firstName} ${this.user.lastName}`;
  }

  get userInitials(): string {
    if (!this.user) return 'U';
    return `${this.user.firstName[0]}${this.user.lastName[0]}`.toUpperCase();
  }

  get roleColor(): string {
    const colors: Record<string, string> = {
      OWNER: 'red',
      MANAGER: 'gold',
      STAFF: 'blue',
      ACCOUNTANT: 'purple',
    };

    return colors[this.user?.role || ''] || 'default';
  }
}
