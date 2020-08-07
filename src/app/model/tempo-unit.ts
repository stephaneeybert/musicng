export enum TempoUnit {

  HERTZ = 'hz',
  TICK = 'i',
  SECOND = 's',
  DUPLE = 'n',
  TRIPLET = 't',
  MEASURE = 'm'

}

export type TempoUnitType = 'number' | 's' | 'n' | 't' | 'm' | 'i' | 'hz' | 'tr' | 'samples' | undefined;