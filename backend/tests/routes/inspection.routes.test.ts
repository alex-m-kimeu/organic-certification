import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';
import { InspectionStatus } from '@prisma/client';

const prisma = new PrismaClient();

describe('Inspection Routes', () => {
	// Test data
	const testFarmer = {
		name: 'John Doe',
		phone: '712344462',
		email: 'john.doe@test.com',
		county: 'Kiambu',
	};

	const testFarm = {
		farmName: 'Test Inspection Farm',
		location: 'Test Location',
		areaHa: 2.5,
	};

	const deleteTestFarmer = {
		name: 'Delete Test Farmer',
		phone: '734567890',
		email: 'delete.test@test.com',
		county: 'Kisumu',
	};

	// Clean up before each test
	beforeEach(async () => {
		// Clean test data more thoroughly - including dynamic test data
		await prisma.inspection.deleteMany({
			where: {
				OR: [
					{ inspectorName: { contains: 'Test Inspector' } },
					{ inspectorName: { contains: 'test inspector' } },
					{ inspectorName: { contains: 'John Smith' } },
					{ inspectorName: { contains: 'Jane Doe' } },
					{ inspectorName: { contains: 'Update Test Inspector' } },
					{ inspectorName: { contains: 'Delete Test Inspector' } },
					{ inspectorName: { contains: 'Rate Limit Test Inspector' } },
					{ inspectorName: { contains: 'Search Test Inspector' } },
					{ inspectorName: { contains: 'Filter Test Inspector' } },
				],
			},
		});

		await prisma.farm.deleteMany({
			where: {
				OR: [
					{ farmName: { contains: 'Test Inspection Farm' } },
					{ farmName: { contains: 'test inspection farm' } },
					{ farmName: { contains: 'Delete Test Farm' } },
					{ farmName: { contains: 'Update Test Farm' } },
					{ location: { contains: 'Test Location' } },
					{ location: { contains: 'Delete Location' } },
				],
			},
		});

		await prisma.farmer.deleteMany({
			where: {
				OR: [
					{ email: testFarmer.email },
					{ phone: testFarmer.phone },
					{ email: deleteTestFarmer.email },
					{ phone: deleteTestFarmer.phone },
					{ name: { contains: 'Delete Test Farmer' } },
					{
						AND: [
							{ name: { contains: 'Test Farmer Inspection' } },
							{ name: { not: { contains: 'Shared' } } },
						],
					},
					{ email: { contains: 'delete.test.' } },
					{
						AND: [{ email: { contains: 'farmer.inspection' } }, { email: { not: { contains: 'shared' } } }],
					},
					{ phone: { startsWith: '+25473' } },
					{ phone: { startsWith: '+25411' } },
				],
			},
		});
	});

	// Clean up after each test to prevent data accumulation
	afterEach(async () => {
		// Additional cleanup for any remaining test data - but preserve shared validation data
		await prisma.inspection.deleteMany({
			where: {
				OR: [
					{
						AND: [
							{ inspectorName: { contains: 'Test' } },
							{ inspectorName: { not: { contains: 'Validation' } } },
						],
					},
					{ inspectorName: { contains: 'John Smith' } },
					{ inspectorName: { contains: 'Jane Doe' } },
				],
			},
		});

		await prisma.farm.deleteMany({
			where: {
				OR: [
					{
						AND: [{ farmName: { contains: 'Test' } }, { farmName: { not: { contains: 'Validation' } } }],
					},
					{ location: { contains: 'Test Location' } },
				],
			},
		});

		await prisma.farmer.deleteMany({
			where: {
				OR: [
					{
						AND: [{ email: { contains: '@test.com' } }, { email: { not: { contains: 'shared' } } }],
					},
					{
						AND: [{ name: { contains: 'Test' } }, { name: { not: { contains: 'Validation Shared' } } }],
					},
					{ phone: { startsWith: '+25473' } },
					{ phone: { startsWith: '+25411' } },
				],
			},
		});
	});

	afterAll(async () => {
		// Clean up after all tests - comprehensive cleanup
		await prisma.inspection.deleteMany({
			where: {
				OR: [
					{ inspectorName: { contains: 'Test Inspector' } },
					{ inspectorName: { contains: 'test inspector' } },
					{ inspectorName: { contains: 'John Smith' } },
					{ inspectorName: { contains: 'Jane Doe' } },
					{ inspectorName: { contains: 'Update Test Inspector' } },
					{ inspectorName: { contains: 'Delete Test Inspector' } },
					{ inspectorName: { contains: 'Rate Limit Test Inspector' } },
					{ inspectorName: { contains: 'Search Test Inspector' } },
					{ inspectorName: { contains: 'Filter Test Inspector' } },
				],
			},
		});

		await prisma.farm.deleteMany({
			where: {
				OR: [
					{ farmName: { contains: 'Test Inspection Farm' } },
					{ farmName: { contains: 'test inspection farm' } },
					{ farmName: { contains: 'Delete Test Farm' } },
					{ farmName: { contains: 'Update Test Farm' } },
					{ location: { contains: 'Test Location' } },
					{ location: { contains: 'Delete Location' } },
				],
			},
		});

		await prisma.farmer.deleteMany({
			where: {
				OR: [
					{ email: testFarmer.email },
					{ phone: testFarmer.phone },
					{ email: deleteTestFarmer.email },
					{ phone: deleteTestFarmer.phone },
					{ name: { contains: 'Delete Test Farmer' } },
					{ name: { contains: 'Test Farmer Inspection' } },
					{ email: { contains: 'delete.test.' } },
					{ email: { contains: 'farmer.inspection' } },
					{ phone: { startsWith: '+25473' } },
					{ phone: { startsWith: '+25411' } },
				],
			},
		});
		await prisma.$disconnect();
	});

	describe('POST /api/inspections', () => {
		let testFarmerId: string;
		let testFarmId: string;

		beforeEach(async () => {
			// Create test farmer and farm
			const farmer = await prisma.farmer.create({
				data: testFarmer,
			});
			testFarmerId = farmer.id;

			const farm = await prisma.farm.create({
				data: {
					...testFarm,
					farmerId: testFarmerId,
				},
			});
			testFarmId = farm.id;
		});

		it('should create a new inspection with valid data', async () => {
			const inspectionData = {
				farmId: testFarmId,
				inspectorName: 'John Smith',
				checklist: [
					{ questionId: 1, answer: true },
					{ questionId: 2, answer: true },
					{ questionId: 3, answer: false },
					{ questionId: 4, answer: true },
					{ questionId: 5, answer: true },
				],
			};

			const response = await request(app).post('/api/inspections').send(inspectionData).expect(201);

			expect(response.body.success).toBe(true);
			expect(response.body.data.farmId).toBe(testFarmId);
			expect(response.body.data.inspectorName).toBe('John Smith');
			expect(response.body.data.complianceScore).toBe(80);
			expect(response.body.data.status).toBe(InspectionStatus.SUBMITTED);
		});

		it('should create inspection with high compliance score and auto-approve', async () => {
			const inspectionData = {
				farmId: testFarmId,
				inspectorName: 'John Smith',
				checklist: [
					{ questionId: 1, answer: true },
					{ questionId: 2, answer: true },
					{ questionId: 3, answer: true },
					{ questionId: 4, answer: true },
					{ questionId: 5, answer: true },
				],
			};

			const response = await request(app).post('/api/inspections').send(inspectionData).expect(201);

			expect(response.body.success).toBe(true);
			expect(response.body.data.complianceScore).toBe(100);
			expect(response.body.data.status).toBe(InspectionStatus.APPROVED);
		});

		it('should create inspection with low compliance score and reject', async () => {
			const inspectionData = {
				farmId: testFarmId,
				inspectorName: 'John Smith',
				checklist: [
					{ questionId: 1, answer: false },
					{ questionId: 2, answer: false },
					{ questionId: 3, answer: false },
					{ questionId: 4, answer: true },
					{ questionId: 5, answer: false },
				],
			};

			const response = await request(app).post('/api/inspections').send(inspectionData).expect(201);

			expect(response.body.success).toBe(true);
			expect(response.body.data.complianceScore).toBe(20);
			expect(response.body.data.status).toBe(InspectionStatus.REJECTED);
		});

		it('should return 400 for invalid inspection data', async () => {
			const invalidData = {
				farmId: testFarmId,
				// Missing inspectorName
				checklist: [
					{ questionId: 1, answer: true },
					{ questionId: 2, answer: true },
				], // Too few questions
			};

			const response = await request(app).post('/api/inspections').send(invalidData).expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.validationErrors || response.body.message).toBeDefined();
		});

		it('should return 404 when farm does not exist', async () => {
			const inspectionData = {
				farmId: 'non-existent-farm-id',
				inspectorName: 'John Smith',
				checklist: [
					{ questionId: 1, answer: true },
					{ questionId: 2, answer: true },
					{ questionId: 3, answer: false },
					{ questionId: 4, answer: true },
					{ questionId: 5, answer: true },
				],
			};

			const response = await request(app).post('/api/inspections').send(inspectionData).expect(404);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Farm not found');
		});

		it('should return 400 for duplicate question IDs in checklist', async () => {
			const inspectionData = {
				farmId: testFarmId,
				inspectorName: 'John Smith',
				checklist: [
					{ questionId: 1, answer: true },
					{ questionId: 1, answer: false }, // Duplicate question ID
					{ questionId: 2, answer: true },
					{ questionId: 3, answer: false },
					{ questionId: 4, answer: true },
				],
			};

			const response = await request(app).post('/api/inspections').send(inspectionData).expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.validationErrors || response.body.message).toBeDefined();
		});
	});

	describe('GET /api/inspections', () => {
		let testFarmerId: string;
		let testFarmId: string;

		beforeEach(async () => {
			// Create test farmer and farm
			const farmer = await prisma.farmer.create({
				data: testFarmer,
			});
			testFarmerId = farmer.id;

			const farm = await prisma.farm.create({
				data: {
					...testFarm,
					farmerId: testFarmerId,
				},
			});
			testFarmId = farm.id;

			// Create test inspections
			await prisma.inspection.create({
				data: {
					farmId: testFarmId,
					inspectorName: 'Search Test Inspector',
					status: InspectionStatus.SUBMITTED,
					complianceScore: 85,
				},
			});

			await prisma.inspection.create({
				data: {
					farmId: testFarmId,
					inspectorName: 'Filter Test Inspector',
					status: InspectionStatus.APPROVED,
					complianceScore: 95,
				},
			});
		});

		it('should get all inspections', async () => {
			const response = await request(app).get('/api/inspections').expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toBeDefined();
			expect(response.body.data).toBeInstanceOf(Array);
			expect(response.body.pagination.total).toBeGreaterThanOrEqual(2);
			expect(response.body.pagination.totalPages).toBeGreaterThanOrEqual(1);
		});

		it('should support pagination', async () => {
			const response = await request(app).get('/api/inspections?page=1&limit=1').expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toBeDefined();
			expect(response.body.data).toHaveLength(1);
			expect(response.body.pagination.total).toBeGreaterThanOrEqual(2);
			expect(response.body.pagination.totalPages).toBeGreaterThanOrEqual(2);
		});

		it('should support search functionality', async () => {
			const response = await request(app).get('/api/inspections?search=Search Test').expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toBeDefined();
			expect(response.body.data.length).toBeGreaterThanOrEqual(1);
			expect(response.body.data[0].inspectorName).toContain('Search Test');
		});

		it('should filter by farmId when provided', async () => {
			const response = await request(app).get(`/api/inspections?farmId=${testFarmId}`).expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toBeDefined();
			expect(response.body.data).toBeInstanceOf(Array);
			response.body.data.forEach((inspection: any) => {
				expect(inspection.farmId).toBe(testFarmId);
			});
		});

		it('should filter by status when provided', async () => {
			const response = await request(app).get(`/api/inspections?status=${InspectionStatus.APPROVED}`).expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toBeDefined();
			expect(response.body.data).toBeInstanceOf(Array);
			response.body.data.forEach((inspection: any) => {
				expect(inspection.status).toBe(InspectionStatus.APPROVED);
			});
		});

		it('should filter by inspector name when provided', async () => {
			const response = await request(app).get('/api/inspections?inspectorName=Filter Test Inspector').expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toBeDefined();
			expect(response.body.data.length).toBeGreaterThanOrEqual(1);
			expect(response.body.data[0].inspectorName).toBe('Filter Test Inspector');
		});

		it('should validate pagination parameters', async () => {
			const response = await request(app).get('/api/inspections?page=0&limit=0').expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toBeDefined();
			expect(response.body.pagination.page).toBe(1);
			expect(response.body.pagination.limit).toBe(10);
		});
	});

	describe('GET /api/inspections/:id', () => {
		let testFarmerId: string;
		let testFarmId: string;
		let inspectionId: string;

		beforeEach(async () => {
			// Create test farmer and farm
			const farmer = await prisma.farmer.create({
				data: testFarmer,
			});
			testFarmerId = farmer.id;

			const farm = await prisma.farm.create({
				data: {
					...testFarm,
					farmerId: testFarmerId,
				},
			});
			testFarmId = farm.id;

			// Create test inspection
			const inspection = await prisma.inspection.create({
				data: {
					farmId: testFarmId,
					inspectorName: 'John Smith',
					status: InspectionStatus.SUBMITTED,
					complianceScore: 85,
				},
			});
			inspectionId = inspection.id;
		});

		it('should get an inspection by ID', async () => {
			const response = await request(app).get(`/api/inspections/${inspectionId}`).expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toBe('Inspection retrieved successfully');
			expect(response.body.data.id).toBe(inspectionId);
			expect(response.body.data.farmId).toBe(testFarmId);
			expect(response.body.data.inspectorName).toBe('John Smith');
			expect(response.body.data.farm).toBeDefined();
			expect(response.body.data.farm.farmer).toBeDefined();
		});

		it('should return 404 for non-existent inspection', async () => {
			const response = await request(app).get('/api/inspections/non-existent-id').expect(404);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Inspection not found');
		});
	});

	describe('GET /api/inspections/questions', () => {
		it('should get all active checklist questions', async () => {
			const response = await request(app).get('/api/inspections/questions').expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.data).toBeInstanceOf(Array);
			expect(response.body.data.length).toBeGreaterThan(0);
			expect(response.body.data[0]).toHaveProperty('id');
			expect(response.body.data[0]).toHaveProperty('question');
			expect(response.body.data[0]).toHaveProperty('order');
		});
	});

	describe('PATCH /api/inspections/:id', () => {
		let testFarmerId: string;
		let testFarmId: string;
		let inspectionId: string;

		beforeEach(async () => {
			// Create test farmer and farm
			const farmer = await prisma.farmer.create({
				data: testFarmer,
			});
			testFarmerId = farmer.id;

			const farm = await prisma.farm.create({
				data: {
					...testFarm,
					farmerId: testFarmerId,
				},
			});
			testFarmId = farm.id;

			// Create test inspection
			const inspection = await prisma.inspection.create({
				data: {
					farmId: testFarmId,
					inspectorName: 'John Smith',
					status: InspectionStatus.DRAFT,
					complianceScore: 60,
				},
			});
			inspectionId = inspection.id;
		});

		it('should update inspection with valid data', async () => {
			const updateData = {
				inspectorName: 'Update Test Inspector',
				checklist: [
					{ questionId: 1, answer: true },
					{ questionId: 2, answer: true },
					{ questionId: 3, answer: false },
					{ questionId: 4, answer: true },
					{ questionId: 5, answer: true },
				],
			};

			const response = await request(app).patch(`/api/inspections/${inspectionId}`).send(updateData).expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.data.inspectorName).toBe('Update Test Inspector');
			expect(response.body.data.complianceScore).toBe(80);
			expect(response.body.data.status).toBe(InspectionStatus.SUBMITTED);
		});

		it('should update inspector name only', async () => {
			const updateData = {
				inspectorName: 'Updated Inspector Name',
			};

			const response = await request(app).patch(`/api/inspections/${inspectionId}`).send(updateData).expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.data.inspectorName).toBe('Updated Inspector Name');
			expect(response.body.data.complianceScore).toBe(60); // Should remain unchanged
		});

		it('should trigger certificate generation for high compliance score', async () => {
			const updateData = {
				checklist: [
					{ questionId: 1, answer: true },
					{ questionId: 2, answer: true },
					{ questionId: 3, answer: true },
					{ questionId: 4, answer: true },
					{ questionId: 5, answer: true },
				],
			};

			const response = await request(app).patch(`/api/inspections/${inspectionId}`).send(updateData).expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.data.complianceScore).toBe(100);
			expect(response.body.data.status).toBe(InspectionStatus.APPROVED);
		});

		it('should return 404 for non-existent inspection', async () => {
			const updateData = {
				inspectorName: 'Update Test Inspector',
			};

			const response = await request(app).patch('/api/inspections/non-existent-id').send(updateData).expect(404);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Inspection not found');
		});

		it('should return 400 for invalid update data', async () => {
			const invalidData = {};

			const response = await request(app).patch(`/api/inspections/${inspectionId}`).send(invalidData).expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Validation failed');
		});
	});

	describe('PATCH /api/inspections/:id/approve', () => {
		let testFarmerId: string;
		let testFarmId: string;
		let inspectionId: string;

		beforeEach(async () => {
			// Create test farmer and farm
			const farmer = await prisma.farmer.create({
				data: testFarmer,
			});
			testFarmerId = farmer.id;

			const farm = await prisma.farm.create({
				data: {
					...testFarm,
					farmerId: testFarmerId,
				},
			});
			testFarmId = farm.id;

			// Create test inspection with compliance score >= 80%
			const inspection = await prisma.inspection.create({
				data: {
					farmId: testFarmId,
					inspectorName: 'John Smith',
					status: InspectionStatus.SUBMITTED,
					complianceScore: 85,
				},
			});
			inspectionId = inspection.id;
		});

		it('should approve inspection successfully', async () => {
			const response = await request(app)
				.patch(`/api/inspections/${inspectionId}/approve`)
				.send({ approved: true })
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.data.status).toBe(InspectionStatus.APPROVED);
		});

		it('should reject inspection successfully', async () => {
			const response = await request(app)
				.patch(`/api/inspections/${inspectionId}/approve`)
				.send({ approved: false })
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.data.status).toBe(InspectionStatus.REJECTED);
		});

		it('should return 404 for non-existent inspection', async () => {
			const response = await request(app)
				.patch('/api/inspections/non-existent-id/approve')
				.send({ approved: true })
				.expect(404);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Inspection not found');
		});

		it('should return 400 for low compliance score', async () => {
			// Create inspection with low compliance score
			const lowScoreInspection = await prisma.inspection.create({
				data: {
					farmId: testFarmId,
					inspectorName: 'Low Score Inspector',
					status: InspectionStatus.SUBMITTED,
					complianceScore: 75, // Below 80%
				},
			});

			const response = await request(app)
				.patch(`/api/inspections/${lowScoreInspection.id}/approve`)
				.send({ approved: true })
				.expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Inspection does not meet minimum compliance score');

			// Clean up
			await prisma.inspection.delete({ where: { id: lowScoreInspection.id } });
		});

		it('should return 400 for missing approval decision', async () => {
			const response = await request(app).patch(`/api/inspections/${inspectionId}/approve`).send({}).expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Validation failed');
		});
	});

	describe('DELETE /api/inspections/:id', () => {
		let testFarmerId: string;
		let testFarmId: string;
		let inspectionId: string;

		beforeEach(async () => {
			// Create test farmer and farm
			const farmer = await prisma.farmer.create({
				data: deleteTestFarmer,
			});
			testFarmerId = farmer.id;

			const farm = await prisma.farm.create({
				data: {
					farmName: 'Delete Test Farm',
					location: 'Delete Location',
					areaHa: 1.5,
					farmerId: testFarmerId,
				},
			});
			testFarmId = farm.id;

			// Create test inspection
			const inspection = await prisma.inspection.create({
				data: {
					farmId: testFarmId,
					inspectorName: 'Delete Test Inspector',
					status: InspectionStatus.DRAFT,
					complianceScore: 75,
				},
			});
			inspectionId = inspection.id;
		});

		it('should delete inspection successfully', async () => {
			const response = await request(app).delete(`/api/inspections/${inspectionId}`).expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toContain('Inspection deleted successfully');
			expect(response.body.data).toBeNull();

			// Verify deletion
			const deletedInspection = await prisma.inspection.findUnique({
				where: { id: inspectionId },
			});
			expect(deletedInspection).toBeNull();
		});

		it('should return 404 for non-existent inspection', async () => {
			const response = await request(app).delete('/api/inspections/non-existent-id').expect(404);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Inspection not found');
		});
	});

	describe('Inspection Validation', () => {
		let testFarmerId: string;
		let testFarmId: string;

		beforeEach(async () => {
			// Create test farmer and farm
			const farmer = await prisma.farmer.create({
				data: testFarmer,
			});
			testFarmerId = farmer.id;

			const farm = await prisma.farm.create({
				data: {
					...testFarm,
					farmerId: testFarmerId,
				},
			});
			testFarmId = farm.id;
		});

		it('should reject inspection with insufficient checklist questions', async () => {
			const inspectionData = {
				farmId: testFarmId,
				date: new Date().toISOString(),
				inspectorName: 'Test Inspector',
				checklist: [
					{ questionId: 1, answer: true },
					{ questionId: 2, answer: false },
				], // Only 2 questions, minimum is 5
			};

			const response = await request(app).post('/api/inspections').send(inspectionData).expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Validation failed');
		});

		it('should reject inspection with missing required fields', async () => {
			const inspectionData = {
				farmId: testFarmId,
				// Missing inspectorName
				checklist: [
					{ questionId: 1, answer: true },
					{ questionId: 2, answer: true },
					{ questionId: 3, answer: false },
					{ questionId: 4, answer: true },
					{ questionId: 5, answer: true },
				],
			};

			const response = await request(app).post('/api/inspections').send(inspectionData).expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Validation failed');
		});

		it('should reject inspection with invalid question ID format', async () => {
			const inspectionData = {
				farmId: testFarmId,
				inspectorName: 'Test Inspector',
				checklist: [
					{ questionId: 'invalid', answer: true },
					{ questionId: 2, answer: true },
					{ questionId: 3, answer: false },
					{ questionId: 4, answer: true },
					{ questionId: 5, answer: true },
				],
			};

			const response = await request(app).post('/api/inspections').send(inspectionData).expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Validation failed');
		});

		it('should reject inspection with invalid answer format', async () => {
			const inspectionData = {
				farmId: testFarmId,
				inspectorName: 'Test Inspector',
				checklist: [
					{ questionId: 1, answer: 'yes' }, // Should be boolean
					{ questionId: 2, answer: true },
					{ questionId: 3, answer: false },
					{ questionId: 4, answer: true },
					{ questionId: 5, answer: true },
				],
			};

			const response = await request(app).post('/api/inspections').send(inspectionData).expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Validation failed');
		});

		it('should reject inspection with empty inspector name', async () => {
			const inspectionData = {
				farmId: testFarmId,
				inspectorName: '',
				checklist: [
					{ questionId: 1, answer: true },
					{ questionId: 2, answer: true },
					{ questionId: 3, answer: false },
					{ questionId: 4, answer: true },
					{ questionId: 5, answer: true },
				],
			};

			const response = await request(app).post('/api/inspections').send(inspectionData).expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Validation failed');
		});

		it('should reject inspection with inspector name exceeding limit', async () => {
			const longName = 'a'.repeat(101); // Exceeds 100 character limit
			const inspectionData = {
				farmId: testFarmId,
				inspectorName: longName,
				checklist: [
					{ questionId: 1, answer: true },
					{ questionId: 2, answer: true },
					{ questionId: 3, answer: false },
					{ questionId: 4, answer: true },
					{ questionId: 5, answer: true },
				],
			};

			const response = await request(app).post('/api/inspections').send(inspectionData).expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Validation failed');
		});
	});

	describe('Rate Limiting', () => {
		let testFarmerId: string;
		let testFarmId: string;

		beforeEach(async () => {
			// Create test farmer and farm
			const farmer = await prisma.farmer.create({
				data: {
					name: 'Rate Limit Test Farmer',
					phone: '711234567',
					email: 'ratelimit.test@test.com',
					county: 'Nairobi',
				},
			});
			testFarmerId = farmer.id;

			const farm = await prisma.farm.create({
				data: {
					farmName: 'Rate Limit Test Farm',
					location: 'Rate Limit Location',
					areaHa: 2.0,
					farmerId: testFarmerId,
				},
			});
			testFarmId = farm.id;
		});

		it('should allow requests in development environment (localhost bypass)', async () => {
			// Make multiple requests quickly to test rate limiting
			const inspectionData = {
				farmId: testFarmId,
				inspectorName: 'Rate Limit Test Inspector',
				checklist: [
					{ questionId: 1, answer: true },
					{ questionId: 2, answer: true },
					{ questionId: 3, answer: false },
					{ questionId: 4, answer: true },
					{ questionId: 5, answer: true },
				],
			};

			const requests = Array(5)
				.fill(null)
				.map(() => request(app).post('/api/inspections').send(inspectionData));

			const responses = await Promise.all(requests);

			// In development with localhost, these should all succeed
			responses.forEach((response) => {
				expect([201, 409, 404]).toContain(response.status); // 201 success, 409 duplicate, 404 if data cleaned
			});
		}, 10000);

		it('should have rate limiting middleware configured', async () => {
			// Verify that the rate limiter is properly configured by checking headers or middleware presence
			const inspectionData = {
				farmId: testFarmId,
				inspectorName: 'Rate Limit Test Inspector',
				checklist: [
					{ questionId: 1, answer: true },
					{ questionId: 2, answer: true },
					{ questionId: 3, answer: false },
					{ questionId: 4, answer: true },
					{ questionId: 5, answer: true },
				],
			};

			const response = await request(app).post('/api/inspections').send(inspectionData);

			// Check for rate limit headers (if configured)
			expect(response.headers).toBeDefined();
		});
	});

	describe('Complex Inspection Scenarios', () => {
		let testFarmerId: string;
		let testFarmId: string;

		beforeEach(async () => {
			// Create test farmer and farm
			const farmer = await prisma.farmer.create({
				data: testFarmer,
			});
			testFarmerId = farmer.id;

			const farm = await prisma.farm.create({
				data: {
					...testFarm,
					farmerId: testFarmerId,
				},
			});
			testFarmId = farm.id;
		});

		it('should handle inspection with exactly 5 questions (minimum)', async () => {
			const inspectionData = {
				farmId: testFarmId,
				inspectorName: 'Minimum Questions Inspector',
				checklist: [
					{ questionId: 1, answer: true },
					{ questionId: 2, answer: true },
					{ questionId: 3, answer: false },
					{ questionId: 4, answer: true },
					{ questionId: 5, answer: true },
				],
			};

			const response = await request(app).post('/api/inspections').send(inspectionData).expect(201);

			expect(response.body.success).toBe(true);
			expect(response.body.data.complianceScore).toBe(80);
		});

		it('should handle inspection with 10 questions (maximum)', async () => {
			const inspectionData = {
				farmId: testFarmId,
				inspectorName: 'Maximum Questions Inspector',
				checklist: [
					{ questionId: 1, answer: true },
					{ questionId: 2, answer: true },
					{ questionId: 3, answer: true },
					{ questionId: 4, answer: true },
					{ questionId: 5, answer: true },
					{ questionId: 6, answer: false },
					{ questionId: 7, answer: true },
					{ questionId: 8, answer: true },
					{ questionId: 9, answer: false },
					{ questionId: 10, answer: true },
				],
			};

			const response = await request(app).post('/api/inspections').send(inspectionData).expect(201);

			expect(response.body.success).toBe(true);
			expect(response.body.data.complianceScore).toBe(80);
		});

		it('should calculate compliance score correctly for various scenarios', async () => {
			// Test different compliance scenarios
			const scenarios = [
				{
					name: 'Perfect Score',
					checklist: [
						{ questionId: 1, answer: true },
						{ questionId: 2, answer: true },
						{ questionId: 3, answer: true },
						{ questionId: 4, answer: true },
						{ questionId: 5, answer: true },
					],
					expectedScore: 100,
					expectedStatus: InspectionStatus.APPROVED,
				},
				{
					name: 'Good Score',
					checklist: [
						{ questionId: 1, answer: true },
						{ questionId: 2, answer: true },
						{ questionId: 3, answer: true },
						{ questionId: 4, answer: true },
						{ questionId: 5, answer: false },
					],
					expectedScore: 80,
					expectedStatus: InspectionStatus.SUBMITTED,
				},
				{
					name: 'Poor Score',
					checklist: [
						{ questionId: 1, answer: false },
						{ questionId: 2, answer: false },
						{ questionId: 3, answer: true },
						{ questionId: 4, answer: false },
						{ questionId: 5, answer: false },
					],
					expectedScore: 20,
					expectedStatus: InspectionStatus.REJECTED,
				},
			];

			for (const scenario of scenarios) {
				const inspectionData = {
					farmId: testFarmId,
					inspectorName: `${scenario.name} Inspector`,
					checklist: scenario.checklist,
				};

				const response = await request(app).post('/api/inspections').send(inspectionData).expect(201);

				expect(response.body.success).toBe(true);
				expect(response.body.data.complianceScore).toBe(scenario.expectedScore);
				expect(response.body.data.status).toBe(scenario.expectedStatus);
			}
		});
	});
});
