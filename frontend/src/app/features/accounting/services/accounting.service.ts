import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AccountingService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Chart of Accounts
  getAccountGroups(): Observable<any> {
    return this.http.get(`${this.api}/accounting/chart/groups`);
  }
  getAccountGroupTree(): Observable<any> {
    return this.http.get(`${this.api}/accounting/chart/groups/tree`);
  }
  createAccountGroup(data: any): Observable<any> {
    return this.http.post(`${this.api}/accounting/chart/groups`, data);
  }
  getAccounts(params?: { groupId?: string; type?: string }): Observable<any> {
    let p = new HttpParams();
    if (params?.groupId) p = p.set('groupId', params.groupId);
    if (params?.type) p = p.set('type', params.type);
    return this.http.get(`${this.api}/accounting/chart/accounts`, { params: p });
  }
  createAccount(data: any): Observable<any> {
    return this.http.post(`${this.api}/accounting/chart/accounts`, data);
  }
  updateAccount(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.api}/accounting/chart/accounts/${id}`, data);
  }
  initializeAccounts(): Observable<any> {
    return this.http.post(`${this.api}/accounting/chart/initialize`, {});
  }

  // Journal Entries
  getJournalEntries(params?: { page?: number; limit?: number; type?: string }): Observable<any> {
    let p = new HttpParams();
    if (params?.page) p = p.set('page', params.page.toString());
    if (params?.limit) p = p.set('limit', params.limit.toString());
    if (params?.type) p = p.set('type', params.type);
    return this.http.get(`${this.api}/accounting/journal`, { params: p });
  }
  getJournalEntry(id: string): Observable<any> {
    return this.http.get(`${this.api}/accounting/journal/${id}`);
  }
  createJournalEntry(data: any): Observable<any> {
    return this.http.post(`${this.api}/accounting/journal`, data);
  }
  reverseJournal(id: string): Observable<any> {
    return this.http.post(`${this.api}/accounting/journal/${id}/reverse`, {});
  }

  // Reports
  getTrialBalance(params?: { fromDate?: string; toDate?: string }): Observable<any> {
    let p = new HttpParams();
    if (params?.fromDate) p = p.set('fromDate', params.fromDate);
    if (params?.toDate) p = p.set('toDate', params.toDate);
    return this.http.get(`${this.api}/accounting/reports/trial-balance`, { params: p });
  }
  getProfitAndLoss(params?: { fromDate?: string; toDate?: string }): Observable<any> {
    let p = new HttpParams();
    if (params?.fromDate) p = p.set('fromDate', params.fromDate);
    if (params?.toDate) p = p.set('toDate', params.toDate);
    return this.http.get(`${this.api}/accounting/reports/profit-and-loss`, { params: p });
  }
  getBalanceSheet(params?: { asOfDate?: string }): Observable<any> {
    let p = new HttpParams();
    if (params?.asOfDate) p = p.set('asOfDate', params.asOfDate);
    return this.http.get(`${this.api}/accounting/reports/balance-sheet`, { params: p });
  }
  getCashFlow(params?: { fromDate?: string; toDate?: string }): Observable<any> {
    let p = new HttpParams();
    if (params?.fromDate) p = p.set('fromDate', params.fromDate);
    if (params?.toDate) p = p.set('toDate', params.toDate);
    return this.http.get(`${this.api}/accounting/reports/cash-flow`, { params: p });
  }
}
