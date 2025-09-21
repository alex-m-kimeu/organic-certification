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
import { ArrowLeft, MapPin, User, Calendar, Activity } from 'lucide-react';
import type { FarmWithFields } from '@/types/farm';
import { FarmFieldsTab } from '@/components/farm/farm-fields-tab';
import FarmCertificatesTab from '@/components/farm/farm-certificates-tab';
import FarmInspectionsTab from '@/components/farm/farm-inspections-tab';

export interface FarmDetailsProps {
	params: Promise<{
		id: string;
	}>;
}

interface FarmWithStats extends FarmWithFields {
	farmer: {
		id: string;
		name: string;
		email: string;
	};
	stats: {
		totalFields: number;
		totalFieldArea: number;
		averageFieldSize: number;
		totalInspections: number;
		totalCertificates: number;
		latestInspectionScore: number | null;
	};
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function FarmManagementPage({ params }: FarmDetailsProps) {
	const router = useRouter();
	const resolvedParams = React.use(params);
	const [farm, setFarm] = useState<FarmWithStats | null>(null);
	const [isNotFound, setIsNotFound] = useState(false);

	// Fetch farm inspections statistics
	const fetchFarmInspections = useCallback(async (farmId: string) => {
		try {
			const response = await fetch(`${BASE_URL}/inspections?farmId=${farmId}&limit=100`);
			if (response.ok) {
				const result = await response.json();
				if (result.success && result.data) {
					const inspections = result.data || [];
					const latestInspection = inspections
						.filter((inspection: any) => {
							return inspection.complianceScore !== null && inspection.complianceScore !== undefined;
						})
						.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

					return {
						total: result.pagination?.total || inspections.length,
						latestScore: latestInspection?.complianceScore || null,
					};
				}
			}

			return { total: 0, latestScore: null };
		} catch {
			return { total: 0, latestScore: null };
		}
	}, []);

	// Fetch farm certificates statistics
	const fetchFarmCertificates = useCallback(async (farmId: string) => {
		try {
			const response = await fetch(`${BASE_URL}/certificates?farmId=${farmId}&limit=100`);
			if (response.ok) {
				const result = await response.json();
				if (result.success && result.data) {
					return {
						total: result.pagination?.total || result.data?.length || 0,
					};
				}
			}

			return { total: 0 };
		} catch {
			return { total: 0 };
		}
	}, []);

	// Fetch farm details
	const fetchFarmDetails = useCallback(async () => {
		if (!resolvedParams.id) {
			return;
		}

		try {
			const response = await fetch(`${BASE_URL}/farms/${resolvedParams.id}?includeFarmer=true`);

			if (!response.ok) {
				if (response.status === 404) {
					setIsNotFound(true);

					return;
				}
				throw new Error('Failed to fetch farm details');
			}

			const result = await response.json();
			if (result.success && result.data) {
				const farmData = result.data;

				// Calculate field-related statistics
				const totalFields = farmData.fields?.length || 0;
				const totalFieldArea = farmData.fields?.reduce((sum: number, field: any) => sum + field.areaHa, 0) || 0;
				const averageFieldSize = totalFields > 0 ? totalFieldArea / totalFields : 0;

				// Fetch additional statistics
				const [inspectionsData, certificatesData] = await Promise.allSettled([
					fetchFarmInspections(resolvedParams.id),
					fetchFarmCertificates(resolvedParams.id),
				]);

				const inspectionsResult =
					inspectionsData.status === 'fulfilled' ? inspectionsData.value : { total: 0, latestScore: null };
				const certificatesResult =
					certificatesData.status === 'fulfilled' ? certificatesData.value : { total: 0 };

				const stats = {
					totalFields,
					totalFieldArea,
					averageFieldSize,
					totalInspections: inspectionsResult.total,
					totalCertificates: certificatesResult.total,
					latestInspectionScore: inspectionsResult.latestScore,
				};

				setFarm({ ...farmData, stats });
			} else {
				throw new Error(result.message || 'Failed to fetch farm details');
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to fetch farm details. Please try again.';
			toast.error(errorMessage);
		}
	}, [resolvedParams.id, fetchFarmInspections, fetchFarmCertificates]);

	useEffect(() => {
		fetchFarmDetails();
	}, [fetchFarmDetails]);

	// Format date
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	const getFarmInitials = (farmName: string): string => {
		if (farmName) {
			const farmParts = farmName.trim().split(' ');

			if (farmParts.length >= 2) {
				return (farmParts[0].charAt(0) + farmParts[farmParts.length - 1].charAt(0)).toUpperCase();
			}
			if (farmParts[0].length >= 2) {
				return farmParts[0].substring(0, 2).toUpperCase();
			}

			return farmParts[0].charAt(0).toUpperCase();
		}

		return 'FM';
	};

	if (isNotFound) {
		return <NotFoundContent />;
	}

	if (!farm) {
		return null;
	}

	return (
		<div className='bg-background container mx-auto flex flex-col items-start gap-8 px-4 py-[72px] md:px-6 md:py-10 lg:gap-10 lg:px-8'>
			{/* Header with back button */}
			<div className='flex w-full flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
				<h1 className='text-primary t-style-h3 !font-bold'>Farm Details</h1>
				<Button
					onClick={() => router.push('/farm')}
					className='t-style-link rounded-2 bg-primary hover:bg-primary/70 focus:ring-primary focus:ring-offset-background flex items-center gap-2 px-4 py-2 text-white shadow-none transition-all focus:ring-[0.5px] focus:ring-offset-2'
				>
					<ArrowLeft className='size-4' aria-hidden='true' />
					Back to Farms
				</Button>
			</div>

			{/* Farm Information Card */}
			<Card className='bg-background w-full border-none p-0 shadow-none'>
				<CardHeader className='grid grid-cols-2 items-center gap-6 p-0'>
					<CardTitle className='t-style-body text-text-muted dark:text-primary flex items-center gap-2 !font-semibold'>
						<Avatar className='size-15'>
							<AvatarFallback
								role='img'
								aria-label={`Avatar for ${farm.farmName}`}
								className='t-style-body text-primary bg-accent !font-semibold'
							>
								{getFarmInitials(farm.farmName)}
							</AvatarFallback>
						</Avatar>
						{farm.farmName}
					</CardTitle>
					<div className='grid grid-cols-1 gap-6 lg:grid-cols-4'>
						<div className='t-style-link text-text-muted flex items-center gap-2 !font-normal'>
							<MapPin className='text-primary size-3' aria-hidden='true' />
							<span>
								<span className='sr-only'>Location: </span>
								{farm.location}
							</span>
						</div>
						<div className='t-style-link text-text-muted flex items-center gap-2 !font-normal'>
							<User className='text-primary size-3' aria-hidden='true' />
							<span>
								<span className='sr-only'>Owner: </span>
								{farm.farmer.name}
							</span>
						</div>
						<div className='t-style-link text-text-muted flex items-center gap-2 !font-normal'>
							<Activity className='text-primary size-3' aria-hidden='true' />
							<span>
								<span className='sr-only'>Total Area: </span>
								{farm.areaHa.toFixed(2)} ha
							</span>
						</div>
						{farm.createdAt && (
							<div className='t-style-link text-text-muted flex items-center gap-2 !font-normal'>
								<Calendar className='text-primary size-3' aria-hidden='true' />
								<span>
									<span className='sr-only'>Created: </span>
									{formatDate(farm.createdAt)}
								</span>
							</div>
						)}
					</div>
				</CardHeader>

				<CardContent className='px-0 pt-6'>
					{/* Statistics */}
					<div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6'>
						<div className='bg-accent rounded-lg p-4 text-center'>
							<div className='text-primary text-2xl font-bold'>{farm.stats.totalFields}</div>
							<div className='t-style-caption text-text-muted !font-normal'>Total Fields</div>
						</div>
						<div className='bg-accent rounded-lg p-4 text-center'>
							<div className='text-primary text-2xl font-bold'>
								{farm.stats.totalFieldArea.toFixed(2)}
							</div>
							<div className='t-style-caption text-text-muted !font-normal'>Field Area (ha)</div>
						</div>
						<div className='bg-accent rounded-lg p-4 text-center'>
							<div className='text-primary text-2xl font-bold'>
								{farm.stats.averageFieldSize.toFixed(2)}
							</div>
							<div className='t-style-caption text-text-muted !font-normal'>Avg Field Size (ha)</div>
						</div>
						<div className='bg-accent rounded-lg p-4 text-center'>
							<div className='text-primary text-2xl font-bold'>{farm.stats.totalInspections}</div>
							<div className='t-style-caption text-text-muted !font-normal'>Inspections</div>
						</div>
						<div className='bg-accent rounded-lg p-4 text-center'>
							<div className='text-primary text-2xl font-bold'>{farm.stats.totalCertificates}</div>
							<div className='t-style-caption text-text-muted !font-normal'>Certificates</div>
						</div>
						<div className='bg-accent rounded-lg p-4 text-center'>
							<div className='text-primary text-2xl font-bold'>
								{farm.stats.latestInspectionScore === null
									? 'N/A'
									: `${farm.stats.latestInspectionScore}%`}
							</div>
							<div className='t-style-caption text-text-muted !font-normal'>Latest Score</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Tabs */}
			<Tabs defaultValue='fields' className='w-full'>
				<TabsList className='bg-accent w-full py-2'>
					<TabsTrigger value='fields' className='t-style-link text-text-muted'>
						Fields
					</TabsTrigger>
					<TabsTrigger value='inspections' className='t-style-link text-text-muted'>
						Inspections
					</TabsTrigger>
					<TabsTrigger value='certificates' className='t-style-link text-text-muted'>
						Certificates
					</TabsTrigger>
				</TabsList>
				<TabsContent value='fields' className='mt-4'>
					<FarmFieldsTab farmId={farm.id} onDataChange={fetchFarmDetails} />
				</TabsContent>
				<TabsContent value='inspections' className='mt-4'>
					<FarmInspectionsTab farmId={farm.id} onDataChange={fetchFarmDetails} />
				</TabsContent>
				<TabsContent value='certificates' className='mt-4'>
					<FarmCertificatesTab farmId={farm.id} onDataChange={fetchFarmDetails} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
