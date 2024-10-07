import { Channel } from './channel.model';

export interface Group {
  _id: string;  // MongoDB ObjectId as string
  name: string;
  adminId: string;  // MongoDB ObjectId as string
  channels: Channel[];
  members: { userId: string; role: string }[];  // MongoDB ObjectId as string
  invitations?: { userId: string }[];  // MongoDB ObjectId as string
  joinRequests?: { userId: string, name: string }[];  // MongoDB ObjectId as string
}

// Define the structure of the Member object
export interface Member {
  userId: string; // MongoDB ObjectId as string
  role: 'user' | 'admin' | 'group-admin'; // Role of the member in the group
}
