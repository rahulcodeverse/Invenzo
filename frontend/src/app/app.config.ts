import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { en_US, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { FormsModule } from '@angular/forms';
import { provideEcharts } from 'ngx-echarts';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import {
  MenuFoldOutline,
  MenuUnfoldOutline,
  DashboardOutline,
  AppstoreOutline,
  InboxOutline,
  ShoppingCartOutline,
  ShoppingOutline,
  CalculatorOutline,
  BarChartOutline,
  SettingOutline,
  BellOutline,
  DownOutline,
  UserOutline,
  LogoutOutline,
  PlusOutline,
  EditOutline,
  DeleteOutline,
  SearchOutline,
  RedoOutline,
  PictureOutline,
  SwapOutline,
  CheckOutline,
  EyeOutline,
  CarOutline,
  CloseOutline,
  TeamOutline,
  ShopOutline,
  DollarOutline,
  ArrowUpOutline,
  ArrowDownOutline,
  ArrowRightOutline,
  SyncOutline,
  WarningOutline,
  HomeOutline,
  SwapRightOutline,
  FilterOutline,
  CalendarOutline,
  ExportOutline,
  FileExcelOutline,
  PrinterOutline,
  HistoryOutline,
  SaveOutline,
  FileTextOutline,
  StopOutline
} from '@ant-design/icons-angular/icons';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

registerLocaleData(en);

// Register commonly used icons
const icons = [
  MenuFoldOutline,
  MenuUnfoldOutline,
  DashboardOutline,
  AppstoreOutline,
  InboxOutline,
  ShoppingCartOutline,
  ShoppingOutline,
  CalculatorOutline,
  BarChartOutline,
  SettingOutline,
  BellOutline,
  DownOutline,
  UserOutline,
  LogoutOutline,
  PlusOutline,
  EditOutline,
  DeleteOutline,
  SearchOutline,
  RedoOutline,
  PictureOutline,
  SwapOutline,
  CheckOutline,
  EyeOutline,
  CarOutline,
  CloseOutline,
  TeamOutline,
  ShopOutline,
  DollarOutline,
  ArrowUpOutline,
  ArrowDownOutline,
  ArrowRightOutline,
  SyncOutline,
  WarningOutline,
  HomeOutline,
  SwapRightOutline,
  FilterOutline,
  CalendarOutline,
  ExportOutline,
  FileExcelOutline,
  PrinterOutline,
  HistoryOutline,
  SaveOutline,
  FileTextOutline,
  StopOutline
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    ),
    provideAnimations(),
    provideNzI18n(en_US),
    importProvidersFrom(FormsModule),
    { provide: NZ_ICONS, useValue: icons },
    provideEcharts()
  ]
};
