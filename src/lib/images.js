const IMAGE_BASE_URL = "https://cdn.warframestat.us/img/";

export const imageUrl = (imageName) => `${IMAGE_BASE_URL}${imageName}`;

export const DUCAT_ICON = imageUrl("Ducat.png");

// The in-game platinum icon; the item data has no image for it, so it ships with the app.
export const PLATINUM_ICON = "/icons/platinum.webp";
