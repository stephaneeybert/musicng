import { Injectable } from '@angular/core';
import { Subject, Observable, from, Subscription, ReplaySubject, EMPTY, Subscriber, interval, of, asapScheduler, asyncScheduler, BehaviorSubject } from 'rxjs';
import { map, filter, switchMap, catchError, delay } from 'rxjs/operators';
import { parseArrayBuffer } from 'midi-json-parser';
import {
  IMidiFile, TMidiEvent, IMidiNoteOnEvent,
  IMidiNoteOffEvent, IMidiSetTempoEvent,
  IMidiTrackNameEvent, IMidiCopyrightNoticeEvent,
  IMidiTextEvent, IMidiChannelPrefixEvent,
  IMidiTimeSignatureEvent, IMidiControlChangeEvent
} from 'midi-json-parser-worker';
import * as Tone from 'tone';
import { Midi } from '@tonejs/midi';
import { TValue } from 'worker-factory';
// import { WebMidi } from 'webmidi';
import { Device } from '@app/model/device';
import { KeyboardService } from '@app/service/keyboard.service';
import { Soundtrack } from '@app/model/soundtrack';
import { Track } from '@app/model/track';
import { Control } from '@app/model/control';
import { Instrument } from '@app/model/instrument';
import { DeviceStore } from '@app/store/device-store';
import { Measure } from '@app/model/measure/measure';
import { TimeSignature } from '@app/model/measure/time-signature';
import { NotationService } from './notation.service';
import { Note } from '@app/model/note/note';
import { PlacedChord } from '@app/model/note/placed-chord';
import { Duration } from '@app/model/note/duration/duration';
import { SynthService } from './synth.service';
import { CommonService, DownloadService } from '@stephaneeybert/lib-core';
import { ProgressTask } from '@stephaneeybert/lib-core/lib/download/progress-task';
import { DEFAULT_TEMPO_BPM, DEFAULT_TONALITY_C_MAJOR } from './notation.constant';

const NOTE_ON: number = 144; // A command value of 144 is a "note on"
const NOTE_OFF: number = 128; // A command value of 128 is a "note off"
const DEFAULT_MIDI_TEMPO: number = 120;
const DEFAULT_MIDI_PPQ: number = 480;
const DEFAULT_MIDI_TIME_SIGNATURE: string = '4/4';

const MIDI_EVENT_CHANNEL_PREFIX: string = 'channelPrefix';
const MIDI_EVENT_COPYRIGHT_NOTICE: string = 'copyrightNotice';
const MIDI_EVENT_TEXT: string = 'text';
const MIDI_EVENT_TIME_SIGNATURE: string = 'timeSignature';
const MIDI_EVENT_SET_TEMPO: string = 'setTempo';
const MIDI_EVENT_NOTE_ON: string = 'noteOn';
const MIDI_EVENT_NOTE_OFF: string = 'noteOff';
const MIDI_EVENT_CONTROL_CHANGE: string = 'controlChange';
const MIDI_EVENT_TRACK_NAME: string = 'trackName';
const MIDI_DEVICE_OBSERVE_DELAY: number = 1000;

declare const navigator: any;

@Injectable({
  providedIn: 'root'
})
export class MidiService {

  public MIDI_DEVICE_CONNECTED = 'connected';
  public MIDI_DEVICE_DISCONNECTED = 'disconnected';

  constructor(
    private deviceStore: DeviceStore,
    private commonService: CommonService,
    private keyboardService: KeyboardService,
    private notationService: NotationService,
    private synthService: SynthService,
    private downloadService: DownloadService
  ) { }

  public getInputDevices$(): Observable<WebMidi.MIDIInput> {
    return this.requestMIDIAccess$()
      .pipe(
        delay(MIDI_DEVICE_OBSERVE_DELAY),
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

  public requestMIDIAccess$(): Observable<WebMidi.MIDIAccess> {
    return from(navigator.requestMIDIAccess())
      .pipe(
        map((midiAccess: any) => {
          return midiAccess;
        }),
        catchError((error: any) => {
          console.log('Your browser is not compatible with MIDI access. Try using the Chrome browser.');
          console.log(error);
          return EMPTY;
        })
      );
  }

  public addMidiDevice(inputDevice: WebMidi.MIDIInput): void {
    if (inputDevice.name) {
      const device: Device = new Device(this.commonService.normalizeName(inputDevice.name), inputDevice.name);
      this.handleMessagesFromInputDevice(device);
      this.deviceStore.add(device);
    }
  }

  public logDeviceHotPlug(): Subscription {
    return this.requestMIDIAccess$()
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
    console.log(inputDevice);
    const source: Subject<WebMidi.MIDIMessageEvent> = new Subject<WebMidi.MIDIMessageEvent>();
    inputDevice.onmidimessage = (note: WebMidi.MIDIMessageEvent) => source.next(note);
    return source.asObservable();
  }

  private handleMessagesFromInputDevice(device: Device): void {
    const subscription: Subscription = this.getInputDevices$()
      .pipe(
        filter((midiInput: WebMidi.MIDIInput) => {
          return (midiInput.name != undefined) && this.commonService.normalizeName(midiInput.name) === this.commonService.normalizeName(device.id);
        }),
        switchMap((midiInput: WebMidi.MIDIInput) => this.midiMessageAsObservable(midiInput)),
      ).subscribe((message: WebMidi.MIDIMessageEvent) => {
        this.onMIDIMessage(device, message);
      });
    device.midiMessageSubscription = subscription;
  }

  // Processing the message received from an input device
  private onMIDIMessage(device: Device, message: WebMidi.MIDIMessageEvent): void {
    const deviceName: string = this.commonService.normalizeName(device.id);

    const status: number = message.data[0];

    // The command is the higher four bits of the status byte
    const command: number = status >>> 4;
    const commandName: string = command === 0x9 ? 'Note On' : 'Note Off';

    // The channel (0-15) is the lower four bits of the status byte
    // A device can thus control 16 voices
    const channel: number = status & 0xF;

    // The velocity is in a range of 0 to 127, from softest to loudest
    // Since a velocity of 0 is a "note off", the softest possible "note on" velocity is 1
    // The velocity might not be included with a "note off"
    const velocity: number = (message.data && message.data.length > 2) ? message.data[2] : 0;

    const midiNote: number = message.data[1];
    const octave: number = Math.trunc(midiNote / 12);
    const musicNote: string = this.synthService.midiToTextNote(midiNote);

    // console.log('Device: ' + deviceName + ' Command: ' + command.toString(16) + ' ' + commandName
    //   + ' Channel: ' + channel.toString(16)
    //   + ' Midi note: ' + midiNote + ' Music note: ' + musicNote + ' Octave: ' + octave
    //   + ' Velocity: ' + velocity);

    switch (status) {
      case NOTE_ON:
        if (velocity > 0) {
          this.keyboardService.pressKey(device.keyboard, [midiNote]);
          // this.synthService.noteOn(midiNote, velocity);
          // A keyboard handler already sends the note to the synth
        } else {
          // But a velocity of 0 is a "note off"
          this.keyboardService.unpressKey(device.keyboard, [midiNote]);
          // this.synthService.noteOff(midiNote);
        }
        break;
      case NOTE_OFF:
        this.keyboardService.unpressKey(device.keyboard, [midiNote]);
        // this.synthService.noteOff(midiNote);
        break;
    }
  }

  private logInputDevice(inputDevice: WebMidi.MIDIInput): void {
    console.log('Input port: [ type: ' + inputDevice.type + ' id: ' + inputDevice.id +
      ' manufacturer: ' + inputDevice.manufacturer + ' name: ' + inputDevice.name +
      ' version: ' + inputDevice.version + ']');
  }

  private logOutputDevice(outputDevice: WebMidi.MIDIOutput): void {
    console.log('Output port : [ type: ' + outputDevice.type + ' id: ' + outputDevice.id +
      ' manufacturer: ' + outputDevice.manufacturer + ' name: ' + outputDevice.name +
      ' version: ' + outputDevice.version + ']');
  }

  public async parseRawMidiTonejs(name: string, rawMidiData: ArrayBuffer): Promise<Soundtrack> {
    const soundtrack: Soundtrack = new Soundtrack(this.commonService.normalizeName(name), name);
    let midi: Midi = new Midi(rawMidiData);
    midi = JSON.parse(JSON.stringify(midi, undefined, 2));
    console.log(midi);
    soundtrack.name = midi.name;
    if (midi.tracks != null) {
      let trackIndex: number = 0;
      midi.tracks.forEach((midiTrack: any) => {
        const track: Track = new Track(trackIndex);
        track.name = midiTrack.name;
        track.channel = midiTrack.channel;
        if (track.instrument != null) {
          track.instrument = new Instrument(
            midiTrack.instrument.id,
            midiTrack.instrument.family,
            midiTrack.instrument.name,
            midiTrack.instrument.percussion
          );
        }
        const measureTempo: number = DEFAULT_TEMPO_BPM;
        const noteDuration: Duration = this.notationService.getDefaultChordDuration();
        const timeSignature: TimeSignature = this.notationService.createDefaultTimeSignature();
        if (midiTrack.notes != null) {
          let measureIndex: number = 0;
          const measures: Array<Measure> = new Array<Measure>();
          let placedChordIndex: number = 0;
          const placedChords: Array<PlacedChord> = new Array<PlacedChord>();
          midiTrack.notes.forEach((midiNote: any) => {
            const [chroma, octave]: [string, number] = this.notationService.noteToChromaOctave(midiNote.name);
            const noteIndex: number = 0; // TODO If the note has the same time than the previous note then add it to the previous chord instead of adding it into a new chord
            const note: Note = this.notationService.createNote(noteIndex, chroma, octave);
            // const duration: Duration = midiNote.time; // TODO midiNote.durationTicks How to retrieve the note time and store it in the chord ?
            const placedChord: PlacedChord = this.notationService.createEmptyChord(placedChordIndex, noteDuration, midiNote.velocity, DEFAULT_TONALITY_C_MAJOR);
            placedChord.addNote(note);
            placedChords.push(placedChord);
            placedChordIndex++;
          });
          const measure: Measure = new Measure(measureIndex, measureTempo, timeSignature);
          measure.placedChords = placedChords;
          measures.push(measure);
          measureIndex++
          track.measures = measures;
          placedChordIndex = 0;
        }
        track.controls = new Array<Control>();
        if (midiTrack.controlChanges != null) {
          Object.keys(midiTrack.controlChanges).forEach(key => {
            // TODO The control is not yet retrieved
            const midiControl: any = midiTrack.controlChanges[key];
            const control: Control = new Control(midiControl.number, midiControl.time, midiControl.ticks, midiControl.value);
            if (track.controls) {
              track.controls.push(control);
            } else {
              throw new Error('The track controls array has not been instantiated.');
            }
          });
        }
        if (midiTrack.instrument != null) {
          track.instrument = new Instrument(
            midiTrack.instrument.number,
            midiTrack.instrument.family,
            midiTrack.instrument.name,
            midiTrack.instrument.percussion);
        }
        trackIndex++;
        soundtrack.tracks.push(track);
      });
    }
    console.log(soundtrack);
    return soundtrack;
  }

  public async parseRawMidi(name: string, rawMidiData: ArrayBuffer): Promise<Soundtrack> {
    let soundtrack: Soundtrack = new Soundtrack(this.commonService.normalizeName(name), name);
    // let midi: Midi = new Midi(rawMidiData);
    // midi = JSON.parse(JSON.stringify(midi, undefined, 2));
    await parseArrayBuffer(rawMidiData)
      .then((jsonMidi: IMidiFile) => {
        if (jsonMidi.format === 1) {
          jsonMidi = this.addEventsTime(jsonMidi);
          console.log(jsonMidi);
          this.copyTempoTrackEventsAndSortByTime(jsonMidi);
          let isFirstTrack = true;
          // The number of parts per quarter note (or ticks per quarter note) is expressed in ticks
          // In MIDI it may also be called PPQ, PPQN, time resolution, time division
          const PPQ: number = jsonMidi.division ? jsonMidi.division : DEFAULT_MIDI_PPQ;
          console.log('PPQ: ' + jsonMidi.division + ' PPQ: ' + PPQ);
          let currentTempoInMicroSecondsPerBeat: number = this.beatsToSeconds(1, DEFAULT_MIDI_TEMPO);
          let previousNoteOnEvent: IMidiNoteOnEvent | undefined;
          let currentNoteOnEvent: IMidiNoteOnEvent | undefined;
          let currentTimeSignature: TimeSignature = this.notationService.createDefaultTimeSignature();
          let currentTicksPerMeasure: number;
          let trackIndex: number = 0;
          jsonMidi.tracks.forEach((midiTrack: TMidiEvent[]) => {
            const track: Track = new Track(trackIndex);
            const measures: Array<Measure> = new Array<Measure>();
            let measureIndex: number = 0;
            let placedChordIndex: number = 0;
            let currentMeasure: Measure;
            midiTrack.forEach((midiEvent: any) => {
              if (midiEvent.hasOwnProperty(MIDI_EVENT_TRACK_NAME)) {
                const trackNameEvent: IMidiTrackNameEvent = midiEvent;
                track.name = trackNameEvent.trackName;
                if (isFirstTrack) {
                  soundtrack.id = this.commonService.normalizeName(track.name);
                  soundtrack.name = track.name;
                }
              } else if (midiEvent.hasOwnProperty(MIDI_EVENT_TEXT)) {
                const textEvent: IMidiTextEvent = midiEvent;
                if (isFirstTrack) {
                  soundtrack.lyrics += textEvent.text + ' ';
                }
              } else if (midiEvent.hasOwnProperty(MIDI_EVENT_CHANNEL_PREFIX)) {
                const channelPrefixEvent: IMidiChannelPrefixEvent = midiEvent;
                track.channel = channelPrefixEvent.channelPrefix;
              } else if (midiEvent.hasOwnProperty(MIDI_EVENT_COPYRIGHT_NOTICE)) {
                const copyrightNoticeEvent: IMidiCopyrightNoticeEvent = midiEvent;
                if (isFirstTrack) {
                  soundtrack.copyright = copyrightNoticeEvent.copyrightNotice;
                }
              } else if (midiEvent.hasOwnProperty(MIDI_EVENT_TIME_SIGNATURE)) {
                const timeSignatureEvent: IMidiTimeSignatureEvent = midiEvent;
                currentTimeSignature = this.notationService.createTimeSignature(
                  timeSignatureEvent.timeSignature.numerator,
                  timeSignatureEvent.timeSignature.denominator
                );
                currentTicksPerMeasure = this.measureInTicks(this.quarterNotesPerMeasure(currentTimeSignature), PPQ);
              } else if (midiEvent.hasOwnProperty(MIDI_EVENT_SET_TEMPO)) {
                const tempoEvent: IMidiSetTempoEvent = midiEvent;
                currentTempoInMicroSecondsPerBeat = tempoEvent.setTempo.microsecondsPerBeat;
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
                  const deltaInTicks: number = this.delta(controlChangeEvent.time, currentNoteOnEvent.time);
                  if (this.placeEventOnNewMeasure(currentNoteOnEvent.time, currentTicksPerMeasure, measureIndex)) {
                    const tempo: number = this.microSecondsToBpm(currentTempoInMicroSecondsPerBeat);
                    currentMeasure = new Measure(measureIndex, tempo, currentTimeSignature);
                    currentMeasure.placedChords = new Array<PlacedChord>();
                    measures.push(currentMeasure);
                    measureIndex++;
                    placedChordIndex = 0;
                  }
                  if (currentMeasure.placedChords) {
                    const note: Note = this.buildNote(deltaInTicks, PPQ, currentTempoInMicroSecondsPerBeat, currentNoteOnEvent);
                    const measureLastPlacedChord: PlacedChord | undefined = this.getLastPlacedChord(currentMeasure);
                    // If the note has the same time than the previous note
                    // then add it to the previous chord instead of adding it into a new chord
                    if (previousNoteOnEvent != null  && currentNoteOnEvent.time != previousNoteOnEvent.time) {
                      // const velocity: number = currentNoteOnEvent.noteOn.velocity;
                      // const duration: Duration; // TODO this.ticksToBpm(deltaInTicks, PPQ, tempoInMicroSecondsPerBeat).toString();
                      // const placedChord: PlacedChord = this.notationService.createEmptyChord(placedChordIndex, duration, velocity);
                      // placedChord.addNote(note);
                      // currentMeasure.placedChords.push(placedChord);
                      placedChordIndex++;
                    } else {
                      if (measureLastPlacedChord != null) {
                        measureLastPlacedChord.addNote(note);
                      }
                    }
                    previousNoteOnEvent = currentNoteOnEvent;
                    currentNoteOnEvent = undefined;
                  }
                }
              } else if (midiEvent.hasOwnProperty(MIDI_EVENT_CONTROL_CHANGE) || midiEvent.hasOwnProperty(MIDI_EVENT_NOTE_OFF)) {
                const noteOffEvent: IMidiNoteOffEvent = midiEvent;
                if (currentNoteOnEvent != null) {
                  const deltaInTicks: number = this.delta(noteOffEvent.time, currentNoteOnEvent.time);
                  if (this.placeEventOnNewMeasure(currentNoteOnEvent.time, currentTicksPerMeasure, measureIndex)) {
                    const tempo: number = this.microSecondsToBpm(currentTempoInMicroSecondsPerBeat);
                    currentMeasure = new Measure(measureIndex, tempo, currentTimeSignature);
                    currentMeasure.placedChords = new Array<PlacedChord>();
                    measures.push(currentMeasure);
                    measureIndex++;
                    placedChordIndex = 0;
                  }
                  if (currentMeasure.placedChords) {
                    const note: Note = this.buildNote(deltaInTicks, PPQ, currentTempoInMicroSecondsPerBeat, currentNoteOnEvent);
                    const measureLastPlacedChord: PlacedChord | undefined = this.getLastPlacedChord(currentMeasure);
                    // If the note has the same time than the previous note
                    // then add it to the previous chord instead of adding it into a new chord
                    if (previousNoteOnEvent != null  && currentNoteOnEvent.time != previousNoteOnEvent.time) {
                      // const velocity: number = currentNoteOnEvent.noteOn.velocity;
                      // const duration: Duration = this.ticksToBpm(deltaInTicks, PPQ, tempoInMicroSecondsPerBeat);
                      // const placedChord: PlacedChord = this.notationService.createEmptyChord(placedChordIndex, duration, velocity);
                      // placedChord.addNote(note);
                      // currentMeasure.placedChords.push(placedChord);
                      placedChordIndex++;
                    } else {
                      if (measureLastPlacedChord != null) {
                        measureLastPlacedChord.addNote(note);
                      }
                    }
                    previousNoteOnEvent = currentNoteOnEvent;
                    currentNoteOnEvent = undefined;
                  }
                }
              }
            });
            track.measures = measures;
            trackIndex++;
            soundtrack.tracks.push(track);
            isFirstTrack = false;
          });
        }
      });
    return soundtrack;
  }

  private getLastPlacedChord(measure: Measure): PlacedChord | undefined {
    let lastPlacedChord: PlacedChord | undefined;
    if (measure.placedChords && measure.placedChords.length > 0) {
      lastPlacedChord = measure.placedChords[measure.placedChords.length - 1];
    }
    return lastPlacedChord;
  }

  private buildNote(deltaInTicks: number, PPQ: number, tempoInMicroSecondsPerBeat: number, currentNoteOnEvent: IMidiNoteOnEvent): Note {
    const textNote: string = this.synthService.midiToTextNote(currentNoteOnEvent.noteOn.noteNumber);
    const [chroma, octave]: [string, number] = this.notationService.noteToChromaOctave(textNote);
    const noteIndex: number = 0;
    const note: Note = this.notationService.createNote(noteIndex, chroma, octave);
    return note;
  }

  private placeEventOnNewMeasure(noteOnTime: TValue, pulsesPerMeasure: number, measureCounter: number): boolean {
    if (noteOnTime) {
      noteOnTime = Number(noteOnTime.toString());
    } else {
      throw new Error('The noteOnTime has not been instantiated.');
    }
    return noteOnTime >= (pulsesPerMeasure * measureCounter);
  }

  private quarterNotesPerMeasure(timeSignature: TimeSignature): number {
    let qpm = 0;
    switch (timeSignature.denominator) {
      case 1:
        qpm = timeSignature.numerator * 4;
        break;
      case 2:
        qpm = timeSignature.numerator * 2;
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

  private measureInTicks(qpm: number, PPQ: number): number {
    return qpm * PPQ;
  }

  // Copy the tempo change events of the given track into the other tracks
  // and sort the events of the other tracks by their time property
  private copyTempoTrackEventsAndSortByTime(jsonMidi: IMidiFile): void {
    // Guess the track containing the tempo change events
    // Usually there is only one track containing all the tempo change events
    // and usually it is the first track, but being defensive doesn't hurt here
    let guessedTempoTrackIndex: number = 0;
    for (let trackIndex: number = 0; trackIndex < jsonMidi.tracks.length; trackIndex++) {
      const track: TMidiEvent[] = jsonMidi.tracks[trackIndex];
      if (this.isTempoTrack(track)) {
        guessedTempoTrackIndex = trackIndex;
        break;
      }
    }

    // Get the tempo change events of the track
    const tempoChangeEvents: Array<any> = new Array<any>();
    jsonMidi.tracks[guessedTempoTrackIndex].forEach((midiEvent: any, eventIndex: number) => {
      if (midiEvent.hasOwnProperty(MIDI_EVENT_SET_TEMPO)) {
        tempoChangeEvents.push(midiEvent);
      }
    });

    // Add the tempo events to the other tracks
    if (tempoChangeEvents.length > 0) {
      jsonMidi.tracks.forEach((midiTrack: TMidiEvent[], trackIndex: number) => {
        if (trackIndex !== guessedTempoTrackIndex) {
          const track: Array<TMidiEvent> = midiTrack.concat(tempoChangeEvents);
          track.sort((a: TMidiEvent, b: TMidiEvent) => {
            if (a.time! < b.time!) {
              return -1;
            } else if (a.time! > b.time!) {
              return 1;
            } else {
              return 0;
            }
          });
          jsonMidi.tracks[trackIndex] = track;
        }
      });
    }
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
    if (t2 && t1) {
      return Number(t2.toString()) - Number(t1.toString());
    } else {
      throw new Error('The delta times t1 or t2 have not been instantiated.');
    }
  }

  // Add a time property to all events of all tracks
  // representing the absolute time of each event
  private addEventsTime(jsonMidi: IMidiFile): IMidiFile {
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

  // private ticksToBeats(deltaInTicks: number, PPQ: number, tempoInMicroSecondsPerBeat: number): number {
  //   const deltaInQuarters: number = this.ticksToQuarters(deltaInTicks, PPQ);
  //   const deltaInMicroSeconds: number = deltaInQuarters * tempoInMicroSecondsPerBeat;
  //   const bpm: number = this.microSecondsToBpm(deltaInMicroSeconds);
  //   const deltaInSubdivisions: number = this.subdivision(deltaInQuarters);
  //   console.log('delta: ' + deltaInTicks + ' ' + deltaInQuarters + ' ' + deltaInSubdivisions
  //     + ' tempo: ' + tempoInMicroSecondsPerBeat
  //     + ' bpm: ' + bpm);
  //   return bpm;
  // }

  // private beatsToTicks(durationInBeats: number, PPQ: number, tempoInMicroSecondsPerBeat: number): number {
  //   const durationInMicroSeconds: number = this.beatsToMicroSeconds(1, durationInBeats);
  //   const durationInQuarters: number = durationInMicroSeconds / tempoInMicroSecondsPerBeat;
  //   const durationInTicks: number = this.quartersToTicks(durationInQuarters, PPQ);
  //   return durationInTicks;
  // }

  // private getOneTickInMicroSeconds(PPQ: number, tempoInBpm: number): number {
  //   return 60 * 1000 * 1000 / (tempoInBpm  * PPQ);
  // }

  // private quartersToTicks(quarters: number, PPQ: number): number {
  //   return quarters * PPQ;
  // }

  // private ticksToQuarters(ticks: number, PPQ: number): number {
  //   return Math.round((ticks / PPQ) * 1000000) / 1000000;
  // }

  // private subdivision(deltaInQuarters: number): number {
  //   const subdivisionSlice: number = 1 / 64;
  //   const deltaInSubdivisionSlices: number = Math.round(deltaInQuarters / subdivisionSlice);
  //   return deltaInSubdivisionSlices;
  // }

  private microSecondsToBpm(microSeconds: number): number {
    return Math.round(60000 / (microSeconds / 1000));
  }

  private beatsToSeconds(beats: number, bpm: number): number {
    const oneBeatInSeconds: number = 60 / bpm;
    const beatsInSeconds: number = oneBeatInSeconds * beats;
    return beatsInSeconds;
  }

  public progressiveCreateSoundtrackMidi$(soundtrack: Soundtrack): Observable<ProgressTask<Uint8Array>> {
    const max: number = 200;

    // return new Observable((observer$: Subscriber<ProgressTask<Uint8Array>>) => {
    //   asyncScheduler.schedule(() => {
    //     for (let index: number = 0; index < max; index++) {
    //       this.commonService.sleep(10);
    //       observer$.next(this.downloadService.createProgressTask<Uint8Array>(max, index));
    //     }
    //     observer$.next(this.downloadService.createProgressTask<Uint8Array>(max, max));
    //     observer$.complete();
    //   }, max);
    // });

    // return new Observable((observer$: Subscriber<ProgressTask<Uint8Array>>) => {
    //   let index = 0;
    //   const handler = setInterval(() => {
    //     observer$.next(this.downloadService.createProgressTask<Uint8Array>(max, index));
    //     index++;
    //   }, max);
    //   // observer$.next(this.downloadService.createProgressTask<Uint8Array>(max, max));
    //   // observer$.complete();
    //   return () => clearInterval(handler);
    //   // return { unsubscribe() { } };
    // });

    // return new Observable((observer$: Subscriber<ProgressTask<Uint8Array>>) => {
    //   for (let index: number = 0; index < max; index++) {
    //     this.commonService.sleep(10);
    //     observer$.next(this.downloadService.createProgressTask<Uint8Array>(max, index));
    //   }
    //   observer$.next(this.downloadService.createProgressTask<Uint8Array>(max, max));
    //   observer$.complete();
    //   return { unsubscribe() { } };
    // });

    // return interval(max)
    // // return this.interval(max)
    // .pipe(
    //   map((value: number) => {
    //     return this.downloadService.createProgressTask<Uint8Array>(max, value);
    //   })
    // );

    return new Observable((subscriber$ : Subscriber<ProgressTask<Uint8Array>>) => {
      // this.createSoundtrackMidi(soundtrack, subscriber$);
      return { unsubscribe() { } };
    });
  }

   // With BehaviorSubject - not working
  public progressiveCreateSoundtrackMidiRS$(soundtrack: Soundtrack): BehaviorSubject<ProgressTask<Uint8Array>> {
    return new BehaviorSubject<ProgressTask<Uint8Array>>(this.downloadService.createProgressTask<Uint8Array>(soundtrack.getNbNotes(), 0));
  }

  private interval(period: number): Observable<number> {
    return new Observable((subscriber$: Subscriber<number>) => {
      let i = 0;
      const handler = setInterval(() => subscriber$.next(i++), period);
      return () => clearInterval(handler);
    });
  }

  public createSoundtrackMidiFake(soundtrack: Soundtrack, progressTask$?: Subscriber<ProgressTask<Uint8Array>>): Uint8Array {
    const midi: Midi = new Midi();
    if (progressTask$) {
      for (let index: number = 0; index < 1000; index++) {
        this.commonService.sleep(10);
        progressTask$.next(this.downloadService.createProgressTask<Uint8Array>(1000, index));
      }
      progressTask$.next(this.downloadService.createProgressTask<Uint8Array>(1000, 1000));
      progressTask$.complete();
    }
    return midi.toArray();
  }

  public createSoundtrackMidi(soundtrack: Soundtrack, progressTask$?: BehaviorSubject<ProgressTask<Uint8Array>>): Uint8Array {
    const midi: Midi = new Midi();
    asyncScheduler.schedule(() => {
    midi.name = soundtrack.name;
    midi.header.name = soundtrack.name;
    let noteIndex: number = 0;
    if (soundtrack.hasTracks()) {
      soundtrack.tracks.forEach((track: Track) => {
        const midiTrack: any = midi.addTrack();
        midiTrack.name = track.name;
        midiTrack.channel = track.channel;
        if (track.hasMeasures()) {
          let totalDurationInSeconds: number = 0;
          for (const measure of track.getSortedMeasures()) {
            if (measure.placedChords) {
              if (!this.notationService.isOnlyEndOfTrackChords(measure.placedChords)) {
                for (const placedChord of measure.placedChords) {
                  if (!this.notationService.isEndOfTrackPlacedChord(placedChord)) {
                    const duration: string = placedChord.renderDuration();
                    const durationInSeconds: number = Tone.Time(duration).toSeconds();
                    const velocity: number = placedChord.velocity;
                    // const tempoInMicroSecondsPerBeat: number = this.beatsToMicroSeconds(1, measure.getTempo());
                    // const ticks: number = this.beatsToTicks(durationInBeats, DEFAULT_MIDI_PPQ, tempoInMicroSecondsPerBeat);
                    for (const note of placedChord.notes) {
                      if (!this.notationService.isEndOfTrackNote(note)) {
                        if (progressTask$) {
                          this.commonService.sleep(50); // TODO Remove this sleep when the download progress is okay
                          progressTask$.next(this.downloadService.createProgressTask<Uint8Array>(soundtrack.getNbNotes(), noteIndex));
                          console.log('Added note ' + noteIndex);
                        }
                        noteIndex++;
                        midiTrack.addNote({
                          midi: this.synthService.textToMidiNote(note.renderIntlChromaOctave()),
                          time: totalDurationInSeconds,
                          // ticks: ticks,
                          name: note.renderIntlChromaOctave(),
                          pitch: note.renderChroma(),
                          octave: note.renderOctave(),
                          velocity: velocity,
                          duration: durationInSeconds
                        });
                      }
                    }
                  totalDurationInSeconds += durationInSeconds;
                  }
                }
              }
            }
          }
        }
        if (track.controls) {
          track.controls.forEach((control: Control) => {
            if (progressTask$) {
              // TODO Add progress
            }
            midiTrack
              .addCC({
                number: control.cc,
                time: control.time,
                ticks: control.ticks,
                value: control.value
              });
          });
        }
      });
    }
    if (progressTask$) {
      progressTask$.next(this.downloadService.createProgressTask<Uint8Array>(soundtrack.getNbNotes(), soundtrack.getNbNotes(), midi.toArray()));
      progressTask$.complete();
    }
    }, 0);
    return midi.toArray();
  }

}
