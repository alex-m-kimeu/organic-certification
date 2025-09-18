'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
	const { theme = 'system' } = useTheme();

	return (
		<Sonner
			theme={theme as ToasterProps['theme']}
			className='toaster group'
			toastOptions={{
				classNames: {
					toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:rounded-xl group-[.toaster]:backdrop-blur-md group-[.toaster]:border t-style-link group-[.toaster]:transition-all group-[.toaster]:duration-300 group-[.toaster]:ease-out group-[.toaster]:p-4 group-[.toaster]:min-h-10',
					description: 'group-[.toast]:text-text-muted group-[.toast]:t-style-caption',
					actionButton:
						'group-[.toast]:bg-primary group-[.toast]:text-background group-[.toast]:hover:bg-primary/90 group-[.toast]:transition-all group-[.toast]:duration-200 group-[.toast]:rounded group-[.toast]:px-3 group-[.toast]:py-1 group-[.toast]:t-style-caption group-[.toast]:font-medium cursor-pointer',
					cancelButton:
						'group-[.toast]:absolute group-[.toast]:right-2 group-[.toast]:top-2 group-[.toast]:text-text-muted group-[.toast]:hover:text-text group-[.toast]:transition-colors group-[.toast]:duration-200 group-[.toast]:bg-transparent group-[.toast]:border-none group-[.toast]:p-1 cursor-pointer',
					success:
						'group-[.toaster]:bg-background group-[.toaster]:text-primary group-[.toaster]:border-primary/30',
					error: 'group-[.toaster]:bg-background group-[.toaster]:text-red-600 group-[.toaster]:border-red-300 dark:group-[.toaster]:text-red-400 dark:group-[.toaster]:border-red-700/50',
					warning:
						'group-[.toaster]:bg-background group-[.toaster]:text-yellow-600 group-[.toaster]:border-yellow-300 dark:group-[.toaster]:text-yellow-400 dark:group-[.toaster]:border-yellow-700/50',
					info: 'group-[.toaster]:bg-background group-[.toaster]:text-primary group-[.toaster]:border-primary/30',
				},
			}}
			position='bottom-right'
			offset={16}
			duration={4000}
			richColors
			closeButton
			expand
			visibleToasts={5}
			style={
				{
					'--normal-bg': 'var(--background)',
					'--normal-border': 'var(--border)',
					'--normal-text': 'var(--text)',
					'--success-bg': 'var(--background)',
					'--success-border': 'var(--primary)',
					'--success-text': 'var(--primary)',
					'--error-bg': 'var(--background)',
					'--error-border': 'rgb(220 38 38)',
					'--error-text': 'rgb(220 38 38)',
					'--warning-bg': 'var(--background)',
					'--warning-border': 'rgb(202 138 4)',
					'--warning-text': 'rgb(202 138 4)',
					'--info-bg': 'var(--background)',
					'--info-border': 'var(--primary)',
					'--info-text': 'var(--primary)',
				} as React.CSSProperties
			}
			{...props}
		/>
	);
};

export { Toaster };
