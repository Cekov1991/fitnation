/**
 * Custom hook for managing PWA "Add to Home Screen" functionality
 * 
 * This hook now delegates to the InstallPromptContext which sets up the
 * beforeinstallprompt event listener at the app level, ensuring it captures
 * the event regardless of which page is active.
 * 
 * The event listener is set up once when the app initializes, so components
 * can access the install state even if they mount after the event has fired.
 */
export { useInstallPrompt } from '../contexts/InstallPromptContext';
