import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatComponent } from './chat.component';
import { AuthService } from '../services/auth.service';
import { MessageService } from '../services/message.service';
import { ChannelService } from '../services/channel.service';
import { GroupService } from '../services/group.service';
import { of, throwError } from 'rxjs';
import { Channel } from '../models/channel.model';
import { Message } from '../models/chat-message.model';
import { User } from '../models/user.model';
import { Socket } from 'socket.io-client';

class MockAuthService {
  getCurrentUser() {
    return { _id: '1', username: 'testUser' };
  }

  getAllUsers() {
    return of([{ _id: '1', username: 'testUser', roles: ['user'] }]);
  }
}

class MockMessageService {
  getMessagesForChannel(channelId: string) {
    return of([{ _id: '1', content: 'Test message', sender: 'testUser' }]);
  }

  uploadImageWithMessage(formData: FormData) {
    return of({ message: { _id: '2', content: 'Test image message', sender: 'testUser' } });
  }
}

class MockChannelService {}

class MockGroupService {
  getGroups() {
    return of([
      {
        _id: 'group1',
        channels: [{ _id: 'channel1', name: 'Test Channel' }]
      }
    ]);
  }
}

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;
  let authService: AuthService;
  let messageService: MessageService;
  let socketMock: jasmine.SpyObj<Socket>;

  beforeEach(async () => {
    socketMock = jasmine.createSpyObj('Socket', ['emit', 'on', 'disconnect']);

    await TestBed.configureTestingModule({
      imports: [ChatComponent],
      providers: [
        { provide: AuthService, useClass: MockAuthService },
        { provide: MessageService, useClass: MockMessageService },
        { provide: ChannelService, useClass: MockChannelService },
        { provide: GroupService, useClass: MockGroupService },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    messageService = TestBed.inject(MessageService);
    component.socket = socketMock;  // Inject mocked socket
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });
   

  it('should load channels and groups', () => {
    fixture.detectChanges();  // Triggers ngOnInit

    expect(component.channels.length).toBe(1);
    expect(component.channels[0]._id).toBe('channel1');
  });

  it('should send a message', () => {
    spyOn(messageService, 'uploadImageWithMessage').and.callThrough();
    
    component.newMessageContent = 'Hello World';
    component.selectedChannel = { _id: 'channel1', name: 'Test Channel', groupId: 'group1', messages: [] };
  
    component.sendMessage();
    expect(messageService.uploadImageWithMessage).toHaveBeenCalled();
    expect(socketMock.emit).toHaveBeenCalledWith('sendMessage', jasmine.anything());
  });  

  it('should not send a message if content is empty', () => {
    spyOn(messageService, 'uploadImageWithMessage').and.callThrough();
    
    component.newMessageContent = '';
    component.sendMessage();
    
    expect(messageService.uploadImageWithMessage).not.toHaveBeenCalled();
  });
  
  it('should select a channel and fetch messages', () => {
    const channel: Channel = {
      _id: 'channel1',
      name: 'Test Channel',
      groupId: 'group1',  // Add groupId
      messages: []  // Add messages (can be an empty array for the test)
    };    spyOn(messageService, 'getMessagesForChannel').and.callThrough();

    component.selectChannel(channel);

    expect(component.selectedChannel).toBe(channel);
    expect(messageService.getMessagesForChannel).toHaveBeenCalledWith('channel1');
    expect(socketMock.emit).toHaveBeenCalledWith('joinChannel', jasmine.anything());
  });

  it('should leave previous channel when selecting a new channel', () => {
    component.selectedChannel = { _id: 'channel1', name: 'Test Channel', groupId: 'group1', messages: [] };
    const newChannel: Channel = {
      _id: 'channel2',
      name: 'Another Channel',
      groupId: 'group2',  // Add groupId
      messages: []  // Add messages
    };

    component.selectChannel(newChannel);

    expect(socketMock.emit).toHaveBeenCalledWith('leaveChannel', jasmine.anything());
    expect(component.selectedChannel).toBe(newChannel);
  });
  
  it('should handle disconnection on destroy', () => {
    component.selectedChannel = { _id: 'channel1', name: 'Test Channel', groupId: 'group1', messages: [] };
    
    fixture.destroy();  // Triggers ngOnDestroy
    expect(socketMock.emit).toHaveBeenCalledWith('leaveChannel', 'channel1');
    expect(socketMock.disconnect).toHaveBeenCalled();
  });  
});
