import { LoginPage } from './login.po';
import { browser } from 'protractor';

describe('Login Page', () => {
  let page: LoginPage;

  beforeEach(() => {
    page = new LoginPage();
    page.navigateTo();
  });

  it('should display login page', () => {
    expect(browser.getCurrentUrl()).toContain('/login');
  });

  it('should login successfully with valid credentials', () => {
    page.login('username', 'password');
    expect(browser.getCurrentUrl()).toContain('/dashboard');
  });
});
