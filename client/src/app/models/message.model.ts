export interface Message {
    id: string;
    senderId: string; // ID of the user who sent the message
    content: string;
    timestamp: Date;
  }
  