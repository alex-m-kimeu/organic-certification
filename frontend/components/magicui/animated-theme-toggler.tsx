'use client';

import { MdOutlineDarkMode, MdOutlineLightMode } from 'react-icons/md';
import { useRef, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { flushSync } from 'react-dom';
import { cn } from '@/lib/utils';

type props = {
	className?: string;
};

export const AnimatedThemeToggler = ({ className }: props) => {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const buttonRef = useRef<HTMLButtonElement | null>(null);

	useEffect(() => {
		setMounted(true);
	}, []);

	const changeTheme = async () => {
		if (!buttonRef.current) {
			return;
		}

		const newTheme = theme === 'dark' ? 'light' : 'dark';

		await document.startViewTransition(() => {
			flushSync(() => {
				setTheme(newTheme);
			});
		}).ready;

		const { top, left, width, height } = buttonRef.current.getBoundingClientRect();
		const y = top + height / 2;
		const x = left + width / 2;

		const right = window.innerWidth - left;
		const bottom = window.innerHeight - top;
		const maxRad = Math.hypot(Math.max(left, right), Math.max(top, bottom));

		document.documentElement.animate(
			{
				clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxRad}px at ${x}px ${y}px)`],
			},
			{
				duration: 700,
				easing: 'ease-in-out',
				pseudoElement: '::view-transition-new(root)',
			},
		);
	};

	// Show a neutral state until mounted
	if (!mounted) {
		return (
			<button ref={buttonRef} className={cn(className)} disabled>
				<div className='h-6 w-6' />
			</button>
		);
	}

	return (
		<button
			ref={buttonRef}
			onClick={changeTheme}
			className={cn(className)}
			aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
			title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
		>
			{theme === 'dark' ? (
				<MdOutlineLightMode className='text-text-muted size-5' />
			) : (
				<MdOutlineDarkMode className='text-text-muted size-5' />
			)}
		</button>
	);
};
