import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { HomeComponent } from '../home/home.component';
import { ProfileComponent } from './profile/profile.component';
import { PostDetailComponent } from './post-detail/post-detail.component';
export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  
  { 
    path: 'home', 
    component: HomeComponent, 
    canActivate: [authGuard] 
  },

  { 
    path: ':username', // Change from 'profile' to ':username'
    component: ProfileComponent, 
    canActivate: [authGuard] 
  },

  { 
    path: 'posts/:id', 
    component: PostDetailComponent,
    canActivate: [authGuard]
  },

  { path: '**', redirectTo: 'home' }
];