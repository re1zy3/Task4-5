import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { map, Observable } from 'rxjs';
import { Company, CompanyRecord } from '../models/company.models';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private base = `${environment.firebaseDbUrl}/companies`;

  constructor(private http: HttpClient) {}


  addCompany(company: Company): Observable<string> {
    return this.http.post<{ name: string }>(`${this.base}.json`, company).pipe(
      map(res => res.name)
    );
  }


  getCompanies(): Observable<CompanyRecord[]> {
    return this.http.get<Record<string, Company> | null>(`${this.base}.json`).pipe(
      map(obj => {
        if (!obj) return [];
        return Object.entries(obj).map(([id, data]) => ({ id, ...data }));
      })
    );
  }

  deleteCompany(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}.json`);
  }
}
