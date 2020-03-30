export class Control {

  cc: number;
  time: number;
  ticks: number;
  value: number;

  constructor(cc: number, time: number, ticks: number, value: number) {
    this.cc = cc;
    this.time = time;
    this.ticks = ticks;
    this.value = value;
  }

}
