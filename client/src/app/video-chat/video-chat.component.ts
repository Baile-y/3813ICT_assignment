import { Component, OnInit, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-video-chat',
  templateUrl: './video-chat.component.html',
  styleUrls: ['./video-chat.component.css'],
})
export class VideoChatComponent implements OnInit, OnDestroy {
  private socket: Socket | undefined;
  private localStream: MediaStream | undefined;
  private peerConnection: RTCPeerConnection | undefined;
  private isInitiator: boolean = false;  // Determine if this user is initiating the call
  remoteUsername: string | null = null;
  currentUser: User | null = null;  // Add this to hold the current user

  // RTC configuration
  private rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },  // Using Google's STUN server
    ],
  };

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    this.startSocketConnection();
    this.initializeVideoCall();

    // Listen for when the remote peer leaves
    this.socket?.on('leave', () => {
      this.handleRemoteDisconnect();
      this.remoteUsername = null;
    });
  }

  private handleRemoteDisconnect(): void {
    const remoteVideo = document.getElementById('remoteVideo') as HTMLVideoElement;
    if (remoteVideo) {
      remoteVideo.srcObject = null;  // Remove the video stream
    }
    this.peerConnection?.close();  // Close the peer connection
  }

  // Initialize Socket.IO and set up signaling
  private startSocketConnection(): void {
    this.socket = io('http://localhost:3000', {
      query: { userId: this.authService.getCurrentUser()?._id },
    });

    // Listen for offer, answer, and ICE candidates
    this.socket.on('offer', (offer: { description: RTCSessionDescriptionInit, username: string }) => {
      this.remoteUsername = offer.username;  // Capture the remote user's name
      this.handleOffer(offer.description);
    });

    this.socket.on('answer', (answer: RTCSessionDescriptionInit) => {
      this.peerConnection?.setRemoteDescription(new RTCSessionDescription(answer));
    });

    this.socket.on('ice-candidate', (candidate: RTCIceCandidate) => {
      this.peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
    });
  }

  // Start the video call
  private initializeVideoCall(): void {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        this.localStream = stream;

        // Show local video
        const localVideo = document.getElementById('localVideo') as HTMLVideoElement;
        localVideo.srcObject = stream;

        this.createPeerConnection();
        stream.getTracks().forEach(track => this.peerConnection?.addTrack(track, stream));

        // If this user is the initiator, start the call by sending an offer
        this.isInitiator = true;
        this.initiateOffer();
      })
      .catch((error) => {
        console.error('Error accessing media devices.', error);
      });
  }

  // Create peer connection and set up ICE handling
  private createPeerConnection(): void {
    this.peerConnection = new RTCPeerConnection(this.rtcConfig);

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket?.emit('ice-candidate', event.candidate);
      }
    };

    this.peerConnection.ontrack = (event) => {
      const remoteVideo = document.getElementById('remoteVideo') as HTMLVideoElement;
      if (event.streams[0]) {
        remoteVideo.srcObject = event.streams[0];
      }
    };
  }

  // Create an offer to start the call (if this user is the initiator)
  private initiateOffer(): void {
    const currentUser = this.authService.getCurrentUser();

    this.peerConnection?.createOffer()
      .then((offer) => {
        this.peerConnection?.setLocalDescription(offer);

        // Send the offer along with the local user's name
        this.socket?.emit('offer', {
          description: offer,
          username: currentUser?.username || 'Anonymous',  // Send the local user's name
        });
      })
      .catch((error) => {
        console.error('Error creating offer:', error);
      });
  }

  // Handle the offer from the other user (callee)
  private handleOffer(offer: RTCSessionDescriptionInit): void {
    this.peerConnection?.setRemoteDescription(new RTCSessionDescription(offer))
      .then(() => {
        return this.peerConnection?.createAnswer();
      })
      .then((answer) => {
        this.peerConnection?.setLocalDescription(answer);
        this.socket?.emit('answer', answer);  // Send the answer to the offer
      })
      .catch((error) => {
        console.error('Error handling offer:', error);
      });
  }
  ngOnDestroy(): void {
    // Notify the other peer about disconnection
    this.socket?.emit('leave');

    // Clean up local stream and peer connection
    this.localStream?.getTracks().forEach(track => track.stop());
    this.peerConnection?.close();
    this.socket?.disconnect();
  }

}
