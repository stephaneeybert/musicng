import { TestBed, async, ComponentFixture } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { LibCoreModule } from 'lib-core';
import { LibI18nModule } from 'lib-i18n';
import { Subscription } from 'rxjs';

describe('AppComponent', () => {

  let fixture: ComponentFixture<AppComponent>;
  let appComponent: AppComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent
      ],
      imports: [
        AppRoutingModule,
        LibCoreModule,
        LibI18nModule,
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    appComponent = fixture.componentInstance;
  });

  it('should create the app', async(() => {
    expect(appComponent).toBeDefined();
    expect(appComponent).toBeTruthy();
  }));

  it('should again get as title', async(() => {
    const subscription: Subscription = appComponent.getDummyTestTitle().subscribe((title: string) => {
      expect(title).toEqual('MusicNG');
      subscription.unsubscribe();
    });
  }));

});
