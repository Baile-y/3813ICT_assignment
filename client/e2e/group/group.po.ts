import { browser, by, element } from 'protractor';

export class GroupPage {
  navigateTo(): Promise<unknown> {
    return browser.get(browser.baseUrl + '/groups') as Promise<unknown>;
  }

  getNewGroupButton() {
    return element(by.css('.create-group-btn'));
  }

  getGroupNameInput() {
    return element(by.css('input[name="groupName"]'));
  }

  getSubmitButton() {
    return element(by.css('.submit-btn'));
  }

  getGroupList() {
    return element.all(by.css('.group-list-item'));
  }

  createGroup(groupName: string): void {
    this.getNewGroupButton().click();
    this.getGroupNameInput().sendKeys(groupName);
    this.getSubmitButton().click();
  }

  deleteGroup(groupName: string): void {
    const groupToDelete = this.getGroupList().filter(function(group) {
      return group.getText().then(function(text) {
        return text === groupName;
      });
    }).first();

    groupToDelete.element(by.css('.delete-group-btn')).click();
  }
}
