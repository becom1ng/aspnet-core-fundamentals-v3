import { PlatformLocation } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { UserSummaryViewModel } from '../account.model';
import { AccountService } from '../account.service';

@Component({
  selector: 'crm-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginType: 'undecided' | 'password' | 'microsoft' | 'google' = 'undecided';
  currentUser: Observable<UserSummaryViewModel>;
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    public snackBar: MatSnackBar,
    private router: Router,
    private platformLocation: PlatformLocation,
  ) {
    this.currentUser = this.accountService.user;
    this.loginForm = this.fb.group({
      emailAddress: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  useUndecided(): void {
    this.loginType = 'undecided';
  }

  usePassword(): void {
    this.loginType = 'password';
  }

  /**
   * This method toggles the display to the first spinner and an option to use another
   * option instead.  This is when its time to query your server for the OAuth keys to use,
   * which is better than storing the keys a second time in the Angular source code.
   * Notice this does not get back the private secret key, only the public clientId.
   */
  useMicrosoft(): void {
    this.loginType = 'microsoft';
    this.snackBar.open('Signing In with Microsoft...', '', { duration: 2000 });
    const baseUrl =
      'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?';
    this.accountService.loginMicrosoftOptions().subscribe((opts) => {
      const options: { [key: string]: string } = {
        ...opts,
        response_type: 'code',
        redirect_uri:
          window.location.origin +
          this.platformLocation.getBaseHrefFromDOM() +
          'signin-microsoft',
      };
      console.log(options['redirect_uri']);
      let params = new HttpParams();
      for (const key of Object.keys(options)) {
        params = params.set(key, options[key]); // encodes values automatically.
      }

      window.location.href = baseUrl + params.toString();
    });
  }

  useGoogle(): void {
    this.loginType = 'google';
    this.snackBar.open('Signing In with Google...', '', { duration: 2000 });
    const baseUrl =
      'https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?';
    this.accountService.loginGoogleOptions().subscribe((opts) => {
      const options: { [key: string]: string } = {
        ...opts,
        response_type: 'code',
        prompt: 'consent',
        access_type: 'offline',
        flowName: 'GeneralOAuthFlow',
        redirect_uri:
          window.location.origin +
          this.platformLocation.getBaseHrefFromDOM() +
          'signin-google',
      };
      console.log(options['redirect_uri']);
      let params = new HttpParams();
      for (const key of Object.keys(options)) {
        params = params.set(key, options[key]); // encodes values automatically.
      }

      window.location.href = baseUrl + params.toString();
    });
  }

  onSubmit(): void {
    if (!this.loginForm.valid) {
      return;
    }
    const creds = { ...this.loginForm.value };
    this.accountService.loginPassword(creds).subscribe({
      next: (result) => {
        this.accountService.loginComplete(result, 'Login Complete');
      },
      error: (_) => {
        // _ is an error, interceptor shows snackbar based on api response
        console.log(_);
      },
    });
  }

  register(): void {
    this.router.navigate(['./register']);
  }

  logout(): void {
    this.accountService.logout();
  }
}
