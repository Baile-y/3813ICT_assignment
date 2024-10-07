export interface Message {
  _id: string;
  channelId: string;  
  userId: string;
  sender: string;
  content: string;
  timestamp: Date;
  image?: string;
  avatar?: string;
}
