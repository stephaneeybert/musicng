import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ThemeMenuOption } from './theme-menu-option';

@Component({
  selector: "app-theme-menu",
  templateUrl: "./theme-menu.component.html"
})
export class ThemeMenuComponent {

  @Input()
  themeMenuOptions?: Array<ThemeMenuOption>;

  @Output()
  themeChangeEvent: EventEmitter<string> = new EventEmitter<string>();

  changeTheme(themeId: string): void {
    this.themeChangeEvent.emit(themeId);
  }

}
