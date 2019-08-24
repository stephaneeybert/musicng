import { Component, Input, AfterViewInit, OnInit } from '@angular/core';
import { Device } from 'lib/model';
import { SheetService } from 'lib/service';
import { Soundtrack } from 'lib/model';

const NAME_PREFIX_SOUNDTRACK = 'sheet-soundtrack-';
const NAME_PREFIX_DEVICE = 'sheet-device-';

@Component({
  selector: 'midi-sheet',
  templateUrl: './sheet.component.html',
  styleUrls: ['./sheet.component.css']
})
export class SheetComponent implements OnInit, AfterViewInit {

  @Input() soundtrack: Soundtrack;
  @Input() device: Device;
  id: string;

  constructor(
    private sheetService: SheetService
  ) { }

  ngOnInit() {
    this.initializeId();
  }

  ngAfterViewInit() {
    this.createSheet();
  }

  private initializeId() {
    if (this.soundtrack != null) {
      this.id = NAME_PREFIX_SOUNDTRACK + this.soundtrack.id;
    } else if (this.device != null) {
      this.id = NAME_PREFIX_DEVICE + this.device.id;
    }
  }

  private createSheet() {
    if (this.soundtrack != null) {
      if (this.soundtrack.hasNotes()) {
        this.sheetService.createSoundtrackSheet(this.id, this.soundtrack);
        // this.soundtrackStore.setSoundtrackSheet(this.name, sheet); TODO
      }
    } else if (this.device != null) {
      this.sheetService.renderDeviceVexflow(this.id, this.device);
      // this.deviceStore.setDeviceSheet(this.name, sheet); TODO
    }
  }

}
