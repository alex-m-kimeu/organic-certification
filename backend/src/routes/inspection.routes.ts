import { Router } from 'express';
import { inspectionController } from '../controllers/inspection.controller';
import { validateBody } from '../middlewares/validate';
import { rateLimiter } from '../config/rateLimit';
import {
	createInspectionSchema,
	updateInspectionSchema,
	approveInspectionSchema,
} from '../utils/validations/inspection.validation';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Inspection:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: ""
 *         farmId:
 *           type: string
 *           example: ""
 *         date:
 *           type: string
 *           format: date-time
 *           example: ""
 *         inspectorName:
 *           type: string
 *           example: ""
 *         status:
 *           type: string
 *           enum: [DRAFT, SUBMITTED, APPROVED, REJECTED]
 *           example: ""
 *         complianceScore:
 *           type: number
 *           format: float
 *           minimum: 0
 *           maximum: 100
 *           example: 85.5
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: ""
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: ""
 *
 *     ChecklistQuestion:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         question:
 *           type: string
 *           example: "Any synthetic inputs in the last 36 months?"
 *         description:
 *           type: string
 *           example: "Check if any synthetic fertilizers, pesticides, or other prohibited substances have been used on the farm in the past 36 months."
 *         order:
 *           type: integer
 *           example: 1
 *         isActive:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-09-15T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2023-09-15T10:30:00.000Z"
 *
 *     InspectionChecklist:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "cm123abc456def"
 *         inspectionId:
 *           type: string
 *           example: "cm123abc456def"
 *         questionId:
 *           type: integer
 *           example: 1
 *         answer:
 *           type: boolean
 *           example: true
 *         question:
 *           $ref: '#/components/schemas/ChecklistQuestion'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-09-15T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2023-09-15T10:30:00.000Z"
 *
 *     InspectionWithFarm:
 *       allOf:
 *         - $ref: '#/components/schemas/Inspection'
 *         - type: object
 *           properties:
 *             farm:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "cm123abc456def"
 *                 farmName:
 *                   type: string
 *                   example: "Green Valley Farm"
 *                 location:
 *                   type: string
 *                   example: "Kiambu County, Central Kenya"
 *                 farmer:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "cm123abc456def"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       example: "john.doe@email.com"
 *             checklist:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InspectionChecklist'
 *
 *     InspectionWithDetails:
 *       allOf:
 *         - $ref: '#/components/schemas/Inspection'
 *         - type: object
 *           properties:
 *             farm:
 *               allOf:
 *                 - $ref: '#/components/schemas/Farm'
 *                 - type: object
 *                   properties:
 *                     farmer:
 *                       $ref: '#/components/schemas/Farmer'
 *             checklist:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InspectionChecklist'
 */

// Inspection CRUD operations
router.post('/', rateLimiter, validateBody(createInspectionSchema), inspectionController.createInspection);
router.get('/', inspectionController.getInspections);
router.get('/questions', inspectionController.getQuestions);
router.get('/:id', inspectionController.getInspectionById);
router.patch('/:id', validateBody(updateInspectionSchema), inspectionController.updateInspection);
router.patch('/:id/approve', validateBody(approveInspectionSchema), inspectionController.approveInspection);
router.delete('/:id', rateLimiter, inspectionController.deleteInspection);

export default router;
