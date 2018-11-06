import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { HttpClient, HttpParams, HttpHeaders, HttpEvent } from '@angular/common/http';

@Injectable()
export class HttpService {

    constructor(private httpClient: HttpClient) { }

    public get<T>(url: string, httpParams?: HttpParams | null, headers?: HttpHeaders | null): Observable<T> {
        let options = this.buildOptions(headers);
        options = this.addOptionParams(options, httpParams);
        return this.httpClient.get<T>(url, options);
    }

    public post<T>(url: string, body: object, headers?: HttpHeaders | null): Observable<T> {
        return this.httpClient.post<T>(url, body, this.buildOptions(headers));
    }

    public postWithHeadersInResponse<T>(url: string, body: object, headers?: HttpHeaders | null): Observable<T> {
        let options = this.buildOptions(headers);
        options = this.addOptionForCompleteResponse(options);
        return this.httpClient.post<T>(url, body, options);
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

    private buildOptions(headers: HttpHeaders) {
        const options = {
            headers: this.buildHeader(headers),
            responseType: 'json' as 'json'
        };
        return options;
    }

    private addOptionParams(options, httpParams) {
        options['params'] = httpParams;
        return options;
    }

    // Have the response headers included in the response object
    private addOptionForCompleteResponse(options) {
        options['observe'] = 'response' as 'body';
        return options;
    }

    public buildHeader(headers: HttpHeaders | null): HttpHeaders {
        headers = headers || new HttpHeaders();
        headers = headers.append('Content-Type', 'application/json');
        headers = headers.append('Accept', 'application/json');
        return headers;
    }

}
