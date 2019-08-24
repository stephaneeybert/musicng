import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MidiLibComponent } from './midi-lib.component';

describe('MidiLibComponent', () => {
  let component: MidiLibComponent;
  let fixture: ComponentFixture<MidiLibComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MidiLibComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MidiLibComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
