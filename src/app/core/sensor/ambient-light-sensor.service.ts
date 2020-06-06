import { ReplaySubject, Observable } from "rxjs";
import { Injectable } from "@angular/core";
import {
  SENSOR_NAME,
  SENSOR_POLICY_NAME,
  ACCESS_DENIED,
  ERROR_TYPES,
  ERROR_MESSAGES,
  SENSOR_AMBIENT_ILLUMINANCE_DARK_ENOUGH,
  SENSOR_OBSERVE_DELAY
} from './ambient-light-sensor.constant';
import { HttpErrorResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';

declare global {
  interface Window {
    AmbientLightSensor: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class AmbientLightSensorService {

  private illuminance: ReplaySubject<number> = new ReplaySubject<number>(1);
  public illuminance$: Observable<number> = this.illuminance.asObservable();

  constructor(
    private window: Window
  ) {
    this.init();
  }

  private init(): void {
    try {
      if (SENSOR_NAME in window) {
        this.startReading();
      } else {
        this.illuminance.error(ERROR_MESSAGES.UNSUPPORTED_FEATURE);
      }
    } catch (error) {
      if (error.name === ERROR_TYPES.SECURITY) {
        this.illuminance.error(ERROR_MESSAGES.BLOCKED_BY_FEATURE_POLICY);
      } else if (error.name === ERROR_TYPES.REFERENCE) {
        this.illuminance.error(ERROR_MESSAGES.NOT_SUPPORTED_BY_USER_AGENT);
      } else {
        this.illuminance.error(`${error.name}: ${error.message}`);
      }
    }
  }

  private startReading(): void {
    const sensor: any = new this.window.AmbientLightSensor();
    sensor.onreading = () => {
      return this.illuminance.next(sensor.illuminance)
    };
    sensor.onerror = async (event: HttpErrorResponse) => {
      if (event.error.name === ERROR_TYPES.NOT_ALLOWED) {
        const result: PermissionStatus = await navigator.permissions.query({
          name: SENSOR_POLICY_NAME
        });
        if (result.state === ACCESS_DENIED) {
          this.illuminance.error(ERROR_MESSAGES.PREMISSION_DENIED);
          return;
        }
        this.startReading();
      } else if (event.error.name === ERROR_TYPES.NOT_READABLE) {
        this.illuminance.error(ERROR_MESSAGES.CANNOT_CONNECT);
      }
    };
    sensor.start();
  }

  public ambientIsDarkEnough$(): Observable<boolean> {
    return this.illuminance$
      .pipe(
        delay(SENSOR_OBSERVE_DELAY),
        map((illuminance: number) => {
          if (illuminance < SENSOR_AMBIENT_ILLUMINANCE_DARK_ENOUGH) {
            return true;
          } else {
            return false;
          }
        })
      )
  }

  public ambientIsBrightEnough$(): Observable<boolean> {
    return this.illuminance$
      .pipe(
        delay(SENSOR_OBSERVE_DELAY),
        map((illuminance: number) => {
          if (illuminance > SENSOR_AMBIENT_ILLUMINANCE_BRIGHT_ENOUGH) {
            return true;
          } else {
            return false;
          }
        })
      )
  }

}

