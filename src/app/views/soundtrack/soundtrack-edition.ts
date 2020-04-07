export class SoundtrackEdition {

  id: string;
  name: string;
  copyright: string;
  lyrics: string;

  constructor(id: string, name: string, copyright: string, lyrics: string) {
    this.id = id;
    this.name = name;
    this.copyright = copyright;
    this.lyrics = lyrics;
  }

}
