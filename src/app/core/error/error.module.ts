import { NgModule, ErrorHandler, Optional, SkipSelf } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { ErrorCustomHandler } from './error-custom-handler';
import { ErrorService } from './error.service';
import { ErrorRoutingModule } from './error-routing.module';
import { ErrorComponent } from './error.component';
import { ErrorRequestInterceptor } from './error-request-interceptor';
import { ModuleWithProviders } from '@angular/compiler/src/core';

// See https://medium.com/@aleixsuau/error-handling-angular-859d529fa53a

@NgModule({
    declarations: [
        ErrorComponent
    ],
    imports: [
        CommonModule,
        RouterModule,
        ErrorRoutingModule,
    ],
    providers: [
        ErrorService,
        {
            provide: ErrorHandler,
            useClass: ErrorCustomHandler
        },
        ErrorCustomHandler,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: ErrorRequestInterceptor,
            multi: true,
        }
]
})
export class ErrorModule { }
