import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SoundtrackComponent } from './soundtrack.component';

describe('SoundtrackComponent', () => {
  let component: SoundtrackComponent;
  let fixture: ComponentFixture<SoundtrackComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SoundtrackComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SoundtrackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
