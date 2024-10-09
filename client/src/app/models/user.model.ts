export interface User {
    _id: string;
    groupId: string;
    username: string;
    password: string;
    roles: string[];  // Array of roles such as 'user', 'group-admin', 'super-admin'
    avatar?: string;
    // groups?: Group[]; // Optional array of groups the user belongs to
  }
  