import type { ReadableAtom } from 'nanostores';

export function useStore<T>(store: ReadableAtom<T>): { readonly value: T } {
	let value = $state(store.get());

	$effect(() => {
		return store.subscribe((v) => {
			value = v;
		});
	});

	return {
		get value() {
			return value;
		}
	};
}
