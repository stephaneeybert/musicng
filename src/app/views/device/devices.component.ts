import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
// import { WebMidi } from 'webmidi';
import { Device } from '../../model/device';
import { MidiService } from '../../lib/service/midi.service';
import { DeviceStore } from '../../lib/store/device-store';

@Component({
  selector: 'devices',
  templateUrl: './devices.component.html',
})
export class DevicesComponent implements OnInit, OnDestroy {

  devices$!: Observable<Array<Device>>;
  devices!: Array<Device>;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private deviceStore: DeviceStore,
    private midiService: MidiService
  ) { }

  private devicesSubscription!: Subscription;
  private logDeviceHotPlugSubscription!: Subscription;
  private midiAccessSubscription!: Subscription;
  private midiInputSubscription!: Subscription;

  ngOnInit() {
    this.devices$ = this.deviceStore.getDevices();
    this.observeDevices();

    this.getConnectedDevices();
    this.handleDeviceHotPlug();
    this.logDeviceHotPlugSubscription = this.midiService.logDeviceHotPlug();
  }

  ngOnDestroy() {
    if (this.devicesSubscription != null) {
      this.devicesSubscription.unsubscribe();
    }
    if (this.logDeviceHotPlugSubscription != null) {
      this.logDeviceHotPlugSubscription.unsubscribe();
    }
    if (this.midiAccessSubscription != null) {
      this.midiAccessSubscription.unsubscribe();
    }
  }

  // Updating a view model in a subscribe() block requires an explicit call to the change detection
  private detectChanges(): void {
    this.changeDetector.detectChanges();
  }

  private observeDevices(): void {
    this.devicesSubscription = this.deviceStore.getDevices()
    .subscribe((devices: Array<Device>) => {
      this.devices = devices;
      this.detectChanges();
    });
  }

  // // https://stackoverflow.com/questions/56392671/retrieving-a-midiinput-from-the-onstatechange-handler
  // private handleDeviceHotPlug_TODO() {
  //   this.midiService.getMidiAccess()
  //     .subscribe((midiAccess: WebMidi.MIDIAccess) => {
  //       midiAccess.onstatechange = (event: WebMidi.MIDIConnectionEvent) => {
  //         console.log(event);
  //         if (event.port.state === 'connected') {
  //           console.log('Connected the device: ' + event.port);
  //           this.midiService.addMidiDevice(event.port);
  //         } else if (event.port.state === 'disconnected') {
  //           console.log('Disconnected the device: ' + event.port.name);
  //           this.deviceStore.removeDevice(event.port.name);
  //         } else {
  //           this.devices$ = this.deviceStore.getDevices();
  //         }
  //       };
  //     });
  // }

  private handleDeviceHotPlug() {
    this.midiAccessSubscription = this.midiService.requestMIDIAccess()
      .subscribe((midiAccess: WebMidi.MIDIAccess) => {
        midiAccess.onstatechange = (event: WebMidi.MIDIConnectionEvent) => {
          if (event.port.state === this.midiService.MIDI_DEVICE_CONNECTED) {
            console.log('Connected the device: ' + event.port.name);
            this.getConnectedDevices();
          } else if (event.port.state === this.midiService.MIDI_DEVICE_DISCONNECTED) {
            console.log('Disconnected the device: ' + event.port.name);
            const portName: string = (event && event.port && event.port.name) ? event.port.name : '';
            this.deviceStore.removeDevice(portName);
          }
        };
      });
  }

  private getConnectedDevices() {
    this.deviceStore.removeAllDevices();
    if (this.midiInputSubscription != null) {
      this.midiInputSubscription.unsubscribe();
    }
    this.midiInputSubscription = this.midiService.getInputDevices()
      .subscribe((device: WebMidi.MIDIInput) => {
        this.midiService.addMidiDevice(device);
      });
  }

}
