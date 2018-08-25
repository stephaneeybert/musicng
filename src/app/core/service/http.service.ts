import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable()
export class HttpService {

    constructor(private httpClient: HttpClient) { }

    public post<T>(url: string, body: object, headers?: HttpHeaders | null): Observable<T> {
        const options = {
            headers: this.prepareHeader(headers),
            observe: 'response' as 'body', // Have the response headers included in the response object
            responseType: 'json' as 'json'
        };
        return this.httpClient.post<T>(url, body, options);
    }

    private prepareHeader(headers: HttpHeaders | null): HttpHeaders {
        headers = headers || new HttpHeaders();
        headers = headers.set('Content-Type', 'application/json');
        headers = headers.set('Accept', 'application/json');
        return headers;
    }

}
