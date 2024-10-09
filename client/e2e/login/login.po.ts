import { browser, by, element } from 'protractor';

export class LoginPage {
  navigateTo(): Promise<unknown> {
    return browser.get(browser.baseUrl + '/login') as Promise<unknown>;
  }

  getUsernameInput() {
    return element(by.css('input[name="username"]'));
  }

  getPasswordInput() {
    return element(by.css('input[name="password"]'));
  }

  getLoginButton() {
    return element(by.css('button[type="submit"]'));
  }

  login(username: string, password: string): void {
    this.getUsernameInput().sendKeys(username);
    this.getPasswordInput().sendKeys(password);
    this.getLoginButton().click();
  }
}
