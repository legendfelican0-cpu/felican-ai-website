/**
 * Live-chat handoff for the Felican AI assistant.
 *
 * Paste your tawk.to Property ID and Widget ID below and the assistant grows a
 * "Talk to a person" button. Until then the button stays hidden and visitors are
 * offered the email handoff instead — nothing breaks while this is blank.
 *
 * Find both in tawk.to → Administration → Chat Widget. The embed snippet looks
 * like https://embed.tawk.to/<propertyId>/<widgetId>.
 *
 * Note: the button only appears when an agent is actually online. An unattended
 * chat box is worse than none, so when nobody is available the assistant falls
 * back to email automatically.
 */
window.FELICAN_TAWK = {
  propertyId: '',
  widgetId: 'default',
};
