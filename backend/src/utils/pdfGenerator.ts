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
	try {
		// Read the HTML template
		const templatePath = path.join(__dirname, '../templates/certificate-template.html');
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

		// Launch Puppeteer browser
		const browser = await puppeteer.launch({
			headless: true,
			args: [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				'--disable-dev-shm-usage',
				'--disable-accelerated-2d-canvas',
				'--no-first-run',
				'--no-zygote',
				'--single-process',
				'--disable-gpu',
			],
		});

		const page = await browser.newPage();

		// Set the content
		await page.setContent(htmlContent, {
			waitUntil: 'networkidle0',
		});

		// Generate PDF
		const pdfBuffer = await page.pdf({
			format: 'A4',
			printBackground: true,
			margin: {
				top: '0',
				right: '0',
				bottom: '0',
				left: '0',
			},
		});

		// Close browser
		await browser.close();

		return Buffer.from(pdfBuffer);
	} catch (error) {
		throw new Error(
			`Failed to generate certificate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
	}
};

export default {
	generateCertificatePdf,
};
