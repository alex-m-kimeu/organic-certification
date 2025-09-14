import type { Request, Response } from 'express';
import { FieldService } from '../services/field.service';
import { asyncHandler } from '../middlewares/errorHandler';
import { CreateFieldDto, UpdateFieldDto, ApiResponse, PaginatedResponse, FieldWithFarm } from '../types/field.types';
import { Field } from '@prisma/client';

export class FieldController {
	private fieldService: FieldService;

	constructor() {
		this.fieldService = new FieldService();
	}

	/**
	 * @swagger
	 * /api/fields:
	 *   post:
	 *     summary: Create a new field
	 *     description: Register a new field within a farm in the organic certification system
	 *     tags: [Fields]
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             required:
	 *               - farmId
	 *               - name
	 *               - crop
	 *               - areaHa
	 *             properties:
	 *               farmId:
	 *                 type: string
	 *                 description: ID of the farm this field belongs to
	 *                 example: "cm123abc456def"
	 *               name:
	 *                 type: string
	 *                 description: Name of the field
	 *                 example: "North Field"
	 *               crop:
	 *                 type: string
	 *                 description: Type of crop grown in this field
	 *                 example: "Maize"
	 *               areaHa:
	 *                 type: number
	 *                 description: Area of the field in hectares
	 *                 example: 5.25
	 *           examples:
	 *             newField:
	 *               summary: Example field registration
	 *               value:
	 *                 farmId: "cm123abc456def"
	 *                 name: "North Field"
	 *                 crop: "Maize"
	 *                 areaHa: 5.25
	 *     responses:
	 *       201:
	 *         description: Field created successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 *       400:
	 *         description: Invalid input data
	 *       404:
	 *         description: Farm not found
	 */
	createField = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const data = req.body as CreateFieldDto;
		const field = await this.fieldService.createField(data);

		const response: ApiResponse<Field> = {
			success: true,
			message: 'Field created successfully',
			data: field,
		};

		res.status(201).json(response);
	});

	/**
	 * @swagger
	 * /api/fields:
	 *   get:
	 *     summary: Get all fields with pagination and search
	 *     description: Retrieve a paginated list of fields with optional search and filtering
	 *     tags: [Fields]
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
	 *         description: Number of fields per page (max 100)
	 *         schema:
	 *           type: integer
	 *           minimum: 1
	 *           maximum: 100
	 *           default: 10
	 *       - name: search
	 *         in: query
	 *         description: Search term to filter fields by name, crop, farm name, or farmer name
	 *         schema:
	 *           type: string
	 *           minLength: 1
	 *       - name: farmId
	 *         in: query
	 *         description: Filter fields by farm ID
	 *         schema:
	 *           type: string
	 *       - name: crop
	 *         in: query
	 *         description: Filter fields by crop type
	 *         schema:
	 *           type: string
	 *     responses:
	 *       200:
	 *         description: List of fields retrieved successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/PaginatedResponse'
	 */
	getFields = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const page = Math.max(1, parseInt(req.query.page as string) || 1);
		const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
		const search = req.query.search as string;
		const farmId = req.query.farmId as string;
		const crop = req.query.crop as string;

		const result = await this.fieldService.getFields(page, limit, search, farmId, crop);

		const response: PaginatedResponse<FieldWithFarm> = {
			success: true,
			data: result.fields,
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
	 * /api/fields/{id}:
	 *   get:
	 *     summary: Get a specific field by ID
	 *     description: Retrieve detailed information about a field including farm and farmer details
	 *     tags: [Fields]
	 *     parameters:
	 *       - name: id
	 *         in: path
	 *         required: true
	 *         description: Unique identifier for the field
	 *         schema:
	 *           type: string
	 *     responses:
	 *       200:
	 *         description: Field details retrieved successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 *       404:
	 *         description: Field not found
	 */
	getFieldById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const { id } = req.params;
		const field = await this.fieldService.getFieldById(id);

		const response: ApiResponse<FieldWithFarm> = {
			success: true,
			data: field,
		};

		res.json(response);
	});

	/**
	 * @swagger
	 * /api/fields/farm/{farmId}:
	 *   get:
	 *     summary: Get all fields for a specific farm
	 *     description: Retrieve all fields belonging to a specific farm
	 *     tags: [Fields]
	 *     parameters:
	 *       - name: farmId
	 *         in: path
	 *         required: true
	 *         description: ID of the farm
	 *         schema:
	 *           type: string
	 *     responses:
	 *       200:
	 *         description: Fields retrieved successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 *       404:
	 *         description: Farm not found
	 */
	getFieldsByFarmId = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const { farmId } = req.params;
		const fields = await this.fieldService.getFieldsByFarmId(farmId);

		const response: ApiResponse<Field[]> = {
			success: true,
			data: fields,
		};

		res.json(response);
	});

	/**
	 * @swagger
	 * /api/fields/{id}:
	 *   patch:
	 *     summary: Update field information (partial update)
	 *     description: Update one or more properties of a field
	 *     tags: [Fields]
	 *     parameters:
	 *       - name: id
	 *         in: path
	 *         required: true
	 *         description: Unique identifier for the field
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
	 *               farmId:
	 *                 type: string
	 *                 description: ID of the farm this field belongs to
	 *               name:
	 *                 type: string
	 *                 description: Name of the field
	 *               crop:
	 *                 type: string
	 *                 description: Type of crop grown in this field
	 *               areaHa:
	 *                 type: number
	 *                 description: Area of the field in hectares
	 *     responses:
	 *       200:
	 *         description: Field updated successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 *       400:
	 *         description: Invalid input data
	 *       404:
	 *         description: Field not found
	 */
	updateField = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const { id } = req.params;
		const data = req.body as UpdateFieldDto;

		const field = await this.fieldService.updateField(id, data);

		const response: ApiResponse<Field> = {
			success: true,
			message: 'Field updated successfully',
			data: field,
		};

		res.json(response);
	});

	/**
	 * @swagger
	 * /api/fields/{id}:
	 *   delete:
	 *     summary: Delete a field permanently
	 *     description: Permanently remove a field from the system
	 *     tags: [Fields]
	 *     parameters:
	 *       - name: id
	 *         in: path
	 *         required: true
	 *         description: Unique identifier for the field
	 *         schema:
	 *           type: string
	 *     responses:
	 *       200:
	 *         description: Field deleted successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 *       404:
	 *         description: Field not found
	 */
	deleteField = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const { id } = req.params;
		await this.fieldService.deleteField(id);

		const response: ApiResponse<null> = {
			success: true,
			message: 'Field deleted successfully',
			data: null,
		};

		res.json(response);
	});

	/**
	 * @swagger
	 * /api/fields/stats:
	 *   get:
	 *     summary: Get field statistics
	 *     description: Retrieve statistical information about fields
	 *     tags: [Fields]
	 *     parameters:
	 *       - name: farmId
	 *         in: query
	 *         description: Get stats for fields of a specific farm (optional)
	 *         schema:
	 *           type: string
	 *     responses:
	 *       200:
	 *         description: Field statistics retrieved successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 */
	getFieldStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const farmId = req.query.farmId as string;
		const stats = await this.fieldService.getFieldStats(farmId);

		const response: ApiResponse<typeof stats> = {
			success: true,
			data: stats,
		};

		res.json(response);
	});

	/**
	 * @swagger
	 * /api/fields/crops:
	 *   get:
	 *     summary: Get all unique crop types
	 *     description: Retrieve a list of all unique crop types used in fields
	 *     tags: [Fields]
	 *     responses:
	 *       200:
	 *         description: Crop types retrieved successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 */
	getCropTypes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const crops = await this.fieldService.getCropTypes();

		const response: ApiResponse<string[]> = {
			success: true,
			data: crops,
		};

		res.json(response);
	});
}

export const fieldController = new FieldController();
