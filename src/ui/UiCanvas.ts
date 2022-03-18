const template = document.createElement("template");
template.innerHTML = `
<style>

canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

</style>
<canvas></canvas>`;

export class UiCanvas extends HTMLElement {
  public static Bind(name: string) {
    const element = document.querySelector(`ui-canvas[name="${name}"]`);

    if (!(element instanceof UiCanvas)) {
      throw new Error();
    }

    return element;
  }

  private _canvas: HTMLCanvasElement;

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });
    const element = template.content.cloneNode(true);

    shadow.appendChild(element);

    this._canvas = shadow.querySelector("canvas");
  }

  public getWebGlContext() {
    return this._canvas.getContext("webgl");
  }

  public setDimensions(width: number, height: number) {
    if (width !== this._canvas.width) {
      this._canvas.width = width;
    }

    if (height !== this._canvas.height) {
      this._canvas.height = height;
    }
  }
}

(() => {
  customElements.define("ui-canvas", UiCanvas);
})();
