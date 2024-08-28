export interface Group {
    id: string;
    name: string;
    channels: string[]; // Array of channel IDs
    admins: string[]; // Array of user IDs who are admins
  }
  