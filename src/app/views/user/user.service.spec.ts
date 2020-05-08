import { TestBed, inject } from '@angular/core/testing';

import { UserService } from './user.service';
import { CoreModule } from '@app/core.module';

describe('UserService', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule
      ]
    });
  });

  it('should be created', inject([UserService], (userService: UserService) => {
    expect(userService).toBeTruthy();
  }));

});
