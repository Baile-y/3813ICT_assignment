## Git Repository Organization

The Git repository for this project was organized with two primary branches: `main` and `dev`.

- **`main` branch**: This branch was used for stable releases. All finalized and tested features were merged into this branch.
- **`dev` branch**: The ongoing development occurred in this branch. All new features and updates were committed here before being merged into `main`.

### Commit History and Frequency

Commits were made frequently to ensure a clear history of the project's development.

### Directory Structure

The repository was organized with a clear separation between the server-side and client-side code:

- **`server/`**: Contains all server-side code, including route handlers, data models, and middleware.
- **`client/`**: Contains the frontend Angular application, including components, services, models, and styles.

## Data Structures

### Client-Side Data Structures
- **Users**: 
  - Stored in `localStorage` as well as on the server.
  - Data includes `id`, `username`, `roles`, and `password`.
  
- **Groups**:
  - Stored in `localStorage` as well as on the server.
  - Each group contains `id`, `name`, `adminId`, `channels`, `members`, `invitations`, and `joinRequests`.
  
- **Channels**:
  - Each channel is associated with a group and includes `id`, `name`, and `messages`.

### Server-Side Data Structures
- **Users**: 
  - Managed in-memory with a structure similar to the client-side.
  - Example: `{ id: 1, username: 'super', password: '123', roles: ['super-admin'] }`

- **Groups**:
  - Managed in-memory with a structure that includes group-specific details like `adminId`, `members`, and `channels`.
  
- **Channels**:
  - Stored as part of the group data structure and include details like `id`, `name`, and `members`.

## Angular Architecture

### Components
- **Login Component**: Handles user login requests.
- **Admin Component**: Handles user management, including promotion to admin roles.
- **Group Component**: Manages group creation, deletion, and user membership within groups.
- **Channel Component**: Manages channel creation and management.
- **Register Component**: Manages user registration with validation for unique usernames.
- **Invite Component**: Manages user group invitations.
- **Chat Component**: Manages chats within channels.


### Services
- **AuthService**: Handles authentication, user management, and session storage.
- **GroupService**: Manages group-related operations, including creation, deletion, membership, and invites.
- **ChannelService**: Manages channel-related operations within groups.
- **MessageService**: Manages message-related operations.
- **ChatService**: Manages chat-related operations within channels.

### Models
- **User**: Represents a user with properties such as `id`, `username`, `password`, and `roles`.
- **Group**: Represents a group with properties such as `id`, `name`, `adminId`, `members`, and `channels`.
- **Channel**: Represents a channel with properties such as `id`, `name`, and `messages`.
- **Chat-Message**: Represents a message with properties such as `id`, `content`, `sender`, and `timestamp`.

### Routes
- **App Routes**: Define navigation between key components like login, group management, and channels.

## Node Server Architecture

### Modules
- **Express**: Used for routing and middleware management.
- **Body-Parser**: Handles incoming request data.
- **UserRoutes**: Manages user authentication, registration, and role management.
- **GroupRoutes**: Manages group creation, membership, and admin functionalities.
- **ChannelRoutes**: Manages channel creation, deletion, and messaging within groups.

### Functions
- **authorize**: Middleware function to check user roles and authorize access to routes.
- **login**: Handles user authentication.
- **register**: Manages user registration and ensures unique usernames.
- **promote**: Allows super admins to promote users to higher roles.

### Global Variables
- **users**: Stores all user data in memory.
- **groups**: Stores all group data in memory, including channels and members.

## Server-Side Routes

### User Routes
- **`/login` [POST]**: Authenticates a user based on username and password.
- **`/register` [POST]**: Registers a new user with a unique username.
- **`/promote` [POST]**: Promotes a user to a higher role like group admin or super admin.

### Group Routes
- **`/` [GET]**: Retrieves all groups visible to the user based on their role.
- **`/create` [POST]**: Creates a new group.
- **`/:groupId/channels` [POST]**: Creates a new channel within a group.
- **`/:groupId/members` [POST]**: Adds a member to a group.

## Server-Side Routes

### Channel Routes

- **`GET /:groupId`**: 
  - **Description**: Retrieves all channels within a specified group.
  - **Parameters**:
    - `groupId` (path): The ID of the group.
  - **Return**: A list of channels within the specified group.

- **`POST /:groupId/channels`**:
  - **Description**: Creates a new channel within a specified group.
  - **Parameters**:
    - `groupId` (path): The ID of the group.
    - `name` (body): The name of the new channel.
  - **Return**: The created channel object.

- **`DELETE /:groupId/channels/:channelId`**:
  - **Description**: Deletes a channel within a specified group.
  - **Parameters**:
    - `groupId` (path): The ID of the group.
    - `channelId` (path): The ID of the channel to delete.
  - **Return**: A success message upon successful deletion.

### Group Routes

- **`GET /`**:
  - **Description**: Retrieves all groups visible to the user based on their role.
  - **Return**: A list of groups visible to the user.

- **`POST /create`**:
  - **Description**: Creates a new group.
  - **Parameters**:
    - `name` (body): The name of the new group.
    - `adminId` (body): The ID of the group's admin.
    - `members` (body): The list of initial members.
  - **Return**: The created group object.

- **`DELETE /:id`**:
  - **Description**: Deletes a group.
  - **Parameters**:
    - `id` (path): The ID of the group to delete.
  - **Return**: A success message upon successful deletion.

- **`POST /:groupId/channels`**:
  - **Description**: Creates a new channel within a specified group.
  - **Parameters**:
    - `groupId` (path): The ID of the group.
    - `name` (body): The name of the new channel.
  - **Return**: The created channel object.

- **`DELETE /:groupId/channels/:channelId`**:
  - **Description**: Deletes a channel within a specified group.
  - **Parameters**:
    - `groupId` (path): The ID of the group.
    - `channelId` (path): The ID of the channel to delete.
  - **Return**: A success message upon successful deletion.

- **`POST /:groupId/invite`**:
  - **Description**: Invites a user to a group.
  - **Parameters**:
    - `groupId` (path): The ID of the group.
    - `userId` (body): The ID of the user to invite.
  - **Return**: A success message upon successful invitation.

- **`POST /:groupId/members`**:
  - **Description**: Adds a member to a group when the user accepts the invite.
  - **Parameters**:
    - `groupId` (path): The ID of the group.
    - `userId` (body): The ID of the user to add as a member.
  - **Return**: A success message upon successful addition to the group.

- **`POST /:groupId/promote`**:
  - **Description**: Promotes a user to group admin.
  - **Parameters**:
    - `groupId` (path): The ID of the group.
    - `userId` (body): The ID of the user to promote.
    - `role` (body): The new role of the user.
  - **Return**: A success message upon successful promotion.

- **`DELETE /:groupId/users/:userId`**:
  - **Description**: Removes a user from a group.
  - **Parameters**:
    - `groupId` (path): The ID of the group.
    - `userId` (path): The ID of the user to remove.
  - **Return**: A success message upon successful removal of the user.

- **`POST /:groupId/join-request`**:
  - **Description**: Allows a user to request to join a group.
  - **Parameters**:
    - `groupId` (path): The ID of the group.
    - `userId` (body): The ID of the user requesting to join.
    - `name` (body): The name of the user requesting to join.
  - **Return**: A success message upon successful request submission.

- **`POST /:groupId/approve-request`**:
  - **Description**: Approves a join request for a group.
  - **Parameters**:
    - `groupId` (path): The ID of the group.
    - `userId` (body): The ID of the user whose request is approved.
  - **Return**: A success message upon successful approval.

- **`POST /:groupId/deny-request`**:
  - **Description**: Denies a join request for a group.
  - **Parameters**:
    - `groupId` (path): The ID of the group.
    - `userId` (body): The ID of the user whose request is denied.
  - **Return**: A success message upon successful denial.

- **`POST /:groupId/leave`**:
  - **Description**: Allows a user to leave a group.
  - **Parameters**:
    - `groupId` (path): The ID of the group.
    - `userId` (body): The ID of the user leaving the group.
  - **Return**: A success message upon successful departure from the group.

### User Routes

1. **`POST /login`**
   - **Description**: Authenticates a user by verifying their username and password.
   - **Parameters**:
     - `username` (Request body): The username of the user attempting to log in.
     - `password` (Request body): The password of the user attempting to log in.
   - **Response**: Returns a success message and user details if the login is successful, or an error message if the credentials are invalid.

2. **`POST /register`**
   - **Description**: Registers a new user.
   - **Parameters**:
     - `username` (Request body): The desired username of the new user.
     - `password` (Request body): The password for the new user.
   - **Response**: Returns a success message and the newly created user if registration is successful, or an error message if the username already exists.

3. **`POST /promote`**
   - **Description**: Promotes a user to a Group Admin or Super Admin role. Only accessible by Super Admins.
   - **Parameters**:
     - `userId` (Request body): The ID of the user to be promoted.
     - `newRole` (Request body): The role to which the user should be promoted (`group-admin` or `super-admin`).
   - **Authorization**: Requires the user to have the `super-admin` role.
   - **Response**: Returns a success message if the promotion is successful, or an error message if the user already has the role or is not found.

4. **`DELETE /delete/:userId`**
   - **Description**: Allows a user to delete themselves or, if they are a Super Admin, delete another user.
   - **Parameters**:
     - `userId` (URL parameter): The ID of the user to be deleted.
   - **Authorization**:
     - If a user is deleting themselves, no special role is required.
     - If a Super Admin is deleting another user, they must include their role in the request headers.
   - **Response**: Returns a success message if the deletion is successful, or an error message if the user is not found or the request is unauthorized.

5. **`GET /all`**
   - **Description**: Retrieves a list of all users. Only accessible by Super Admins.
   - **Authorization**: Requires the user to have the `super-admin` role.
   - **Response**: Returns an array of all users.

6. **`POST /promote-to-superadmin`**
   - **Description**: Promotes a user to the Super Admin role. Only accessible by Super Admins.
   - **Parameters**:
     - `userId` (Request body): The ID of the user to be promoted to Super Admin.
   - **Authorization**: Requires the user to have the `super-admin` role.
   - **Response**: Returns a success message if the promotion is successful, or an error message if the user is already a Super Admin or is not found.

### Middleware

- **`authorize(requiredRoles)`**: Middleware function that checks if the user has the required roles to access a route. It extracts `userRoles` from the request headers and validates the user's access.
  
  - **Parameters**:
    - `requiredRoles` (Array): An array of roles that are allowed to access the route.
  - **Error Handling**:
    - Responds with a `403 Forbidden` status if the user does not have the required roles.


## Client-Server Interaction

### Interaction Flow
1. **Login/Register**: Users authenticate via the login/register routes. Upon success, the user data is stored in `localStorage` and reflected in the UI.
2. **Group Management**: Groups are managed via the `GroupService`, interacting with the `GroupRoutes` on the server. Changes in group data are synchronized between the client and server.
3. **Channel Management**: Channels within groups are managed similarly, with interactions handled via the `ChannelService` and `ChannelRoutes`.
4. **User Management**: Super admins can manage users, including promotion and deletion, through the `AdminComponent` and corresponding server routes.
