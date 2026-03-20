import { describe, it, expect } from 'vitest';
import { computeTtl } from './cache';

describe('computeTtl', () => {
	it('returns 1 hour for today', () => {
		const today = new Date().toISOString().split('T')[0];
		expect(computeTtl(today)).toBe(3600);
	});

	it('returns 4 hours for 3 days ago', () => {
		const date = new Date();
		date.setDate(date.getDate() - 3);
		expect(computeTtl(date.toISOString().split('T')[0])).toBe(14400);
	});

	it('returns 24 hours for 30 days ago', () => {
		const date = new Date();
		date.setDate(date.getDate() - 30);
		expect(computeTtl(date.toISOString().split('T')[0])).toBe(86400);
	});
});
