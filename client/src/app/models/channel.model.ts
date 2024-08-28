import { Message } from './message.model';

export interface Channel {
    id: string;
    name: string;
    groupId: string; // ID of the parent group
    messages: Message[]; // Array of message objects
  }
  