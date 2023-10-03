import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CustomerService } from '../customer.service';
import { Customer } from '../customer.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'crm-customer-detail',
  templateUrl: './customer-detail.component.html',
  styleUrls: ['./customer-detail.component.scss']
})
export class CustomerDetailComponent implements OnInit {

  customerId!: number;
  customer!: Customer;
  detailForm!: FormGroup;
  
  constructor(
    private route: ActivatedRoute,
    private customerService: CustomerService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar) {
      this.createForm();
    }

  public createForm(): void {
    this.detailForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phoneNumber: [''],
      emailAddress: ['', [Validators.required, Validators.email]],
      preferredContactMethod: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
     // convert id route param to number with the +
     this.customerId = +this.route.snapshot.params['id']; 
  
     this.customerService //injected
        .get(this.customerId)
        .subscribe(cust => {  // like listening to a JavaScript fetch call to return
           if (cust) {
             this.detailForm.patchValue(cust);
             this.customer = cust;
           }
        });
  }
  // THIS CODE IS NOT IDEAL!!  It works. And lots of people write code like this.  
  //  We will convert this to be better using RxJs and Observables in the advanced course.

  public save() {
    if (!this.detailForm.valid) { return; }
    const customer = { ...this.customer, ...this.detailForm.value };
    this.customerService.update(customer).subscribe({
        next: (result) => { 
          this.snackBar.open('Customer saved', 'OK');
        },
        error: (err) => {
          this.snackBar.open('An error occurred: ' + err, 'OK');
        }
    });
  }
}