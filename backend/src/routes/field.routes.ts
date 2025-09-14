import { Router } from 'express';
import { fieldController } from '../controllers/field.controller';
import { validateBody } from '../middlewares/validate';
import { rateLimiter } from '../config/rateLimit';
import { createFieldSchema, updateFieldSchema } from '../utils/validations/field.validation';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Field:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "cm123abc456def"
 *         farmId:
 *           type: string
 *           example: "cm123abc456def"
 *         name:
 *           type: string
 *           example: "North Field"
 *         crop:
 *           type: string
 *           example: "Maize"
 *         areaHa:
 *           type: number
 *           example: 5.25
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-09-12T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2023-09-12T10:30:00.000Z"
 *     FieldWithFarm:
 *       allOf:
 *         - $ref: '#/components/schemas/Field'
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
 *     CropType:
 *       type: string
 *       enum: [
 *         "Maize", "Beans", "Wheat", "Rice", "Barley", "Sorghum", "Millet",
 *         "Cassava", "Sweet Potatoes", "Irish Potatoes", "Bananas", "Plantains",
 *         "Sugarcane", "Cotton", "Coffee", "Tea", "Pyrethrum", "Sunflower",
 *         "Groundnuts", "Soybeans", "Green Grams", "Cowpeas", "Pigeon Peas",
 *         "Tomatoes", "Onions", "Carrots", "Cabbages", "Kales", "Spinach",
 *         "Lettuce", "Cucumbers", "Watermelons", "Mangoes", "Avocados",
 *         "Citrus", "Passion Fruit", "Pineapples", "Macadamia", "Cashew Nuts",
 *         "Coconuts", "Other"
 *       ]
 */

// Field CRUD operations
router.post('/', rateLimiter, validateBody(createFieldSchema), fieldController.createField);
router.get('/', fieldController.getFields);
router.get('/stats', fieldController.getFieldStats);
router.get('/crops', fieldController.getCropTypes);
router.get('/:id', fieldController.getFieldById);
router.get('/farm/:farmId', fieldController.getFieldsByFarmId);
router.patch('/:id', validateBody(updateFieldSchema), fieldController.updateField);
router.delete('/:id', rateLimiter, fieldController.deleteField);

export default router;
