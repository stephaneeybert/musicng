export class HateoasPage {

  pageNumber: number = 0;
  pageSize: number = 0;
  totalElements: number = 0;
  totalPages: number = 0;

  constructor(pageNumber: number, pageSize: number, totalElements: number, totalPages: number) {
    this.pageNumber = pageNumber;
    this.pageSize = pageSize;
    this.totalElements = totalElements;
    this.totalPages = totalPages;
  }
}
