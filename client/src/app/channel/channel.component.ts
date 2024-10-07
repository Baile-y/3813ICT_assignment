import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChannelService } from '../services/channel.service';
import { CommonModule } from '@angular/common';
import { Channel } from '../models/channel.model';

@Component({
  selector: 'app-channel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './channel.component.html',
  styleUrls: ['./channel.component.css']
})
export class ChannelComponent implements OnInit, OnChanges {
  @Input() groupId!: string; // Ensure groupId is a string
  channels: Channel[] = [];

  constructor(private channelService: ChannelService) {}

  ngOnInit(): void {
    console.log('groupId:', this.groupId);
    if (this.groupId) {
      this.loadChannels();
    } else {
      console.error('groupId is undefined. Cannot load channels.');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['groupId'] && !changes['groupId'].isFirstChange()) {
      this.loadChannels();
    }
  }

  loadChannels(): void {
    this.channelService.getChannels(this.groupId).subscribe({
      next: (channels: Channel[]) => {
        this.channels = channels; // Set channels
      },
      error: (err) => {
        console.error('Failed to load channels:', err);
      }
    });
  }

  createChannel(name: string) {
    if (this.groupId) {
      this.channelService.createChannel(this.groupId, name).subscribe({
        next: (channel) => {
          console.log('Channel created successfully:', channel);
          if (channel) {
            this.channels.push(channel); // Add new channel to list
          }
        },
        error: (err) => {
          console.error('Failed to create channel:', err);
        }
      });
    } else {
      console.error('Cannot create channel because groupId is undefined.');
    }
  }

  deleteChannel(channelId: string): void {
    if (this.groupId) {
      this.channelService.deleteChannel(this.groupId, channelId).subscribe({
        next: () => {
          console.log('Channel deleted:', channelId);
          this.channels = this.channels.filter(channel => channel._id !== channelId); // Update channels array
        },
        error: (err) => {
          console.error('Failed to delete channel:', err);
        }
      });
    } else {
      console.error('Cannot delete channel because groupId is undefined.');
    }
  }
}
