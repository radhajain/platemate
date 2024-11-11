import * as React from 'react';

export type UseSetReturn<T> = {
	value: Set<T>;
	add: (value: T) => void;
	remove: (value: T) => void;
	toggle: (value: T) => void;
};
export function useSet<T>(initialValues: T[] = []): UseSetReturn<T> {
	const [value, setValue] = React.useState(new Set(initialValues));

	const add = React.useCallback((value: T) => {
		setValue((prevSet) => new Set(prevSet).add(value));
	}, []);

	const remove = React.useCallback((value: T) => {
		setValue((prevSet) => {
			const newSet = new Set(prevSet);
			newSet.delete(value);
			return newSet;
		});
	}, []);

	const toggle = React.useCallback((value: T) => {
		setValue((prevSet) => {
			const newSet = new Set(prevSet);
			if (newSet.has(value)) {
				newSet.delete(value);
			} else {
				newSet.add(value);
			}
			return newSet;
		});
	}, []);

	return { value, add, remove, toggle };
}
