import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { Company, CompanyRecord } from './models/company.models';
import { CompanyService } from './services/company.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  form: FormGroup;


  isLoading = signal(true);
  isSaving = signal(false);
  loadError = signal<string | null>(null);
  saveError = signal<string | null>(null);
  saveSuccess = signal<string | null>(null);

  companies = signal<CompanyRecord[]>([]);

  constructor(private fb: FormBuilder, private companyService: CompanyService) {
    this.form = this.fb.group({
      companyName: [
        '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(30)],
      ],
      companyCode: ['', [this.optionalNumbersOnlyValidator]],
      vatCode: ['', [this.optionalVatValidator]],
      address: [''],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [this.optionalLtPhoneValidator]],
      contacts: this.fb.array([this.createContactGroup()]),
    });

    this.loadCompanies();
  }


  loadCompanies(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.companyService
      .getCompanies()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.companies.set(data),
        error: (err) => {
          console.error(err);
          this.loadError.set('Failed to load companies. Check Firebase connection/rules.');
        },
      });
  }


  get contacts(): FormArray {
    return this.form.get('contacts') as FormArray;
  }

  private createContactGroup(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      position: [''],
      phone: ['', [this.optionalLtPhoneValidator]],
    });
  }

  addContact(): void {
    this.contacts.push(this.createContactGroup());
  }

  removeContact(index: number): void {
    if (this.contacts.length > 1) this.contacts.removeAt(index);
  }


  onRegister(): void {
    this.form.markAllAsTouched();
    this.saveError.set(null);
    this.saveSuccess.set(null);

     if (this.form.invalid) {
    console.warn('Form invalid:', this.form.value);
    console.log('Invalid controls:', this.getInvalidControls());
    return;
  }

    const payload: Company = this.form.value as Company;


    console.log('REGISTER CLICKED, FORM DATA:', payload);

    this.isSaving.set(true);

    this.companyService
      .addCompany(payload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (id) => {
          this.saveSuccess.set(`Company saved successfully (id: ${id})`);

          this.loadCompanies();


          this.resetFormToDefault();
        },
        error: (err) => {
          console.error(err);
          this.saveError.set('Failed to save company. Check Firebase connection/rules.');
        },
      });
  }

  getInvalidControls(): string[] {
  const invalid: string[] = [];
  const controls = this.form.controls;

  for (const name in controls) {
    const control = controls[name];
    if (control.invalid) invalid.push(name);
  }


  this.contacts.controls.forEach((group, i) => {
    Object.keys((group as FormGroup).controls).forEach((key) => {
      if (group.get(key)?.invalid) invalid.push(`contacts[${i}].${key}`);
    });
  });

  return invalid;
}



  onDelete(id: string): void {
    this.saveError.set(null);
    this.saveSuccess.set(null);

    this.companyService.deleteCompany(id).subscribe({
      next: () => {
        this.saveSuccess.set('Company deleted successfully.');
        this.loadCompanies();
      },
      error: (err) => {
        console.error(err);
        this.saveError.set('Failed to delete company.');
      },
    });
  }

  private resetFormToDefault(): void {
    this.form.reset({
      companyName: '',
      companyCode: '',
      vatCode: '',
      address: '',
      email: '',
      phone: '',
    });


    while (this.contacts.length > 0) this.contacts.removeAt(0);
    this.contacts.push(this.createContactGroup());
  }


  isInvalid(path: string): boolean {
    const c = this.form.get(path);
    return !!c && c.touched && c.invalid;
  }

  contactInvalid(i: number, field: string): boolean {
    const c = this.contacts.at(i).get(field);
    return !!c && c.touched && c.invalid;
  }




  optionalNumbersOnlyValidator(control: AbstractControl): ValidationErrors | null {
    const v = (control.value ?? '').toString().trim();
    if (!v) return null;
    return /^\d+$/.test(v) ? null : { numbersOnly: true };
  }


  optionalVatValidator(control: AbstractControl): ValidationErrors | null {
    const v = (control.value ?? '').toString().trim();
    if (!v) return null;

    const numbersOnly = /^\d+$/;
    const ltNumbers = /^LT\d+$/;

    return numbersOnly.test(v) || ltNumbers.test(v) ? null : { vatInvalid: true };
  }


  optionalLtPhoneValidator(control: AbstractControl): ValidationErrors | null {
    const v = (control.value ?? '').toString().trim();
    if (!v) return null;

    if (!/^\+\d+$/.test(v)) return { phoneFormat: true };
    if (v.length < 10 || v.length > 12) return { phoneLength: true };

    return null;
  }
}
