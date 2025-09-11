import { dirname } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
	baseDirectory: __dirname,
});

const eslintConfig = [
	// Global ignores
	{
		ignores: [
			'**/dist/**',
			'**/out/**',
			'**/.next/**',
			'**/node_modules/**',
			'**/.git/**',
			'**/coverage/**',
			'**/.nyc_output/**',
			'**/build/**',
			'**/.vercel/**',
			'**/*.d.ts',
			'next-env.d.ts',
			'package.json',
			'package-lock.json',
			'.prettierrc',
			'.prettierignore',
			'tsconfig.json',
			'tailwind.config.*',
			'postcss.config.*',
			'components.json',
			// Ignore all generated Next.js files
			'.next/**/*',
			'.next/static/**/*',
			'.next/types/**/*',
			'.next/server/**/*',
			'.next/cache/**/*',
			// Ignore webpack and build artifacts
			'**/*webpack*.js',
			'**/*buildManifest*.js',
			'**/*ssgManifest*.js',
			'**/polyfills.js',
			'**/*.chunk.js',
			// Ignore dotfiles by default
			'**/.*',
		],
	},
	...compat.extends('next/core-web-vitals', 'next/typescript'),
	...compat.extends('prettier'),
	{
		linterOptions: {
			reportUnusedDisableDirectives: 'warn',
		},
	},
	// Specific configuration for TypeScript declaration files
	{
		files: ['**/*.d.ts'],
		rules: {
			'@typescript-eslint/triple-slash-reference': 'off',
			'@typescript-eslint/no-empty-object-type': 'off',
			'@typescript-eslint/no-unsafe-function-type': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
			'@typescript-eslint/no-empty-function': 'off',
			'no-var': 'off',
			'prefer-rest-params': 'off',
		},
	},
	// Main configuration for source files
	{
		files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
		languageOptions: {
			globals: {
				window: 'readonly',
				document: 'readonly',
				console: 'readonly',
				localStorage: 'readonly',
				sessionStorage: 'readonly',
				fetch: 'readonly',
				URL: 'readonly',
				URLSearchParams: 'readonly',
				navigator: 'readonly',
				location: 'readonly',
				history: 'readonly',
			},
		},
		rules: {
			'no-redeclare': 'error',
			'eol-last': ['warn', 'always'],
			'newline-before-return': 'warn',
			'no-var': 'error',
			'prefer-const': 'error',

			'space-before-function-paren': 'off',
			'space-before-blocks': 'off',
			'func-call-spacing': 'off',
			'arrow-spacing': 'off',

			'for-direction': 'error',
			'getter-return': 'error',
			'no-await-in-loop': 'warn',
			'no-console': 'warn',
			'no-constant-condition': 'warn',
			'no-loss-of-precision': 'error',
			'no-promise-executor-return': 'warn',
			'no-template-curly-in-string': 'warn',
			'no-unreachable': 'warn',
			'no-unreachable-loop': 'warn',

			'class-methods-use-this': 'off',
			'consistent-return': 'off',
			curly: 'warn',
			'default-param-last': 'warn',
			'dot-notation': 'warn',
			eqeqeq: 'error',
			'grouped-accessor-pairs': 'warn',
			'no-caller': 'error',
			'no-alert': 'warn',
			'no-constructor-return': 'error',
			'no-else-return': 'warn',
			'no-empty-function': [
				'warn',
				{
					allow: ['constructors', 'arrowFunctions'],
				},
			],
			'no-eq-null': 'warn',
			'no-extend-native': 'error',
			'no-extra-bind': 'warn',
			'no-loop-func': 'warn',
			'no-multi-spaces': 'off',
			'no-return-assign': 'warn',
			'no-return-await': 'warn',
			'no-throw-literal': 'error',
			'no-unmodified-loop-condition': 'warn',
			'no-useless-concat': 'warn',
			'no-useless-escape': 'warn',
			'no-warning-comments': 'off',
			'prefer-promise-reject-errors': 'warn',
			'require-await': 'warn',
			yoda: 'warn',

			'block-spacing': 'off',
			'comma-spacing': 'off',
			'comma-style': 'off',
			'key-spacing': 'off',
			'linebreak-style': 'off',
			'lines-between-class-members': 'off',
			'new-cap': [
				'warn',
				{
					newIsCap: true,
					capIsNew: false,
					properties: false,
				},
			],
			'no-lonely-if': 'warn',
			'no-multi-assign': 'warn',
			'no-multiple-empty-lines': 'off',
			'no-negated-condition': 'warn',
			'no-unneeded-ternary': 'warn',
			'no-whitespace-before-property': 'off',
			'one-var': ['warn', 'never'],
			'one-var-declaration-per-line': 'off',
			'prefer-object-spread': 'warn',
			'semi-spacing': 'off',
			'semi-style': 'off',
			'space-unary-ops': 'off',

			// ES6 features
			'arrow-parens': 'off',
			'constructor-super': 'error',
			'no-class-assign': 'error',
			'no-confusing-arrow': 'off',
			'prefer-arrow-callback': [
				'warn',
				{
					allowNamedFunctions: true,
				},
			],
			'prefer-rest-params': 'warn',
			'prefer-spread': 'warn',
			'prefer-template': 'warn',
			'rest-spread-spacing': 'off',
			'template-curly-spacing': 'off',
			'max-depth': 'off',
			'space-infix-ops': 'off',

			// React rules
			'react/jsx-key': 'error',
			'react/no-array-index-key': 'warn',
			'react/jsx-no-duplicate-props': 'error',
			'react/jsx-no-undef': 'error',
			'react/no-direct-mutation-state': 'error',
			'react/no-typos': 'error',
			'react/require-render-return': 'error',
			'react/self-closing-comp': 'warn',
			'react/jsx-wrap-multilines': 'off',
			'react/jsx-uses-react': 'off',
			'react/react-in-jsx-scope': 'off',
			'react/prop-types': 'off',

			// Next.js specific rules
			'@next/next/no-img-element': 'warn',
			'@next/next/no-html-link-for-pages': 'warn',
			'@next/next/no-assign-module-variable': 'error',
		},
	},
	// TypeScript specific configuration
	{
		files: ['**/*.ts', '**/*.tsx'],
		languageOptions: {
			parser: (await import('@typescript-eslint/parser')).default,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
				project: path.resolve(__dirname, 'tsconfig.json'),
				tsconfigRootDir: __dirname,
			},
		},
		plugins: {
			'@typescript-eslint': (await import('@typescript-eslint/eslint-plugin')).default,
		},
		rules: {
			// TypeScript specific rules
			'@typescript-eslint/no-var-requires': 'off',
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					vars: 'all',
					args: 'after-used',
					ignoreRestSiblings: false,
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
				},
			],
			'no-use-before-define': 'off',
			'@typescript-eslint/no-use-before-define': 'off',
			'@typescript-eslint/no-empty-function': [
				'warn',
				{
					allow: ['private-constructors', 'arrowFunctions'],
				},
			],
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unsafe-function-type': 'warn',
			'@typescript-eslint/no-empty-object-type': 'warn',
			'@typescript-eslint/prefer-nullish-coalescing': 'off',
			'@typescript-eslint/prefer-optional-chain': 'warn',
			'@typescript-eslint/no-non-null-assertion': 'warn',
			'@typescript-eslint/consistent-type-imports': [
				'warn',
				{
					prefer: 'type-imports',
					disallowTypeAnnotations: false,
				},
			],
			'@typescript-eslint/ban-ts-comment': [
				'warn',
				{
					'ts-expect-error': 'allow-with-description',
					'ts-ignore': 'allow-with-description',
					'ts-nocheck': 'allow-with-description',
					'ts-check': false,
				},
			],
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
			'@typescript-eslint/no-unsafe-return': 'off',
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-unused-expressions': 'warn',
			'@typescript-eslint/array-type': ['warn', { default: 'array' }],
			'@typescript-eslint/no-duplicate-enum-values': 'error',
			'@typescript-eslint/no-empty-interface': 'warn',
			'@typescript-eslint/no-inferrable-types': 'warn',
			'@typescript-eslint/no-misused-new': 'error',
			'@typescript-eslint/no-namespace': 'warn',
			'@typescript-eslint/no-this-alias': 'warn',
			'@typescript-eslint/prefer-as-const': 'warn',
		},
	},
	// Configuration files
	{
		files: ['**/*.config.{js,ts,mjs}', '**/next.config.{js,ts,mjs}'],
		rules: {
			'@typescript-eslint/no-var-requires': 'off',
			'no-console': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
		},
	},
	// Component specific overrides
	{
		files: [
			'components/navbar/**/*.{ts,tsx}',
			'components/**/animations/**/*.{ts,tsx}',
			'components/**/*.{ts,tsx}',
		],
		rules: {
			'@typescript-eslint/ban-ts-comment': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unsafe-function-type': 'off',
		},
	},
	// Pages and app directory
	{
		files: ['app/**/*.{ts,tsx}', 'pages/**/*.{ts,tsx}'],
		rules: {
			'@next/next/no-html-link-for-pages': 'off',
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unsafe-function-type': 'warn',
		},
	},
	// Test files
	{
		files: ['**/*.test.{ts,tsx,js,jsx}', '**/*.spec.{ts,tsx,js,jsx}', '**/__tests__/**/*'],
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/ban-ts-comment': 'off',
			'no-console': 'off',
			'max-lines-per-function': 'off',
		},
	},
];

export default eslintConfig;
