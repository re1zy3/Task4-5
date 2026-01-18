import { Component } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App{
  form: FormGroup;

  constructor(private fb: FormBuilder) {
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

    if (this.form.invalid) {
      console.warn('Form invalid:', this.form.value);
      return;
    }

    console.log('REGISTERED COMPANY DATA:', this.form.value);
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
