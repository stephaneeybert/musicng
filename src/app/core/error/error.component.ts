import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Data } from '@angular/router';
import { Observable } from 'rxjs/Observable';

@Component({
    selector: 'app-error',
    templateUrl: './error.component.html',
    styleUrls: ['./error.component.scss']
})
export class ErrorComponent implements OnInit {

    routeParams: Params = {};
    data: Data = {};

    constructor(private activatedRoute: ActivatedRoute) { }

    ngOnInit() {
        this.routeParams = this.activatedRoute.snapshot.queryParams;
        this.data = this.activatedRoute.snapshot.data;
    }
}
