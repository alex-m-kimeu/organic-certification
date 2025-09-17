import { SideBar } from '@/components/sidebar';

export default function RootGroupLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className='flex min-h-screen'>
			<div className='fixed left-0 top-0 z-10 h-full'>
				<SideBar />
			</div>
			<main className='md:ml-66 flex-grow overflow-y-auto'>{children}</main>
		</div>
	);
}
