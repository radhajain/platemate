import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import { defineConfig } from 'eslint/config';

export default defineConfig([
	{
		// Global ignores must be in their own object at the top
		ignores: [
			'.next/*',
			'out/*',
			'dist/*',
			'build/*',
			'coverage/*',
			'node_modules/*',
			'scripts/*.js',
		],
	},
	{
		files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
		plugins: { js },
		extends: ['js/recommended'],
		languageOptions: { globals: globals.browser },
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	pluginReact.configs.flat.recommended,
	pluginReact.configs.flat['jsx-runtime'],
	{
		settings: {
			react: {
				version: 'detect', // Best practice to avoid version warnings
			},
		},
	},
]);
