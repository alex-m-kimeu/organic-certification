import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import '@/styles/globals.css';

const nunito = Nunito({
	variable: '--font-nunito',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'Organic Certification',
	description:
		'Organic farm certification platform to register farmers, manage inspections, and issue PDF certificates.',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en' suppressHydrationWarning>
			<body className={`${nunito.variable} bg-background antialiased`}>
				<main>{children}</main>
			</body>
		</html>
	);
}
