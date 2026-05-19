import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    NzButtonModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
  ],
  template: `
    <div class="auth-container">
      <section class="auth-card">
        <a routerLink="/auth/login" class="back-link">
          <span nz-icon nzType="arrow-left"></span>
          Back to login
        </a>

        <div class="auth-header">
          <img src="assets/brand/invenzo-logo.svg" alt="Invenzo" />
          <h1>Reset your password</h1>
          <p>Enter your account email and we will send reset instructions if the account exists.</p>
        </div>

        <form nz-form [formGroup]="form" (ngSubmit)="submit()" nzLayout="vertical">
          <nz-form-item>
            <nz-form-label nzRequired>Email</nz-form-label>
            <nz-form-control nzErrorTip="Enter a valid email address">
              <nz-input-group [nzPrefix]="mailPrefix">
                <input nz-input type="email" formControlName="email" placeholder="owner@invenzo.com" />
              </nz-input-group>
              <ng-template #mailPrefix>
                <span nz-icon nzType="mail"></span>
              </ng-template>
            </nz-form-control>
          </nz-form-item>

          <button nz-button nzType="primary" [nzLoading]="loading" [disabled]="form.invalid" class="submit-button">
            Send reset link
          </button>
        </form>
      </section>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      background: var(--invenzo-bg);
    }
    .auth-card {
      width: min(440px, 100%);
      background: var(--invenzo-surface);
      border: 1px solid var(--invenzo-border);
      border-radius: 8px;
      padding: 28px;
      box-shadow: 0 20px 50px var(--invenzo-shadow);
    }
    .back-link {
      display: inline-flex;
      gap: 6px;
      align-items: center;
      color: var(--invenzo-muted);
      margin-bottom: 24px;
    }
    .auth-header img {
      height: 42px;
      margin-bottom: 20px;
    }
    .auth-header h1 {
      color: var(--invenzo-ink);
      font-size: 28px;
      margin: 0 0 8px;
    }
    .auth-header p {
      color: var(--invenzo-muted);
      margin-bottom: 24px;
    }
    .submit-button {
      width: 100%;
      height: 42px;
    }
  `],
})
export class ForgotPasswordComponent {
  loading = false;
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly message: NzMessageService,
  ) {}

  submit(): void {
    if (this.form.invalid || !this.form.value.email) return;

    this.loading = true;
    this.authService.forgotPassword(this.form.value.email).subscribe({
      next: () => {
        this.loading = false;
        this.message.success('If the account exists, reset instructions have been sent.');
      },
      error: () => {
        this.loading = false;
        this.message.error('Unable to send reset instructions right now.');
      },
    });
  }
}
