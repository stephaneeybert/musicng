import { Injectable } from '@angular/core';
import { Subject, Observable, from, Subscription } from 'rxjs';
import { map, filter, switchMap } from 'rxjs/operators';
import { parseArrayBuffer } from 'midi-json-parser';
import { IMidiFile, TMidiEvent, IMidiNoteOnEvent,
  IMidiNoteOffEvent, IMidiSetTempoEvent,
  IMidiTrackNameEvent, IMidiCopyrightNoticeEvent,
  IMidiTextEvent, IMidiChannelPrefixEvent,
  IMidiTimeSignatureEvent, IMidiControlChangeEvent } from 'midi-json-parser-worker';
import { Midi } from '@tonejs/midi';
import { TValue } from 'worker-factory';
// import { WebMidi } from 'webmidi';
import { Device } from 'lib/model/device';
import { KeyboardService } from 'lib/service/keyboard.service';
import { Soundtrack } from 'lib/model/soundtrack';
import { Track } from 'lib/model/track';
import { Control } from 'lib/model/control';
import { Instrument } from 'lib/model/instrument';
import { CommonService } from './common.service';
import { TempoUnit } from 'lib/model/tempo-unit';
import { Tempo } from 'lib/model/tempo';
import { DeviceStore } from 'lib/store/device-store';
import { Measure } from 'lib/model/measure/measure';
import { TimeSignature } from 'lib/model/measure/time-signature';
import { ParseService } from 'lib/service/parse.service';
import { Note } from 'lib/model/note/note';
import { PlacedNote } from 'lib/model/note/placed-note';
import { Chroma } from 'lib/model/note/pitch/chroma';
import { Subdivision } from 'lib/model/note/duration/subdivision';
import { Subdivisions } from 'lib/model/note/duration/subdivisions';

const NOTE_ON = 144; // A command value of 144 is a "note on"
const NOTE_OFF = 128; // A command value of 128 is a "note off"
const DEFAULT_MIDI_TEMPO = 120;
const DEFAULT_MIDI_PPQ = 480;
const DEFAULT_MIDI_TIME_SIGNATURE = '4/4';

const MIDI_EVENT_CHANNEL_PREFIX = 'channelPrefix';
const MIDI_EVENT_COPYRIGHT_NOTICE = 'copyrightNotice';
const MIDI_EVENT_TEXT = 'text';
const MIDI_EVENT_TIME_SIGNATURE = 'timeSignature';
const MIDI_EVENT_SET_TEMPO = 'setTempo';
const MIDI_EVENT_NOTE_ON = 'noteOn';
const MIDI_EVENT_NOTE_OFF = 'noteOff';
const MIDI_EVENT_CONTROL_CHANGE = 'controlChange';
const MIDI_EVENT_TRACK_NAME = 'trackName';

declare const navigator: any;

@Injectable({
  providedIn: 'root'
})
export class MidiService {

  public MIDI_DEVICE_CONNECTED = 'connected';
  public MIDI_DEVICE_DISCONNECTED = 'disconnected';
  public MIDI_VELOCITY_MAX = 127;

  constructor(
    private deviceStore: DeviceStore,
    private commonService: CommonService,
    private keyboardService: KeyboardService,
    private parseService: ParseService
  ) { }

  public getInputDevices(): Observable<WebMidi.MIDIInput> {
    return from(navigator.requestMIDIAccess())
      .pipe(
        switchMap((midiAccess: WebMidi.MIDIAccess) => {
          return midiAccess.inputs;
        }),
        map((midiInput) => {
          return midiInput[1];
        }),
        filter((midiInput: WebMidi.MIDIInput) => {
          return midiInput != null && midiInput.state === this.MIDI_DEVICE_CONNECTED;
        })
      );
  }

  // public getMidiAccess(): Observable<WebMidi.MIDIAccess> {
  public getMidiAccess(): Observable<any> {
    return from(navigator.requestMIDIAccess());
  }

  public addMidiDevice(inputDevice: WebMidi.MIDIInput) {
    const device: Device = new Device(this.commonService.normalizeName(inputDevice.name), inputDevice.name);
    this.handleMessagesFromInputDevice(device);
    this.deviceStore.addDevice(device);
  }

  public logDeviceHotPlug(): Subscription {
    return from(navigator.requestMIDIAccess())
      .subscribe((midiAccess: WebMidi.MIDIAccess) => {
        midiAccess.onstatechange = e => {
          console.log('Port name: ' + e.port.name
            + ' Type: ' + e.port.type
            + ' Manufacturer: ' + e.port.manufacturer
            + ' State: ' + e.port.state);
        };
      });
  }

  private midiMessageAsObservable(inputDevice: WebMidi.MIDIInput): Observable<WebMidi.MIDIMessageEvent> {
    this.logInputDevice(inputDevice);
    const source: Subject<WebMidi.MIDIMessageEvent> = new Subject<WebMidi.MIDIMessageEvent>();
    inputDevice.onmidimessage = (note: WebMidi.MIDIMessageEvent) => source.next(note);
    return source.asObservable();
  }

  private handleMessagesFromInputDevice(device: Device) {
    const subscription = this.getInputDevices().pipe(
      filter((midiInput: WebMidi.MIDIInput) => {
        return this.commonService.normalizeName(midiInput.name) === this.commonService.normalizeName(device.id);
      }),
      switchMap((midiInput: WebMidi.MIDIInput) => this.midiMessageAsObservable(midiInput)),
    ).subscribe((message: WebMidi.MIDIMessageEvent) => {
      this.onMIDIMessage(device, message);
    });
    device.midiMessageSubscription = subscription;
  }

  // Processing the message received from an input device
  private onMIDIMessage(device: Device, message: WebMidi.MIDIMessageEvent) {
    const deviceName = this.commonService.normalizeName(device.id);

    const status = message.data[0];

    // The command is the higher four bits of the status byte
    const command = status >>> 4;
    const commandName = command === 0x9 ? 'Note On' : 'Note Off';

    // The channel (0-15) is the lower four bits of the status byte
    // A device can thus control 16 voices
    const channel = status & 0xF;

    // The velocity is in a range of 0 to 127, from softest to loudest
    // Since a velocity of 0 is a "note off", the softest possible "note on" velocity is 1
    // The velocity might not be included with a "note off"
    const velocity = (message.data.length > 2) ? message.data[2] : 0;

    const midiNote = message.data[1];
    const octave = Math.trunc(midiNote / 12);
    const musicNote = this.midi2Abc(midiNote);

    // console.log('Device: ' + deviceName + ' Command: ' + command.toString(16) + ' ' + commandName
    //   + ' Channel: ' + channel.toString(16)
    //   + ' Midi note: ' + midiNote + ' Music note: ' + musicNote + ' Octave: ' + octave
    //   + ' Velocity: ' + velocity);

    switch (status) {
      case NOTE_ON:
        if (velocity > 0) {
          this.keyboardService.pressKey(device.keyboard, midiNote);
          // this.synthService.noteOn(midiNote, velocity);
          // A keyboard handler already sends the note to the synth
        } else {
          // But a velocity of 0 is a "note off"
          this.keyboardService.unpressKey(device.keyboard, midiNote);
          // this.synthService.noteOff(midiNote);
        }
        break;
      case NOTE_OFF:
        this.keyboardService.unpressKey(device.keyboard, midiNote);
        // this.synthService.noteOff(midiNote);
        break;
    }
  }

  private logInputDevice(inputDevice: WebMidi.MIDIInput) {
    console.log('Input port: [ type: ' + inputDevice.type + ' id: ' + inputDevice.id +
      ' manufacturer: ' + inputDevice.manufacturer + ' name: ' + inputDevice.name +
      ' version: ' + inputDevice.version + ']');
  }

  private logOutputDevice(outputDevice: WebMidi.MIDIOutput) {
    console.log('Output port : [ type: ' + outputDevice.type + ' id: ' + outputDevice.id +
      ' manufacturer: ' + outputDevice.manufacturer + ' name: ' + outputDevice.name +
      ' version: ' + outputDevice.version + ']');
  }

  public async parseRawMidiTonejs(name: string, rawMidiData: ArrayBuffer): Promise<Soundtrack> {
    const midi = new Midi(rawMidiData);
    console.log(midi);
    const soundtrack = new Soundtrack(this.commonService.normalizeName(name), name);
    soundtrack.name = midi.name;
    if (midi.tracks != null) {
      midi.tracks.forEach((midiTrack: any) => {
        const track: Track = new Track();
        track.name = midiTrack.name;
        track.channel = midiTrack.channel;
        if (track.instrument != null) {
          track.instrument = new Instrument(
            midiTrack.instrument.id,
            midiTrack.instrument.family,
            midiTrack.instrument.name,
            midiTrack.instrument.percussion);
        }
        const tempo: Tempo = this.parseService.buildDefaultTempo();
        const timeSignature: TimeSignature = this.parseService.buildDefaultTimeSignature();
        if (midiTrack.notes != null) {
          const measures = new Array<Measure>();
          const placedNotes: Array<PlacedNote> = new Array<PlacedNote>();
          midiTrack.notes.forEach((midiNote: any) => {
            const pitchOctave: Array<string> = this.parseService.noteToPitchOctave(midiNote.name);
            const note: Note = this.parseService.buildNoteWithTicks(
              pitchOctave[0],
              parseInt(pitchOctave[1], 10),
              midiNote.velocity,
              midiNote.durationTicks);
            note.time = midiNote.time;
            const placedNote: PlacedNote = this.parseService.placeNote(note, null);
            placedNotes.push(placedNote);
          });
          const measure: Measure = new Measure(tempo, timeSignature);
          measure.placedNotes = placedNotes;
          measures.push(measure);
          track.measures = measures;
        }
        track.controls = new Array<Control>();
        if (midiTrack.controlChanges != null) {
          Object.keys(midiTrack.controlChanges).map(key => {
            // TODO The control is not yet retrieved
            const midiControl: any = midiTrack.controlChanges[key];
            const control = new Control(midiControl.number, midiControl.time, midiControl.ticks, midiControl.value);
            console.log(control);
            track.controls.push(control);
          });
        }
        if (midiTrack.instrument != null) {
          track.instrument = new Instrument(
            midiTrack.instrument.number,
            midiTrack.instrument.family,
            midiTrack.instrument.name,
            midiTrack.instrument.percussion);
        }
        soundtrack.tracks.push(track);
      });
    }
    console.log(soundtrack);
    return soundtrack;
  }

  public async parseRawMidi(name: string, rawMidiData: ArrayBuffer): Promise<Soundtrack> {
    let soundtrack: Soundtrack;
    await parseArrayBuffer(rawMidiData)
    .then((jsonMidi: IMidiFile) => {
      soundtrack = new Soundtrack(this.commonService.normalizeName(name), name);
      if (jsonMidi.format === 1) {
        jsonMidi = this.addCursorTime(jsonMidi);
        const assumedTempoTrackIndex = 0;
        if (this.isTempoTrack(jsonMidi.tracks[assumedTempoTrackIndex])) {
          jsonMidi = this.copyTempoTrackEventsAndSortByTime(assumedTempoTrackIndex, jsonMidi);
        }
        console.log(jsonMidi);
        let isFirstTrack = true;
        // The number of pulses per quarter note is expressed in ticks
        // In MIDI it may also be called PPQ, PPQN, time resolution, time division
        const pulsesPerQuarter = jsonMidi.division ? jsonMidi.division : DEFAULT_MIDI_PPQ;
        console.log('PPQ: ' + jsonMidi.division + ' pulsesPerQuarter: ' + pulsesPerQuarter);
        let currentTempo: number = this.bpmToMicroSeconds(DEFAULT_MIDI_TEMPO);
        let currentNoteOnEvent: IMidiNoteOnEvent = null;
        let currentTimeSignature: TimeSignature = this.parseService.buildDefaultTimeSignature();
        let pulsesPerMeasure = null;
        jsonMidi.tracks.forEach((midiTrack: TMidiEvent[]) => {
          const track: Track = new Track();
          console.log('New track');
          // In MIDI the measure may also be called a bar
          const measures = new Array<Measure>();
          let currentMeasure: Measure = null;
          let measureCounter: number = 0;
          midiTrack.forEach((midiEvent: any) => {
            if (midiEvent.hasOwnProperty(MIDI_EVENT_TRACK_NAME)) {
              const trackNameEvent: IMidiTrackNameEvent = midiEvent;
              track.name = trackNameEvent.trackName;
              if (isFirstTrack) {
                soundtrack.id = track.name; // TODO Normalize this
                soundtrack.name = track.name;
              }
            } else if (midiEvent.hasOwnProperty(MIDI_EVENT_CHANNEL_PREFIX)) {
              const channelPrefixEvent: IMidiChannelPrefixEvent = midiEvent;
              track.channel = channelPrefixEvent.channelPrefix;
            } else if (midiEvent.hasOwnProperty(MIDI_EVENT_COPYRIGHT_NOTICE)) {
              const copyrightNoticeEvent: IMidiCopyrightNoticeEvent = midiEvent;
              if (isFirstTrack) {
                soundtrack.copyright = copyrightNoticeEvent.copyrightNotice;
              }
            } else if (midiEvent.hasOwnProperty(MIDI_EVENT_TEXT)) {
              const textEvent: IMidiTextEvent = midiEvent;
              if (isFirstTrack) {
                soundtrack.text += textEvent.text + ' ';
              }
            } else if (midiEvent.hasOwnProperty(MIDI_EVENT_TIME_SIGNATURE)) {
              const timeSignatureEvent: IMidiTimeSignatureEvent = midiEvent;
              currentTimeSignature = this.parseService.timeSignature(
                timeSignatureEvent.timeSignature.numerator,
                timeSignatureEvent.timeSignature.denominator);
              pulsesPerMeasure = this.pulsesPerMeasure(this.quarterNotesPerMeasure(currentTimeSignature), pulsesPerQuarter);
              console.log('pulsesPerMeasure: ' + pulsesPerMeasure);
            } else if (midiEvent.hasOwnProperty(MIDI_EVENT_SET_TEMPO)) {
              const tempoEvent: IMidiSetTempoEvent = midiEvent;
              currentTempo = tempoEvent.setTempo.microsecondsPerBeat;
            } else if (midiEvent.hasOwnProperty(MIDI_EVENT_NOTE_ON)) {
              const noteOnEvent: IMidiNoteOnEvent = midiEvent;
              // Ignore additional note-on events if any
              if (currentNoteOnEvent == null) {
                currentNoteOnEvent = noteOnEvent;
              }
            } else if (midiEvent.hasOwnProperty(MIDI_EVENT_CONTROL_CHANGE)) {
              // A control-change event might be sitting between a note-on and a note-off event
              // In that case, the control-change event delta is used as the note-off event delta is 0
              const controlChangeEvent: IMidiControlChangeEvent = midiEvent;
              if (currentNoteOnEvent != null) {
                const delta: number = this.delta(controlChangeEvent.time, currentNoteOnEvent.time);
                if (this.placeEventOnNewMeasure(currentNoteOnEvent.time, pulsesPerMeasure, measureCounter)) {
                  const tempo: Tempo = this.parseService.tempo(this.microSecondsToBpm(currentTempo).toString());
                  currentMeasure = new Measure(tempo, currentTimeSignature);
                  currentMeasure.placedNotes = new Array<PlacedNote>();
                  measures.push(currentMeasure);
                  measureCounter++;
                }
                currentMeasure.placedNotes.push(this.buildAndPlaceNote(delta, pulsesPerQuarter, currentTempo, currentNoteOnEvent));
                currentNoteOnEvent = null;
              }
            } else if (midiEvent.hasOwnProperty(MIDI_EVENT_CONTROL_CHANGE) || midiEvent.hasOwnProperty(MIDI_EVENT_NOTE_OFF)) {
              const noteOffEvent: IMidiNoteOffEvent = midiEvent;
              if (currentNoteOnEvent != null) {
                // console.log('Note off');
                const delta: number = this.delta(noteOffEvent.time, currentNoteOnEvent.time);
                if (this.placeEventOnNewMeasure(currentNoteOnEvent.time, pulsesPerMeasure, measureCounter)) {
                  const tempo: Tempo = this.parseService.tempo(this.microSecondsToBpm(currentTempo).toString());
                  currentMeasure = new Measure(tempo, currentTimeSignature);
                  currentMeasure.placedNotes = new Array<PlacedNote>();
                  measures.push(currentMeasure);
                  measureCounter++;
                  // console.log('New measure with counter: ' + measureCounter);
                }
                // console.log('Push note');
                currentMeasure.placedNotes.push(this.buildAndPlaceNote(delta, pulsesPerQuarter, currentTempo, currentNoteOnEvent));
                currentNoteOnEvent = null;
              }
            }
          });
          track.measures = measures;
          soundtrack.tracks.push(track);
          isFirstTrack = false;
        });
      }
    });
    return soundtrack;
  }

  private placeEventOnNewMeasure(noteOnTime: TValue, pulsesPerMeasure: number, measureCounter: number): boolean {
    noteOnTime = parseInt(noteOnTime.toString(), 10);
    return noteOnTime >= (pulsesPerMeasure * measureCounter);
  }

  private quarterNotesPerMeasure(timeSignature: TimeSignature): number {
    let qpm = 0;
    switch (timeSignature.denominator) {
      case 1:
        qpm = 4 * timeSignature.numerator;
        break;
      case 2:
        qpm = 2 * timeSignature.numerator;
        break;
      case 4:
        qpm = timeSignature.numerator;
        break;
      case 8:
        qpm = timeSignature.numerator / 2;
        break;
      case 16:
        qpm = timeSignature.numerator / 4;
        break;
    }
    return qpm;
  }

  private pulsesPerMeasure(qpm: number, pulsesPerQuarter: number): number {
    return qpm * pulsesPerQuarter;
  }

  // Copy the tempo change events of the given track into the other tracks
  // and sort the events of the other tracks by their time property
  private copyTempoTrackEventsAndSortByTime(tempoTrackIndex: number, jsonMidi: IMidiFile): IMidiFile {
    const tempoChangeEvents: Array<any> = new Array<any>();
    jsonMidi.tracks[tempoTrackIndex].forEach((midiEvent: any, eventIndex: number) => {
      if (midiEvent.hasOwnProperty(MIDI_EVENT_SET_TEMPO)) {
        tempoChangeEvents.push(midiEvent);
      }
    });

    if (tempoChangeEvents.length > 0) {
      jsonMidi.tracks.forEach((midiTrack: TMidiEvent[], trackIndex: number) => {
        if (trackIndex !== tempoTrackIndex) {
          const track = midiTrack.concat(tempoChangeEvents);
          track.sort((a: TMidiEvent, b: TMidiEvent) => {
            if (a.time < b.time) {
              return -1;
            } else if (a.time > b.time) {
              return 1;
            } else {
              return 0;
            }
          });
          jsonMidi.tracks[trackIndex] = track;
        }
      });
    }
    return jsonMidi;
  }

  // If a track has no notes and its first tempo change event has a delta based on the start time
  // then the track is considered to be a track of tempo changes
  private isTempoTrack(midiTrack: TMidiEvent[]): boolean {
    let hasNoNotes = true;
    let firstTempoEventIsFirstEventWithTime: boolean = true;
    let isFirstTempoEvent = true;
    midiTrack.forEach((midiEvent: any, eventIndex: number) => {
      if (midiEvent.hasOwnProperty(MIDI_EVENT_SET_TEMPO)) {
        if (isFirstTempoEvent) {
          if (midiEvent.delta !== midiEvent.time) {
            firstTempoEventIsFirstEventWithTime = false;
          }
          isFirstTempoEvent = false;
        }
      } else if (midiEvent.hasOwnProperty(MIDI_EVENT_NOTE_ON)) {
        hasNoNotes = false;
      } else if (midiEvent.hasOwnProperty(MIDI_EVENT_NOTE_OFF)) {
        hasNoNotes = false;
      }
    });
    return hasNoNotes && firstTempoEventIsFirstEventWithTime;
  }

  private delta(t2: TValue, t1: TValue): number {
    return parseInt(t2.toString(), 10) - parseInt(t1.toString(), 10);
  }

  // Add a time property to all events of all tracks
  // representing the absolute time of each event
  private addCursorTime(jsonMidi: IMidiFile): IMidiFile {
    jsonMidi.tracks.forEach((midiTrack: TMidiEvent[], trackIndex: number) => {
      let time: number = 0;
      midiTrack.forEach((midiEvent: any, eventIndex: number) => {
        time += midiEvent.delta;
        midiEvent.time = time;
        jsonMidi.tracks[trackIndex][eventIndex] = midiEvent;
      });
    });
    return jsonMidi;
  }

  private buildAndPlaceNote(
    deltaInTicks: number, ticksPerQuarter: number,
    tempoInMicroSecondsPerBeat: number, currentNoteOnEvent: IMidiNoteOnEvent): PlacedNote {
    // const duration: string = this.ticksToBpm(deltaInTicks,
    //   ticksPerQuarter, tempoInMicroSecondsPerBeat)
    //   .toString();
    const abc: string = this.midi2Abc(currentNoteOnEvent.noteOn.noteNumber);
    const octave: number = this.midi2octave(currentNoteOnEvent.noteOn.noteNumber);
    const velocity: number = currentNoteOnEvent.noteOn.velocity;
    const note: Note = this.parseService.buildNoteWithTicks(abc, octave, velocity, deltaInTicks);
    const placedNote: PlacedNote = this.parseService.placeNote(note, null);
    return placedNote;
  }

  private ticksToBpm(deltaInTicks: number, ticksPerQuarter: number, tempoInMicroSecondsPerBeat: number): number {
    const deltaInQuarters = this.ticksToQuarters(deltaInTicks, ticksPerQuarter);
    const deltaInMicroSeconds = deltaInQuarters * tempoInMicroSecondsPerBeat;
    const bpm = this.microSecondsToBpm(deltaInMicroSeconds);
    const deltaInSubdivisions = this.subdivision(deltaInQuarters);
    console.log('delta: ' + deltaInTicks + ' ' + deltaInQuarters + ' ' + deltaInSubdivisions
    + ' tempo: ' + tempoInMicroSecondsPerBeat
    + ' bpm: ' + bpm);
    return bpm;
  }

  private ticksToQuarters(ticks: number, ticksPerQuarter: number) {
    return Math.round((ticks / ticksPerQuarter) * 1000000) / 1000000;
  }

  private subdivision(deltaInQuarters: number) {
    const subdivisionSlice: number = 1 / 64;
    const deltaInSubdivisionSlices: number = Math.round(deltaInQuarters / subdivisionSlice);
    return deltaInSubdivisionSlices;
  }

  private findSubdivision(subdivisionSlices: number): Subdivision {
    let left: number = 0;
    let leftUnit: number = 0;
    let right: number = 0;
    let rightUnit: number = 0;
    let remain = subdivisionSlices;
    while (remain > 0) {
      if (remain - 64 >= 0) {
        left += 1;
        leftUnit = Subdivisions.WHOLE;
        remain -= 64;
      } else if (remain >= 32) {

      }
    }
    return null;
    // if ()
    // if (intValue === Subdivision.EIGHTH.left) {
    //   return Subdivision.EIGHTH;
    // } else if (intValue === Subdivision.QUARTER.left) {
    //   return Subdivision.QUARTER;
    // } else if (intValue === Subdivision.SIXTEENTH.left) {
    //   return Subdivision.SIXTEENTH;
    // } else if (intValue === Subdivision.HALF.left) {
    //   return Subdivision.HALF;
    // } else if (intValue === Subdivision.THIRTY_SECOND.left) {
    //   return Subdivision.THIRTY_SECOND;
    // } else {
    //   throw new Error('Unknown subdivision for duration: ' + subdivisionSlices);
    // }
  }

  private midi2octave(midiNote: number): number {
    return Math.round(midiNote / 12) - 1;
  }

  private midi2Abc(midiNote: number) {
    return Chroma.CHROMAS[midiNote % 12];
  }

  private microSecondsToBpm(microSeconds: number): number {
    return Math.round(60000 / (microSeconds / 1000));
  }

  private bpmToMicroSeconds(bpm: number): number {
    return Math.round(60000 / bpm * 1000);
  }

  // TODO public createRawMidiFile(soundtrack: Soundtrack, filename: string): ToneMidi.Midi {
  //   const midi = new ToneMidi.Midi();
  //   midi.name = soundtrack.name;
  //   soundtrack.tracks.forEach((track: Track) => {
  //     const midiTrack = midi.addTrack();
  //     midiTrack.name = track.name;
  //     midiTrack.channel = track.channel;
  //     track.notes.forEach((note: Note) => {
  //       midiTrack
  //         .addNote({
  //           midi: note.midi,
  //           time: note.time,
  //           ticks: note.ticks,
  //           name: note.abc,
  //           velocity: note.velocity,
  //           duration: note.duration
  //         });
  //     });
  //     track.controls.forEach((control: Control) => {
  //       midiTrack
  //         .addCC({
  //           number: control.cc,
  //           time: control.time,
  //           ticks: control.ticks,
  //           value: control.value
  //         });
  //     });
  //   });
  //   return midi;
  // }

}
