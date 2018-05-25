import { NgModule, ErrorHandler } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { ErrorRoutingModule } from './error-routing.module';
import { ErrorComponent } from './error-component/error.component';
import { ErrorCustomHandler } from './error-custom-handler';
import { ErrorService } from './error.service';
import { ErrorServerInterceptor } from './error-server.interceptor';

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
            provide: ErrorCustomHandler,
            useClass: ErrorCustomHandler,
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: ErrorServerInterceptor,
            multi: true,
        }
    ]
})
export class ErrorCustomModule { }
