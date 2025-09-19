'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { NotFoundContent } from '../not-found-content';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Button,
	Avatar,
	AvatarFallback,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@/components/ui';
import { ArrowLeft, MapPin, Phone, Mail, Calendar } from 'lucide-react';
import type { Farmer } from '@/types/farmer';
import { FarmerFarmsTab } from './farmer-farms-tab';
import FarmerInspectionsTab from './farmer-inspections-tab';
import FarmerCertificatesTab from './farmer-certificates-tab';

export interface FarmerDetailsProps {
	params: Promise<{
		id: string;
	}>;
}

interface FarmerWithStats extends Farmer {
	stats: {
		totalFarms: number;
		totalFields: number;
		totalFarmArea: number;
		totalFieldArea: number;
		averageFarmSize: number;
		averageFieldSize: number;
	};
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function FarmerManagementPage({ params }: FarmerDetailsProps) {
	const router = useRouter();
	const resolvedParams = React.use(params);
	const [farmer, setFarmer] = useState<FarmerWithStats | null>(null);
	const [isNotFound, setIsNotFound] = useState(false);

	// Fetch farmer details
	const fetchFarmerDetails = useCallback(async () => {
		if (!resolvedParams.id) {
			return;
		}

		try {
			const response = await fetch(`${BASE_URL}/farmers/${resolvedParams.id}/details`);

			if (!response.ok) {
				if (response.status === 404) {
					setIsNotFound(true);

					return;
				}
				throw new Error('Failed to fetch farmer details');
			}

			const result = await response.json();
			if (result.success && result.data) {
				setFarmer(result.data);
			} else {
				throw new Error(result.message || 'Failed to fetch farmer details');
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to fetch farmer details. Please try again.';
			toast.error(errorMessage);
		}
	}, [resolvedParams.id]);

	useEffect(() => {
		fetchFarmerDetails();
	}, [fetchFarmerDetails]);

	// Format date
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	// Format phone number
	const formatPhone = (phone: string) => {
		return phone.startsWith('+254') ? phone : `+254${phone.replace(/^0+/, '')}`;
	};

	const getFarmerInitials = (farmerName: string): string => {
		if (farmerName) {
			const farmerParts = farmerName.trim().split(' ');

			if (farmerParts.length >= 2) {
				return (farmerParts[0].charAt(0) + farmerParts[farmerParts.length - 1].charAt(0)).toUpperCase();
			}
			if (farmerParts[0].length >= 2) {
				return farmerParts[0].substring(0, 2).toUpperCase();
			}

			return farmerParts[0].charAt(0).toUpperCase();
		}

		return 'FM';
	};

	if (isNotFound) {
		return <NotFoundContent />;
	}

	if (!farmer) {
		return null;
	}

	return (
		<div className='bg-background container mx-auto flex flex-col items-start gap-8 px-4 py-[72px] md:px-6 md:py-10 lg:gap-10 lg:px-8'>
			{/* Header with back button */}
			<div className='flex w-full flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
				<h1 className='text-primary t-style-h3 !font-bold'>Farmer&apos;s Details</h1>
				<Button
					onClick={() => router.push('/farmer')}
					className='t-style-link rounded-2 bg-primary hover:bg-primary/70 focus:ring-primary focus:ring-offset-background flex items-center gap-2 px-4 py-2 text-white shadow-none transition-all focus:ring-[0.5px] focus:ring-offset-2'
				>
					<ArrowLeft className='size-4' aria-hidden='true' />
					Back to Farmers
				</Button>
			</div>

			{/* Farmer Information Card */}
			<Card className='bg-background w-full border-none p-0 shadow-none'>
				<CardHeader className='grid grid-cols-2 items-center gap-6 p-0'>
					<CardTitle className='t-style-body text-text-muted dark:text-primary flex items-center gap-2 !font-semibold'>
						<Avatar className='size-15'>
							<AvatarFallback
								role='img'
								aria-label={`Avatar for ${farmer.name}`}
								className='t-style-body text-primary bg-accent !font-semibold'
							>
								{getFarmerInitials(farmer.name)}
							</AvatarFallback>
						</Avatar>
						{farmer.name}
					</CardTitle>
					<div className='grid grid-cols-1 gap-6 lg:grid-cols-4'>
						<div className='t-style-link text-text-muted flex items-center gap-2 !font-normal'>
							<MapPin className='text-primary size-3' aria-hidden='true' />
							<span>
								<span className='sr-only'>County: </span>
								{farmer.county}
							</span>
						</div>
						<div className='t-style-link text-text-muted flex items-center gap-2 !font-normal'>
							<Phone className='text-primary size-3' aria-hidden='true' />
							<span>
								<span className='sr-only'>Phone: </span>
								{formatPhone(farmer.phone)}
							</span>
						</div>
						<div className='t-style-link text-text-muted flex items-center gap-2 !font-normal'>
							<Mail className='text-primary size-3' aria-hidden='true' />
							<span className='max-w-[200px] truncate'>
								<span className='sr-only'>Email: </span>
								{farmer.email}
							</span>
						</div>
						{farmer.createdAt && (
							<div className='t-style-link text-text-muted flex items-center gap-2 !font-normal'>
								<Calendar className='text-primary size-3' aria-hidden='true' />
								<span>
									<span className='sr-only'>Registered on: </span>
									{formatDate(farmer.createdAt)}
								</span>
							</div>
						)}
					</div>
				</CardHeader>

				<CardContent className='px-0'>
					{/* Statistics */}
					<div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6'>
						<div className='bg-accent rounded-lg p-4 text-center'>
							<div className='text-primary text-2xl font-bold'>{farmer.stats.totalFarms}</div>
							<div className='t-style-caption text-text-muted !font-normal'>Farms</div>
						</div>
						<div className='bg-accent rounded-lg p-4 text-center'>
							<div className='text-primary text-2xl font-bold'>{farmer.stats.totalFields}</div>
							<div className='t-style-caption text-text-muted !font-normal'>Fields</div>
						</div>
						<div className='bg-accent rounded-lg p-4 text-center'>
							<div className='text-primary text-2xl font-bold'>
								{farmer.stats.totalFarmArea.toFixed(2)}
							</div>
							<div className='t-style-caption text-text-muted !font-normal'>Farm Area (ha)</div>
						</div>
						<div className='bg-accent rounded-lg p-4 text-center'>
							<div className='text-primary text-2xl font-bold'>
								{farmer.stats.totalFieldArea.toFixed(2)}
							</div>
							<div className='t-style-caption text-text-muted !font-normal'>Field Area (ha)</div>
						</div>
						<div className='bg-accent rounded-lg p-4 text-center'>
							<div className='text-primary text-2xl font-bold'>
								{farmer.stats.averageFarmSize.toFixed(2)}
							</div>
							<div className='t-style-caption text-text-muted !font-normal'>Avg Farm Size (ha)</div>
						</div>
						<div className='bg-accent rounded-lg p-4 text-center'>
							<div className='text-primary text-2xl font-bold'>
								{farmer.stats.averageFieldSize.toFixed(2)}
							</div>
							<div className='t-style-caption text-text-muted !font-normal'>Avg Field Size (ha)</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Tabs */}
			<Tabs defaultValue='farms' className='w-full'>
				<TabsList className='bg-accent w-full py-2'>
					<TabsTrigger value='farms' className='t-style-link text-text-muted'>
						Farms
					</TabsTrigger>
					<TabsTrigger value='inspections' className='t-style-link text-text-muted'>
						Inspections
					</TabsTrigger>
					<TabsTrigger value='certificates' className='t-style-link text-text-muted'>
						Certificates
					</TabsTrigger>
				</TabsList>
				<TabsContent value='farms' className='mt-4'>
					<FarmerFarmsTab farmerId={farmer.id} onDataChange={fetchFarmerDetails} />
				</TabsContent>
				<TabsContent value='inspections' className='mt-4'>
					<FarmerInspectionsTab farmerId={farmer.id} onDataChange={fetchFarmerDetails} />
				</TabsContent>
				<TabsContent value='certificates' className='mt-4'>
					<FarmerCertificatesTab farmerId={farmer.id} onDataChange={fetchFarmerDetails} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
