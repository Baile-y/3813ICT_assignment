import { Channel } from './channel.model';

export interface Group {
  id: number;
  name: string;
  adminId: number;
  channels: Channel[];
  members: { userId: number; role: string }[];
  invitations?: { userId: number }[];
  joinRequests?: { userId: number, name: string}[];
}


// Define the structure of the Member object
export interface Member {
  userId: number;          // User ID of the member
  role: 'user' | 'admin' | 'group-admin';  // Role of the member in the group
}
