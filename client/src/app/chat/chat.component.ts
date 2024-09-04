import { Component, Input, OnInit } from '@angular/core';
import { MessageService } from '../services/message.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Channel } from '../models/channel.model';
import { Message } from '../models/chat-message.model';
import { AuthService } from '../services/auth.service';
import { ChannelService } from '../services/channel.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  channels: Channel[] = [];
  selectedChannel: Channel | null = null;
  newMessageContent: string = '';

  constructor(private channelService: ChannelService, private authService: AuthService) {}

  ngOnInit(): void {
    // Load channels from local storage
    this.channelService.getChannelsForChat().subscribe(channels => {
      this.channels = channels;
    });
  }

  selectChannel(channel: Channel): void {
    // Ensure the channel has a messages array
    if (!channel.messages) {
      channel.messages = [];
    }
    this.selectedChannel = channel;
  }  

  sendMessage(): void {
    if (!this.newMessageContent.trim() || !this.selectedChannel) return;
  
    if (!this.selectedChannel.messages) {
      this.selectedChannel.messages = []; // Ensure messages array is initialized
    }
  
    const newMessage: Message = {
      id: this.selectedChannel.messages.length + 1,
      sender: this.authService.getCurrentUser().username,
      content: this.newMessageContent,
      timestamp: new Date()
    };
  
    // Add the message to the channel's messages
    this.selectedChannel.messages.push(newMessage);
  
    // Update the messages in localStorage
    this.channelService.updateChannelMessages(this.selectedChannel.id, this.selectedChannel.messages);
  
    // Clear the input field
    this.newMessageContent = '';
  }
}