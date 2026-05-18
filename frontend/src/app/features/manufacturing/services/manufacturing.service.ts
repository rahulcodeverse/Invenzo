import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ManufacturingService {
  private apiUrl = `${environment.apiUrl}/manufacturing`;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<any> {
    return this.http.get(`${this.apiUrl}/summary`);
  }

  getBoms(): Observable<any> {
    return this.http.get(`${this.apiUrl}/boms`);
  }

  getWorkOrders(): Observable<any> {
    return this.http.get(`${this.apiUrl}/work-orders`);
  }
}
