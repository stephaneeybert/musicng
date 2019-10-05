import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from './store';
import { CommonService } from 'lib/service/common.service';
import { Device } from 'lib/model';

@Injectable({
  providedIn: 'root'
})
export class DeviceStore extends Store<Array<Device>> {

  constructor(
    private commonService: CommonService
  ) {
    super(new Array<Device>());
  }

  public clearMidiDevices() {
    this.getState()
      .filter((device: Device) => device.midiMessageSubscription != null)
      .forEach((device: Device, index: number) => {
        this.getState().splice(index, 1);
      });
  }

  public getDevices(): Observable<Array<Device>> {
    return this.state$;
  }

  public getNumberOfDevices(): number {
    return this.getState().length;
  }

  public addDevice(device: Device) {
    const index = this.getDeviceIndex(device.id);
    if (index === -1) {
      device.id = this.commonService.normalizeName(device.id);
      this.getState().push(device);
    }
  }

  public removeDevice(deviceName: string) {
    const index = this.getDeviceIndex(deviceName);
    if (index !== -1) {
      if (this.getState()[index].midiMessageSubscription != null) {
        this.getState()[index].midiMessageSubscription.unsubscribe();
      }
      this.getState().splice(index);
    }
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
