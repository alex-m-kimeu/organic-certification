import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import '@/styles/globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';

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
				<ThemeProvider attribute='class' defaultTheme='light' enableSystem>
					<main>{children}</main>
					<Toaster />
				</ThemeProvider>
			</body>
		</html>
	);
}
