import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { HttpClient, HttpParams, HttpHeaders, HttpEvent } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class HttpService {

    constructor(private httpClient: HttpClient) { }

    public get<T>(url: string, httpParams?: HttpParams, headers?: HttpHeaders): Observable<HttpEvent<T>> {
        let options = this.buildOptions(headers);
        options = this.addOptionParams(options, httpParams);
        return this.httpClient.get<T>(url, options);
    }

    public post<T>(url: string, body: object, headers?: HttpHeaders): Observable<HttpEvent<T>> {
        return this.httpClient.post<T>(url, body, this.buildOptions(headers));
    }

    public postWithHeadersInResponse<T>(url: string, body: object, headers?: HttpHeaders): Observable<HttpEvent<T>> {
        let options = this.buildOptions(headers);
        options = this.addOptionForCompleteResponse(options);
        return this.httpClient.post<T>(url, body, options);
    }

    public put<T>(url: string, body: object, headers?: HttpHeaders): Observable<HttpEvent<T>> {
        return this.httpClient.put<T>(url, body, this.buildOptions(headers));
    }

    public patch<T>(url: string, body: object, headers?: HttpHeaders): Observable<HttpEvent<T>> {
        return this.httpClient.patch<T>(url, body, this.buildOptions(headers));
    }

    public delete<T>(url: string): Observable<HttpEvent<T>> {
        return this.httpClient.delete<T>(url, this.buildOptions());
    }

    private buildOptions(headers?: HttpHeaders): any {
        const options = {
            headers: this.buildHeader(headers),
            responseType: 'json' as 'json'
        };
        return options;
    }

    public buildHeader(headers?: HttpHeaders): HttpHeaders {
        headers = headers || new HttpHeaders();
        headers = headers.set('Content-Type', 'application/json');
        headers = headers.set('Accept', 'application/json');
        return headers;
    }

    private addOptionParams(options: any, httpParams?: HttpParams) {
        options['params'] = httpParams;
        return options;
    }

    // Have the response headers included in the response object
    private addOptionForCompleteResponse(options: any) {
        options['observe'] = 'response' as 'body';
        return options;
    }

}
