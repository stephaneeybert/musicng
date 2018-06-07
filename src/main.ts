import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

import { KeycloakClientService } from './app/core/auth/keycloak-client.service';

if (environment.production) {
  enableProdMode();
}

KeycloakClientService.init()
  .then(
    () => {
      platformBrowserDynamic().bootstrapModule(AppModule);
    }
  )
  .catch(
    (error) => {
      console.log(error);
      window.location.reload();
    }
  );
