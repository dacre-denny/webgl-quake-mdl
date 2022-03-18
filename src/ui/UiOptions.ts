const template = document.createElement("template");
template.innerHTML = `
<style>
input {
display:none;
}
label {
cursor: pointer;
font-weight: 100;
font-size: small; 

line-height: var(--line-height);
padding: var(--padding);

background: var(--background);

border:1px solid rgb(94, 31, 31);
border-right: none;

display:flex;
align-items:center;
height:var(--height);
box-sizing:border-box;
}



input:checked + label {
background: rgb(94, 31, 31); 
} 

input:first-child + label {
  border-top-left-radius:0.25rem;
  border-bottom-left-radius:0.25rem;
}

label:last-child {
  border-top-right-radius:0.25rem;
  border-bottom-right-radius:0.25rem;
  border-right:1px solid rgb(94, 31, 31);
}

label {
  text-transform:uppercase;
  flex:1;
}

div {
  display:flex;
  flex-direction:row;
  align-items:center;
}


label:hover {
  opacity:0.9;
}

</style>

<div>  
</div>

`;

export interface Item {
  label: string;
  value: any; //string;
}

export type Items = Array<Item>;

export class UiOptions extends HTMLElement {
  private _items: Items;
  private _selected: Item | null;

  public static Bind(
    name: string,
    options: Items,
    onChange: (item: Item) => void,
    value: any
  ): UiOptions {
    const element = document.querySelector(`ui-options[name="${name}"]`);

    if (!(element instanceof UiOptions)) {
      throw new Error();
    }

    element.items = options;

    element.value = value;

    element.addEventListener("change", () => onChange(element.selected));

    return element;
  }

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });

    const element = template.content.cloneNode(true);
    shadow.appendChild(element);

    this._items = [];
    this._selected = null;
  }

  set value(value: any) {
    const item = this.items.find((item) => item.value === value) ?? null;
    if (item) {
      this.selected = item;
    }
  }

  get value() {
    return this.selected?.value ?? null;
  }

  set selected(value: Item) {
    for (const input of this.shadowRoot.querySelectorAll("input")) {
      if (input.value === value.value) {
        input.checked = true;
        this._selected = value;
      } else {
        input.checked = false;
      }
    }
  }

  get selected() {
    return this._selected;
  }

  set items(value: Items) {
    this._items = value;

    const div = this.shadowRoot.querySelector("div");

    for (const child of div.querySelectorAll("*")) {
      child.remove();
    }

    let i = 0;

    for (const item of value) {
      const input = document.createElement("input");
      const label = document.createElement("label");
      const optionId = `${name}${i}`;

      input.value = item.value ?? null;
      input.type = "radio";
      input.name = `${Math.random()}`;
      input.id = optionId;
      input.addEventListener("click", () => {
        this.selected = item;
        this.dispatchEvent(new CustomEvent("change"));
      });

      label.textContent = `${item.label ?? ""}`;
      label.htmlFor = optionId;

      div.append(input);
      div.append(label);

      i++;
    }

    this.selected = this.items[0] ?? null;
  }

  get items() {
    return this._items;
  }
}

(() => {
  customElements.define("ui-options", UiOptions);
})();
