import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoChatComponent } from './video-chat.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('VideoChatComponent', () => {
  let component: VideoChatComponent;
  let fixture: ComponentFixture<VideoChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VideoChatComponent],
      imports: [HttpClientTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VideoChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
