import { GroupPage } from './group.po';
import { browser, logging } from 'protractor';

describe('Group Management', () => {
  let page: GroupPage;

  beforeEach(() => {
    page = new GroupPage();
  });

  it('should display group management page', async () => {
    await page.navigateTo();
    expect(browser.getCurrentUrl()).toContain('/groups');
  });

  it('should create a new group', async () => {
    await page.navigateTo();
    const groupName = 'Test Group';
    page.createGroup(groupName);

    const groupList = page.getGroupList();
    expect(groupList.count()).toBeGreaterThan(0);

    const newGroup = groupList.first();
    expect(newGroup.getText()).toContain(groupName);
  });

  it('should delete a group', async () => {
    await page.navigateTo();
    const groupName = 'Test Group';
    page.deleteGroup(groupName);

    const groupList = page.getGroupList();
    const groupNames = groupList.map(group => group.getText());

    expect(groupNames).not.toContain(groupName);
  });

  afterEach(async () => {
    const logs = await browser.manage().logs().get(logging.Type.BROWSER);
    expect(logs).not.toContain(jasmine.objectContaining({
      level: logging.Level.SEVERE,
    }));
  });
});
