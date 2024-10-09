import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  imports: [FormsModule,CommonModule],
  standalone: true,
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent {
  selectedFile: File | null = null;
  currentUser: User | null = null;

  constructor(private http: HttpClient, private authService: AuthService) {
    // Get the current user from the AuthService
    this.currentUser = this.authService.getCurrentUser();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
    }
  }

  uploadProfileImage(event: Event) {
    event.preventDefault();

    if (this.selectedFile && this.currentUser) {
      const formData = new FormData();
      formData.append('profileImage', this.selectedFile);

      this.http.post<{ message: string; avatarPath: string }>('http://localhost:3000/api/users/upload-avatar', formData, {
        headers: this.buildHeaders()
      })
        .subscribe({
          next: (response) => {
            console.log('Image uploaded successfully', response);
            // Update the current user's avatar after successful upload
            if (this.currentUser) {
              this.currentUser.avatar = response.avatarPath;
              this.authService.updateCurrentUser(this.currentUser); // Update current user in local storage
            }
          },
          error: (error) => {
            console.error('Error uploading image', error);
          }
        });
    }
  }

  // Build HTTP headers for requests
  private buildHeaders(): HttpHeaders {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User not logged in'); // Throw an error or handle appropriately
    }
    return new HttpHeaders({
      'user-id': user._id.toString(), // MongoDB ObjectId as string
    });
  }
}
