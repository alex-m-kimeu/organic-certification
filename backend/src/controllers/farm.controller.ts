import type { Request, Response } from 'express';
import { FarmService } from '../services/farm.service';
import { asyncHandler } from '../middlewares/errorHandler';
import {
	CreateFarmDto,
	UpdateFarmDto,
	ApiResponse,
	PaginatedResponse,
	FarmWithFieldsAndFarmer,
} from '../types/farm.types';
import { Farm } from '@prisma/client';

export class FarmController {
	private farmService: FarmService;

	constructor() {
		this.farmService = new FarmService();
	}

	/**
	 * @swagger
	 * /api/farms:
	 *   post:
	 *     summary: Create a new farm
	 *     description: Register a new farm in the organic certification system
	 *     tags: [Farms]
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             required:
	 *               - farmerId
	 *               - farmName
	 *               - location
	 *               - areaHa
	 *             properties:
	 *               farmerId:
	 *                 type: string
	 *                 description: ID of the farmer who owns this farm
	 *                 example: "cm123abc456def"
	 *               farmName:
	 *                 type: string
	 *                 description: Name of the farm
	 *                 example: "Green Valley Farm"
	 *               location:
	 *                 type: string
	 *                 description: Physical location of the farm
	 *                 example: "Kiambu County, Central Kenya"
	 *               areaHa:
	 *                 type: number
	 *                 description: Total area of the farm in hectares
	 *                 example: 25.5
	 *           examples:
	 *             newFarm:
	 *               summary: Example farm registration
	 *               value:
	 *                 farmerId: "cm123abc456def"
	 *                 farmName: "Green Valley Farm"
	 *                 location: "Kiambu County, Central Kenya"
	 *                 areaHa: 25.5
	 *     responses:
	 *       201:
	 *         description: Farm created successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 *       400:
	 *         description: Invalid input data
	 *       404:
	 *         description: Farmer not found
	 */
	createFarm = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const data = req.body as CreateFarmDto;
		const farm = await this.farmService.createFarm(data);

		const response: ApiResponse<Farm> = {
			success: true,
			message: 'Farm created successfully',
			data: farm,
		};

		res.status(201).json(response);
	});

	/**
	 * @swagger
	 * /api/farms:
	 *   get:
	 *     summary: Get all farms with pagination and search
	 *     description: Retrieve a paginated list of farms with optional search and filtering
	 *     tags: [Farms]
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
	 *         description: Number of farms per page (max 100)
	 *         schema:
	 *           type: integer
	 *           minimum: 1
	 *           maximum: 100
	 *           default: 10
	 *       - name: search
	 *         in: query
	 *         description: Search term to filter farms by name, location, or farmer name
	 *         schema:
	 *           type: string
	 *           minLength: 1
	 *       - name: farmerId
	 *         in: query
	 *         description: Filter farms by farmer ID
	 *         schema:
	 *           type: string
	 *     responses:
	 *       200:
	 *         description: List of farms retrieved successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/PaginatedResponse'
	 */
	getFarms = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const page = Math.max(1, parseInt(req.query.page as string) || 1);
		const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
		const search = req.query.search as string;
		const farmerId = req.query.farmerId as string;

		const result = await this.farmService.getFarms(page, limit, search, farmerId);

		const response: PaginatedResponse<FarmWithFieldsAndFarmer> = {
			success: true,
			data: result.farms,
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
	 * /api/farms/{id}:
	 *   get:
	 *     summary: Get a specific farm by ID
	 *     description: Retrieve detailed information about a farm including its fields
	 *     tags: [Farms]
	 *     parameters:
	 *       - name: id
	 *         in: path
	 *         required: true
	 *         description: Unique identifier for the farm
	 *         schema:
	 *           type: string
	 *       - name: includeFarmer
	 *         in: query
	 *         description: Include farmer information in response
	 *         schema:
	 *           type: boolean
	 *           default: false
	 *     responses:
	 *       200:
	 *         description: Farm details retrieved successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 *       404:
	 *         description: Farm not found
	 */
	getFarmById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const { id } = req.params;
		const includeFarmer = req.query.includeFarmer === 'true';
		const farm = await this.farmService.getFarmById(id, includeFarmer);

		const response: ApiResponse<typeof farm> = {
			success: true,
			data: farm,
		};

		res.json(response);
	});

	/**
	 * @swagger
	 * /api/farms/farmer/{farmerId}:
	 *   get:
	 *     summary: Get all farms for a specific farmer
	 *     description: Retrieve all farms owned by a specific farmer
	 *     tags: [Farms]
	 *     parameters:
	 *       - name: farmerId
	 *         in: path
	 *         required: true
	 *         description: ID of the farmer
	 *         schema:
	 *           type: string
	 *     responses:
	 *       200:
	 *         description: Farms retrieved successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 *       404:
	 *         description: Farmer not found
	 */
	getFarmsByFarmerId = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const { farmerId } = req.params;
		const farms = await this.farmService.getFarmsByFarmerId(farmerId);

		const response: ApiResponse<typeof farms> = {
			success: true,
			data: farms,
		};

		res.json(response);
	});

	/**
	 * @swagger
	 * /api/farms/{id}:
	 *   patch:
	 *     summary: Update farm information (partial update)
	 *     description: Update one or more fields of a farm's information
	 *     tags: [Farms]
	 *     parameters:
	 *       - name: id
	 *         in: path
	 *         required: true
	 *         description: Unique identifier for the farm
	 *         schema:
	 *           type: string
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             minProperties: 1
	 *             properties:
	 *               farmerId:
	 *                 type: string
	 *                 description: ID of the farmer who owns this farm
	 *               farmName:
	 *                 type: string
	 *                 description: Name of the farm
	 *               location:
	 *                 type: string
	 *                 description: Physical location of the farm
	 *               areaHa:
	 *                 type: number
	 *                 description: Total area of the farm in hectares
	 *     responses:
	 *       200:
	 *         description: Farm updated successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 *       400:
	 *         description: Invalid input data
	 *       404:
	 *         description: Farm not found
	 */
	updateFarm = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const { id } = req.params;
		const data = req.body as UpdateFarmDto;

		const farm = await this.farmService.updateFarm(id, data);

		const response: ApiResponse<Farm> = {
			success: true,
			message: 'Farm updated successfully',
			data: farm,
		};

		res.json(response);
	});

	/**
	 * @swagger
	 * /api/farms/{id}:
	 *   delete:
	 *     summary: Delete a farm permanently
	 *     description: Permanently remove a farm and all associated data from the system
	 *     tags: [Farms]
	 *     parameters:
	 *       - name: id
	 *         in: path
	 *         required: true
	 *         description: Unique identifier for the farm
	 *         schema:
	 *           type: string
	 *     responses:
	 *       200:
	 *         description: Farm deleted successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 *       400:
	 *         description: Cannot delete farm with existing inspections or certificates
	 *       404:
	 *         description: Farm not found
	 */
	deleteFarm = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const { id } = req.params;
		await this.farmService.deleteFarm(id);

		const response: ApiResponse<null> = {
			success: true,
			message: 'Farm deleted successfully',
			data: null,
		};

		res.json(response);
	});

	/**
	 * @swagger
	 * /api/farms/stats:
	 *   get:
	 *     summary: Get farm statistics
	 *     description: Retrieve statistical information about farms
	 *     tags: [Farms]
	 *     parameters:
	 *       - name: farmId
	 *         in: query
	 *         description: Get stats for a specific farm (optional)
	 *         schema:
	 *           type: string
	 *     responses:
	 *       200:
	 *         description: Farm statistics retrieved successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 */
	getFarmStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const farmId = req.query.farmId as string;
		const stats = await this.farmService.getFarmStats(farmId);

		const response: ApiResponse<typeof stats> = {
			success: true,
			data: stats,
		};

		res.json(response);
	});
}

export const farmController = new FarmController();
