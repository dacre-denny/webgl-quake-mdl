(() => {
  const template = document.createElement("template");
  template.innerHTML = `
<style>

section {
    margin: 0 0 1rem 0;
}

h4 {
  cursor:pointer;
  margin:0;
  display:flex;
  flex-direction:row;
  align-items:center;
  gap:.75rem;
}

h4::before {
  content:'';
  display:block;
  
  width:.3rem;
  height:.3rem;

  transform: translateY(-0.05rem) rotate(-45deg);
  transition: border-color 0.3s, transform 0.3s;

  border:.2rem solid var(--color-selected);
  border-left:none;
  border-top:none;
}

h4:hover::before {
  border-color:var(--color);
}

div {
  display:none;
}

.open div {
  display:flex;
  flex-direction:column;
  gap:10px;
}

.open h4::before {
  transform:rotate(45deg) translateY(-0.15rem);
}

</style>
<section>
    <h4></h4>
    <div>
      <slot></slot>
    </div>
</section>`;

  customElements.define(
    "ui-section",
    class UiSection extends HTMLElement {
      constructor() {
        super();

        const shadow = this.attachShadow({ mode: "open" });
        const element = template.content.cloneNode(true);

        shadow.appendChild(element);

        const section = shadow.querySelector("section");
        section.classList.toggle("open", true);

        const openTextContent = this.attributes["open"]?.textContent;
        const open = openTextContent === "" || openTextContent === "true";

        section.classList.toggle("open", open);

        const label = shadow.querySelector("h4");
        label.textContent = `${this.getAttribute("label") ?? ""}`;
        label.addEventListener("click", () => {
          section.classList.toggle("open");
        });
      }
    }
  );
})();
