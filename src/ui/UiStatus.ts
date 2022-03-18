const template = document.createElement("template");
template.innerHTML = `
<style>

div {
  z-index: 1;
  top: 1rem;
  right: 1rem;
  
  position: fixed;

  color:var(--color);
  background:var(--background);

  padding:.25rem .75rem;
  border-radius:0.25rem;

  display:flex;
  flex-direction:row;
  align-items:center;
  
  display:none;
}

.visible {
  display:flex;
}

</style>
<div></div>`;

export class UiStatus extends HTMLElement {
  public static Bind(name: string) {
    const element = document.querySelector(`ui-status[name="${name}"]`);
    if (!(element instanceof UiStatus)) {
      throw new Error();
    }

    return element;
  }

  public static Update(name: string, content: string | null) {
    const element = document.querySelector(`ui-status[name="${name}"]`);
    if (!(element instanceof UiStatus)) {
      throw new Error();
    }

    element.htmlContent = content;

    return element;
  }

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });
    const element = template.content.cloneNode(true);

    shadow.appendChild(element);

    const div = shadow.querySelector("div");
    div.classList.add("visible");
  }

  set htmlContent(html: string | null) {
    const div = this.shadowRoot.querySelector("div");
    if (div) {
      if (html) {
        div.innerHTML = html;
        div.classList.add("visible");
      } else {
        div.classList.remove("visible");
      }
    }
  }
}

(() => {
  customElements.define("ui-status", UiStatus);
})();
