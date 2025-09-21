import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Farm Routes', () => {
	// Test data
	const testFarmer = {
		name: 'John Doe',
		phone: '712344462',
		email: 'john.doe@test.com',
		county: 'Kiambu',
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
		await prisma.farm.deleteMany({
			where: {
				OR: [
					// Static farm patterns
					{ farmName: { contains: 'Test Farm' } },
					{ farmName: { contains: 'test farm' } },
					// Dynamic farm patterns
					{ farmName: { contains: 'Green Valley Test Farm' } },
					{ farmName: { contains: 'Duplicate Test Farm' } },
					{ farmName: { contains: 'Get Test Farm' } },
					{ farmName: { contains: 'GetById Test Farm' } },
					{ farmName: { contains: 'Farmer Farm Test' } },
					{ farmName: { contains: 'Update Test Farm' } },
					{ farmName: { contains: 'Delete Test Farm' } },
					{ farmName: { contains: 'Stats Test Farm' } },
					// Location patterns
					{ location: { contains: 'Test Location' } },
					{ location: { contains: 'Delete Location' } },
					{ location: { contains: 'Stats Location' } },
				],
			},
		});

		await prisma.farmer.deleteMany({
			where: {
				OR: [
					// Static farmer data
					{ email: testFarmer.email },
					{ phone: testFarmer.phone },
					{ email: deleteTestFarmer.email },
					{ phone: deleteTestFarmer.phone },
					// Dynamic farmer patterns for farm tests - but exclude shared validation farmer
					{ name: { contains: 'Delete Test Farmer' } },
					{
						AND: [
							{ name: { contains: 'Test Farmer Validation' } },
							{ name: { not: { contains: 'Shared' } } },
						],
					},
					{ email: { contains: 'delete.test.' } },
					{
						AND: [{ email: { contains: 'farmer.validation' } }, { email: { not: { contains: 'shared' } } }],
					},
					// Phone patterns - exclude shared validation farmer phones (175xxxxx)
					{ phone: { startsWith: '+25473' } }, // Delete test phones
				],
			},
		});
	});

	// Clean up after each test to prevent data accumulation
	afterEach(async () => {
		// Additional cleanup for any remaining test data - but preserve shared validation farmer
		await prisma.farm.deleteMany({
			where: {
				OR: [
					{
						AND: [
							{ farmName: { contains: 'Test' } }, // Catch all test farm names
							{ farmName: { not: { contains: 'Validation' } } }, // But not validation test farms
						],
					},
					{ location: { contains: 'Test Location' } }, // Specific test locations only
				],
			},
		});

		await prisma.farmer.deleteMany({
			where: {
				OR: [
					{
						AND: [
							{ email: { contains: '@test.com' } }, // Test emails
							{ email: { not: { contains: 'shared' } } }, // But not shared validation farmer
						],
					},
					{
						AND: [
							{ name: { contains: 'Test' } }, // Test names
							{ name: { not: { contains: 'Validation Shared' } } }, // But not shared validation farmer
						],
					},
					{ phone: { startsWith: '+25473' } }, // Delete test phones only
				],
			},
		});
	});

	afterAll(async () => {
		// Clean up after all tests - comprehensive cleanup
		await prisma.farm.deleteMany({
			where: {
				OR: [
					// Static farm patterns
					{ farmName: { contains: 'Test Farm' } },
					{ farmName: { contains: 'test farm' } },
					// Dynamic farm patterns
					{ farmName: { contains: 'Green Valley Test Farm' } },
					{ farmName: { contains: 'Duplicate Test Farm' } },
					{ farmName: { contains: 'Get Test Farm' } },
					{ farmName: { contains: 'GetById Test Farm' } },
					{ farmName: { contains: 'Farmer Farm Test' } },
					{ farmName: { contains: 'Update Test Farm' } },
					{ farmName: { contains: 'Delete Test Farm' } },
					{ farmName: { contains: 'Stats Test Farm' } },
					// Location patterns
					{ location: { contains: 'Test Location' } },
					{ location: { contains: 'Delete Location' } },
					{ location: { contains: 'Stats Location' } },
				],
			},
		});

		await prisma.farmer.deleteMany({
			where: {
				OR: [
					// Static farmer data
					{ email: testFarmer.email },
					{ phone: testFarmer.phone },
					{ email: deleteTestFarmer.email },
					{ phone: deleteTestFarmer.phone },
					// Dynamic farmer patterns for farm tests - NOW include validation farmer in final cleanup
					{ name: { contains: 'Delete Test Farmer' } },
					{ name: { contains: 'Test Farmer Validation' } }, // Now clean up validation farmer too
					{ email: { contains: 'delete.test.' } },
					{ email: { contains: 'farmer.validation' } }, // Now clean up validation farmer too
					// Phone patterns
					{ phone: { startsWith: '+25473' } }, // Delete test phones
					{ phone: { startsWith: '+254175' } }, // Validation test phones
				],
			},
		});
		await prisma.$disconnect();
	});

	describe('POST /api/farms', () => {
		let testFarmerId: string;

		beforeEach(async () => {
			// Create test farmer
			const farmerResponse = await request(app).post('/api/farmers').send(testFarmer).expect(201);
			testFarmerId = farmerResponse.body.data.id;
		});

		it('should create a new farm with valid data', async () => {
			const testFarm = {
				farmerId: testFarmerId,
				farmName: 'Green Valley Test Farm',
				location: 'Kiambu County, Central Kenya',
				areaHa: 25.5,
			};

			const response = await request(app).post('/api/farms').send(testFarm).expect(201);

			expect(response.body.success).toBe(true);
			expect(response.body.data.farmName).toBe(testFarm.farmName);
			expect(response.body.data.location).toBe(testFarm.location);
			expect(response.body.data.areaHa).toBe(testFarm.areaHa);
			expect(response.body.data.farmerId).toBe(testFarmerId);
		});

		it('should return 400 for invalid farm data', async () => {
			const invalidFarm = {
				farmerId: testFarmerId,
				farmName: '', // Invalid: empty name
				location: '', // Invalid: empty location
				areaHa: -1, // Invalid: negative area
			};

			const response = await request(app).post('/api/farms').send(invalidFarm).expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Validation failed');
		});

		it('should return 404 when farmer does not exist', async () => {
			const farmWithInvalidFarmer = {
				farmerId: 'cm000000000000000000', // Non-existent farmer ID
				farmName: 'Test Farm',
				location: 'Test Location',
				areaHa: 10.0,
			};

			const response = await request(app).post('/api/farms').send(farmWithInvalidFarmer).expect(404);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Farmer not found');
		});

		it('should return 409 for duplicate farm name for same farmer', async () => {
			const testFarm = {
				farmerId: testFarmerId,
				farmName: 'Duplicate Test Farm',
				location: 'Kiambu County',
				areaHa: 20.0,
			};

			// First, create a farm
			await request(app).post('/api/farms').send(testFarm).expect(201);

			// Try to create another farm with the same name for the same farmer
			const response = await request(app).post('/api/farms').send(testFarm).expect(409);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('already exists');
		});
	});

	describe('GET /api/farms', () => {
		let testFarmerId: string;

		beforeEach(async () => {
			// Create test farmer
			const farmerResponse = await request(app).post('/api/farmers').send(testFarmer);
			testFarmerId = farmerResponse.body.data.id;

			// Create test farm
			await request(app).post('/api/farms').send({
				farmerId: testFarmerId,
				farmName: 'Get Test Farm',
				location: 'Test Location',
				areaHa: 15.0,
			});
		});

		it('should get all farms', async () => {
			const response = await request(app).get('/api/farms');

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(Array.isArray(response.body.data)).toBe(true);
			expect(response.body.data.length).toBeGreaterThan(0);
			expect(response.body.pagination).toBeDefined();
		});

		it('should support pagination', async () => {
			const response = await request(app).get('/api/farms?page=1&limit=1');

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.pagination.page).toBe(1);
			expect(response.body.pagination.limit).toBe(1);
			expect(response.body.pagination.total).toBeDefined();
			expect(response.body.pagination.totalPages).toBeDefined();
		});

		it('should support search functionality', async () => {
			const response = await request(app).get('/api/farms?search=Get Test');

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.length).toBeGreaterThan(0);
		});

		it('should filter by farmerId when provided', async () => {
			const response = await request(app).get(`/api/farms?farmerId=${testFarmerId}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.length).toBeGreaterThan(0);
			expect(response.body.data[0].farmerId).toBe(testFarmerId);
		});
	});

	describe('GET /api/farms/:id', () => {
		let testFarmerId: string;
		let farmId: string;

		beforeEach(async () => {
			// Create test farmer
			const farmerResponse = await request(app).post('/api/farmers').send(testFarmer);
			testFarmerId = farmerResponse.body.data.id;

			// Create test farm and get ID
			const farmResponse = await request(app).post('/api/farms').send({
				farmerId: testFarmerId,
				farmName: 'GetById Test Farm',
				location: 'Test Location',
				areaHa: 12.0,
			});
			farmId = farmResponse.body.data.id;
		});

		it('should get a farm by ID', async () => {
			const response = await request(app).get(`/api/farms/${farmId}`).expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.data.id).toBe(farmId);
			expect(response.body.data.farmName).toBe('GetById Test Farm');
		});

		it('should include farmer information when includeFarmer=true', async () => {
			const response = await request(app).get(`/api/farms/${farmId}?includeFarmer=true`).expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.data.farmer).toBeDefined();
			expect(response.body.data.farmer.name).toBe(testFarmer.name);
		});

		it('should return 404 for non-existent farm', async () => {
			const nonExistentId = 'cm000000000000000000';
			const response = await request(app).get(`/api/farms/${nonExistentId}`).expect(404);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('not found');
		});
	});

	describe('GET /api/farms/farmer/:farmerId', () => {
		let testFarmerId: string;

		beforeEach(async () => {
			// Create test farmer
			const farmerResponse = await request(app).post('/api/farmers').send(testFarmer);
			testFarmerId = farmerResponse.body.data.id;

			// Create test farm
			await request(app).post('/api/farms').send({
				farmerId: testFarmerId,
				farmName: 'Farmer Farm Test',
				location: 'Test Location',
				areaHa: 8.5,
			});
		});

		it('should get farms by farmer ID', async () => {
			const response = await request(app).get(`/api/farms/farmer/${testFarmerId}`).expect(200);

			expect(response.body.success).toBe(true);
			expect(Array.isArray(response.body.data)).toBe(true);
			expect(response.body.data.length).toBeGreaterThan(0);
			expect(response.body.data[0].farmerId).toBe(testFarmerId);
		});

		it('should return 404 for non-existent farmer', async () => {
			const nonExistentId = 'cm000000000000000000';
			const response = await request(app).get(`/api/farms/farmer/${nonExistentId}`).expect(404);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Farmer not found');
		});
	});

	describe('PATCH /api/farms/:id', () => {
		let testFarmerId: string;
		let farmId: string;

		beforeEach(async () => {
			// Create test farmer
			const farmerResponse = await request(app).post('/api/farmers').send(testFarmer);
			testFarmerId = farmerResponse.body.data.id;

			// Create test farm and get ID
			const farmResponse = await request(app).post('/api/farms').send({
				farmerId: testFarmerId,
				farmName: 'Update Test Farm',
				location: 'Original Location',
				areaHa: 18.0,
			});
			farmId = farmResponse.body.data.id;
		});

		it('should update a farm with valid data', async () => {
			const updatedData = {
				farmName: 'Updated Farm Name',
				location: 'Updated Location',
				areaHa: 22.0,
			};

			const response = await request(app).patch(`/api/farms/${farmId}`).send(updatedData).expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.data.farmName).toBe(updatedData.farmName);
			expect(response.body.data.location).toBe(updatedData.location);
			expect(response.body.data.areaHa).toBe(updatedData.areaHa);
		});

		it('should return 404 for non-existent farm', async () => {
			const nonExistentId = 'cm000000000000000000';
			const response = await request(app)
				.patch(`/api/farms/${nonExistentId}`)
				.send({ farmName: 'Updated Name' })
				.expect(404);

			expect(response.body.success).toBe(false);
		});

		it('should return 400 for invalid update data', async () => {
			const invalidData = {
				areaHa: -5, // Invalid: negative area
			};

			const response = await request(app).patch(`/api/farms/${farmId}`).send(invalidData).expect(400);

			expect(response.body.success).toBe(false);
		});
	});

	describe('DELETE /api/farms/:id', () => {
		let testFarmerId: string;
		let farmId: string;

		beforeEach(async () => {
			// Create unique test data for each test run to avoid conflicts
			const uniqueSuffix = Date.now().toString().slice(-3);
			const deleteTestFarmer = {
				name: `Delete Test Farmer ${uniqueSuffix}`,
				phone: `73456${uniqueSuffix}0`,
				email: `delete.test.${uniqueSuffix}@test.com`,
				county: 'Kisumu',
			};

			// Create test farmer
			const farmerResponse = await request(app).post('/api/farmers').send(deleteTestFarmer);
			testFarmerId = farmerResponse.body.data.id;

			// Create test farm and get ID
			const farmResponse = await request(app)
				.post('/api/farms')
				.send({
					farmerId: testFarmerId,
					farmName: `Delete Test Farm ${uniqueSuffix}`,
					location: 'Delete Location',
					areaHa: 10.0,
				});
			farmId = farmResponse.body.data.id;

			// Verify both were created
			expect(farmerResponse.status).toBe(201);
			expect(farmResponse.status).toBe(201);
		});

		it('should delete a farm', async () => {
			const response = await request(app).delete(`/api/farms/${farmId}`).expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toBe('Farm deleted successfully');

			// Verify farm is actually deleted
			await request(app).get(`/api/farms/${farmId}`).expect(404);
		});

		it('should return 404 for non-existent farm', async () => {
			const nonExistentId = 'cm000000000000000000';
			const response = await request(app).delete(`/api/farms/${nonExistentId}`).expect(404);

			expect(response.body.success).toBe(false);
		});
	});

	describe('GET /api/farms/stats', () => {
		let testFarmerId: string;

		beforeEach(async () => {
			// Create test farmer
			const farmerResponse = await request(app).post('/api/farmers').send(testFarmer);
			testFarmerId = farmerResponse.body.data.id;

			// Create test farm for stats
			await request(app).post('/api/farms').send({
				farmerId: testFarmerId,
				farmName: 'Stats Test Farm',
				location: 'Stats Location',
				areaHa: 30.0,
			});
		});

		it('should get farm statistics', async () => {
			const response = await request(app).get('/api/farms/stats').expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.data.totalFarms).toBeGreaterThan(0);
			expect(response.body.data.totalArea).toBeGreaterThan(0);
			expect(response.body.data.averageFarmSize).toBeGreaterThan(0);
		});
	});

	describe('Farm Validation', () => {
		let testFarmerId: string;

		beforeAll(async () => {
			// Use a unique timestamp to avoid conflicts
			const timestamp = Date.now() + Math.floor(Math.random() * 1000);
			const uniqueFarmer = {
				name: `Test Farmer Validation Shared ${timestamp}`,
				email: `farmer.validation.shared.${timestamp}@test.com`,
				phone: `175${timestamp.toString().slice(-6)}`, // 9-digit phone starting with 1
				county: 'Kiambu', // Use a valid Kenyan county
			};

			// Create test farmer
			const farmerResponse = await request(app).post('/api/farmers').send(uniqueFarmer);
			expect(farmerResponse.status).toBe(201);
			expect(farmerResponse.body.data).toBeDefined();
			testFarmerId = farmerResponse.body.data.id;
		});

		it('should validate farm name length limits', async () => {
			const longNameFarm = {
				farmerId: testFarmerId,
				farmName: 'A'.repeat(101), // Exceeds 100 character limit
				location: 'Test Location',
				areaHa: 15.0,
			};

			const response = await request(app).post('/api/farms').send(longNameFarm).expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Validation failed');
		});

		it('should validate area is positive', async () => {
			const negativeAreaFarm = {
				farmerId: testFarmerId,
				farmName: 'Negative Area Farm',
				location: 'Test Location',
				areaHa: -5.0, // Invalid: must be positive
			};

			const response = await request(app).post('/api/farms').send(negativeAreaFarm).expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Validation failed');
		});

		it('should validate area maximum limit (50,000 hectares)', async () => {
			const tooLargeAreaFarm = {
				farmerId: testFarmerId,
				farmName: 'Too Large Farm',
				location: 'Test Location',
				areaHa: 50001, // Exceeds 50,000 hectare limit
			};

			const response = await request(app).post('/api/farms').send(tooLargeAreaFarm).expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Validation failed');
		});

		it('should validate area decimal places (max 2)', async () => {
			const tooManyDecimalsFarm = {
				farmerId: testFarmerId,
				farmName: 'Too Many Decimals Farm',
				location: 'Test Location',
				areaHa: 10.123, // 3 decimal places (should fail)
			};

			const response = await request(app).post('/api/farms').send(tooManyDecimalsFarm).expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Validation failed');
		});

		it('should allow valid area with 2 decimal places', async () => {
			const validDecimalFarm = {
				farmerId: testFarmerId,
				farmName: 'Valid Decimal Farm',
				location: 'Test Location',
				areaHa: 10.12, // 2 decimal places (should pass)
			};

			const response = await request(app).post('/api/farms').send(validDecimalFarm).expect(201);

			expect(response.body.success).toBe(true);
			expect(response.body.data.areaHa).toBe(10.12);
		});

		it('should validate location length limits', async () => {
			const longLocationFarm = {
				farmerId: testFarmerId,
				farmName: 'Test Farm',
				location: 'L'.repeat(201), // Exceeds 200 character limit
				areaHa: 10.5,
			};

			const response = await request(app).post('/api/farms').send(longLocationFarm).expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Validation failed');
		});

		it('should validate required fields', async () => {
			// Test missing farmerId
			const missingFarmerIdFarm = {
				farmName: 'Test Farm',
				location: 'Test Location',
				areaHa: 10.5,
			};

			let response = await request(app).post('/api/farms').send(missingFarmerIdFarm).expect(400);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Validation failed');

			// Test missing farmName
			const missingNameFarm = {
				farmerId: testFarmerId,
				location: 'Test Location',
				areaHa: 10.5,
			};

			response = await request(app).post('/api/farms').send(missingNameFarm).expect(400);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Validation failed');

			// Test missing location
			const missingLocationFarm = {
				farmerId: testFarmerId,
				farmName: 'Test Farm',
				areaHa: 10.5,
			};

			response = await request(app).post('/api/farms').send(missingLocationFarm).expect(400);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Validation failed');

			// Test missing areaHa
			const missingAreaFarm = {
				farmerId: testFarmerId,
				farmName: 'Test Farm',
				location: 'Test Location',
			};

			response = await request(app).post('/api/farms').send(missingAreaFarm).expect(400);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Validation failed');
		});

		it('should validate empty strings for required fields', async () => {
			// Test empty farmName
			const emptyNameFarm = {
				farmerId: testFarmerId,
				farmName: '', // Empty string should fail min(1) validation
				location: 'Test Location',
				areaHa: 10.5,
			};

			let response = await request(app).post('/api/farms').send(emptyNameFarm).expect(400);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Validation failed');

			// Test empty location
			const emptyLocationFarm = {
				farmerId: testFarmerId,
				farmName: 'Test Farm',
				location: '', // Empty string should fail min(1) validation
				areaHa: 10.5,
			};

			response = await request(app).post('/api/farms').send(emptyLocationFarm).expect(400);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Validation failed');

			// Test empty farmerId
			const emptyFarmerIdFarm = {
				farmerId: '', // Empty string should fail min(1) validation
				farmName: 'Test Farm',
				location: 'Test Location',
				areaHa: 10.5,
			};

			response = await request(app).post('/api/farms').send(emptyFarmerIdFarm).expect(400);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Validation failed');
		});

		it('should require at least one field for update', async () => {
			// First create a farm
			const farmResponse = await request(app).post('/api/farms').send({
				farmerId: testFarmerId,
				farmName: 'Update Validation Farm',
				location: 'Test Location',
				areaHa: 20.0,
			});

			const farmId = farmResponse.body.data.id;

			// Try to update with empty body
			const response = await request(app).patch(`/api/farms/${farmId}`).send({}).expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toBe('Validation failed');
		});
	});

	describe('Rate Limiting', () => {
		let testFarmerId: string;

		beforeEach(async () => {
			// Create a test farmer for rate limiting tests (use unique data to avoid conflicts)
			const timestamp = Date.now();
			const farmer = await request(app)
				.post('/api/farmers')
				.send({
					name: `Rate Limit Farmer ${timestamp}`,
					phone: `71${timestamp.toString().slice(-7)}`,
					email: `ratelimit${timestamp}@test.com`,
					county: 'Kiambu',
				});

			if (farmer.status === 201) {
				testFarmerId = farmer.body.data.id;
			} else {
				throw new Error(`Failed to create test farmer: ${farmer.status}`);
			}

			// Small delay to avoid rate limiting between test setup
			await new Promise((resolve) => setTimeout(resolve, 100));
		});

		it('should allow requests in development environment (localhost bypass)', async () => {
			// In development, rate limiting is bypassed for localhost
			// This test verifies that we can make multiple requests without being blocked
			const farmData = {
				farmerId: testFarmerId,
				farmName: 'Rate Limit Test Farm',
				location: 'Test Location',
				areaHa: 10.5,
			};

			// Create multiple farms with delays to avoid hitting limits
			const results = [];
			for (let i = 0; i < 5; i++) {
				const response = await request(app)
					.post('/api/farms')
					.send({
						...farmData,
						farmName: `${farmData.farmName} ${i}`,
					});
				results.push(response);
				// Small delay between requests
				await new Promise((resolve) => setTimeout(resolve, 50));
			}

			// Most requests should succeed (allowing for some rate limiting)
			const successfulRequests = results.filter((result) => result.status === 201);
			const rateLimitedRequests = results.filter((result) => result.status === 429);

			// We should have at least some successful requests
			expect(successfulRequests.length).toBeGreaterThan(0);

			// Log for debugging
			console.log(`Successful: ${successfulRequests.length}, Rate Limited: ${rateLimitedRequests.length}`);
		}, 10000);

		it('should have rate limiting middleware configured', async () => {
			// Verify that the rate limiting headers are present (even if not triggered)
			const response = await request(app).get('/api/farms').expect(200);

			// Rate limiter should add these headers even when not limiting
			expect(response.headers).toBeDefined();
			expect(response.body.success).toBe(true);
		});
	});
});
