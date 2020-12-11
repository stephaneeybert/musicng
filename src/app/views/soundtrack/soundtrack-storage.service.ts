import { Injectable } from '@angular/core';
import { Soundtrack } from '@app/model/soundtrack';
import { NotationService } from '@app/service/notation.service';
import { Track } from '@app/model/track';
import { Measure } from '@app/model/measure/measure';
import { Note } from '@app/model/note/note';
import { TempoUnit, TempoUnitType } from '@app/model/tempo-unit';
import { PlacedChord } from '@app/model/note/placed-chord';
import { CommonService, LocalStorageService } from '@stephaneeybert/lib-core';
import { Tonality } from '@app/model/note/tonality';
import { DEFAULT_CHORD_DURATION, DEFAULT_TONALITY_C_MAJOR, DEFAULT_VELOCITY_MEDIUM } from '@app/service/notation.constant ';
import { Subdivisions } from '@app/model/note/duration/subdivisions';

const PREFIX: string = 'musicng-soundtrack-';

@Injectable({
  providedIn: 'root'
})
export class SoundtrackStorageService extends LocalStorageService<Soundtrack> {

  constructor(
    private commonService: CommonService,
    private notationService: NotationService,
  ) {
    super();
  }

  public setSoundtrack(soundtrack: Soundtrack): void {
    this.set(PREFIX + soundtrack.id, soundtrack);
  }

  public getSoundtrack(soundtrackId: string): Soundtrack | null {
    return this.get(PREFIX + soundtrackId);
  }

  public getAllSoundtracks(): Array<Soundtrack> {
    return this.getAll(PREFIX);
  }

  public deleteSoundtrack(soundtrackId: string): void {
    this.delete(PREFIX + soundtrackId);
  }

  public deleteAll(): void {
    this.getAllSoundtracks().forEach((soundtrack: Soundtrack) => {
      this.deleteSoundtrack(soundtrack.id);
    });
  }

  public cleanUpInstance(soundtrackJson: any): Soundtrack {
    const soundtrack: Soundtrack = new Soundtrack(this.commonService.normalizeName(name), name);

    // The settings may end up being stored with unset properties
    if (this.commonService.isSet(soundtrackJson.id)) {
      soundtrack.id = soundtrackJson.id;
    }
    if (this.commonService.isSet(soundtrackJson.name)) {
      soundtrack.name = soundtrackJson.name;
    }
    if (this.commonService.isSet(soundtrackJson.copyright)) {
      soundtrack.copyright = soundtrackJson.copyright;
    }
    if (this.commonService.isSet(soundtrackJson.lyrics)) {
      soundtrack.lyrics = soundtrackJson.lyrics;
    }
    if (this.commonService.isSet(soundtrackJson.tracks) && soundtrackJson.tracks.length > 0) {
      for (let trackIndex: number = 0; trackIndex < soundtrackJson.tracks.length; trackIndex++) {
        const trackJson: any = soundtrackJson.tracks[trackIndex];
        const track: Track = new Track(trackIndex);
        if (this.commonService.isSet(trackJson.name)) {
          track.name = trackJson.name;
        }
        if (this.commonService.isSet(trackJson.displayChordNames)) {
          track.displayChordNames = trackJson.displayChordNames;
        }
        if (this.commonService.isSet(trackJson.channel)) {
          track.channel = Number(trackJson.channel);
        }
        track.measures = new Array();
        if (this.commonService.isSet(trackJson.measures) && trackJson.measures.length > 0) {
          for (let measureIndex: number = 0; measureIndex < trackJson.measures.length; measureIndex++) {
            const measureJson: any = trackJson.measures[measureIndex];
            if (measureJson.placedChords && measureJson.placedChords.length > 0) {
              if (this.commonService.isSet(measureJson.tempo) && this.commonService.isSet(measureJson.tempo)) {
                const measureDurationInBpm: number = Number(measureJson.tempo);
                if (this.commonService.isSet(measureJson.timeSignature) && this.commonService.isSet(measureJson.timeSignature.numerator) && this.commonService.isSet(measureJson.timeSignature.denominator)) {
                  const measure: Measure = this.notationService.createMeasure(measureIndex, measureDurationInBpm, Number(measureJson.timeSignature.numerator), Number(measureJson.timeSignature.denominator));
                  if (this.commonService.isSet(measureJson.tempo)) {
                    measure.tempo = measureDurationInBpm;
                  }
                  measure.timeSignature = this.notationService.createTimeSignature(Number(measureJson.timeSignature.numerator), Number(measureJson.timeSignature.denominator));
                  measure.placedChords = new Array();
                  if (this.commonService.isSet(measureJson.placedChords) && measureJson.placedChords.length > 0) {
                    for (let placedChordIndex: number = 0; placedChordIndex < measureJson.placedChords.length; placedChordIndex++) {
                      const placedChordJson: any = measureJson.placedChords[placedChordIndex];
                      if (this.commonService.isSet(placedChordJson.notes) && placedChordJson.notes.length > 0) {
                        const notes: Array<Note> = new Array();
                        for (let noteIndex: number = 0; noteIndex < placedChordJson.notes.length; noteIndex++) {
                          const noteJson: any = placedChordJson.notes[noteIndex];
                          if (this.commonService.isSet(noteJson.pitch) && this.commonService.isSet(noteJson.pitch.chroma) && this.commonService.isSet(noteJson.pitch.chroma.value) && this.commonService.isSet(noteJson.pitch.octave) && this.commonService.isSet(noteJson.pitch.octave.value)) {
                            const note: Note = this.notationService.createNote(noteIndex, noteJson.pitch.chroma.value, Number(noteJson.pitch.octave.value));
                            if (this.commonService.isSet(noteJson.pitch.accidental)) {
                              note.pitch.accidental = noteJson.pitch.accidental;
                            }
                            if (this.commonService.isSet(noteJson.dotted)) {
                              note.dotted = noteJson.dotted;
                            }
                            notes.push(note);
                          }
                        }
                        let durationInBeats: number;
                        if (this.commonService.isSet(placedChordJson.duration) && this.commonService.isSet(placedChordJson.duration.value)) {
                          durationInBeats = Number(placedChordJson.duration.value);
                        } else {
                          durationInBeats = DEFAULT_CHORD_DURATION;
                        }
                        let tempoUnit: TempoUnitType;
                        if (this.commonService.isSet(placedChordJson.duration) && this.commonService.isSet(placedChordJson.duration.unit)) {
                          tempoUnit = placedChordJson.duration.unit as TempoUnitType;
                        } else {
                          tempoUnit = TempoUnit.NOTE;
                        }
                        let velocity: number;
                        if (this.commonService.isSet(placedChordJson.velocity)) {
                          velocity = parseFloat(placedChordJson.velocity);
                        } else {
                          velocity = DEFAULT_VELOCITY_MEDIUM;
                        }
                        let tonality: Tonality;
                        if (this.commonService.isSet(placedChordJson.tonality) && this.commonService.isSet(placedChordJson.tonality.range) && this.commonService.isSet(placedChordJson.tonality.firstChroma)) {
                          tonality = new Tonality(Number(placedChordJson.tonality.range), placedChordJson.tonality.firstChroma);
                        } else {
                          tonality = DEFAULT_TONALITY_C_MAJOR;
                        }
                        const placedChord: PlacedChord = this.notationService.createPlacedChord(placedChordIndex, durationInBeats, tempoUnit, velocity, tonality, notes);
                        placedChord.dottedAll = placedChordJson.dottedAll;
                        if (measure.placedChords) {
                          measure.placedChords.push(placedChord);
                        }
                      }
                    }
                  }
                  track.measures.push(measure);
                }
              }
            }
          }
        }
        soundtrack.tracks.push(track);
      }
    }
    return soundtrack;
  }

  private is(value: any): boolean {
    return this.commonService.is(value);
  }

}
