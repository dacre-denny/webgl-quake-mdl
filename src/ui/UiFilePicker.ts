const template = document.createElement("template");
template.innerHTML = `
<style>


button {
  position:relative;
  font-size: small;

  font-family: inherit;

  line-height: var(--line-height);
  padding: var(--padding);
  
  
  background: rgb(94, 31, 31); 

  color: var(--color);

  border:1px solid rgb(94, 31, 31);
  border-radius: 0.2rem;
  text-transform: uppercase;

  display:flex;
  align-items:center;
  height:var(--height);
  box-sizing:border-box;
}

input {
  display:none;
}


</style>

<button></button>
<input type="file" accept=".mdl" />

`;

export class UiFilePicker extends HTMLElement {
  private _selected: File | null;

  public static Bind(name: string, onChange?: (value: File | null) => void) {
    const element = document.querySelector(`ui-file-picker[name="${name}"]`);

    if (!(element instanceof UiFilePicker)) {
      throw new Error();
    }

    if (onChange) {
      element.addEventListener("change", () => {
        onChange(element.selected);
      });
    }

    return element;
  }

  public static Update(name: string, selected: File) {
    const element = document.querySelector(`ui-file-picker[name="${name}"]`);

    if (!(element instanceof UiFilePicker)) {
      throw new Error();
    }

    element.selected = selected;

    return element;
  }

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });

    const element = template.content.cloneNode(true);
    shadow.appendChild(element);

    const button = shadow.querySelector("button");
    const input = shadow.querySelector("input") as HTMLInputElement;
    input.addEventListener("change", (event) => {
      event.preventDefault();

      const [file] = (event.currentTarget as HTMLInputElement).files;
      if (file) {
        this.selected = file;
      } else {
        this.selected = null;
      }

      // Propagate event
      this.dispatchEvent(new Event("change", event));
    });
    button.addEventListener("click", (event) => {
      input.click();
    });

    this.selected = null;
  }

  get selected() {
    return this._selected;
  }

  set selected(value: File | null) {
    this._selected = value;

    const button = this.shadowRoot.querySelector("button");
    if (this._selected) {
      button.innerText = `${this._selected.name}`;
    } else {
      button.innerText = "Open file";
    }
  }
}

(() => {
  customElements.define("ui-file-picker", UiFilePicker);
})();
