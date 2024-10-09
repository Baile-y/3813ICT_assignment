import { TestBed } from '@angular/core/testing';
import { ChatService } from './chat.service';
import { Message } from '../models/chat-message.model';

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000; // Increase to 10 seconds
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return an empty messages array initially', (done: DoneFn) => {
    service.getMessages().subscribe(messages => {
      expect(messages.length).toBe(0);
      done();
    });
  });

});
