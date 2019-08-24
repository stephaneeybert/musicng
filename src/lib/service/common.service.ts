import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  constructor() { }

  public isNumber(value: string | number): boolean {
    return (value && !isNaN(Number(value.toString())));
  }

  public normalizeName(name: string) {
    return name.replace(/\s/g, '');
  }

}
