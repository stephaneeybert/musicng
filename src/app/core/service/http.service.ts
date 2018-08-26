import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable()
export class HttpService {

    constructor(private httpClient: HttpClient) { }

    public get<T>(url: string, headers?: HttpHeaders | null): Observable<T> {
        return this.httpClient.get<T>(url, this.buildOptions(headers));
    }

    public post<T>(url: string, body: object, headers?: HttpHeaders | null): Observable<T> {
        return this.httpClient.post<T>(url, body, this.buildOptions(headers));
    }

    public put<T>(url: string, body: object, headers?: HttpHeaders | null): Observable<T> {
        return this.httpClient.put<T>(url, body, this.buildOptions(headers));
    }

    public patch<T>(url: string, body: object, headers?: HttpHeaders | null): Observable<T> {
        return this.httpClient.patch<T>(url, body, this.buildOptions(headers));
    }

    public delete<T>(url: string, headers?: HttpHeaders | null): Observable<T> {
        return this.httpClient.delete<T>(url, this.buildOptions(headers));
    }

    private buildOptions(headers?: HttpHeaders | null) {
        return {
            headers: this.buildHeader(headers),
            // Have the response headers included in the response object
            observe: 'response' as 'body',
            responseType: 'json' as 'json'
        };
    }

    private buildHeader(headers: HttpHeaders | null): HttpHeaders {
        headers = headers || new HttpHeaders();
        headers = headers.set('Content-Type', 'application/json');
        headers = headers.set('Accept', 'application/json');
        return headers;
    }

}
