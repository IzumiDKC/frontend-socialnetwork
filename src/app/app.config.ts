import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom, PLATFORM_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptorsFromDi, withFetch } from '@angular/common/http';
import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular';
import { isPlatformBrowser } from '@angular/common';
import Keycloak from 'keycloak-js';

function initializeKeycloak(keycloak: KeycloakService, platformId: Object) {
  return () => {
    if (isPlatformBrowser(platformId)) {
      console.log("🔄 Đang khởi tạo Keycloak...");
      return keycloak.init({
        config: {
          url: 'http://localhost:9090',
          realm: 'social-network',
          clientId: 'social-client'
        },
        initOptions: {
          onLoad: 'check-sso',
          checkLoginIframe: false 
        },
        enableBearerInterceptor: true,
        bearerPrefix: 'Bearer',
      })
      .then(success => console.log("Keycloak khởi tạo thành công! Login status:", success))
      .catch(err => console.error("Keycloak khởi tạo THẤT BẠI:", err));
    }
    return Promise.resolve();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi(), withFetch()),
    
    importProvidersFrom(KeycloakAngularModule),

    {
      provide: Keycloak,
      useFactory: (keycloakService: KeycloakService) => keycloakService.getKeycloakInstance(),
      deps: [KeycloakService]
    },

    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService, PLATFORM_ID]
    }
  ]
};