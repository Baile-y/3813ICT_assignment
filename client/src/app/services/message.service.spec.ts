import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MessageService } from './message.service';
import { AuthService } from './auth.service';
import { Message } from '../models/chat-message.model';
import { HttpHeaders } from '@angular/common/http';

describe('MessageService', () => {
  let service: MessageService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockUser = {
    _id: 'userId123',
    username: 'testuser',
    password: 'password123',
    roles: ['user'],
    groupId: 'groupId123'
  };

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    authServiceSpy.getCurrentUser.and.returnValue(mockUser);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        MessageService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(MessageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verify no outstanding requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('sendMessage', () => {
    it('should send a message and return a response', () => {
      const mockMessage: Message = {
        _id: 'message123',
        channelId: 'channel123',
        sender: 'testuser',
        content: 'Hello world!',
        userId: 'userId123',
        timestamp: new Date()
      };

      service.sendMessage(mockMessage).subscribe(response => {
        expect(response).toBeTruthy();
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/messages`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('user-id')).toBe(mockUser._id);
      req.flush({ success: true }); // Respond with mock data
    });
  });

  describe('getMessagesForChannel', () => {
    it('should fetch messages for a channel', () => {
      const channelId = 'channel123';
      const mockMessages: Message[] = [
        {
          _id: 'msg123',
          channelId: 'channel123',
          sender: 'user1',
          content: 'Hello!',
          userId: 'userId1',
          timestamp: new Date()
        }
      ];

      service.getMessagesForChannel(channelId).subscribe(messages => {
        expect(messages.length).toBe(1);
        expect(messages).toEqual(mockMessages);
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/channels/${channelId}/messages`);
      expect(req.request.method).toBe('GET');
      req.flush(mockMessages); // Respond with mock data
    });
  });

  describe('uploadImageWithMessage', () => {
    it('should upload image with a message', () => {
      const formData = new FormData();
      formData.append('channelId', 'channel123');
      formData.append('userId', 'userId123');
      formData.append('content', 'Hello with image');
      
      service.uploadImageWithMessage(formData).subscribe(response => {
        expect(response.success).toBeTrue();
        expect(response.message).toBeDefined();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/channels/message');
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, message: { _id: 'message123' } }); // Respond with mock data
    });
  });

  describe('buildHeaders', () => {
    it('should throw error if user is not logged in', () => {
      authServiceSpy.getCurrentUser.and.returnValue(null); // Simulate no user logged in
      expect(() => service['buildHeaders']()).toThrowError('User not logged in');
    });

    it('should return valid headers if user is logged in', () => {
      const headers: HttpHeaders = service['buildHeaders']();
      expect(headers.get('user-id')).toBe(mockUser._id);
      expect(headers.get('user-roles')).toBe(JSON.stringify(mockUser.roles));
    });
  });
});
