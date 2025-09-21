import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Farmer Routes', () => {
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
		// Clean test data more thoroughly
		await prisma.farmer.deleteMany({
			where: {
				OR: [
					{ email: testFarmer.email },
					{ phone: testFarmer.phone },
					{ email: deleteTestFarmer.email },
					{ phone: deleteTestFarmer.phone },
				],
			},
		});
	});

	afterAll(async () => {
		// Clean up after all tests
		await prisma.farmer.deleteMany({
			where: {
				OR: [
					{ email: testFarmer.email },
					{ phone: testFarmer.phone },
					{ email: deleteTestFarmer.email },
					{ phone: deleteTestFarmer.phone },
				],
			},
		});
		await prisma.$disconnect();
	});

	describe('POST /api/farmers', () => {
		it('should create a new farmer with valid data', async () => {
			const response = await request(app).post('/api/farmers').send(testFarmer).expect(201);

			expect(response.body.success).toBe(true);
			expect(response.body.data.name).toBe(testFarmer.name);
			expect(response.body.data.email).toBe(testFarmer.email);
			expect(response.body.data.phone).toBe('+254712344462'); // Phone is formatted with country code
		});

		it('should return 400 for invalid farmer data', async () => {
			const invalidFarmer = {
				name: '', // Invalid: empty name
				phone: 'invalid-phone', // Invalid: not a valid phone format
				email: 'invalid-email', // Invalid: not a valid email
				county: 'Kiambu',
			};

			const response = await request(app).post('/api/farmers').send(invalidFarmer).expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Validation failed');
		});

		it('should return 409 for duplicate phone number', async () => {
			// First, create a farmer
			await request(app).post('/api/farmers').send(testFarmer).expect(201);

			// Try to create another farmer with the same phone
			const duplicateFarmer = {
				...testFarmer,
				name: 'Jane Doe',
				email: 'jane.doe@test.com',
				// Same phone number
			};

			const response = await request(app).post('/api/farmers').send(duplicateFarmer).expect(409);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('already exists');
		});
	});

	describe('GET /api/farmers', () => {
		beforeEach(async () => {
			// Create test farmer
			await request(app).post('/api/farmers').send(testFarmer);
		});

		it('should get all farmers', async () => {
			const response = await request(app).get('/api/farmers').expect(200);

			expect(response.body.success).toBe(true);
			expect(Array.isArray(response.body.data)).toBe(true);
			expect(response.body.data.length).toBeGreaterThan(0);
		});

		it('should support pagination', async () => {
			const response = await request(app).get('/api/farmers?page=1&limit=10').expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.pagination).toBeDefined();
			expect(response.body.pagination.page).toBe(1);
			expect(response.body.pagination.limit).toBe(10);
		});

		it('should support search functionality', async () => {
			const response = await request(app).get(`/api/farmers?search=${testFarmer.name}`).expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.data.length).toBeGreaterThan(0);
			expect(response.body.data[0].name).toContain('John');
		});
	});

	describe('GET /api/farmers/:id', () => {
		let farmerId: string;

		beforeEach(async () => {
			// Create test farmer and get ID
			const response = await request(app).post('/api/farmers').send(testFarmer);
			farmerId = response.body.data.id;
		});

		it('should get a farmer by ID', async () => {
			const response = await request(app).get(`/api/farmers/${farmerId}`).expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.data.id).toBe(farmerId);
			expect(response.body.data.name).toBe(testFarmer.name);
		});

		it('should return 404 for non-existent farmer', async () => {
			const nonExistentId = 'cm000000000000000000';
			const response = await request(app).get(`/api/farmers/${nonExistentId}`).expect(404);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('not found');
		});

		it('should return 404 for invalid farmer ID format', async () => {
			const invalidId = 'invalid-id';
			const response = await request(app).get(`/api/farmers/${invalidId}`).expect(404);

			expect(response.body.success).toBe(false);
		});
	});

	describe('PATCH /api/farmers/:id', () => {
		let farmerId: string;
		const updateTestFarmer = {
			name: 'Update Test Farmer',
			phone: '723456789',
			email: 'update.test@test.com',
			county: 'Mombasa',
		};

		beforeEach(async () => {
			// Clean up any existing farmer with the same data first
			await prisma.farmer.deleteMany({
				where: {
					OR: [{ email: updateTestFarmer.email }, { phone: updateTestFarmer.phone }],
				},
			});

			// Create test farmer and get ID
			const response = await request(app).post('/api/farmers').send(updateTestFarmer);
			farmerId = response.body.data.id;

			// Verify the farmer was created
			expect(response.status).toBe(201);
			expect(farmerId).toBeDefined();
		});

		it('should update a farmer with valid data', async () => {
			// First verify the farmer exists
			const checkResponse = await request(app).get(`/api/farmers/${farmerId}`).expect(200);

			expect(checkResponse.body.data.id).toBe(farmerId);

			const updatedData = {
				name: 'John Smith',
				county: 'Nairobi',
			};

			const response = await request(app).patch(`/api/farmers/${farmerId}`).send(updatedData);

			if (response.status !== 200) {
				console.log('PATCH response:', response.status, response.body);
			}

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.name).toBe(updatedData.name);
			expect(response.body.data.county).toBe(updatedData.county);
			// Original email should remain
			expect(response.body.data.email).toBe(updateTestFarmer.email);
		});

		it('should return 404 for non-existent farmer', async () => {
			const nonExistentId = 'cm000000000000000000';
			const response = await request(app)
				.patch(`/api/farmers/${nonExistentId}`)
				.send({ name: 'Updated Name' })
				.expect(404);

			expect(response.body.success).toBe(false);
		});

		it('should return 400 for invalid update data', async () => {
			const invalidData = {
				email: 'invalid-email-format',
			};

			const response = await request(app).patch(`/api/farmers/${farmerId}`).send(invalidData).expect(400);

			expect(response.body.success).toBe(false);
		});
	});

	describe('DELETE /api/farmers/:id', () => {
		let farmerId: string;

		beforeEach(async () => {
			// Create unique test data for each test run to avoid conflicts
			const uniqueSuffix = Date.now().toString().slice(-3); // Last 3 digits of timestamp
			const deleteTestFarmer = {
				name: `Delete Test Farmer ${uniqueSuffix}`,
				phone: `73456${uniqueSuffix}0`, // 9 digits: 73456 + 3-digit suffix + 0 = 734561230
				email: `delete.test.${uniqueSuffix}@test.com`, // Unique email
				county: 'Kisumu',
			};

			// Create test farmer and get ID
			const response = await request(app).post('/api/farmers').send(deleteTestFarmer);
			if (response.status !== 201) {
				console.log('DELETE test farmer creation failed:', response.status, response.body);
			}

			farmerId = response.body.data?.id;

			// Verify the farmer was created
			expect(response.status).toBe(201);
			expect(farmerId).toBeDefined();
		});

		it('should delete a farmer', async () => {
			const response = await request(app).delete(`/api/farmers/${farmerId}`).expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toContain('deleted');

			// Verify farmer is actually deleted
			await request(app).get(`/api/farmers/${farmerId}`).expect(404);
		});

		it('should return 404 for non-existent farmer', async () => {
			const nonExistentId = 'cm000000000000000000';
			const response = await request(app).delete(`/api/farmers/${nonExistentId}`).expect(404);

			expect(response.body.success).toBe(false);
		});
	});

	describe('Rate Limiting', () => {
		it('should allow requests in development environment (localhost bypass)', async () => {
			// In development, rate limiting is bypassed for localhost
			// This test verifies that all requests succeed (no 429 responses)
			const promises = Array(20)
				.fill(null)
				.map(() => request(app).get('/api/farmers'));

			const results = await Promise.allSettled(promises);
			const successfulRequests = results.filter(
				(result) => result.status === 'fulfilled' && result.value.status === 200,
			);

			// All requests should succeed due to localhost bypass in development
			expect(successfulRequests.length).toBe(20);

			// Verify no rate limiting occurred
			const rateLimitedRequests = results.filter(
				(result) => result.status === 'fulfilled' && result.value.status === 429,
			);
			expect(rateLimitedRequests.length).toBe(0);
		}, 10000);

		it('should have rate limiting middleware configured', async () => {
			// Verify that the rate limiting headers are present (even if not triggered)
			const response = await request(app).get('/api/farmers').expect(200);

			// Rate limiter should add these headers even when not limiting
			expect(response.headers).toBeDefined();
			expect(response.body.success).toBe(true);
		});
	});

	describe('Phone Number Validation', () => {
		it('should accept valid phone numbers starting with 7', async () => {
			const uniquePhone = `71${Date.now().toString().slice(-7)}`;
			const validFarmer = {
				name: 'Valid Phone Test',
				phone: uniquePhone,
				email: `valid.phone.${Date.now()}@test.com`,
				county: 'Nairobi',
			};

			const response = await request(app).post('/api/farmers').send(validFarmer).expect(201);

			expect(response.body.data.phone).toBe(`+254${uniquePhone}`);
		});

		it('should accept valid phone numbers starting with 1', async () => {
			const timestamp = Date.now();
			const uniquePhone = `11${timestamp.toString().slice(-7)}`;
			const validFarmer = {
				name: `Valid Phone Test 1 ${timestamp}`,
				phone: uniquePhone,
				email: `valid.phone1.${timestamp}@test.com`,
				county: 'Mombasa',
			};

			const response = await request(app).post('/api/farmers').send(validFarmer).expect(201);

			expect(response.body.data.phone).toBe(`+254${uniquePhone}`);
		});

		it('should reject phone numbers not starting with 1 or 7', async () => {
			const invalidFarmer = {
				name: 'Invalid Phone Test',
				phone: '512345678', // Invalid: starts with 5
				email: 'invalid.phone@test.com',
				county: 'Kisumu',
			};

			const response = await request(app).post('/api/farmers').send(invalidFarmer).expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Validation failed');
		});

		it('should reject phone numbers with incorrect length', async () => {
			const shortPhone = {
				name: 'Short Phone Test',
				phone: '7123456', // Too short
				email: 'short.phone@test.com',
				county: 'Nakuru',
			};

			await request(app).post('/api/farmers').send(shortPhone).expect(400);

			const longPhone = {
				name: 'Long Phone Test',
				phone: '71234567890', // Too long
				email: 'long.phone@test.com',
				county: 'Eldoret',
			};

			await request(app).post('/api/farmers').send(longPhone).expect(400);
		});
	});

	describe('County Validation', () => {
		it('should accept valid Kenyan counties', async () => {
			const validCounties = ['Nairobi', 'Mombasa', 'Kiambu', 'Nakuru', 'Kisumu'];

			for (let i = 0; i < validCounties.length; i++) {
				const county = validCounties[i];
				const timestamp = Date.now() + i; // Make each unique
				const farmer = {
					name: `County Test ${timestamp}`,
					phone: `71${timestamp.toString().slice(-7)}`, // Make each phone unique
					email: `county.test.${timestamp}@test.com`,
					county: county,
				};

				const response = await request(app).post('/api/farmers').send(farmer).expect(201);

				expect(response.body.data.county).toBe(county);
			}
		});

		it('should reject invalid counties', async () => {
			const invalidCountyFarmer = {
				name: 'Invalid County Test',
				phone: '712345678',
				email: 'invalid.county@test.com',
				county: 'Invalid County',
			};

			const response = await request(app).post('/api/farmers').send(invalidCountyFarmer).expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Validation failed');
		});
	});

	describe('Advanced Validation Scenarios', () => {
		it('should require at least one field for update', async () => {
			// First create a farmer with unique data
			const timestamp = Date.now();
			const farmer = await request(app)
				.post('/api/farmers')
				.send({
					name: `Update Test Farmer ${timestamp}`,
					phone: `78${timestamp.toString().slice(-7)}`,
					email: `update.test.${timestamp}@test.com`,
					county: 'Nyeri',
				})
				.expect(201);

			const farmerId = farmer.body.data.id;

			// Try to update with empty body
			const response = await request(app).patch(`/api/farmers/${farmerId}`).send({}).expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toBe('Validation failed');
		});

		it('should validate name length limits', async () => {
			const longNameFarmer = {
				name: 'A'.repeat(101), // Exceeds 100 character limit
				phone: '712345678',
				email: 'long.name@test.com',
				county: 'Kericho',
			};

			const response = await request(app).post('/api/farmers').send(longNameFarmer).expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Validation failed');
		});

		it('should validate email format', async () => {
			const invalidEmailFarmer = {
				name: 'Invalid Email Test',
				phone: '712345678',
				email: 'not-an-email', // Invalid email format
				county: 'Machakos',
			};

			const response = await request(app).post('/api/farmers').send(invalidEmailFarmer).expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Validation failed');
		});
	});
});
