export interface User {
    id: string;
    username: string;
    email: string;
    roles: string[]; // ['User', 'GroupAdmin', 'SuperAdmin']
    groups: string[]; // Array of group IDs
  }
  