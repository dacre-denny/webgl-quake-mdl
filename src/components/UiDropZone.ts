const template = document.createElement("template");
template.innerHTML = `
<style>

div {
  position: fixed;
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;

  background-color: rgba(25, 17, 38, 0.7);
  pointer-events:none;
  
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;

  display: none;
}
.active {
  display:flex;
}
</style>
<div>Drop file here</div>`;

export class UiDropZone extends HTMLElement {
  public static Bind(
    name: string,
    dropMessage: string,
    onDropped: (event: DragEvent) => void
  ) {
    const element = document.querySelector(`ui-drop-zone[name="${name}"]`);
    if (element instanceof UiDropZone) {
      element.dropMessage = dropMessage ?? "Drop file here";

      element.addEventListener("dropped", onDropped);
    }
  }

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });
    const element = template.content.cloneNode(true);
    const selector = `${this.getAttribute("target") ?? "html"}`;

    shadow.appendChild(element);

    const div = shadow.querySelector("div");
    const target = document.querySelector(selector);

    target.addEventListener("drop", (event) => {
      event.preventDefault();
      div.classList.remove("active");
      // Propagate event
      this.dispatchEvent(new DragEvent("dropped", event));
    });
    target.addEventListener("dragover", (event) => {
      event.preventDefault();
      div.classList.add("active");
    });
    target.addEventListener("dragleave", () => {
      div.classList.remove("active");
    });
  }

  get dropMessage() {
    return this.shadowRoot.querySelector("div")?.innerText ?? "";
  }

  set dropMessage(value: string) {
    const div = this.shadowRoot.querySelector("div");
    if (div) {
      div.innerText = value;
    }
  }
}

(() => {
  customElements.define("ui-drop-zone", UiDropZone);
})();
