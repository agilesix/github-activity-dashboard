import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
	menuOpen,
	copyFeedback,
	stickyVisible,
	toggleMenu,
	closeMenu,
	showCopyFeedback,
	setStickyVisible
} from './ui-store';

describe('ui-store', () => {
	beforeEach(() => {
		menuOpen.set(false);
		copyFeedback.set(false);
		stickyVisible.set(false);
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('toggleMenu toggles menuOpen', () => {
		expect(menuOpen.get()).toBe(false);
		toggleMenu();
		expect(menuOpen.get()).toBe(true);
		toggleMenu();
		expect(menuOpen.get()).toBe(false);
	});

	it('closeMenu sets menuOpen to false', () => {
		menuOpen.set(true);
		closeMenu();
		expect(menuOpen.get()).toBe(false);
	});

	it('showCopyFeedback sets true then resets after 2s', () => {
		showCopyFeedback();
		expect(copyFeedback.get()).toBe(true);

		vi.advanceTimersByTime(1999);
		expect(copyFeedback.get()).toBe(true);

		vi.advanceTimersByTime(1);
		expect(copyFeedback.get()).toBe(false);
	});

	it('setStickyVisible updates stickyVisible', () => {
		setStickyVisible(true);
		expect(stickyVisible.get()).toBe(true);
		setStickyVisible(false);
		expect(stickyVisible.get()).toBe(false);
	});
});
