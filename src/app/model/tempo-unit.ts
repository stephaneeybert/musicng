export enum TempoUnit {

  HERTZ = 'hz',
  TICK = 'i',
  SECOND = 's',
  NOTE = 'n',
  TRIPLET = 't',
  MEASURE = 'm'

}

export type TempoUnitType = 'number' | 's' | 'n' | 't' | 'm' | 'i' | 'hz' | 'tr' | 'samples' | undefined;