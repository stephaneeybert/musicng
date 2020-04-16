import { parse, stringify } from 'flatted';

export abstract class LocalStorageService<T> {

  private stringify(value: T): string {
    return stringify(value);
  }

  private parse(value: string): T | null {
    try {
      return parse(value);
    } catch (e) {
      return null;
    }
  }

  protected set(key: string, item: T): void {
    localStorage.setItem(key, this.stringify(item));
  }

  protected get(key: string): T | null {
    const value: string | null = localStorage.getItem(key);
    return value ? this.parse(value) : null;
  }

  protected getAll(prefix: string): Array<T> {
    const items: Array<T> = new Array();
    for (let i: number = 0; i < localStorage.length; i++) {
      const key: string | null = localStorage.key(i);
      if (key && key.includes(prefix)) {
        const value: T | null = this.get(key);
        if (value) {
          items.push(value);
        }
      }
    }
    return items;
  }

  protected delete(key: string): void {
    localStorage.removeItem(key);
  }

  public deleteAll(): void {
    localStorage.clear();
  }

  public hasLocalStorage(): boolean {
    return window.localStorage != null;
  }

  public isEmpty(): boolean {
    return localStorage.length === 0;
  }

}
