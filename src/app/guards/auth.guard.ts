import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

export const authGuard: CanActivateFn = async (route, state) => {
  const keycloak = inject(KeycloakService);
  const router = inject(Router);

  const loggedIn = await keycloak.isLoggedIn();

  if (loggedIn) {
    return true; 
  } else {
    await keycloak.login({
      redirectUri: window.location.origin + state.url
    });
    return false;
  }
};