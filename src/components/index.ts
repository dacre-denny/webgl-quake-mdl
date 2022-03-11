import "./UiField";
import "./UiSection";
export { UiDropZone } from "./UiDropZone";
export { UiOptions as UiRadioGroup } from "./UiOptions";
export { UiDropDown as UiSelect } from "./UiSelect";
export { UiFilePicker } from "./UiFilePicker";
export { UiStatus } from "./UiStatus";
export { UiCanvas } from "./UiCanvas";

const { style: rootStyle } = document.querySelector(":root") as HTMLElement;

rootStyle.setProperty("--color", "rgb(245, 43, 43)");
rootStyle.setProperty("--color-selected", `rgb(94, 31, 31)`);
rootStyle.setProperty("--background", `rgb(38 17 17)`);
rootStyle.setProperty("--font-family", `"Cairo", sans-serif`);
rootStyle.setProperty("--padding", `0 0.95rem`);
rootStyle.setProperty("--height", ` 2rem`);
rootStyle.setProperty("--line-height", ` 1rem`);

const { style: htmlStyle } = document.querySelector("html");

htmlStyle.fontWeight = `200`;
htmlStyle.fontFamily = `var(--font-family)`;
htmlStyle.color = `var(--color)`;
