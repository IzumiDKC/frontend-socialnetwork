import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; 
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; 
import { KeycloakService } from 'keycloak-angular';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

import { UserService } from '../services/user.service';
import { PostService } from '../services/post.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  targetUsername: string = '';
  myUsername: string = '';   
  myId: number | null = null; 

  // Data show
  profileData: any = null;    
  userPosts: any[] = [];      

  // Status UI
  isLoading: boolean = true;
  isMyProfile: boolean = false; 
  isFollowing: boolean = false; 

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private postService: PostService,
    private keycloak: KeycloakService
  ) {}

  async ngOnInit() {
    this.isLoading = true;

    try {
      const keycloakProfile = await this.keycloak.loadUserProfile();
      this.myUsername = keycloakProfile.username || '';
      
      if (this.myUsername) {
        this.userService.getUserInfo(this.myUsername).subscribe(user => {
          this.myId = user.id;
        });
      }
    } catch (e) {
      console.error('Lỗi load Keycloak profile', e);
    }

    this.route.paramMap.subscribe(params => {
      const usernameFromUrl = params.get('username');
      
      if (usernameFromUrl) {
        this.targetUsername = usernameFromUrl;
        this.checkIfMyProfile();
        this.loadProfileData(this.targetUsername);
      } else {
        this.router.navigate(['/home']);
      }
    });
  }

  checkIfMyProfile() {
    this.isMyProfile = (this.targetUsername === this.myUsername);
  }

  loadProfileData(username: string) {
    this.isLoading = true;
    this.profileData = null;
    this.userPosts = [];

    this.userService.getUserInfo(username).pipe(
      switchMap((user: any) => {
        if (!user) {
          throw new Error('User not found');
        }
        this.profileData = user;

        if (!this.isMyProfile && this.myId) {
          this.checkFollowStatus(this.myId, user.id);
        }

        return this.postService.getPostsByUserId ? this.postService.getPostsByUserId(user.id) : of([]); 
      })
    ).subscribe({
      next: (posts: any[]) => {
        this.userPosts = posts;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi tải profile:', err);
        this.isLoading = false;
      }
    });
  }

  checkFollowStatus(sourceId: number, targetId: number) {
    this.userService.getFollowingIds(sourceId).subscribe((ids: number[]) => {
      this.isFollowing = ids.includes(targetId);
    });
  }

  // Follow / Unfollow
  toggleFollow() {
    if (!this.myId || !this.profileData) return;

    if (this.isFollowing) {
      alert('Chức năng bỏ theo dõi chưa cập nhật!');
    } else {
      this.userService.followUser(this.myId, this.profileData.id).subscribe({
        next: () => {
          this.isFollowing = true;
        },
        error: (err) => alert('Lỗi khi follow: ' + err.message)
      });
    }
  }

  editProfile() {
    alert('Tính năng chỉnh sửa đang phát triển');
  }
}