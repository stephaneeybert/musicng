import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PaginationService {

    elementsPerPage = 5;
    pageSizeOptions: number[] = [5, 10, 25, 100];

    // The current page number returned in the json response by Spring Data
    // is still zero based even if the configuration asks for a one based indexed pagination
    // See https://jira.spring.io/browse/DATACMNS-563
    public correctPageNumberMispatch(pageNumber: number): number {
        return pageNumber + 1;
    }

}
