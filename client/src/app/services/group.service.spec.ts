import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GroupService } from './group.service';
import { AuthService } from './auth.service';
import { Group } from '../models/group.model';
import { User } from '../models/user.model';

describe('GroupService', () => {
  let service: GroupService;
  let httpMock: HttpTestingController;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        GroupService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(GroupService);
    httpMock = TestBed.inject(HttpTestingController);
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    // Mock a logged-in user
    mockAuthService.getCurrentUser.and.returnValue({
      _id: 'userId123',
      username: 'testuser',
      roles: ['admin'],
      groupId: 'groupId123',
      password: 'password123'
    });
  });

  afterEach(() => {
    httpMock.verify(); // Ensure no outstanding requests are left
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch and return the list of groups', () => {
    const mockGroups: Group[] = [
      { _id: 'group1', name: 'Group 1', adminId: 'admin1', channels: [], members: [] },
      { _id: 'group2', name: 'Group 2', adminId: 'admin2', channels: [], members: [] }
    ];

    service.getGroups().subscribe(groups => {
      expect(groups.length).toBe(2);
      expect(groups).toEqual(mockGroups);
    });

    const req = httpMock.expectOne(service['baseUrl']);
    expect(req.request.method).toBe('GET');
    req.flush(mockGroups);
  });

  it('should delete a group and return success status', () => {
    const groupId = 'group123';
    const mockResponse = { success: true };

    service.deleteGroup(groupId).subscribe(success => {
      expect(success).toBeTrue();
    });

    const req = httpMock.expectOne(`${service['baseUrl']}/${groupId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(mockResponse);
  });

  it('should invite a user to a group and return success', () => {
    const groupId = 'group123';
    const userId = 'user456';
    const mockResponse = { success: true };

    service.inviteUserToGroup(groupId, userId).subscribe(success => {
      expect(success).toBeTrue();
    });

    const req = httpMock.expectOne(`${service['baseUrl']}/${groupId}/invite`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ userId });
    req.flush(mockResponse);
  });

  it('should accept an invitation to a group and return success', () => {
    const groupId = 'group123';
    const mockResponse = { success: true };
  
    service.acceptInvite(groupId).subscribe(success => {
      expect(success).toBeTrue();
    });
  
    const req = httpMock.expectOne(`${service['baseUrl']}/${groupId}/members`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ userId: mockAuthService.getCurrentUser()!._id });
    req.flush(mockResponse);
  });

  it('should allow a user to leave a group and return success', () => {
    const groupId = 'group123';
    const mockResponse = { success: true };
  
    service.leaveGroup(groupId).subscribe(success => {
      expect(success).toBeTrue();
    });
  
    const req = httpMock.expectOne(`${service['baseUrl']}/${groupId}/leave`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ userId: mockAuthService.getCurrentUser()!._id });
    req.flush(mockResponse);
  });

  it('should promote a user to group admin and return success', () => {
    const groupId = 'group123';
    const userId = 'user456';
    const mockResponse = true;

    service.promoteUserToAdmin(groupId, userId).subscribe(success => {
      expect(success).toBeTrue();
    });

    const req = httpMock.expectOne(`${service['baseUrl']}/${groupId}/promote`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ userId, role: 'group-admin' });
    req.flush(mockResponse);
  });

  it('should deny a join request and return success', () => {
    const groupId = 'group123';
    const userId = 'user456';
    const mockResponse = { success: true };

    service.denyJoinRequest(groupId, userId).subscribe(success => {
      expect(success).toBeTrue();
    });

    const req = httpMock.expectOne(`${service['baseUrl']}/${groupId}/deny-request`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ userId });
    req.flush(mockResponse);
  });
});
