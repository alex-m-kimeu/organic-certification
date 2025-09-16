import { Request, Response } from 'express';
import { CertificateService } from '../services/certificate.service';
import { asyncHandler, ServiceErrors } from '../middlewares/errorHandler';
import { ApiResponse, PaginatedResponse } from '../types/common.types';
import { CertificateWithDetails, CertificateWithFarm } from '../types/certificate.types';

export class CertificateController {
	private certificateService: CertificateService;

	constructor() {
		this.certificateService = new CertificateService();
	}

	/**
	 * @swagger
	 * /api/certificates:
	 *   get:
	 *     summary: Get all certificates with pagination and filtering
	 *     tags: [Certificates]
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
	 *         description: Number of certificates per page
	 *       - in: query
	 *         name: search
	 *         schema:
	 *           type: string
	 *         description: Search term for certificate number, farm name, location, or farmer name
	 *       - in: query
	 *         name: farmId
	 *         schema:
	 *           type: string
	 *         description: Filter by farm ID
	 *       - in: query
	 *         name: status
	 *         schema:
	 *           type: string
	 *           enum: [active, expired, expiring]
	 *         description: Filter by certificate status
	 *     responses:
	 *       200:
	 *         description: Certificates retrieved successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 success:
	 *                   type: boolean
	 *                   example: true
	 *                 message:
	 *                   type: string
	 *                   example: "Certificates retrieved successfully"
	 *                 data:
	 *                   type: array
	 *                   items:
	 *                     $ref: '#/components/schemas/CertificateWithFarm'
	 *                 pagination:
	 *                   type: object
	 *                   properties:
	 *                     page:
	 *                       type: integer
	 *                       example: 1
	 *                     limit:
	 *                       type: integer
	 *                       example: 10
	 *                     total:
	 *                       type: integer
	 *                       example: 25
	 *                     totalPages:
	 *                       type: integer
	 *                       example: 3
	 *       400:
	 *         description: Invalid query parameters
	 *       500:
	 *         description: Internal server error
	 */
	public getCertificates = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const page = Math.max(1, parseInt(req.query.page as string) || 1);
		const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
		const search = req.query.search as string;
		const farmId = req.query.farmId as string;
		const status = req.query.status as string;

		const result = await this.certificateService.getCertificates(page, limit, search, farmId, status);

		const response: PaginatedResponse<CertificateWithFarm> = {
			success: true,
			message: 'Certificates retrieved successfully',
			data: result.certificates,
			pagination: {
				page,
				limit,
				total: result.total,
				totalPages: result.totalPages,
			},
		};

		res.status(200).json(response);
	});

	/**
	 * @swagger
	 * /api/certificates/{id}:
	 *   get:
	 *     summary: Get certificate by ID with full details
	 *     description: Returns certificate data including PDF URL for download
	 *     tags: [Certificates]
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *         description: Certificate ID
	 *     responses:
	 *       200:
	 *         description: Certificate retrieved successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 success:
	 *                   type: boolean
	 *                   example: true
	 *                 message:
	 *                   type: string
	 *                   example: "Certificate retrieved successfully"
	 *                 data:
	 *                   $ref: '#/components/schemas/CertificateWithDetails'
	 *       400:
	 *         description: Invalid certificate ID
	 *       404:
	 *         description: Certificate not found
	 *       500:
	 *         description: Internal server error
	 */
	public getCertificateById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const { id } = req.params;

		ServiceErrors.validateRequiredString(id, 'Certificate ID');

		const certificate = await this.certificateService.getCertificateById(id);

		const response: ApiResponse<CertificateWithDetails> = {
			success: true,
			message: 'Certificate retrieved successfully',
			data: certificate,
		};

		res.status(200).json(response);
	});

	/**
	 * @swagger
	 * /api/certificates/{id}:
	 *   delete:
	 *     summary: Delete certificate by ID
	 *     tags: [Certificates]
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *         description: Certificate ID
	 *     responses:
	 *       200:
	 *         description: Certificate deleted successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 success:
	 *                   type: boolean
	 *                   example: true
	 *                 message:
	 *                   type: string
	 *                   example: "Certificate deleted successfully"
	 *       400:
	 *         description: Invalid certificate ID
	 *       404:
	 *         description: Certificate not found
	 *       500:
	 *         description: Internal server error
	 */
	public deleteCertificate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const { id } = req.params;

		ServiceErrors.validateRequiredString(id, 'Certificate ID');

		await this.certificateService.deleteCertificate(id);

		const response: ApiResponse<null> = {
			success: true,
			message: 'Certificate deleted successfully',
		};

		res.status(200).json(response);
	});
}

export const certificateController = new CertificateController();
