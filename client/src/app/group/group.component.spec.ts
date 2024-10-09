import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GroupComponent } from './group.component';
import { GroupService } from '../services/group.service';
import { AuthService } from '../services/auth.service';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { Group } from '../models/group.model';

describe('GroupComponent', () => {
  let component: GroupComponent;
  let fixture: ComponentFixture<GroupComponent>;
  let groupService: jasmine.SpyObj<GroupService>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const groupServiceSpy = jasmine.createSpyObj('GroupService', ['getGroups', 'createGroup', 'deleteGroup', 'promoteUserToAdmin', 'inviteUserToGroup', 'deleteUserFromGroup', 'denyJoinRequest', 'leaveGroup']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);

    await TestBed.configureTestingModule({
      imports: [GroupComponent, FormsModule],
      declarations: [],
      providers: [
        { provide: GroupService, useValue: groupServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        ChangeDetectorRef
      ]
    }).compileComponents();


    fixture = TestBed.createComponent(GroupComponent);
    component = fixture.componentInstance;
    groupService = TestBed.inject(GroupService) as jasmine.SpyObj<GroupService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  it('should load groups on init', () => {
    const mockGroups: Group[] = [
      { _id: '1', name: 'Test Group', adminId: 'admin1', channels: [], members: [{ userId: 'user1', role: 'user' }] }
    ];
    groupService.getGroups.and.returnValue(of(mockGroups));

    component.ngOnInit();

    expect(groupService.getGroups).toHaveBeenCalled();
    expect(component.groups.length).toBe(1);
    expect(component.groups[0].name).toBe('Test Group');
  });

  it('should handle error while loading groups', () => {
    groupService.getGroups.and.returnValue(throwError('Error fetching groups'));

    component.ngOnInit();

    expect(groupService.getGroups).toHaveBeenCalled();
    expect(component.groups.length).toBe(0);
  });

  it('should create a group successfully', () => {
    const newGroup: Group = { _id: '2', name: 'New Group', adminId: 'admin1', channels: [], members: [{ userId: 'user1', role: 'user' }] };
    groupService.createGroup.and.returnValue(of(newGroup));

    component.createGroup('New Group');

    expect(groupService.createGroup).toHaveBeenCalledWith('New Group');
    expect(component.groups.length).toBe(1);
    expect(component.groups[0].name).toBe('New Group');
  });

  it('should not create a group with empty name', () => {
    component.createGroup('');

    expect(groupService.createGroup).not.toHaveBeenCalled();
    expect(component.groups.length).toBe(0);
  });

  it('should delete a group successfully', () => {
    component.groups = [{ _id: '1', name: 'Test Group', adminId: 'admin1', channels: [], members: [{ userId: 'user1', role: 'user' }] }];
    groupService.deleteGroup.and.returnValue(of({ success: true }));

    component.deleteGroup('1');

    expect(groupService.deleteGroup).toHaveBeenCalledWith('1');
    expect(component.groups.length).toBe(0);
  });

  it('should handle error when deleting group', () => {
    component.groups = [{ _id: '1', name: 'Test Group', adminId: 'admin1', channels: [], members: [{ userId: 'user1', role: 'user' }] }];
    groupService.deleteGroup.and.returnValue(of({ success: false }));

    component.deleteGroup('1');

    expect(groupService.deleteGroup).toHaveBeenCalledWith('1');
    expect(component.groups.length).toBe(1);  // Group should not be removed
  });

  it('should promote a user to admin successfully', () => {
    const mockGroup: Group = { _id: '1', name: 'Test Group', adminId: 'admin1', channels: [], members: [{ userId: '2', role: 'user' }] };
    component.groups = [mockGroup];
    groupService.promoteUserToAdmin.and.returnValue(of(true));

    component.promoteUser('1', '2');

    expect(groupService.promoteUserToAdmin).toHaveBeenCalledWith('1', '2');
    expect(mockGroup.members[0].role).toBe('admin');
  });

  it('should check if user has access to the group', () => {
    const mockGroup: Group = {
      _id: '1',
      name: 'Test Group',
      adminId: 'admin1',
      channels: [],
      members: [{ userId: '2', role: 'user' }]
    };

    const mockUser = {
      _id: '2',
      username: 'normalUser',
      roles: ['user'],
      groupId: 'group1',
      password: 'password123'
    };

    authService.getCurrentUser.and.returnValue(mockUser);

    const hasAccess = component.userHasAccess(mockGroup);

    expect(hasAccess).toBeTrue();
  });

  it('should deny access if user is not a member', () => {
    const mockGroup: Group = {
      _id: '1',
      name: 'Test Group',
      adminId: 'admin1',
      channels: [],
      members: [{ userId: '3', role: 'user' }]
    };

    const mockUser = {
      _id: '2',
      username: 'normalUser',
      roles: ['user'],
      groupId: 'group1',
      password: 'password123'
    };

    authService.getCurrentUser.and.returnValue(mockUser);

    const hasAccess = component.userHasAccess(mockGroup);

    expect(hasAccess).toBeFalse();
  });

  it('should leave a group successfully', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.groups = [{ _id: '1', name: 'Test Group', adminId: 'admin1', channels: [], members: [{ userId: 'user1', role: 'user' }] }];
    groupService.leaveGroup.and.returnValue(of(true));

    component.leaveGroup('1');

    expect(groupService.leaveGroup).toHaveBeenCalledWith('1');
    expect(component.groups.length).toBe(0);
  });
});
