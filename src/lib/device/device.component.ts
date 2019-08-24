import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
// import { WebMidi } from 'webmidi';
import { Device } from 'lib/model';
import { MidiService } from 'lib/service';
import { DeviceStore } from 'lib/store';

@Component({
  selector: 'midi-devices',
  templateUrl: './device.component.html',
  styleUrls: ['./device.component.css']
})
export class DeviceComponent implements OnInit, OnDestroy {

  devices$: Observable<Array<Device>>;
  private timerId: any;

  constructor(
    private deviceStore: DeviceStore,
    private midiService: MidiService
  ) { }

  private logDeviceHotPlugSubscription: Subscription;
  private midiAccessSubscription: Subscription;
  private midiInputSubscription: Subscription;

  ngOnInit() {
    this.devices$ = this.deviceStore.state$;

    this.getConnectedDevices();
    this.handleDeviceHotPlug();
    this.logDeviceHotPlugSubscription = this.midiService.logDeviceHotPlug();

    this.timerId = setInterval(() => {
      console.warn('Plugged in devices: ' + this.deviceStore.getNumberOfDevices());
    }, 5000);
  }

  ngOnDestroy() {
    if (this.logDeviceHotPlugSubscription != null) {
      this.logDeviceHotPlugSubscription.unsubscribe();
    }
    if (this.midiAccessSubscription != null) {
      this.midiAccessSubscription.unsubscribe();
    }

    if (this.timerId) {
      clearInterval(this.timerId);
    }
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
    this.midiAccessSubscription = this.midiService.getMidiAccess()
      .subscribe((midiAccess: WebMidi.MIDIAccess) => {
        midiAccess.onstatechange = (event: WebMidi.MIDIConnectionEvent) => {
          if (event.port.state === this.midiService.MIDI_DEVICE_CONNECTED) {
            console.log('Connected the device: ' + event.port.name);
            this.getConnectedDevices();
          } else if (event.port.state === this.midiService.MIDI_DEVICE_DISCONNECTED) {
            console.log('Disconnected the device: ' + event.port.name);
            this.deviceStore.removeDevice(event.port.name);
          }
        };
      });
  }

  private getConnectedDevices() {
    this.deviceStore.clearMidiDevices();
    console.warn('Connected devices: ' + this.deviceStore.getNumberOfDevices());
    if (this.midiInputSubscription != null) {
      this.midiInputSubscription.unsubscribe();
    }
    this.midiInputSubscription = this.midiService.getInputDevices()
      .subscribe((device: WebMidi.MIDIInput) => {
        this.midiService.addMidiDevice(device);
      });
  }

}
