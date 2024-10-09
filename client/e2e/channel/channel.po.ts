import { browser, by, element } from 'protractor';

export class ChannelPage {
  navigateTo(groupId: string): Promise<unknown> {
    return browser.get(browser.baseUrl + `/groups/${groupId}/channels`) as Promise<unknown>;
  }

  getNewChannelButton() {
    return element(by.css('.create-channel-btn'));
  }

  getChannelNameInput() {
    return element(by.css('input[name="channelName"]'));
  }

  getSubmitButton() {
    return element(by.css('.submit-channel-btn'));
  }

  getChannelList() {
    return element.all(by.css('.channel-list-item'));
  }

  createChannel(channelName: string): void {
    this.getNewChannelButton().click();
    this.getChannelNameInput().sendKeys(channelName);
    this.getSubmitButton().click();
  }

  deleteChannel(channelName: string): void {
    const channelToDelete = this.getChannelList().filter(function(channel) {
      return channel.getText().then(function(text) {
        return text === channelName;
      });
    }).first();

    channelToDelete.element(by.css('.delete-channel-btn')).click();
  }
}
