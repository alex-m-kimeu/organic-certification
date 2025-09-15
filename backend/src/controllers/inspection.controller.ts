import { Request, Response } from 'express';
import { InspectionService } from '../services/inspection.service';
import { asyncHandler } from '../middlewares/errorHandler';
import {
	CreateInspectionDto,
	UpdateInspectionDto,
	ApproveInspectionDto,
} from '../utils/validations/inspection.validation';

export class InspectionController {
	private inspectionService: InspectionService;

	constructor() {
		this.inspectionService = new InspectionService();
	}

	/**
	 * @swagger
	 * /api/inspections:
	 *   post:
	 *     summary: Create a new inspection
	 *     description: Create a new inspection for a farm with checklist answers. Compliance score is calculated automatically and status is set based on score.
	 *     tags: [Inspections]
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             required:
	 *               - farmId
	 *               - inspectorName
	 *               - checklist
	 *             properties:
	 *               farmId:
	 *                 type: string
	 *                 description: ID of the farm being inspected
	 *                 example: "cm123abc456def"
	 *               inspectorName:
	 *                 type: string
	 *                 description: Name of the inspector conducting the inspection
	 *                 example: "John Smith"
	 *               checklist:
	 *                 type: array
	 *                 description: Array of checklist answers (minimum 5 questions required)
	 *                 items:
	 *                   type: object
	 *                   properties:
	 *                     questionId:
	 *                       type: integer
	 *                       description: ID of the checklist question
	 *                       example: 1
	 *                     answer:
	 *                       type: boolean
	 *                       description: Answer to the question (true for Yes, false for No)
	 *                       example: true
	 *           examples:
	 *             newInspection:
	 *               summary: Example inspection creation
	 *               value:
	 *                 farmId: "cm123abc456def"
	 *                 inspectorName: "John Smith"
	 *                 checklist:
	 *                   - questionId: 1
	 *                     answer: true
	 *                   - questionId: 2
	 *                     answer: true
	 *                   - questionId: 3
	 *                     answer: false
	 *                   - questionId: 4
	 *                     answer: true
	 *                   - questionId: 5
	 *                     answer: true
	 *     responses:
	 *       201:
	 *         description: Inspection created successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 *       400:
	 *         description: Invalid input data or insufficient questions answered
	 *       404:
	 *         description: Farm not found or invalid questions
	 */
	createInspection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const data = req.body as CreateInspectionDto;
		const inspection = await this.inspectionService.createInspection(data);

		res.status(201).json({
			success: true,
			message: `Inspection created successfully with ${inspection.complianceScore}% compliance score. Status: ${inspection.status}`,
			data: inspection,
		});
	});

	/**
	 * @swagger
	 * /api/inspections:
	 *   get:
	 *     summary: Get all inspections
	 *     description: Retrieve paginated list of inspections with optional search and filtering
	 *     tags: [Inspections]
	 *     parameters:
	 *       - in: query
	 *         name: page
	 *         schema:
	 *           type: integer
	 *           minimum: 1
	 *           default: 1
	 *         description: Page number for pagination
	 *       - in: query
	 *         name: limit
	 *         schema:
	 *           type: integer
	 *           minimum: 1
	 *           maximum: 100
	 *           default: 10
	 *         description: Number of inspections per page
	 *       - in: query
	 *         name: search
	 *         schema:
	 *           type: string
	 *         description: Search by inspector name, farm name, location, or farmer name
	 *         example: ""
	 *       - in: query
	 *         name: farmId
	 *         schema:
	 *           type: string
	 *         description: Filter by specific farm ID
	 *         example: ""
	 *       - in: query
	 *         name: status
	 *         schema:
	 *           type: string
	 *           enum: [DRAFT, SUBMITTED, APPROVED, REJECTED]
	 *         description: Filter by inspection status
	 *         example: ""
	 *       - in: query
	 *         name: inspectorName
	 *         schema:
	 *           type: string
	 *         description: Filter by inspector name
	 *         example: ""
	 *     responses:
	 *       200:
	 *         description: Inspections retrieved successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/PaginatedResponse'
	 *       400:
	 *         description: Invalid query parameters
	 */
	getInspections = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const page = Math.max(1, parseInt(req.query.page as string) || 1);
		const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
		const search = req.query.search as string;
		const farmId = req.query.farmId as string;
		const status = req.query.status as string;
		const inspectorName = req.query.inspectorName as string;

		const result = await this.inspectionService.getInspections(page, limit, search, farmId, status, inspectorName);

		res.json({
			success: true,
			message: `Retrieved ${result.inspections.length} inspections`,
			data: result.inspections,
			pagination: {
				page,
				limit,
				total: result.total,
				totalPages: result.totalPages,
			},
		});
	});

	/**
	 * @swagger
	 * /api/inspections/{id}:
	 *   get:
	 *     summary: Get inspection by ID
	 *     description: Retrieve detailed information about a specific inspection including checklist answers
	 *     tags: [Inspections]
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *         description: Inspection ID
	 *         example: ""
	 *     responses:
	 *       200:
	 *         description: Inspection retrieved successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 *       404:
	 *         description: Inspection not found
	 */
	getInspectionById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const { id } = req.params;
		const inspection = await this.inspectionService.getInspectionById(id);

		res.json({
			success: true,
			message: 'Inspection retrieved successfully',
			data: inspection,
		});
	});

	/**
	 * @swagger
	 * /api/inspections/{id}:
	 *   patch:
	 *     summary: Update inspection
	 *     description: Update inspection details and/or checklist answers. Can be used to correct mistakes in any inspection status.
	 *     tags: [Inspections]
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *         description: Inspection ID
	 *         example: "cm123abc456def"
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             properties:
	 *               inspectorName:
	 *                 type: string
	 *                 description: Name of the inspector
	 *                 example: "Jane Doe"
	 *               checklist:
	 *                 type: array
	 *                 description: Updated checklist answers
	 *                 items:
	 *                   type: object
	 *                   properties:
	 *                     questionId:
	 *                       type: integer
	 *                       example: 1
	 *                     answer:
	 *                       type: boolean
	 *                       example: true
	 *     responses:
	 *       200:
	 *         description: Inspection updated successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 *       400:
	 *         description: Invalid input data or inspection cannot be updated
	 *       404:
	 *         description: Inspection not found
	 */
	updateInspection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const { id } = req.params;
		const data = req.body as UpdateInspectionDto;
		const inspection = await this.inspectionService.updateInspection(id, data);

		res.json({
			success: true,
			message: `Inspection updated successfully. New compliance score: ${inspection.complianceScore}%, Status: ${inspection.status}`,
			data: inspection,
		});
	});

	/**
	 * @swagger
	 * /api/inspections/{id}/approve:
	 *   patch:
	 *     summary: Approve or reject inspection
	 *     description: Manually approve or reject an inspection that is in SUBMITTED status (score >= 80% but < 90%)
	 *     tags: [Inspections]
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *         description: Inspection ID
	 *         example: "cm123abc456def"
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             required:
	 *               - approved
	 *             properties:
	 *               approved:
	 *                 type: boolean
	 *                 description: Whether to approve (true) or reject (false) the inspection
	 *                 example: true
	 *           examples:
	 *             approve:
	 *               summary: Approve inspection
	 *               value:
	 *                 approved: true
	 *             reject:
	 *               summary: Reject inspection
	 *               value:
	 *                 approved: false
	 *     responses:
	 *       200:
	 *         description: Inspection approval status updated successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 *       400:
	 *         description: Inspection cannot be approved (wrong status or low score)
	 *       404:
	 *         description: Inspection not found
	 */
	approveInspection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const { id } = req.params;
		const { approved } = req.body as ApproveInspectionDto;
		const inspection = await this.inspectionService.approveInspection(id, approved);

		res.json({
			success: true,
			message: `Inspection ${approved ? 'approved' : 'rejected'} successfully`,
			data: inspection,
		});
	});

	/**
	 * @swagger
	 * /api/inspections/{id}:
	 *   delete:
	 *     summary: Delete inspection
	 *     description: Delete an inspection. Approved inspections cannot be deleted.
	 *     tags: [Inspections]
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *         description: Inspection ID
	 *         example: "cm123abc456def"
	 *     responses:
	 *       200:
	 *         description: Inspection deleted successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 *       400:
	 *         description: Inspection cannot be deleted (approved status)
	 *       404:
	 *         description: Inspection not found
	 */
	deleteInspection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const { id } = req.params;
		await this.inspectionService.deleteInspection(id);

		res.json({
			success: true,
			message: 'Inspection deleted successfully',
		});
	});

	/**
	 * @swagger
	 * /api/inspections/questions:
	 *   get:
	 *     summary: Get checklist questions
	 *     description: Get all active checklist questions for creating inspections
	 *     tags: [Inspections]
	 *     responses:
	 *       200:
	 *         description: Questions retrieved successfully
	 */
	getQuestions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const questions = await this.inspectionService.getQuestions();

		res.json({
			success: true,
			data: questions,
		});
	});
}

export const inspectionController = new InspectionController();
