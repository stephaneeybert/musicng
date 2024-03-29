import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Injectable, InjectionToken, Injector } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

const KEYBOARD_EVENT_KEY_ESC: string = "Escape";

@Injectable({
  providedIn: 'root'
})
export class OverlayService {

  constructor(
    private injector: Injector,
    private overlay: Overlay
  ) { }

  public create<R = any, T = any>(left: number, top: number, inputData: T | undefined): CustomOverlayRef<R> {
    const positionStrategy = this.overlay
      .position()
      .global()
      .left(left + 'px')
      .top(top + 'px');
    const scrollStrategy = this.overlay.scrollStrategies.reposition();
    const overlayConfig = new OverlayConfig({
      positionStrategy,
      scrollStrategy,
      hasBackdrop: true,
      panelClass: ['modal', 'is-active'],
      backdropClass: 'modal-background' // "cdk-overlay-transparent-backdrop" TODO Remove
     });
     const overlayRef: OverlayRef = this.overlay.create(overlayConfig);
     return new CustomOverlayRef<R>(overlayRef, inputData);
  }

  public attach<T>(customOverlayRef: CustomOverlayRef, componentPortal: ComponentPortal<T>): void {
    if (customOverlayRef) {
      if (!customOverlayRef.hasAttached()) {
        customOverlayRef.attach<T>(componentPortal);
      }
    }
  }

  public createInjector<T>(customOverlayRef: CustomOverlayRef, dataToken: InjectionToken<T>, data: T | undefined): Injector {
    return Injector.create({
      parent: this.injector,
      providers: [
        { provide: CustomOverlayRef, useValue: customOverlayRef },
        { provide: dataToken, useValue: data },
      ]
    })
  }
}

export class CustomOverlayRef<R = any, T = any> {

  public closeEvents = new Subject<OverlayCloseEvent<R>>();

  constructor(
    private overlayRef: OverlayRef,
    private data: T
    ) {
    this.overlayRef
    .backdropClick()
    .pipe(takeUntil(this.closeEvents))
    .subscribe(() => {
      this.closeWithoutData();
    });
    this.overlayRef
    .keydownEvents()
    .subscribe((event: KeyboardEvent) => {
      if (event.key === KEYBOARD_EVENT_KEY_ESC) {
        this.closeWithoutData();
      }
    });
  }

  public getInputData(): T {
    return this.data;
  }

  public closeWithData(data: R): void {
    this.close('close', data);
  }

  public closeWithoutData(): void {
    this.close('backdropClick', undefined);
  }

  private close(type: 'backdropClick' | 'close', data: R | undefined): void {
    this.detach();
    this.closeEvents.next({
      type,
      data
     });
    this.closeEvents.complete();
  }

  public attach<T>(componentPortal: ComponentPortal<T>): void {
    this.overlayRef.attach(componentPortal);
  }

  public hasAttached(): boolean {
    if (this.overlayRef) {
      return this.overlayRef.hasAttached();
    } else {
      return false;
    }
  }

  private detach(): void {
    if (this.overlayRef) {
      if (this.overlayRef.hasAttached()) {
        this.overlayRef.detach();
        this.overlayRef.dispose();
      }
    }
  }

}

export interface OverlayCloseEvent<R> {

  type: 'backdropClick' | 'close';
  data: R | undefined;

}
