import * as React from 'react';

type ButtonVariant = 'primary' | 'primary-filled' | 'icon' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	isLoading?: boolean;
	children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
	primary: 'btn-primary',
	'primary-filled': 'btn-primary-filled',
	icon: 'btn-icon',
	ghost:
		'px-4 py-2 text-charcoal hover:text-primary transition-colors duration-200',
};

export function Button({
	variant = 'primary',
	isLoading = false,
	children,
	className = '',
	disabled,
	...props
}: ButtonProps) {
	return (
		<button
			className={`${variantClasses[variant]} ${className} ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
			disabled={disabled || isLoading}
			{...props}
		>
			{isLoading ? (
				<span className="flex items-center gap-2">
					<svg
						className="animate-spin h-4 w-4"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						/>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						/>
					</svg>
					Loading...
				</span>
			) : (
				children
			)}
		</button>
	);
}

interface IconButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	icon: React.ReactNode;
	label: string;
}

export function IconButton({
	icon,
	label,
	className = '',
	...props
}: IconButtonProps) {
	return (
		<button
			className={`btn-icon ${className}`}
			aria-label={label}
			title={label}
			{...props}
		>
			{icon}
		</button>
	);
}

export function PlusIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<line x1="12" y1="5" x2="12" y2="19" />
			<line x1="5" y1="12" x2="19" y2="12" />
		</svg>
	);
}

export function CheckIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<polyline points="20 6 9 17 4 12" />
		</svg>
	);
}
