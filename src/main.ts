import { enableProdMode, ApplicationRef } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableDebugTools } from '@angular/platform-browser';
import { AppModule } from './app/app.module';
import { environment } from '@env/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
.then(
  (module) => {
    let applicationRef = module.injector.get(ApplicationRef);
      let appComponent = applicationRef.components[0];
      enableDebugTools(appComponent);
  }
)
.catch(error => {
  console.log(error);
});
