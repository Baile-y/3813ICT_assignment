import { Channel } from './channel.model';

export interface Group {
  id: number;              // Unique identifier for the group
  name: string;            // Name of the group
  adminId: number;         // User ID of the group admin
  channels: Channel[];     // Array of channels within the group
  members: Member[];       // Array of members with their roles
  invitations?: { userId: number }[]; // Group invitations
} 

// Define the structure of the Member object
export interface Member {
  userId: number;          // User ID of the member
  role: 'user' | 'admin' | 'group-admin';  // Role of the member in the group
}
