import * as vexflow from 'vexflow';
import { Track } from './track';
import { Measure } from './measure/measure';

export class Soundtrack {

  tracks: Array<Track>;
  id: string;
  name: string;
  copyright: string;
  lyrics: string;
  keyboard: any;
  synth: any;
  nowPlaying: boolean;
  sheetContext?: vexflow.Flow.SVGContext;

  constructor(id: string, name: string) {
    this.tracks = new Array<Track>();
    this.id = id;
    this.name = name;
    this.copyright = '';
    this.lyrics = '';
    this.nowPlaying = false;
  }

  public addTrack(measures: Array<Measure>): Track {
    const track: Track = new Track(this.tracks.length);
    track.measures = measures;
    this.tracks.push(track);
    return track;
  }

  public hasTracks(): boolean {
    if (this.tracks != null && this.tracks.length > 0) {
      return true;
    }
    return false;
  }

  public getNgTracks(): number {
    return this.hasTracks() ? this.tracks.length : 0;
  }

  public getSortedTracks(): Array<Track> {
    if (this.hasTracks()) {
      return this.tracks.sort((trackA: Track, trackB: Track) => {
        return trackA.index - trackB.index;
      });
    } else {
      throw new Error('The soundtrack has no tracks');
    }
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
