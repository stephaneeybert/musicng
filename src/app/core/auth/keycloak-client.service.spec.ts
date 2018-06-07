import { TestBed, inject } from '@angular/core/testing';

import { KeycloakClientService } from './keycloak-client.service';

describe('KeycloakClientService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [KeycloakClientService]
    });
  });

  it('should be created', inject([KeycloakClientService], (service: KeycloakClientService) => {
    expect(service).toBeTruthy();
  }));
});
