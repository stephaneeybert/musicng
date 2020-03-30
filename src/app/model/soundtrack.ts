import { Track } from './track';
import { Measure } from './measure/measure';

export class Soundtrack {

  tracks: Array<Track>;
  id: string;
  name: string;
  copyright: string;
  text: string;
  keyboard: any;
  synth: any;

  constructor(id: string, name: string) {
    this.tracks = new Array<Track>();
    this.id = id;
    this.name = name;
    this.copyright = '';
    this.text = '';
  }

  public addTrack(measures: Array<Measure>) {
    const track: Track = new Track();
    track.measures = measures;
    this.tracks.push(track);
  }

  public hasTracks(): boolean {
    if (this.tracks != null && this.tracks.length > 0) {
      return true;
    }
    return false;
  }

  public hasNotes(): boolean {
    if (this.tracks != null && this.tracks.length > 0) {
      for (const track of this.tracks) {
        if (track.hasMeasures()) {
          for (const measure of track.measures) {
            if (measure.hasChords()) {
              for (const placedChord of measure.placedChords!) {
                if (placedChord.hasNotes()) {
                  return true;
                }
              }
            }
          }
        }
      }
    }
    return false;
  }

}
