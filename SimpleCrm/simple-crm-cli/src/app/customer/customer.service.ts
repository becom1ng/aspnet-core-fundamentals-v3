import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Customer } from './customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  constructor(private http: HttpClient) {
    console.warn('Using CustomerService. Production environments.');
  }

  search(term: string): Observable<Customer[]> {
    return this.http.get<Customer[]>('/api/customer/search?term=' + term);
  }
  
  get(customerId: number): Observable<Customer | undefined> {
    return this.http.get<Customer>('/api/customer/' + customerId);
  }

  insert(customer: Customer): Observable<Customer> {
    return this.http.post<Customer>('/api/customer/save', customer);
  }

  update(customer: Customer): Observable<Customer> {
    // example url: /api/customer/5
    return this.http.put<Customer>(`/api/customer/${customer.customerId}`, customer);
  }

}
