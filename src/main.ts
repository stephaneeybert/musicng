import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

import { KeycloakClientService } from './app/core/auth/keycloak-client.service';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));

KeycloakClientService.init()
  .then(
    () => {
      const platform = platformBrowserDynamic();
      platform.bootstrapModule(AppModule);
    }
  )
  .catch(() => window.location.reload());
