export class SettingsEdition { // TODO Why not use the existing Settings class ?

  animatedStave: boolean;
  showKeyboard: boolean;

  constructor(
    animatedStave: boolean,
    showKeyboard: boolean
    ) {
    this.animatedStave = animatedStave;
    this.showKeyboard = showKeyboard;
  }

}
