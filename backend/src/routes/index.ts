import { Router } from 'express';
import farmerRoutes from './farmer.routes';

const router = Router();

/**
 * @swagger
 * /api:
 *   get:
 *     summary: API status and information
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is running successfully
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
 *                   example: "Organic Certification API is running"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 docs:
 *                   type: string
 *                   example: "/api/docs"
 */

// API Info endpoint
router.get('/', (req, res) => {
	res.json({
		success: true,
		message: 'Organic Certification API is running',
		version: '1.0.0',
		endpoints: {
			farmers: '/api/farmers',
			// farms: '/api/farms', // Will be added later
			// fields: '/api/fields', // Will be added later
			// inspections: '/api/inspections', // Will be added later
			// certificates: '/api/certificates', // Will be added later
		},
		docs: '/api/docs',
		health: '/health',
	});
});

// Mount route modules
router.use('/farmers', farmerRoutes);

// Future route modules will be added here:
// router.use('/farms', farmRoutes);
// router.use('/fields', fieldRoutes);
// router.use('/inspections', inspectionRoutes);
// router.use('/certificates', certificateRoutes);

// Handle unmatched API routes - catch all remaining routes
router.use((req, res) => {
	res.status(404).json({
		success: false,
		message: `API endpoint ${req.originalUrl} not found`,
		error: 'Not Found',
		availableEndpoints: {
			farmers: '/api/farmers',
			docs: '/api/docs',
			health: '/health',
		},
	});
});

export default router;
