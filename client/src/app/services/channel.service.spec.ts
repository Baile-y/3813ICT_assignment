import { TestBed } from '@angular/core/testing';
import { ChannelService } from './channel.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { Channel } from '../models/channel.model';
import { Message } from '../models/chat-message.model';
import { of } from 'rxjs';

describe('ChannelService', () => {
  let service: ChannelService;
  let httpMock: HttpTestingController;
  let authService: AuthService;

  const mockUser = {
    _id: 'user123',
    roles: ['user'],
    username: 'testuser'
  };

  const mockChannel: Channel = {
    _id: 'channel123',
    name: 'Test Channel',
    groupId: 'group123',
    messages: []
  };

  const mockChannels: Channel[] = [mockChannel];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ChannelService,
        { provide: AuthService, useValue: { getCurrentUser: () => mockUser } }
      ]
    });

    service = TestBed.inject(ChannelService);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createChannel', () => {
    it('should create a new channel', () => {
      const mockResponse = { success: true, channel: mockChannel };
      
      service.createChannel('group123', 'New Channel').subscribe(channel => {
        expect(channel).toEqual(mockChannel);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/channels/group123/channels');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ name: 'New Channel' });
      req.flush(mockResponse);
    });

    it('should handle error and return null if channel creation fails', () => {
      service.createChannel('group123', 'New Channel').subscribe(channel => {
        expect(channel).toBeNull();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/channels/group123/channels');
      req.flush('Failed to create channel', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getChannels', () => {
    it('should fetch channels for a group', () => {
      const mockResponse = { channels: mockChannels };

      service.getChannels('group123').subscribe(channels => {
        expect(channels).toEqual(mockChannels);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/channels/group123');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error and return an empty array if fetching channels fails', () => {
      service.getChannels('group123').subscribe(channels => {
        expect(channels).toEqual([]);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/channels/group123');
      req.flush('Failed to fetch channels', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getChannelsForChat', () => {
    it('should fetch channels for a user for chat purposes', () => {
      const mockResponse = { channels: mockChannels };

      service.getChannelsForChat('user123').subscribe(channels => {
        expect(channels).toEqual(mockChannels);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/channels/user123');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error and return an empty array if fetching channels for chat fails', () => {
      service.getChannelsForChat('user123').subscribe(channels => {
        expect(channels).toEqual([]);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/channels/user123');
      req.flush('Failed to fetch channels', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('updateChannelMessages', () => {
    const mockMessages: Message[] = [
      {
        _id: 'msg123',
        channelId: 'channel123',
        sender: 'testuser',
        content: 'Hello!',
        userId: 'user123',   // Include userId field
        timestamp: new Date(), // Include timestamp field
      }
    ];
  
    it('should update messages for a channel', () => {
      const mockResponse = { success: true };
  
      service.updateChannelMessages('channel123', mockMessages).subscribe(success => {
        expect(success).toBeTrue();
      });
  
      const req = httpMock.expectOne('http://localhost:3000/api/channels/channel123/messages');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ messages: mockMessages });
      req.flush(mockResponse);
    });
  
    it('should handle error and return false if updating messages fails', () => {
      service.updateChannelMessages('channel123', mockMessages).subscribe(success => {
        expect(success).toBeFalse();
      });
  
      const req = httpMock.expectOne('http://localhost:3000/api/channels/channel123/messages');
      req.flush('Failed to update messages', { status: 500, statusText: 'Server Error' });
    });
  });  

  describe('buildHeaders', () => {
    it('should return appropriate headers with user data', () => {
      const headers = service['buildHeaders']();
      expect(headers.get('user-id')).toBe(mockUser._id);
      expect(headers.get('user-roles')).toBe(JSON.stringify(mockUser.roles));
    });

    it('should throw error if no user is logged in', () => {
      spyOn(authService, 'getCurrentUser').and.returnValue(null);
      expect(() => service['buildHeaders']()).toThrowError('User not logged in');
    });
  });
});
