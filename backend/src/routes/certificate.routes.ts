import { Router } from 'express';
import { certificateController } from '../controllers/certificate.controller';
import { validateParams } from '../middlewares/validate';
import { rateLimiter } from '../config/rateLimit';
import { certificateIdParamSchema } from '../utils/validations/certificate.validation';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Certificate:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "cm123abc456def"
 *         farmId:
 *           type: string
 *           example: "cm123abc456def"
 *         certificateNo:
 *           type: string
 *           example: "OC2024-0001"
 *         issueDate:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00.000Z"
 *         expiryDate:
 *           type: string
 *           format: date-time
 *           example: "2025-01-15T10:30:00.000Z"
 *         pdfUrl:
 *           type: string
 *           example: "https://res.cloudinary.com/demo/raw/upload/v123456/organic-certificates/cert_OC2024-0001.pdf"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00.000Z"
 *     CertificateWithFarm:
 *       allOf:
 *         - $ref: '#/components/schemas/Certificate'
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
 *     CertificateWithDetails:
 *       allOf:
 *         - $ref: '#/components/schemas/Certificate'
 *         - type: object
 *           properties:
 *             farm:
 *               allOf:
 *                 - $ref: '#/components/schemas/Farm'
 *                 - type: object
 *                   properties:
 *                     farmer:
 *                       $ref: '#/components/schemas/Farmer'
 */

router.get('/', certificateController.getCertificates);
router.get('/:id', validateParams(certificateIdParamSchema), certificateController.getCertificateById);
router.delete('/:id', rateLimiter, validateParams(certificateIdParamSchema), certificateController.deleteCertificate);

export default router;
