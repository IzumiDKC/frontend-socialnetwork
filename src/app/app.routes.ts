import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { HomeComponent } from '../home/home.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  
  { 
    path: 'home', 
    component: HomeComponent, 
    canActivate: [authGuard] 
  },

  { path: '**', redirectTo: 'home' }
];