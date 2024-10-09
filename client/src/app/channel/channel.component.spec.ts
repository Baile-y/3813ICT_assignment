import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChannelComponent } from './channel.component';
import { ChannelService } from '../services/channel.service';
import { of, throwError } from 'rxjs';
import { Channel } from '../models/channel.model';
import { SimpleChange } from '@angular/core';

describe('ChannelComponent', () => {
  let component: ChannelComponent;
  let fixture: ComponentFixture<ChannelComponent>;
  let channelService: jasmine.SpyObj<ChannelService>;

  beforeEach(async () => {
    const channelServiceSpy = jasmine.createSpyObj('ChannelService', ['getChannels', 'createChannel', 'deleteChannel']);

    await TestBed.configureTestingModule({
      imports: [ChannelComponent],
      providers: [
        { provide: ChannelService, useValue: channelServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChannelComponent);
    component = fixture.componentInstance;
    channelService = TestBed.inject(ChannelService) as jasmine.SpyObj<ChannelService>;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call loadChannels if groupId is provided', () => {
      const mockChannels: Channel[] = [{ _id: '1', name: 'Channel 1', groupId: 'group1', messages: [] }];

      component.groupId = 'group1';
      channelService.getChannels.and.returnValue(of(mockChannels));

      component.ngOnInit();

      expect(channelService.getChannels).toHaveBeenCalledWith('group1');
      expect(component.channels).toEqual(mockChannels);
    });

    it('should log an error if groupId is undefined', () => {
      spyOn(console, 'error');
      component.groupId = ''; // Simulate no groupId
      component.ngOnInit();

      expect(console.error).toHaveBeenCalledWith('groupId is undefined. Cannot load channels.');
    });
  });

  describe('ngOnChanges', () => {
    it('should reload channels if groupId changes', () => {
      const mockChannels: Channel[] = [{ _id: '1', name: 'Channel 1', groupId: 'group1', messages: [] }];

      component.groupId = 'group1';
      channelService.getChannels.and.returnValue(of(mockChannels));

      const change = new SimpleChange(null, 'group1', false);
      component.ngOnChanges({ groupId: change });

      expect(channelService.getChannels).toHaveBeenCalledWith('group1');
      expect(component.channels).toEqual(mockChannels);
    });

    it('should not reload channels if groupId does not change', () => {
      spyOn(component, 'loadChannels');

      const change = new SimpleChange(null, 'group1', true);
      component.ngOnChanges({ groupId: change });

      expect(component.loadChannels).not.toHaveBeenCalled();
    });
  });

  describe('loadChannels', () => {
    it('should load channels and set the channels array', () => {
      const mockChannels: Channel[] = [{ _id: '1', name: 'Channel 1', groupId: 'group1', messages: [] }];

      channelService.getChannels.and.returnValue(of(mockChannels));

      component.groupId = 'group1';
      component.loadChannels();

      expect(component.channels).toEqual(mockChannels);
    });

    it('should log an error if loadChannels fails', () => {
      spyOn(console, 'error');
      channelService.getChannels.and.returnValue(throwError('Failed to load channels'));

      component.groupId = 'group1';
      component.loadChannels();

      expect(console.error).toHaveBeenCalledWith('Failed to load channels:', 'Failed to load channels');
    });
  });

  describe('createChannel', () => {
    it('should create a new channel and add it to the channels array', () => {
      const mockChannel: Channel = { _id: '2', name: 'New Channel', groupId: 'group1', messages: [] };

      component.groupId = 'group1';
      channelService.createChannel.and.returnValue(of(mockChannel));

      component.createChannel('New Channel');

      expect(channelService.createChannel).toHaveBeenCalledWith('group1', 'New Channel');
      expect(component.channels).toContain(mockChannel);
    });

    it('should log an error if groupId is undefined during channel creation', () => {
      spyOn(console, 'error');
      component.groupId = ''; // No groupId provided
      component.createChannel('New Channel');

      expect(console.error).toHaveBeenCalledWith('Cannot create channel because groupId is undefined.');
    });

    it('should log an error if createChannel fails', () => {
      spyOn(console, 'error');
      channelService.createChannel.and.returnValue(throwError('Failed to create channel'));

      component.groupId = 'group1';
      component.createChannel('New Channel');

      expect(console.error).toHaveBeenCalledWith('Failed to create channel:', 'Failed to create channel');
    });
  });

  describe('deleteChannel', () => {
    it('should delete a channel and remove it from the channels array', () => {
      const mockChannels: Channel[] = [
        { _id: '1', name: 'Channel 1', groupId: 'group1', messages: [] },
        { _id: '2', name: 'Channel 2', groupId: 'group1', messages: [] }
      ];

      component.groupId = 'group1';
      component.channels = [...mockChannels];

      // Return void (undefined) as expected by the method signature
      channelService.deleteChannel.and.returnValue(of(undefined));

      component.deleteChannel('1');

      expect(channelService.deleteChannel).toHaveBeenCalledWith('group1', '1');
      expect(component.channels).toEqual([{ _id: '2', name: 'Channel 2', groupId: 'group1', messages: [] }]);
    });

    it('should log an error if groupId is undefined during channel deletion', () => {
      spyOn(console, 'error');
      component.groupId = ''; // No groupId provided
      component.deleteChannel('1');

      expect(console.error).toHaveBeenCalledWith('Cannot delete channel because groupId is undefined.');
    });

    it('should log an error if deleteChannel fails', () => {
      spyOn(console, 'error');
      channelService.deleteChannel.and.returnValue(throwError('Failed to delete channel'));

      component.groupId = 'group1';
      component.deleteChannel('1');

      expect(console.error).toHaveBeenCalledWith('Failed to delete channel:', 'Failed to delete channel');
    });
  });
});
