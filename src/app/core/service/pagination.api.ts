export class PaginationApi {

    constructor(currentPageNumber: number, elementsPerPage: number, totalElements: number, totalPages: number) {
        this.currentPageNumber = currentPageNumber;
        this.elementsPerPage = elementsPerPage;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
    }

    currentPageNumber: number;
    elementsPerPage: number;
    totalElements: number;
    totalPages: number;

}
