import { Router } from 'express';
import { farmerController } from '../controllers/farmer.controller';
import { validateBody } from '../middlewares/validate';
import { rateLimiter } from '../config/rateLimit';
import { createFarmerSchema, updateFarmerSchema } from '../utils/validations/farmer.validation';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Farmer:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "cm123abc456def"
 *         name:
 *           type: string
 *           example: "John Doe"
 *         phone:
 *           type: string
 *           example: "+254712345678"
 *         email:
 *           type: string
 *           format: email
 *           example: "john.doe@email.com"
 *         county:
 *           type: string
 *           example: "Nairobi"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-09-12T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2023-09-12T10:30:00.000Z"
 */

router.post('/', rateLimiter, validateBody(createFarmerSchema), farmerController.createFarmer);
router.get('/', farmerController.getFarmers);
router.get('/:id', farmerController.getFarmerById);
router.patch('/:id', validateBody(updateFarmerSchema), farmerController.updateFarmer);
router.delete('/:id', rateLimiter, farmerController.deleteFarmer);

export default router;
