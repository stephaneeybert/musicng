import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from './store';
import { CommonService } from '../service/common.service';
import { Device } from '../../model/device';
import { map, tap } from 'rxjs/operators';

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
    return this.getState().length;
  }

  public addDevice(device: Device) {
    const index = this.getDeviceIndex(device.id);
    if (index === -1) {
      device.id = this.commonService.normalizeName(device.id);
      const devices = this.getState();
      devices.push(device);
      this.setState(devices);
    }
  }

  public removeAllDevices() {
    this.getState()
      .filter((device: Device) => device.midiMessageSubscription != null)
      .forEach((device: Device, index: number) => {
        if (device.midiMessageSubscription != null) {
          device.midiMessageSubscription.unsubscribe();
        }
          const devices = this.getState();
        devices.splice(index, 1);
        this.setState(devices);
      });
  }

  public removeDevice(deviceName: string) {
    const index = this.getDeviceIndex(deviceName);
    if (index !== -1) {
      const devices = this.getState();
      const currentDevice: Device = devices[index];
      if (currentDevice.midiMessageSubscription != null) {
        currentDevice.midiMessageSubscription.unsubscribe();
      }
      devices[index] = currentDevice;
      devices.splice(index);
      this.setState(devices);
    }
  }

  private muteToggle(device: Device, mute: boolean) {
    if (device.mute != mute) {
      const index = this.getDeviceIndex(device.id);
      if (index !== -1) {
        const devices = this.getState();
        const currentDevice: Device = devices[index];
        currentDevice.mute = mute;
        devices[index] = currentDevice;
        this.setState(devices);
        console.log('Unmuted (' + mute + ') the device ' + device.name);
        console.log(this.getState());
      }
    }
  }

  public mute(device: Device) {
    this.muteToggle(device, true);
  }

  public unmute(device: Device) {
    this.muteToggle(device, false);
  }

  public setDeviceKeyboard(device: Device, keyboard: any) {
    const index = this.getDeviceIndex(device.id);
    if (index !== -1) {
      const devices = this.getState();
      const currentDevice: Device = devices[index];
      currentDevice.keyboard = keyboard;
      devices[index] = currentDevice;
      this.setState(devices);
    }
  }

  public setDeviceSynth(device: Device, synth: any) {
    const index = this.getDeviceIndex(device.id);
    if (index !== -1) {
      const devices = this.getState();
      const currentDevice: Device = devices[index];
      currentDevice.synth = synth;
      devices[index] = currentDevice;
      this.setState(devices);
    }
  }

  private getDeviceIndex(deviceName: string): number {
    return this.getState().findIndex((device: Device) => {
      return this.commonService.normalizeName(device.id) === this.commonService.normalizeName(deviceName);
    });
  }

}
