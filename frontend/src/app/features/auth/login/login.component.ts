import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzCheckboxModule,
    NzIconModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  loading = false;
  activeSlideIndex = 0;
  private slideTimer?: ReturnType<typeof setInterval>;
  readonly slides = [
    {
      eyebrow: 'Inventory control',
      title: 'See stock clearly before every decision.',
      body: 'Warehouse availability, transfers, adjustments, ageing, and low-stock signals stay visible from one workspace.',
      metric: 'Live stock'
    },
    {
      eyebrow: 'Manufacturing flow',
      title: 'Turn demand into production without friction.',
      body: 'Move from BOM to MRP, purchase indents, and work orders with fewer gaps between planning and execution.',
      metric: 'MRP ready'
    },
    {
      eyebrow: 'Order to invoice',
      title: 'Connect every order to the stock behind it.',
      body: 'Quotes, purchase orders, GRNs, delivery notes, invoices, and payments stay tied to inventory impact.',
      metric: 'Flow linked'
    },
    {
      eyebrow: 'Finance and reports',
      title: 'Close faster with reports that already know the flow.',
      body: 'Ledgers, balances, inventory reports, GST summaries, and KPIs reflect what happened across operations.',
      metric: 'Reports built in'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private message: NzMessageService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [true]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      const { email, password } = this.loginForm.value;

      this.authService.login({ email, password }).subscribe({
        next: () => {
          this.message.success('Login successful!');
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
          this.router.navigateByUrl(returnUrl);
        },
        error: (error) => {
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
    } else {
      Object.values(this.loginForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  ngOnInit(): void {
    this.slideTimer = setInterval(() => this.nextSlide(), 5200);
  }

  ngOnDestroy(): void {
    if (this.slideTimer) {
      clearInterval(this.slideTimer);
    }
  }

  get activeSlide() {
    return this.slides[this.activeSlideIndex];
  }

  selectSlide(index: number): void {
    this.activeSlideIndex = index;
    this.restartCarousel();
  }

  nextSlide(): void {
    this.activeSlideIndex = (this.activeSlideIndex + 1) % this.slides.length;
  }

  previousSlide(): void {
    this.activeSlideIndex = (this.activeSlideIndex - 1 + this.slides.length) % this.slides.length;
    this.restartCarousel();
  }

  advanceSlide(): void {
    this.nextSlide();
    this.restartCarousel();
  }

  useDemoCredentials(): void {
    this.loginForm.patchValue({
      email: 'owner@invenzo.com',
      password: 'password123',
      remember: true
    });
  }

  private restartCarousel(): void {
    if (this.slideTimer) {
      clearInterval(this.slideTimer);
    }
    this.slideTimer = setInterval(() => this.nextSlide(), 5200);
  }
}

