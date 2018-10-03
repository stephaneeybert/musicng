import { Injectable } from '@angular/core';

@Injectable()
export class PaginationService {

    // The current page number returned in the json response by Spring Data
    // is still zero based even if the configuration asks for a one based indexed pagination
    // See https://jira.spring.io/browse/DATACMNS-563
    public correctPageNumberMispatch(pageNumber: number): number {
        return pageNumber + 1;
    }

}
