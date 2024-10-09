import { ChannelPage } from './channel.po';
import { browser, logging } from 'protractor';

describe('Channel Management', () => {
  let page: ChannelPage;
  const groupId = '12345';  // Mock group ID

  beforeEach(() => {
    page = new ChannelPage();
  });

  it('should display channel management page', async () => {
    await page.navigateTo(groupId);
    expect(browser.getCurrentUrl()).toContain(`/groups/${groupId}/channels`);
  });

  it('should create a new channel', async () => {
    await page.navigateTo(groupId);
    const channelName = 'Test Channel';
    page.createChannel(channelName);

    const channelList = page.getChannelList();
    expect(channelList.count()).toBeGreaterThan(0);

    const newChannel = channelList.first();
    expect(newChannel.getText()).toContain(channelName);
  });

  it('should delete a channel', async () => {
    await page.navigateTo(groupId);
    const channelName = 'Test Channel';
    page.deleteChannel(channelName);

    const channelList = page.getChannelList();
    const channelNames = channelList.map(channel => channel.getText());

    expect(channelNames).not.toContain(channelName);
  });

  afterEach(async () => {
    const logs = await browser.manage().logs().get(logging.Type.BROWSER);
    expect(logs).not.toContain(jasmine.objectContaining({
      level: logging.Level.SEVERE,
    }));
  });
});
