import { Injectable, Injector, Inject } from '@angular/core';
import { Overlay, OverlayRef, GlobalPositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal, PortalInjector } from '@angular/cdk/portal';
import { ToastComponent } from './toast.component';
import { ToastData, TOAST_CONFIG_TOKEN, ToastConfig } from './toast-config';
import { ToastRef } from './toast-ref';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  private lastToast!: ToastRef;

  constructor(
    private overlay: Overlay,
    private parentInjector: Injector,
    @Inject(TOAST_CONFIG_TOKEN) private toastConfig: ToastConfig
  ) { }

  public show(data: ToastData): ToastRef {
    const positionStrategy: any = this.getPositionStrategy();
    const overlayRef: OverlayRef = this.overlay.create({ positionStrategy });
    const toastRef: ToastRef = new ToastRef(overlayRef);
    this.lastToast = toastRef;
    const injector: PortalInjector = this.getInjector(data, toastRef, this.parentInjector);
    const toastPortal: ComponentPortal<ToastComponent> = new ComponentPortal(ToastComponent, null, injector);
    overlayRef.attach(toastPortal);
    return toastRef;
  }

  private getPositionStrategy(): GlobalPositionStrategy {
    return this.overlay.position()
      .global()
      .top(this.getPosition())
      .right(this.toastConfig.position.right + 'px');
  }

  private getPosition(): string {
    const lastToastIsVisible: any = this.lastToast && this.lastToast.isVisible();
    const position: any = lastToastIsVisible ? this.lastToast.getPosition().bottom : this.toastConfig.position.top;
    return position + 'px';
  }

  private getInjector(data: ToastData, toastRef: ToastRef, parentInjector: Injector): PortalInjector {
    const tokens: any = new WeakMap();
    tokens.set(ToastData, data);
    tokens.set(ToastRef, toastRef);
    return new PortalInjector(parentInjector, tokens);
  }

}
