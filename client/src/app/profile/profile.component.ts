// profile.component.ts
import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
})
export class ProfileComponent {
  selectedFile: File | null = null;

  constructor(private http: HttpClient, private authService: AuthService) { }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
    }
  }

  uploadProfileImage(event: Event) {
    event.preventDefault();

    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('profileImage', this.selectedFile);

      const user = this.authService.getCurrentUser();
      if (user) {
        this.http.post('http://localhost:3000/api/users/upload-avatar', formData, {
          headers: {
            'user-id': user._id,  // Add user ID to the request headers
          }
        })
          .subscribe({
            next: (response) => console.log('Image uploaded successfully', response),
            error: (error) => console.error('Error uploading image', error),
          });
      }
    }
  }

  // Build HTTP headers for requests
  private buildHeaders(): HttpHeaders {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User not logged in'); // Throw an error or handle appropriately
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'user-id': user._id.toString(), // MongoDB ObjectId as string
      'user-roles': JSON.stringify(user.roles)
    });
  }
}
