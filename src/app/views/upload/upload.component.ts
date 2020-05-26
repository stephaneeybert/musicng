import { Component, OnInit } from '@angular/core';
import { MidiService } from '@app/service/midi.service';
import { Soundtrack } from '@app/model/soundtrack';
import { SoundtrackStore } from '@app/store/soundtrack-store';

@Component({
  selector: 'app-soundtrack-upload',
  templateUrl: './upload.component.html',
})
export class UploadComponent implements OnInit {

  rawMidiData?: ArrayBuffer;
  soundtrack?: Soundtrack;

  constructor(
    private soundtrackStore: SoundtrackStore,
    private midiService: MidiService
  ) { }

  ngOnInit() {
  }

  public onUpload(fileList: FileList) {
    const file: any = fileList[0];
    const fileReader: FileReader = new FileReader();
    fileReader.onloadend = (event: Event) => {
      this.rawMidiData = fileReader.result as ArrayBuffer;
      this.midiService.parseRawMidi(file.name, this.rawMidiData).then((soundtrack: Soundtrack) => {
      // this.midiService.parseRawMidiTonejs(file.name, this.rawMidiData).then((soundtrack: Soundtrack) => {
        this.soundtrack = soundtrack;
        console.log(this.soundtrack);
        this.soundtrackStore.add(soundtrack);
      });
    };
    fileReader.readAsArrayBuffer(file);
  }

}
