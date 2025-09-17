'use client';

import React from 'react';
import Link from 'next/link';
import { MdSearchOff } from 'react-icons/md';
import { Button } from '@/components/ui';

export const NotFoundContent = () => {
	const handleSurpriseClick = () => {
		const celebration = document.createElement('div');
		celebration.innerHTML = '🌿';
		celebration.style.position = 'fixed';
		celebration.style.top = '50%';
		celebration.style.left = '50%';
		celebration.style.fontSize = '1rem';
		celebration.style.pointerEvents = 'none';
		celebration.style.zIndex = '9999';
		celebration.style.transform = 'translate(-50%, -50%) translateZ(0)';
		celebration.setAttribute('aria-hidden', 'true');
		document.body.appendChild(celebration);

		setTimeout(() => {
			celebration.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
			celebration.style.transform = 'translate(-50%, -50%) translateZ(0) scale(20)';
			celebration.style.opacity = '0';
		}, 50);

		setTimeout(() => {
			if (document.body.contains(celebration)) {
				document.body.removeChild(celebration);
			}
		}, 900);
	};

	return (
		<main className='bg-background relative flex min-h-screen items-center justify-center overflow-hidden px-4 md:px-6 lg:px-8'>
			{/* Background 404 */}
			<div
				className='text-primary/6 absolute inset-0 flex select-none items-center justify-center text-[180px] font-black leading-none md:text-[220px] lg:text-[300px] xl:text-[380px]'
				aria-hidden='true'
			>
				404
			</div>

			{/* Main Content */}
			<div className='relative z-10 flex max-w-3xl flex-col items-center gap-10 text-center md:gap-16 lg:gap-20'>
				<div className='flex flex-col gap-8 md:gap-12'>
					<header className='space-y-6'>
						{/* Error Status Badge */}
						<div
							className='bg-accent t-style-caption text-text-muted inline-flex items-center gap-3 rounded-full px-6 py-2 !font-semibold'
							role='img'
							aria-label='Page not found error'
						>
							<MdSearchOff className='text-primary h-5 w-5' aria-hidden='true' />
							<span>Page Not Found</span>
						</div>

						<h1 className='t-style-h2 text-text max-w-2xl'>
							Looks like this page took a <span className='text-primary font-bold'>different route</span>
						</h1>

						<p className='t-style-body text-text-muted max-w-xl'>
							The page you&apos;re looking for seems to have strayed from the farm path. Just like in
							nature, sometimes things wander. Let&apos;s guide you back to fertile ground.
						</p>
					</header>

					{/* Action Buttons */}
					<div className='flex w-full items-center justify-center gap-4'>
						<Link href='/'>
							<Button className='t-style-link bg-primary hover:bg-primary/70 cursor-pointer px-4 py-2 text-white transition-colors duration-300'>
								Take Me Home
							</Button>
						</Link>

						<Button
							onClick={() => window.history.back()}
							className='t-style-link bg-accent text-text-muted hover:bg-primary hover:border-primary border-border cursor-pointer border px-4 py-2 transition-colors duration-300 hover:text-white'
						>
							Go Back
						</Button>
					</div>

					{/* Fun Interactive Element */}
					<div className='mt-8 text-center'>
						<p className='t-style-caption text-text-muted mb-4'>
							This page exists, it&apos;s just hiding out in the fields! 🌾
						</p>
						<button
							className='cursor-pointer select-none text-2xl transition-all duration-300 hover:scale-110 focus:scale-110'
							onClick={handleSurpriseClick}
							title='Click me for a surprise!'
							aria-label='Interactive surprise element - click for animation'
						>
							🌱
						</button>
					</div>
				</div>
			</div>
		</main>
	);
};
