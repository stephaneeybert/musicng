import { Injectable } from '@angular/core';
import { LocalStorageService } from '@app/core/service/local-storage.service';
import { Soundtrack } from '@app/model/soundtrack';
import { CommonService } from '@app/core/service/common.service';
import { NotationService } from '@app/lib/service/notation.service';
import { Track } from '@app/model/track';
import { Measure } from '@app/model/measure/measure';
import { Note } from '@app/model/note/note';
import { TempoUnit } from '@app/model/tempo-unit';
import { PlacedChord } from '@app/model/note/placed-chord';

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

  public deleteSoundtrack(soundtrackId: string) {
    this.delete(PREFIX + soundtrackId);
  }

  public cleanUpInstance(soundtrackJson: any): Soundtrack {
    const soundtrack: Soundtrack = new Soundtrack(this.commonService.normalizeName(name), name);
    soundtrack.id = soundtrackJson.id;
    soundtrack.name = soundtrackJson.name;
    soundtrack.copyright = soundtrackJson.copyright;
    soundtrack.lyrics = soundtrackJson.lyrics;
    soundtrack.tracks = new Array();
    if (soundtrackJson.tracks && soundtrackJson.tracks.length > 0) {
      let trackIndex: number = 0;
      soundtrackJson.tracks.forEach((trackJson: any) => {
        const track: Track = new Track(trackIndex);
        track.name = trackJson.name;
        track.displayChordNames = trackJson.displayChordNames;
        track.channel = trackJson.channel;
        track.measures = new Array();
        if (trackJson.measures && trackJson.measures.length > 0) {
          let measureIndex: number = 0;
          trackJson.measures.forEach((measureJson: any) => {
            if (measureJson.placedChords && measureJson.placedChords.length > 0) {
              if (!measureJson.tempo || !measureJson.tempo.subdivision || !this.is(measureJson.tempo.subdivision.left) || !this.is(measureJson.tempo.subdivision.right) || !measureJson.tempo.unit) {
                this.deleteSoundtrack(soundtrack.id);
                throw new Error('The measure duration subdivision or unit could not be accessed from the untyped soundtrack.');
              }
              const measureDuration: number = parseInt(measureJson.tempo.subdivision.left, 10) + parseInt(measureJson.tempo.subdivision.right, 10);
              const measure: Measure = this.notationService.createMeasure(measureIndex, measureDuration, parseInt(measureJson.timeSignature.numerator), parseInt(measureJson.timeSignature.denominator));
              measure.placedChords = new Array();
              measure.tempo = this.notationService.createDuration(measureDuration, measureJson.tempo.unit);
              measure.timeSignature = this.notationService.createTimeSignature(measureJson.timeSignature.numerator, measureJson.timeSignature.denominator);
              let placedChordIndex: number = 0;
              measureJson.placedChords.forEach((placedChordJson: any) => {
                if (placedChordJson.notes && placedChordJson.notes.length > 0) {
                  const notes: Array<Note> = new Array();
                  let noteIndex: number = 0;
                  placedChordJson.notes.forEach((noteJson: any) => {
                    if (noteJson.pitch) {
                      const note: Note = this.notationService.createNote(noteIndex, noteJson.pitch.chroma.value, noteJson.pitch.octave.value);
                      note.pitch.accidental = noteJson.pitch.accidental;
                      note.dotted = noteJson.dotted;
                      notes.push(note);
                      noteIndex++;
                    }
                  });
                  if (!placedChordJson.duration || !placedChordJson.duration.subdivision || !this.is(placedChordJson.duration.subdivision.left) || !this.is(placedChordJson.duration.subdivision.right) || !placedChordJson.duration.unit) {
                    this.deleteSoundtrack(soundtrack.id);
                    throw new Error('The placed chord duration subdivistion or unit could not be accessed from the untyped soundtrack.');
                  }
                  const duration: number = parseInt(placedChordJson.duration.subdivision.left, 10) + parseInt(placedChordJson.duration.subdivision.right, 10);
                  const tempoUnit: TempoUnit = placedChordJson.duration.unit as TempoUnit;
                  const velocity: number = parseFloat(placedChordJson.velocity);
                  const placedChord: PlacedChord = this.notationService.createPlacedChord(placedChordIndex, duration, tempoUnit, velocity, notes);
                  placedChord.dottedAll = placedChordJson.dottedAll;
                  if (!measure.placedChords) {
                    this.deleteSoundtrack(soundtrack.id);
                    throw new Error('The measure placed chords array could not be accessed from the untyped soundtrack.');
                  }
                  measure.placedChords.push(placedChord);
                  placedChordIndex++;
                }
              });
              measureIndex++;
              track.measures.push(measure);
            }
          });
        }
        trackIndex++;
        soundtrack.tracks.push(track);
      });
    }
    return soundtrack;
  }

  private is(value: any): boolean {
    return this.commonService.is(value);
  }

}
