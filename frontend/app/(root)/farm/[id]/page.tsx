import FarmManagementPage, { type FarmDetailsProps } from '@/components/farm/farm-management';

export default function FarmDetailsPage({ params }: FarmDetailsProps) {
	return <FarmManagementPage params={params} />;
}
