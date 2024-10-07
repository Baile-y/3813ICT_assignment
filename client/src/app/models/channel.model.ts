// channel.model.ts
import { Message } from './chat-message.model';

export interface Channel {
  _id: string;
  groupId: string;
  name: string;
  messages: Message[];
}
