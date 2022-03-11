(() => {
  const template = document.createElement("template");
  template.innerHTML = `
<style>

div {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin: 0 0 .5rem 0;
    gap:10px;
}

label {
    font-size: small;
    text-transform: uppercase;
    color:#fff;
    
    line-height:1;
    min-width: 5rem;
}
</style>

<div>
    <label></label>
    <slot></slot>
</div>`;

  customElements.define(
    "ui-field",
    class extends HTMLElement {
      constructor() {
        super();

        const shadow = this.attachShadow({ mode: "open" });
        const element = template.content.cloneNode(true);

        shadow.appendChild(element);

        const label = shadow.querySelector("label");

        label.textContent = `${this.getAttribute("label") ?? ""}`;
      }
    }
  );
})();
