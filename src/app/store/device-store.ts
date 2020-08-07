import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import * as Tone from 'tone';
import { Store } from './store';
import { Device } from '@app/model/device';
import { map } from 'rxjs/operators';
import { CommonService } from '@stephaneeybert/lib-core';

@Injectable({
  providedIn: 'root'
})
export class DeviceStore extends Store<Array<Device>> {

  constructor(
    private commonService: CommonService
  ) {
    super(new Array<Device>());
  }

  public getDevices$(): Observable<Array<Device>> {
    return this.state$!
      .pipe(
        map((devices: Array<Device>) => {
          return devices
            .filter((device: Device) => {
              return device != null && device.mute != true
            })
        })
      );
  }

  public getNumberOfDevices(): number {
    return this.getState() ? this.getState().length : 0;
  }

  public add(device: Device) {
    const index: number = this.getDeviceIndex(device.id);
    if (index === -1) {
      device.id = this.commonService.normalizeName(device.id);
      const devices: Array<Device> = this.getState();
      devices.push(device);
      this.setState(devices);
    }
  }

  public deleteAll() {
    this.getState()
      .filter((device: Device) => device.midiMessageSubscription != null)
      .forEach((device: Device, index: number) => {
        this.delete(device.id);
      });
  }

  public delete(deviceId: string) {
    const index: number = this.getDeviceIndex(deviceId);
    if (index !== -1) {
      const devices: Array<Device> = this.getState();
      const itemDevice: Device = devices[index];
      if (itemDevice.midiMessageSubscription != null) {
        itemDevice.midiMessageSubscription.unsubscribe();
      }
      devices[index] = itemDevice;
      devices.splice(index, 1);
      this.setState(devices);
    }
  }

  private muteToggle(device: Device, mute: boolean) {
    if (device.mute !== mute) {
      device.mute = mute;
      this.setDevice(device);
    }
  }

  public mute(device: Device) {
    this.muteToggle(device, true);
  }

  public unmute(device: Device) {
    this.muteToggle(device, false);
  }

  public setDeviceKeyboard(device: Device, keyboard: any) {
    device.keyboard = keyboard;
    this.setDevice(device);
  }

  public setDeviceSynth(device: Device, synth: Tone.PolySynth) {
    device.synth = synth;
    this.setDevice(device);
  }

  public setDevice(device: Device) {
    const index: number = this.getDeviceIndex(device.id);
    if (index !== -1) {
      const devices: Array<Device> = this.getState();
      devices[index] = device;
      this.setState(devices);
    }
  }

  private getDeviceIndex(deviceName: string): number {
    return this.getState().findIndex((device: Device) => {
      return this.commonService.normalizeName(device.id) === this.commonService.normalizeName(deviceName);
    });
  }

}
