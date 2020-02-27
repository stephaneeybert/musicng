import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';

// The options need to be explicitly typed so as to have the typescript compiler use the correct get() method,
// the get method that returns the interface <T>> and not the one that returns an HttpEvent<T> of the interface.
class HttpOptions {
  headers?: HttpHeaders;
  params?: HttpParams;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  constructor(private httpClient: HttpClient) { }

  public get<T>(url: string, httpParams?: HttpParams, headers?: HttpHeaders): Observable<T> {
    let options = this.buildOptions(headers);
    options = this.addOptionParams(options, httpParams);
    return this.httpClient.get<T>(url, options);
  }

  public post<T>(url: string, body: object, headers?: HttpHeaders): Observable<T> {
    return this.httpClient.post<T>(url, body, this.buildOptions(headers));
  }

  public postWithHeadersInResponse<T>(url: string, body: object, headers?: HttpHeaders): Observable<T> {
    let options = this.buildOptions(headers);
    options = this.addOptionForFullHttpResponse(options);
    return this.httpClient.post<T>(url, body, options);
  }

  public put<T>(url: string, body: object, headers?: HttpHeaders): Observable<T> {
    return this.httpClient.put<T>(url, body, this.buildOptions(headers));
  }

  public patch<T>(url: string, body: object, headers?: HttpHeaders): Observable<T> {
    return this.httpClient.patch<T>(url, body, this.buildOptions(headers));
  }

  public delete<T>(url: string): Observable<T> {
    return this.httpClient.delete<T>(url, this.buildOptions());
  }

  private buildOptions(headers?: HttpHeaders): HttpOptions {
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

  private addOptionParams(options: HttpOptions, httpParams?: HttpParams) {
    options['params'] = httpParams;
    return options;
  }

  // Return a full HTTP response with its headers instead of simply the response body
  private addOptionForFullHttpResponse(options: HttpOptions): HttpOptions {
    options['observe'] = 'response';
    return options;
  }

}
