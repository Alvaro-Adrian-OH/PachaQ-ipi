import { renderLayout } from "./modules/layout.js";
import { handleFormSubmit } from "./modules/forms.js";
import { initializeInteractions } from "./modules/interactions.js";
import { initializeShelters } from "./modules/shelters.js";
import { initializeFirstAid } from "./modules/firstaid.js";

renderLayout();
initializeInteractions();
initializeShelters();
initializeFirstAid();
document.addEventListener("submit", handleFormSubmit);
