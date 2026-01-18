export interface Contact {
  firstName: string;
  lastName: string;
  position?: string;
  phone?: string;
}

export interface Company {
  companyName: string;
  companyCode?: string;
  vatCode?: string;
  address?: string;
  email: string;
  phone?: string;
  contacts: Contact[];
}


export interface CompanyRecord extends Company {
  id: string;
}
