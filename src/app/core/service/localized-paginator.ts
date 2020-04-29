import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core';
import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';

const ITEMS_PER_PAGE = 'PAGINATOR.ITEMS_PER_PAGE';
const NEXT_PAGE = 'PAGINATOR.NEXT_PAGE';
const PREVIOUS_PAGE = 'PAGINATOR.PREVIOUS_PAGE';
const FIRST_PAGE = 'PAGINATOR.FIRST_PAGE';
const LAST_PAGE = 'PAGINATOR.LAST_PAGE';
const OUT_OF = 'PAGINATOR.OUT_OF';

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
    const out_of = this.translateService.instant(OUT_OF);
    if (length === 0 || pageSize === 0) {
      return '0 ' + out_of + ' ' + length;
    }
    length = Math.max(length, 0);
    const startIndex = page * pageSize;
    // If the start index exceeds the list length, do not try and fix the end index to the end
    const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
    return startIndex + 1 + ' - ' + endIndex + ' ' + out_of + ' ' + length;
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
