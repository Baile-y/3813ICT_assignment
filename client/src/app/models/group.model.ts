import { Channel } from './channel.model';

export interface Group {
  id: number;
  name: string;
  adminId: number;      // ID of the user who is the admin of this group
  channels: Channel[];  // Array of channels within the group
}
