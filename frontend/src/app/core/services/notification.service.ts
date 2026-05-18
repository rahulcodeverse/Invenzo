import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../models/user.model';

export interface AppNotification {
  id: string;
  type: 'LOW_STOCK' | 'EXPIRY_ALERT' | 'PAYMENT_REMINDER' | 'ORDER_UPDATE' | 'SYSTEM';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getNotifications(params?: { page?: number; limit?: number }): Observable<PaginatedResponse<AppNotification>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit);

    return this.http.get<PaginatedResponse<AppNotification>>(`${this.apiUrl}/notifications`, { params: httpParams });
  }

  getUnreadCount(): Observable<ApiResponse<{ count: number }>> {
    return this.http.get<ApiResponse<{ count: number }>>(`${this.apiUrl}/notifications/unread-count`);
  }

  markRead(id: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/notifications/${id}/read`, {});
  }

  markAllRead(): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/notifications/read-all`, {});
  }
}
