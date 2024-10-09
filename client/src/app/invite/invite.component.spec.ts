import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { GroupService } from '../services/group.service';
import { InvitesComponent } from './invite.component';
import { Group } from '../models/group.model';

describe('InvitesComponent', () => {
  let component: InvitesComponent;
  let fixture: ComponentFixture<InvitesComponent>;
  let groupService: jasmine.SpyObj<GroupService>;

  beforeEach(async () => {
    const groupServiceSpy = jasmine.createSpyObj('GroupService', ['getInvitations', 'acceptInvite', 'declineInvite']);

    await TestBed.configureTestingModule({
      imports: [InvitesComponent],
      providers: [
        { provide: GroupService, useValue: groupServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InvitesComponent);
    component = fixture.componentInstance;
    groupService = TestBed.inject(GroupService) as jasmine.SpyObj<GroupService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load invitations on init', () => {
      const mockInvitations: Group[] = [
        { _id: '1', name: 'Test Group', adminId: 'admin1', channels: [], members: [] },
        { _id: '2', name: 'Another Group', adminId: 'admin2', channels: [], members: [] }
      ];
      
      // Ensure the getInvitations method returns an observable
      groupService.getInvitations.and.returnValue(of(mockInvitations));

      component.ngOnInit();

      expect(component.invitations).toEqual(mockInvitations);
      expect(groupService.getInvitations).toHaveBeenCalled();
    });

    it('should handle error when loading invitations fails', () => {
      const consoleErrorSpy = spyOn(console, 'error');
      
      // Simulate an error
      groupService.getInvitations.and.returnValue(throwError('Error fetching invitations'));

      component.ngOnInit();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch invitations', 'Error fetching invitations');
    });
  });

  describe('loadInvitations', () => {
    it('should load invitations', () => {
      const mockInvitations: Group[] = [
        { _id: '1', name: 'Test Group', adminId: 'admin1', channels: [], members: [] }
      ];

      // Ensure the getInvitations method returns an observable
      groupService.getInvitations.and.returnValue(of(mockInvitations));

      component.loadInvitations();

      expect(component.invitations).toEqual(mockInvitations);
      expect(groupService.getInvitations).toHaveBeenCalled();
    });
  });
});
