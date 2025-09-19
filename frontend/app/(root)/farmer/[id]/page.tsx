import FarmerManagementPage, { type FarmerDetailsProps } from '@/components/farmers/farmer-managemet';

export default function FarmerDetailsPage({ params }: FarmerDetailsProps) {
	return <FarmerManagementPage params={params} />;
}
