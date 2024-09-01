// channel.model.ts
import { Message } from './chat-message.model';

export interface Channel {
  id: number;
  name: string;
  messages: Message[];
}
