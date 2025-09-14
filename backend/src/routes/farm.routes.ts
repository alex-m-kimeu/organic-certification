import { Router } from 'express';
import { farmController } from '../controllers/farm.controller';
import { validateBody } from '../middlewares/validate';
import { rateLimiter } from '../config/rateLimit';
import { createFarmSchema, updateFarmSchema } from '../utils/validations/farm.validation';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Farm:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "cm123abc456def"
 *         farmerId:
 *           type: string
 *           example: "cm123abc456def"
 *         farmName:
 *           type: string
 *           example: "Green Valley Farm"
 *         location:
 *           type: string
 *           example: "Kiambu County, Central Kenya"
 *         areaHa:
 *           type: number
 *           example: 25.5
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-09-12T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2023-09-12T10:30:00.000Z"
 *     FarmWithFields:
 *       allOf:
 *         - $ref: '#/components/schemas/Farm'
 *         - type: object
 *           properties:
 *             fields:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Field'
 *     FarmWithFieldsAndFarmer:
 *       allOf:
 *         - $ref: '#/components/schemas/FarmWithFields'
 *         - type: object
 *           properties:
 *             farmer:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "cm123abc456def"
 *                 name:
 *                   type: string
 *                   example: "John Doe"
 *                 email:
 *                   type: string
 *                   example: "john.doe@email.com"
 */

// Farm CRUD operations
router.post('/', rateLimiter, validateBody(createFarmSchema), farmController.createFarm);
router.get('/', farmController.getFarms);
router.get('/stats', farmController.getFarmStats);
router.get('/:id', farmController.getFarmById);
router.get('/farmer/:farmerId', farmController.getFarmsByFarmerId);
router.patch('/:id', validateBody(updateFarmSchema), farmController.updateFarm);
router.delete('/:id', rateLimiter, farmController.deleteFarm);

export default router;
