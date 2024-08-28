import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChatService } from '../services/chat.service';
import { Message } from '../models/message.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule]
})
export class ChatComponent implements OnInit {
  messages: Message[] = [];
  newMessage = '';
  channelId!: string;

  constructor(private chatService: ChatService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.channelId = this.route.snapshot.paramMap.get('id')!;
    this.loadMessages();
  }

  loadMessages() {
    this.chatService.getMessages(this.channelId).subscribe((messages) => {
      this.messages = messages;
    });
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      this.chatService.sendMessage(this.channelId, this.newMessage).subscribe((message) => {
        this.messages.push(message);
        this.newMessage = '';
      });
    }
  }
}
