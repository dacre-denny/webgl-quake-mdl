const template = document.createElement("template");
template.innerHTML = `
<style>
select {
  font-family: var(--font-family);
  font-size: small;
  
  line-height: var(--line-height);
  padding: var(--padding);

  border: none;
  border-radius: 0.2rem;

  background: var(--color-selected);
  color: inherit;
  outline: none;

  text-transform:uppercase;

  display:flex;
  align-items:center;
  height:var(--height);
  box-sizing:border-box;
}
</style>

<div>  
</div>`;

//TODO: dedupe
export interface Item<T> {
  label: string;
  value: T;
}

//TODO: dedupe
export type Items<T> = Array<Item<T>>;

export class UiDropDown<T> extends HTMLElement {
  private _items: Items<T>;
  private _selected: Item<T> | null;

  public static Bind<T>(
    name: string,
    onChange?: (value: T) => void,
    options?: Items<T>
  ) {
    const element = document.querySelector(`ui-dropdown[name="${name}"]`);

    if (!(element instanceof UiDropDown)) {
      throw new Error();
    }

    if (options) {
      element.items = options;
    }

    if (onChange) {
      element.addEventListener("change", () => {
        onChange(element.selected.value);
      });
    }

    return element as UiDropDown<T>;
  }

  public static Update<T>(name: string, options?: Items<T>) {
    const element = document.querySelector(`ui-dropdown[name="${name}"]`);

    if (!(element instanceof UiDropDown)) {
      throw new Error();
    }

    if (options) {
      element.items = options;
    }

    return element as UiDropDown<T>;
  }

  public static Bind_old<T>(
    element: Element | null,
    options: Items<T>,
    onChange: (item: Item<T>) => void
  ) {
    if (element instanceof UiDropDown) {
      element.addEventListener("change", () => {
        onChange(element.selected);
      });
      element.items = options;
    }
  }

  public onChange(callback: (item: T) => void) {
    const listener = () => {
      callback(this.selected.value);
    };

    this.addEventListener("change", listener);

    return () => {
      this.removeEventListener("change", listener);
    };
  }

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });

    const element = template.content.cloneNode(true);
    shadow.appendChild(element);

    this._items = [];
    this._selected = null;
  }

  set selected(value: Item<T>) {
    this._selected =
      this._items.find((item) => item.value === value.value) ?? null;
  }

  get selected() {
    return this._selected;
  }

  set items(value: Items<T>) {
    this._items = value;

    const div = this.shadowRoot.querySelector("div");

    for (const child of div.querySelectorAll("*")) {
      child.remove();
    }

    const select = document.createElement("select");
    select.addEventListener("change", (e) => {
      const optionValue = (e.currentTarget as HTMLSelectElement).value;
      const item = this._items.find(
        (item) => JSON.stringify(item.value) === optionValue
      );

      if (item) {
        this.selected = item;
      }

      this.dispatchEvent(new CustomEvent("change"));
    });

    div.append(select);

    let i = 0;

    for (const item of value) {
      const option = document.createElement("option");
      const optionId = `${name}${i}`;

      option.value = JSON.stringify(item.value ?? null);
      option.label = item.label;
      option.id = optionId;

      select.append(option);

      i++;
    }

    this.selected = this.items[0] ?? null;
  }

  get items() {
    return this._items;
  }
}

(() => {
  customElements.define("ui-dropdown", UiDropDown);
})();
