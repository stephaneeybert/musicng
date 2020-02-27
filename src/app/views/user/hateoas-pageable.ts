import { HateoasPage } from './hateoas-page';

export class HateoasPageable {

  _embedded: any = {};
  _link: any = {};
  page: HateoasPage = new HateoasPage(0, 0, 0, 0);

  constructor(_embedded: any, _link: any, page: HateoasPage) {
    this._embedded = _embedded;
    this._link = _link;
    this.page = page;
  }
}
