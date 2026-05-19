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
      type: 'image',
      eyebrow: 'Connected workspace',
      title: 'Inventory, manufacturing, sales, and finance in one operating view.',
      body: 'A cleaner way to see the movement of stock and money across the business.',
      metric: 'Live operations'
    },
    {
      type: 'data',
      eyebrow: 'Operations snapshot',
      title: 'Know what needs action today.',
      body: 'Use the dashboard to track stock, pending orders, purchase flow, and production demand before problems build up.',
      metric: '9 modules',
      stats: [
        { label: 'Stock visibility', value: 'Real time' },
        { label: 'Order flow', value: 'Linked' },
        { label: 'Warehouses', value: 'Multi-site' }
      ]
    },
    {
      type: 'data',
      eyebrow: 'Business control',
      title: 'From purchase to payment, the flow stays connected.',
      body: 'Create quotes, orders, invoices, payments, GST reports, BOMs, indents, and work orders without losing context.',
      metric: 'Reports ready',
      stats: [
        { label: 'GST reports', value: 'Built in' },
        { label: 'MRP planning', value: 'Ready' },
        { label: 'Payments', value: 'Tracked' }
      ]
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

