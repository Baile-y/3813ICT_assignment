import { Component, OnInit, OnDestroy } from '@angular/core';
import { MessageService } from '../services/message.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Channel } from '../models/channel.model';
import { Message } from '../models/chat-message.model';
import { AuthService } from '../services/auth.service';
import { ChannelService } from '../services/channel.service';
import { GroupService } from '../services/group.service';
import { io, Socket } from 'socket.io-client'; // Import Socket.IO client

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, OnDestroy {
  channels: Channel[] = [];
  selectedChannel: Channel | null = null;
  previousChannel: Channel | null = null; // To track the previously selected channel
  newMessageContent: string = '';
  messages: Message[] = [];
  selectedImage: File | null = null; // Store the selected image
  private socket: Socket | undefined; // Declare a socket instance
  private currentUser: any; // Store current user details

  constructor(
    private channelService: ChannelService,
    private messageService: MessageService,
    private groupService: GroupService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    console.log('User:', this.currentUser); // Log the full user object

    if (this.currentUser) {
      // Initialize Socket.IO connection
      this.socket = io('http://localhost:3000', {
        query: { userId: this.currentUser._id, username: this.currentUser.username },
      });

      // Handle incoming chat messages
      this.socket.on('messageReceived', (message: Message) => {
        if (this.selectedChannel && message.channelId === this.selectedChannel._id) {
          this.messages.push(message);
        }
      });

      // Fetch all groups the user belongs to
      this.groupService.getGroups().subscribe({
        next: (groups) => {
          const channels = groups.flatMap((group) => group.channels); // Merge all channels from different groups
          this.channels = channels;
        },
        error: (err) => {
          console.error('Failed to load channels for user:', err);
        },
      });
    } else {
      console.error('User is not available or user.id is missing');
    }
  }

  selectChannel(channel: Channel): void {
    // If there was a previously selected channel, leave that channel first
    if (this.selectedChannel) {
      this.socket?.emit('leaveChannel', this.selectedChannel._id);
    }

    // Set the newly selected channel and join it
    this.selectedChannel = channel;
    this.socket?.emit('joinChannel', channel._id);

    // Fetch existing messages for the selected channel
    this.messageService.getMessagesForChannel(this.selectedChannel._id).subscribe({
      next: (messages) => {
        this.messages = messages; // Assuming response is an array of messages
      },
      error: (err) => {
        console.error('Failed to load messages:', err);
      },
    });
  }

  // Handle file selection (for image messages)
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedImage = input.files[0];
    }
  }

  sendMessage(): void {
    if (!this.newMessageContent.trim() && !this.selectedImage) return;
  
    const formData = new FormData();
    formData.append('channelId', this.selectedChannel?._id || '');
    formData.append('userId', this.currentUser?._id || '');
    formData.append('sender', this.currentUser?.username || 'Anonymous');
    formData.append('content', this.newMessageContent || '');
  
    if (this.selectedImage) {
      formData.append('image', this.selectedImage); // Append image if available
    }
  
    // Send the message (with or without an image) via the same route
    this.messageService.uploadImageWithMessage(formData).subscribe({
      next: (response) => {
        // Emit the message via Socket.IO for real-time updates
        this.socket?.emit('sendMessage', response.message);
        console.log('Message sent and image uploaded successfully', response);
      },
      error: (err) => {
        console.error('Error uploading image:', err);
      }
    });
  
    // Clear the input fields after sending
    this.newMessageContent = '';
    this.selectedImage = null;
  }
  
  // Helper function to emit the message and store it via the API
  private sendMessageToServer(messageData: any) {
    // Emit the message via Socket.IO for real-time communication
    this.socket?.emit('sendMessage', messageData);
  
    // Send the message to the backend via the API for storage
    this.messageService.sendMessage(messageData).subscribe({
      next: (response) => {
        console.log('Message stored successfully', response);
      },
      error: (err) => {
        console.error('Error storing message:', err);
      }
    });
  }

  // Function to send a connect message when user selects a channel
  private sendConnectMessage(channel: Channel): void {
    const message: Message = {
      _id: '',
      channelId: channel._id,
      userId: this.currentUser?._id || '',
      sender: 'System',
      content: `${this.currentUser.username} has joined the channel.`,
      timestamp: new Date(),
    };
    this.socket?.emit('sendConnectMessage', message);
  }

  // Function to send a disconnect message when user leaves a channel
  private sendDisconnectMessage(channel: Channel): void {
    const message: Message = {
      _id: '',
      channelId: channel._id,
      userId: this.currentUser?._id || '',
      sender: 'System',
      content: `${this.currentUser.username} has left the channel.`,
      timestamp: new Date(),
    };
    this.socket?.emit('sendDisconnectMessage', message);
  }

  // Handle disconnect when leaving the component or switching channels
  ngOnDestroy(): void {
    // If there's a selected channel when leaving, send a disconnect message
    if (this.selectedChannel) {
      this.sendDisconnectMessage(this.selectedChannel);
    }
    this.socket?.disconnect();
  }
}
