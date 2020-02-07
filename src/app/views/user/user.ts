export class User {

  id: number;
  email: string;
  confirmedEmail: boolean;
  password: string;
  firstname: string;
  lastname: string;

  constructor(id: number, email: string, confirmedEmail: boolean, password: string, firstname: string, lastname: string) {
    this.id = id;
    this.email = email;
    this.confirmedEmail = confirmedEmail;
    this.password = password;
    this.firstname = firstname;
    this.lastname = lastname;
  }
}
