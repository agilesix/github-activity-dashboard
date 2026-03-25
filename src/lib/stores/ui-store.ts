import { atom } from 'nanostores';

// =======================================================================
// Atoms
// =======================================================================

export const menuOpen = atom(false);
export const copyFeedback = atom(false);
export const stickyVisible = atom(false);

// =======================================================================
// Actions
// =======================================================================

export function toggleMenu() {
	menuOpen.set(!menuOpen.get());
}

export function closeMenu() {
	menuOpen.set(false);
}

export function showCopyFeedback() {
	copyFeedback.set(true);
	setTimeout(() => copyFeedback.set(false), 2000);
}

export function setStickyVisible(visible: boolean) {
	stickyVisible.set(visible);
}
