import { HateoasPage } from './hateoas-page';

export class HateoasPageable {

  _embedded: any = {};
  page: HateoasPage = new HateoasPage(0, 0, 0, 0);

}
