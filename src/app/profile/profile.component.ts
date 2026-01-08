import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; 
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; 
import { KeycloakService } from 'keycloak-angular';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs'; // Import 'of' để xử lý luồng RxJS

import { UserService } from '../services/user.service';
import { PostService } from '../services/post.service';

import { FormsModule } from '@angular/forms'; // Quan trọng cho ngModel

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  targetUsername: string = '';
  myUsername: string = '';   
  myId: number | null = null; 
  profileData: any = null;    
  userPosts: any[] = [];      
  isLoading: boolean = true;
  isMyProfile: boolean = false; 
  isFollowing: boolean = false; 
  showEditModal: boolean = false;
  editData = { fullName: '', bio: '' };
  selectedFile: File | null = null;
  previewAvatar: string | null = null;

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
        if (!user) throw new Error('User not found');
        this.profileData = user;

        if (!this.isMyProfile) {
            this.isFollowing = user.followedByCurrentUser; 
        }

        return this.postService.getPostsByUserId(user.id);
      })
    ).subscribe({
      next: (posts: any[]) => {
        this.userPosts = posts;
        this.isLoading = false;
      },
      error: (err: any) => {
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

  toggleFollow() {
    if (!this.myId || !this.profileData) return;

    const previousState = this.isFollowing;

    // OPTIMISTIC UI
    this.isFollowing = !this.isFollowing;

    if (this.isFollowing) {
        this.profileData.followerCount = (this.profileData.followerCount || 0) + 1;
    } else {
        this.profileData.followerCount = Math.max(0, (this.profileData.followerCount || 0) - 1);
    }

    this.userService.followUser(this.myId, this.profileData.id).subscribe({
      next: () => {
        console.log(this.isFollowing ? 'Đã follow' : 'Đã unfollow');
      },
      error: (err: any) => {
        this.isFollowing = previousState;
        if (this.isFollowing) this.profileData.followerCount++;
        else this.profileData.followerCount--;
        
        alert('Lỗi kết nối: ' + err.message);
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => this.previewAvatar = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  openEditModal() {
    this.editData = {
      fullName: this.profileData.fullName || '',
      bio: this.profileData.bio || ''
    };
    this.selectedFile = null;
    this.previewAvatar = this.profileData.avatarUrl; 
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
  }

  saveProfile() {

    const updateText$ = this.userService.updateProfile(this.editData);
    
    let requestStream;

    if (this.selectedFile) {
      requestStream = this.userService.uploadAvatar(this.selectedFile).pipe(
        switchMap(() => updateText$) 
      );
    } else {

      requestStream = updateText$;
    }

    requestStream.subscribe({
      next: (updatedUser: any) => { 
        this.profileData = updatedUser;
        this.showEditModal = false;     
        alert('Cập nhật thành công!');
      },
      error: (err: any) => {
        console.error(err);
        alert('Lỗi cập nhật: ' + (err.error?.message || err.message));
      }
    });
  }
}
