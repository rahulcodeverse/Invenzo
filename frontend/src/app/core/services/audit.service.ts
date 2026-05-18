import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/user.model';

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  changes?: Record<string, any>;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getLogs(params?: { page?: number; limit?: number; search?: string }): Observable<PaginatedResponse<AuditLog>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit);
    if (params?.search) httpParams = httpParams.set('search', params.search);

    return this.http.get<PaginatedResponse<AuditLog>>(`${this.apiUrl}/audit`, { params: httpParams });
  }
}
