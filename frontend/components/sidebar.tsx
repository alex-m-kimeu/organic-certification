'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AnimatedThemeToggler } from '@/components/magicui';
import Link from 'next/link';
import { FaLinkedinIn, FaXTwitter, FaInstagram } from 'react-icons/fa6';
import { MdMenu, MdClose } from 'react-icons/md';
import { PiFarmLight, PiCertificateLight, PiTractorLight, PiListChecksLight } from 'react-icons/pi';
import { usePathname } from 'next/navigation';

export const SideBar = () => {
	const pathname = usePathname();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const sidebarRef = useRef<HTMLElement>(null);
	const menuButtonRef = useRef<HTMLButtonElement>(null);

	const toggleMobileMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
	};

	const closeMobileMenu = () => {
		setIsMobileMenuOpen(false);
		menuButtonRef.current?.focus();
	};

	useEffect(() => {
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && isMobileMenuOpen) {
				closeMobileMenu();
			}
		};

		document.addEventListener('keydown', handleEscape);

		return () => document.removeEventListener('keydown', handleEscape);
	}, [isMobileMenuOpen]);

	useEffect(() => {
		if (isMobileMenuOpen) {
			const firstFocusable = sidebarRef.current?.querySelector(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
			) as HTMLElement;
			firstFocusable?.focus();
		}
	}, [isMobileMenuOpen]);

	const getLinkClasses = (href: string) => {
		const isActive = pathname === href;

		return `t-style-link flex items-center gap-2 !font-medium ${
			isActive ? 'text-primary !font-bold underline underline-offset-4' : 'text-text-muted hover:text-primary'
		}`;
	};

	return (
		<>
			{/* Mobile Menu Button */}
			<button
				ref={menuButtonRef}
				onClick={toggleMobileMenu}
				className={`bg-accent border-border fixed left-4 top-4 z-50 rounded-md border p-2 transition-opacity duration-300 md:hidden ${
					isMobileMenuOpen ? 'pointer-events-none opacity-0' : 'opacity-100'
				}`}
				aria-label='Open navigation menu'
				aria-expanded={isMobileMenuOpen}
				aria-controls='sidebar-navigation'
			>
				<MdMenu size={24} className='text-text-muted' />
			</button>

			{/* Mobile Overlay */}
			{isMobileMenuOpen && (
				<div
					className='fixed inset-0 z-40 bg-transparent md:hidden'
					onClick={closeMobileMenu}
					aria-hidden='true'
				/>
			)}

			{/* Sidebar */}
			<aside
				ref={sidebarRef}
				id='sidebar-navigation'
				className={`w-66 bg-accent fixed z-50 h-screen overflow-hidden px-6 pb-6 pt-16 transition-transform duration-300 ease-in-out md:pt-10 ${
					isMobileMenuOpen ? 'flex translate-x-0' : '-translate-x-full'
				} flex-col md:relative md:z-auto md:flex md:translate-x-0`}
				aria-hidden={isMobileMenuOpen ? 'false' : 'true'}
				aria-label='Main navigation'
			>
				{/* Close Button for Mobile */}
				<button
					onClick={closeMobileMenu}
					className={`bg-accent border-border fixed left-4 top-4 z-50 rounded-md border p-2 transition-opacity duration-300 md:hidden ${
						isMobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
					}`}
					aria-label='Close navigation menu'
				>
					<MdClose size={24} className='text-text-muted' />
				</button>

				<div className='flex min-h-0 flex-grow flex-col'>
					<div className='flex min-h-0 flex-grow flex-col space-y-10 overflow-y-auto'>
						{/* Header Section */}
						<header className='border-border/40 dark:border-border flex flex-shrink-0 flex-col space-y-2 border-b pb-6'>
							<PiFarmLight className='text-primary size-10' aria-hidden='true' />
							<h2 className='t-style-body text-primary !font-bold'>Organic Certification</h2>
							<p className='t-style-caption text-text-muted !font-semibold'>Grow. Certify. Sustain.</p>

							{/* Social Media Links */}
							<div className='mt-4 flex gap-4' role='list'>
								<a
									href='https://x.com/'
									target='_blank'
									rel='noopener noreferrer'
									aria-label='Follow us on X'
									role='listitem'
								>
									<FaXTwitter
										className='text-text-muted hover:text-primary size-4'
										aria-hidden='true'
									/>
								</a>
								<a
									href='https://www.instagram.com/'
									target='_blank'
									rel='noopener noreferrer'
									aria-label='Follow us on Instagram'
									role='listitem'
								>
									<FaInstagram
										className='text-text-muted hover:text-primary size-4'
										aria-hidden='true'
									/>
								</a>
								<a
									href='https://www.linkedin.com/in/'
									target='_blank'
									rel='noopener noreferrer'
									aria-label='Follow us on LinkedIn'
									role='listitem'
								>
									<FaLinkedinIn
										className='text-text-muted hover:text-primary size-4'
										aria-hidden='true'
									/>
								</a>
							</div>
						</header>

						{/* Main Navigation */}
						<nav aria-label='Main navigation'>
							<ul className='flex flex-col space-y-8' role='list'>
								<li>
									<Link
										href='/farmer'
										className={getLinkClasses('/farmer')}
										onClick={closeMobileMenu}
										aria-current={pathname === '/farmer' ? 'page' : undefined}
									>
										<PiTractorLight className='size-4' aria-hidden='true' />
										Farmers
									</Link>
								</li>
								<li>
									<Link
										href='/farm'
										className={getLinkClasses('/farm')}
										onClick={closeMobileMenu}
										aria-current={pathname === '/farm' ? 'page' : undefined}
									>
										<PiFarmLight className='size-4' aria-hidden='true' />
										Farms
									</Link>
								</li>
								<li>
									<Link
										href='/inspection'
										className={getLinkClasses('/inspection')}
										onClick={closeMobileMenu}
										aria-current={pathname === '/inspection' ? 'page' : undefined}
									>
										<PiListChecksLight className='size-4' aria-hidden='true' />
										Inspections
									</Link>
								</li>
								<li>
									<Link
										href='/certificate'
										className={getLinkClasses('/certificate')}
										onClick={closeMobileMenu}
										aria-current={pathname === '/certificate' ? 'page' : undefined}
									>
										<PiCertificateLight className='size-4' aria-hidden='true' />
										Certificates
									</Link>
								</li>
							</ul>
						</nav>
					</div>
				</div>

				{/* Footer */}
				<footer className='border-border/40 dark:border-border flex w-full flex-shrink-0 items-center justify-between border-t pt-4'>
					<span className='text-text-muted text-xs font-light'>
						&copy; {new Date().getFullYear()} Organic-Certification
					</span>
					<AnimatedThemeToggler className='cursor-pointer' />
				</footer>
			</aside>
		</>
	);
};
