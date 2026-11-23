import { renderLayout } from "./modules/layout.js";
import { handleFormSubmit } from "./modules/forms.js";
import { initializeInteractions } from "./modules/interactions.js";

renderLayout();
initializeInteractions();
document.addEventListener("submit", handleFormSubmit);
