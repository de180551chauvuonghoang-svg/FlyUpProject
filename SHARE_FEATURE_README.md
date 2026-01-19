# Share Website Feature Documentation

## Overview

The **Share Website Feature** allows users to easily share the current page URL with others. It provides two main methods for sharing:
1. **QR Code**: Generates a scannable QR code that links directly to the current page.
2. **Copy Link**: A convenient button to copy the current URL to the clipboard.

## How It Works

### 1. User Interaction

- Users click the **Share** button (icon: `Share2`) located in the website's header.
- This action opens a modal overlay (`ShareModal`).

### 2. Share Modal

The modal displays:
- **QR Code**: A dynamic QR code generated using the current page's URL (`window.location.href`).
- **URL Display**: The text of the current URL.
- **Copy Button**: A button that, when clicked, copies the URL to the user's clipboard and provides visual feedback ("Copied").

### 3. Closing the Modal

- Users can close the modal by clicking the **X** button, clicking on the backdrop, or pressing the `Esc` key (handled by standard modal behavior if configured, currently click interactions).

## Code Structure & Explanation

### `ShareModal.jsx`

This is the core component that handles the UI and logic for sharing.

- **Dependencies**:
  - `qrcode.react`: Library used to generate the SVG QR code.
  - `framer-motion`: Handles the fade-in and scale-in animations for a smooth user experience.
  - `lucide-react`: Provides the icons (`Copy`, `Check`, `X`, `Share2`).

- **Logic**:
  - **State**:
    - `copied`: Boolean state to toggle the button text between "Copy" and "Copied" for 2 seconds after clicking.
  - **`currentUrl`**: Derived directly from `window.location.href` to ensure it captures the client-side URL correctly.
  - **`handleCopy`**: An async function that uses `navigator.clipboard.writeText(currentUrl)` to copy the link. It handles errors gracefully.
  - **Portals**: The modal is rendered using `ReactDOM.createPortal` attached to `document.body` to ensure it overlays all other content correctly, unaffected by the parent component's z-index or overflow settings.

### `Header.jsx`

The header component was updated to include the entry point for the share feature.

- **Integration**:
  - Imported `ShareModal` and `Share2` icon.
  - Added state `isShareModalOpen` to control the visibility of the modal.
  - Added a button with the `Share2` icon in the navigation bar. clicking it sets `isShareModalOpen(true)`.
  - Rendered `<ShareModal />` at the end of the component, passing the `isOpen` state and an `onClose` handler to close it.

## Technical Details

- **Styling**: Built with Tailwind CSS, utilizing `backdrop-blur` and semi-transparent backgrounds to match the site's "glassmorphism" aesthetic.
- **Dark Mode**: The design primarily supports dark mode, consistent with the rest of the application.
