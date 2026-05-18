import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterModule, NzButtonModule, NzIconModule],
  template: `
    <div class="app-page-header">
      <div class="app-page-header__main">
        <a
          *ngIf="backLink"
          nz-button
          nzType="default"
          class="app-page-header__back"
          [routerLink]="backLink"
        >
          <span nz-icon nzType="arrow-left"></span>
          {{ backLabel }}
        </a>

        <div class="app-page-header__copy">
          <h2>{{ title }}</h2>
          <p *ngIf="subtitle">{{ subtitle }}</p>
        </div>
      </div>

      <div class="app-page-header__actions">
        <ng-content select="[pageActions]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .app-page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 24px;
    }

    .app-page-header__main {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      min-width: 0;
    }

    .app-page-header__back {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      height: 36px;
      padding: 0 12px;
      border-color: var(--invenzo-border);
      color: var(--invenzo-ink);
      font-weight: 700;
      border-radius: 7px;
      background: #fffaf5;
      flex: 0 0 auto;
    }

    .app-page-header__back:hover,
    .app-page-header__back:focus {
      color: var(--invenzo-copper-dark);
      border-color: var(--invenzo-copper);
      background: #fff4e8;
    }

    .app-page-header__copy {
      min-width: 0;
    }

    h2 {
      margin: 0;
      color: var(--invenzo-ink);
      font-size: 24px;
      line-height: 1.25;
      font-weight: 750;
    }

    p {
      margin: 5px 0 0;
      color: var(--invenzo-muted);
      font-size: 14px;
      line-height: 1.45;
    }
    .app-page-header__actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 0 0 auto;
    }

    .app-page-header__actions:empty {
      display: none;
    }

    @media (max-width: 680px) {
      .app-page-header {
        flex-direction: column;
      }

      .app-page-header__main {
        flex-direction: column;
      }
    }
  `]
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() backLink = '';
  @Input() backLabel = 'Back';
}
