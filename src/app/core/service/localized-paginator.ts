import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core';
import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';

const ITEMS_PER_PAGE: string = 'PAGINATOR.ITEMS_PER_PAGE';
const NEXT_PAGE: string = 'PAGINATOR.NEXT_PAGE';
const PREVIOUS_PAGE: string = 'PAGINATOR.PREVIOUS_PAGE';
const FIRST_PAGE: string = 'PAGINATOR.FIRST_PAGE';
const LAST_PAGE: string = 'PAGINATOR.LAST_PAGE';
const OUT_OF: string = 'PAGINATOR.OUT_OF';

@Injectable()
export class LocalizedPaginator extends MatPaginatorIntl {

  constructor(private translateService: TranslateService) {
    super();

    const subscription: Subscription = this.translateService.onLangChange.subscribe((event: Event) => {
      this.getAndInitTranslations();
      subscription.unsubscribe();
    });

    this.getAndInitTranslations();
  }

  getRangeLabel = (page: number, pageSize: number, length: number) => {
    const outOf: string = this.translateService.instant(OUT_OF);
    if (length === 0 || pageSize === 0) {
      return '0 ' + outOf + ' ' + length;
    }
    length = Math.max(length, 0);
    const startIndex: number = page * pageSize;
    // If the start index exceeds the list length, do not try and fix the end index to the end
    const endIndex: number = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
    return startIndex + 1 + ' - ' + endIndex + ' ' + outOf + ' ' + length;
  };

  public getAndInitTranslations(): void {
    this.translateService.get([
      ITEMS_PER_PAGE,
      NEXT_PAGE,
      PREVIOUS_PAGE,
      FIRST_PAGE,
      LAST_PAGE
    ])
      .subscribe((translation: any) => {
        this.itemsPerPageLabel = translation[ITEMS_PER_PAGE];
        this.nextPageLabel = translation[NEXT_PAGE];
        this.previousPageLabel = translation[PREVIOUS_PAGE];
        this.firstPageLabel = translation[FIRST_PAGE];
        this.lastPageLabel = translation[LAST_PAGE];

        this.changes.next();
      });
  }

}
