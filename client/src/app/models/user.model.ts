export interface User {
    id: number;
    username: string;
    password: string;
    roles: string[];  // Array of roles such as 'user', 'group-admin', 'super-admin'
    // groups?: Group[]; // Optional array of groups the user belongs to
  }
  