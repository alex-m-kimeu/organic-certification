import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { GenerateCertificateDto } from '../types/certificate.types';

interface CertificateData extends GenerateCertificateDto {
	certificateNumber: string;
	issueDate: Date;
	expiryDate: Date;
	farmerName: string;
	farmName: string;
	farmLocation: string;
	farmArea: number;
}

/**
 * Generate certificate PDF buffer using Puppeteer
 */
export const generateCertificatePdf = async (data: CertificateData): Promise<Buffer> => {
	let browser;
	try {
		// Fix path resolution - try multiple paths for Docker compatibility
		const possiblePaths = [
			path.join(process.cwd(), 'src/templates/certificate-template.html'),
			path.join(__dirname, '../templates/certificate-template.html'),
			path.join(process.cwd(), 'dist/templates/certificate-template.html'),
			path.join(process.cwd(), 'templates/certificate-template.html'),
		];

		let templatePath = null;
		for (const path of possiblePaths) {
			if (fs.existsSync(path)) {
				templatePath = path;
				break;
			}
		}

		if (!templatePath) {
			throw new Error(`Certificate template not found. Checked paths: ${possiblePaths.join(', ')}`);
		}

		let htmlContent = fs.readFileSync(templatePath, 'utf8');

		// Replace template variables with actual data
		const templateData = {
			certificateNumber: data.certificateNumber,
			farmerName: data.farmerName,
			farmName: data.farmName,
			farmLocation: data.farmLocation || '-',
			farmArea: data.farmArea?.toString() || '-',
			complianceScore: Math.round(data.complianceScore),
			inspectorName: data.inspectorName || '-',
			issueDate: data.issueDate.toLocaleDateString('en-GB'),
			expiryDate: data.expiryDate.toLocaleDateString('en-GB'),
		};

		// Replace all template variables
		for (const [key, value] of Object.entries(templateData)) {
			const regex = new RegExp(`{{${key}}}`, 'g');
			htmlContent = htmlContent.replace(regex, value.toString());
		}

		// Enhanced Puppeteer configuration for Docker
		browser = await puppeteer.launch({
			headless: true, // Use standard headless mode
			executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
			args: [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				'--disable-dev-shm-usage',
				'--disable-accelerated-2d-canvas',
				'--no-first-run',
				'--no-zygote',
				'--single-process',
				'--disable-gpu',
				'--disable-web-security',
				'--disable-features=VizDisplayCompositor',
				'--disable-background-timer-throttling',
				'--disable-backgrounding-occluded-windows',
				'--disable-renderer-backgrounding',
				'--disable-extensions',
				'--disable-plugins',
				'--disable-default-apps',
				'--no-default-browser-check',
			],
		});

		const page = await browser.newPage();

		// Set viewport for consistent PDF generation
		await page.setViewport({ width: 794, height: 1123 }); // A4 dimensions in pixels

		// Set the content with better error handling
		await page.setContent(htmlContent, {
			waitUntil: ['networkidle0', 'domcontentloaded'],
			timeout: 30000, // 30 second timeout
		});

		// Generate PDF with optimized settings
		const pdfBuffer = await page.pdf({
			format: 'A4',
			printBackground: true,
			preferCSSPageSize: false,
			margin: {
				top: '0',
				right: '0',
				bottom: '0',
				left: '0',
			},
			timeout: 30000, // 30 second timeout
		});

		// Close browser
		await browser.close();

		return Buffer.from(pdfBuffer);
	} catch (error) {
		// Ensure browser is closed even if error occurs
		if (browser) {
			try {
				await browser.close();
			} catch {
				// Silently handle browser close errors
			}
		}

		throw new Error(
			`Failed to generate certificate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
	}
};

export default {
	generateCertificatePdf,
};
