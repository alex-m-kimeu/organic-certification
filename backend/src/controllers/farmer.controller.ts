import type { Request, Response } from 'express';
import { FarmerService } from '../services/farmer.service';
import { asyncHandler } from '../middlewares/errorHandler';
import { CreateFarmerDto, UpdateFarmerDto, ApiResponse, PaginatedResponse } from '../types/farmer.types';
import { Farmer } from '@prisma/client';

export class FarmerController {
	private farmerService: FarmerService;

	constructor() {
		this.farmerService = new FarmerService();
	}

	/**
	 * @swagger
	 * /api/farmers:
	 *   post:
	 *     summary: Create a new farmer
	 *     description: Register a new farmer in the organic certification system
	 *     tags: [Farmers]
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             required:
	 *               - name
	 *               - phone
	 *               - email
	 *               - county
	 *             properties:
	 *               name:
	 *                 type: string
	 *                 description: Full name of the farmer
	 *                 example: "John Doe"
	 *               phone:
	 *                 type: string
	 *                 description: "9-digit Kenyan mobile number (without +254 prefix)"
	 *                 pattern: "^[17][0-9]{8}$"
	 *                 example: "712345678"
	 *               email:
	 *                 type: string
	 *                 format: email
	 *                 description: Email address for the farmer
	 *                 example: "john.doe@email.com"
	 *               county:
	 *                 $ref: '#/components/schemas/KenyanCounty'
	 *           examples:
	 *             newFarmer:
	 *               summary: Example farmer registration
	 *               value:
	 *                 name: "John Doe"
	 *                 phone: "712345678"
	 *                 email: "john.doe@email.com"
	 *                 county: "Nairobi"
	 *     responses:
	 *       201:
	 *         description: Farmer created successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 *             examples:
	 *               success:
	 *                 summary: Successful farmer creation
	 *                 value:
	 *                   success: true
	 *                   message: "Farmer created successfully"
	 *                   data:
	 *                     id: "cm123abc456def"
	 *                     name: "John Doe"
	 *                     phone: "+254712345678"
	 *                     email: "john.doe@email.com"
	 *                     county: "Nairobi"
	 *                     createdAt: "2023-09-12T10:30:00.000Z"
	 *                     updatedAt: "2023-09-12T10:30:00.000Z"
	 *       400:
	 *         description: Invalid input data
	 *       409:
	 *         description: Email already exists
	 */
	createFarmer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const data = req.body as CreateFarmerDto;
		const farmer = await this.farmerService.createFarmer(data);

		const response: ApiResponse<Farmer> = {
			success: true,
			message: 'Farmer created successfully',
			data: farmer,
		};

		res.status(201).json(response);
	});

	/**
	 * @swagger
	 * /api/farmers:
	 *   get:
	 *     summary: Get all farmers with pagination and search
	 *     description: Retrieve a paginated list of farmers with optional search functionality
	 *     tags: [Farmers]
	 *     parameters:
	 *       - name: page
	 *         in: query
	 *         description: Page number for pagination (starts from 1)
	 *         schema:
	 *           type: integer
	 *           minimum: 1
	 *           default: 1
	 *       - name: limit
	 *         in: query
	 *         description: Number of farmers per page (max 100)
	 *         schema:
	 *           type: integer
	 *           minimum: 1
	 *           maximum: 100
	 *           default: 10
	 *       - name: search
	 *         in: query
	 *         description: Search term to filter farmers by name, email, county, or phone number
	 *         schema:
	 *           type: string
	 *           minLength: 1
	 *           example: ""
	 *     responses:
	 *       200:
	 *         description: List of farmers retrieved successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/PaginatedResponse'
	 *             examples:
	 *               farmers:
	 *                 summary: Paginated farmers list
	 *                 value:
	 *                   success: true
	 *                   data:
	 *                     - id: "cm123abc456def"
	 *                       name: "John Doe"
	 *                       phone: "+254712345678"
	 *                       email: "john.doe@email.com"
	 *                       county: "Nairobi"
	 *                       createdAt: "2023-09-12T10:30:00.000Z"
	 *                       updatedAt: "2023-09-12T10:30:00.000Z"
	 *                   pagination:
	 *                     page: 1
	 *                     limit: 10
	 *                     total: 25
	 *                     totalPages: 3
	 */
	getFarmers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const page = Math.max(1, parseInt(req.query.page as string) || 1);
		const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
		const search = req.query.search as string;

		const result = await this.farmerService.getFarmers(page, limit, search);

		const response: PaginatedResponse<Farmer> = {
			success: true,
			data: result.farmers,
			pagination: {
				page,
				limit,
				total: result.total,
				totalPages: result.totalPages,
			},
		};

		res.json(response);
	});

	/**
	 * @swagger
	 * /api/farmers/{id}:
	 *   get:
	 *     summary: Get a specific farmer by ID
	 *     description: Retrieve detailed information about a farmer using their unique identifier
	 *     tags: [Farmers]
	 *     parameters:
	 *       - name: id
	 *         in: path
	 *         required: true
	 *         description: "Unique identifier for the farmer"
	 *         schema:
	 *           type: string
	 *           pattern: "^[a-zA-Z0-9_-]+$"
	 *           example: ""
	 *     responses:
	 *       200:
	 *         description: Farmer details retrieved successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 *             examples:
	 *               farmer:
	 *                 summary: Single farmer details
	 *                 value:
	 *                   success: true
	 *                   data:
	 *                     id: "cm123abc456def"
	 *                     name: "John Doe"
	 *                     phone: "+254712345678"
	 *                     email: "john.doe@email.com"
	 *                     county: "Nairobi"
	 *                     createdAt: "2023-09-12T10:30:00.000Z"
	 *                     updatedAt: "2023-09-12T10:30:00.000Z"
	 *       404:
	 *         description: Farmer not found
	 */
	getFarmerById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const { id } = req.params;
		const farmer = await this.farmerService.getFarmerById(id);

		const response: ApiResponse<Farmer> = {
			success: true,
			data: farmer,
		};

		res.json(response);
	});

	/**
	 * @swagger
	 * /api/farmers/{id}:
	 *   patch:
	 *     summary: Update farmer information (partial update)
	 *     description: Update one or more fields of a farmer's information
	 *     tags: [Farmers]
	 *     parameters:
	 *       - name: id
	 *         in: path
	 *         required: true
	 *         description: "Unique identifier for the farmer"
	 *         schema:
	 *           type: string
	 *           pattern: "^[a-zA-Z0-9_-]+$"
	 *           example: ""
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             minProperties: 1
	 *             properties:
	 *               name:
	 *                 type: string
	 *                 description: Full name of the farmer
	 *                 example: "John Doe Updated"
	 *               phone:
	 *                 type: string
	 *                 description: "9-digit Kenyan mobile number (without +254 prefix)"
	 *                 pattern: "^[17][0-9]{8}$"
	 *                 example: "712345679"
	 *               email:
	 *                 type: string
	 *                 format: email
	 *                 description: Email address for the farmer
	 *                 example: "john.updated@email.com"
	 *               county:
	 *                 $ref: '#/components/schemas/KenyanCounty'
	 *           examples:
	 *             updateName:
	 *               summary: Update only name
	 *               value:
	 *                 name: "John Smith"
	 *             updateContact:
	 *               summary: Update contact info
	 *               value:
	 *                 phone: "701234567"
	 *                 email: "john.smith@email.com"
	 *     responses:
	 *       200:
	 *         description: Farmer updated successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 *             examples:
	 *               updated:
	 *                 summary: Successfully updated farmer
	 *                 value:
	 *                   success: true
	 *                   message: "Farmer updated successfully"
	 *                   data:
	 *                     id: "cm123abc456def"
	 *                     name: "John Smith"
	 *                     phone: "+254701234567"
	 *                     email: "john.smith@email.com"
	 *                     county: "Mombasa"
	 *                     createdAt: "2023-09-12T10:30:00.000Z"
	 *                     updatedAt: "2023-09-12T11:00:00.000Z"
	 *       400:
	 *         description: Invalid input data
	 *       404:
	 *         description: Farmer not found
	 *       409:
	 *         description: Email already exists
	 */
	updateFarmer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const { id } = req.params;
		const data = req.body as UpdateFarmerDto;

		const farmer = await this.farmerService.updateFarmer(id, data);

		const response: ApiResponse<Farmer> = {
			success: true,
			message: 'Farmer updated successfully',
			data: farmer,
		};

		res.json(response);
	});

	/**
	 * @swagger
	 * /api/farmers/{id}:
	 *   delete:
	 *     summary: Delete a farmer permanently
	 *     description: Permanently remove a farmer and all associated data from the system
	 *     tags: [Farmers]
	 *     parameters:
	 *       - name: id
	 *         in: path
	 *         required: true
	 *         description: "Unique identifier for the farmer"
	 *         schema:
	 *           type: string
	 *           pattern: "^[a-zA-Z0-9_-]+$"
	 *           example: ""
	 *     responses:
	 *       200:
	 *         description: Farmer deleted successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 *             examples:
	 *               deleted:
	 *                 summary: Successfully deleted farmer
	 *                 value:
	 *                   success: true
	 *                   message: "Farmer deleted successfully"
	 *                   data: null
	 *       404:
	 *         description: Farmer not found
	 */
	deleteFarmer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const { id } = req.params;
		await this.farmerService.deleteFarmer(id);

		const response: ApiResponse<null> = {
			success: true,
			message: 'Farmer deleted successfully',
			data: null,
		};

		res.json(response);
	});
}

export const farmerController = new FarmerController();
