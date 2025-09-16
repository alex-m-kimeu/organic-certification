import PDFDocument from 'pdfkit';
import { GenerateCertificateDto } from '../types/certificate.types';

/**
 * Local PDFKit instance extension to allow ellipse usage.
 */
interface PDFKitWithEllipse extends PDFKit.PDFDocument {
	ellipse(x: number, y: number, r1: number, r2: number): this;
}

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
 * Generate certificate PDF buffer
 */
export const generateCertificatePdf = async (data: CertificateData): Promise<Buffer> => {
	return new Promise((resolve, reject) => {
		try {
			const doc = new PDFDocument({
				size: 'A4',
				margin: 40,
				info: {
					Title: `Organic Certificate - ${data.certificateNumber}`,
					Author: 'Alex Organic Certification Authority',
					Subject: 'Organic Certificate',
					Creator: 'Alex Certification System',
				},
			}) as PDFKitWithEllipse;

			const chunks: Buffer[] = [];
			doc.on('data', (c: Buffer) => chunks.push(c));
			doc.on('end', () => resolve(Buffer.concat(chunks)));
			doc.on('error', (err: Error) => reject(err));

			renderCertificate(doc, data);

			doc.end();
		} catch (err) {
			reject(err);
		}
	});
};

/* -------------------------
   Main renderer
   ------------------------- */
const renderCertificate = (doc: PDFKitWithEllipse, data: CertificateData): void => {
	const pageW = doc.page.width;
	const pageH = doc.page.height;
	const margin = 40;

	// Layout reservations
	const headerHeight = 140;
	const footerHeight = 140; // increased footer room
	const contentTop = headerHeight + 20;

	// Fancy outer border (double-line + corner flourishes)
	drawOuterBorder(doc, pageW, pageH, margin);

	// Header with confined medallion
	drawHeaderMedallion(doc, pageW, margin, headerHeight);

	// Title & certificate number
	drawTitleBlock(doc, pageW, margin);
	drawCertificateNumberLabel(doc, pageW, data.certificateNumber, 200);

	// Divider
	doc.strokeColor('#d4af37')
		.lineWidth(1)
		.moveTo(pageW / 2 - 80, 222)
		.lineTo(pageW / 2 + 80, 222)
		.stroke();

	// Main content start
	let y = contentTop + 100;

	// "This is to certify that" — italic
	doc.font('Helvetica-Oblique')
		.fontSize(13)
		.fillColor('#222')
		.text('This is to certify that', margin, y, { align: 'center', width: pageW - 2 * margin });

	y += 36;

	// Farmer name (emphasized)
	doc.font('Helvetica-Bold')
		.fontSize(28)
		.fillColor('#1f5a2f')
		.text(data.farmerName.toUpperCase(), margin, y, { align: 'center', width: pageW - 2 * margin });

	// decorative line under name
	doc.strokeColor('#d4af37')
		.lineWidth(0.9)
		.moveTo(pageW / 2 - 110, y + 34)
		.lineTo(pageW / 2 + 110, y + 34)
		.stroke();

	y += 56;

	// farm "Operating the organic farm:"
	doc.font('Helvetica-Oblique')
		.fontSize(12)
		.fillColor('#333')
		.text('Operating the organic farm:', margin, y, { align: 'center', width: pageW - 2 * margin });

	y += 22;

	// Farm name emphasized
	doc.font('Helvetica-Bold')
		.fontSize(20)
		.fillColor('#1f5a2f')
		.text(`"${data.farmName}"`, margin, y, { align: 'center', width: pageW - 2 * margin });

	y += 44;

	// Farm details grid-like (two columns)
	drawFarmDetailsGrid(doc, data, pageW, margin, y);

	y += 90;

	// Certification statement (italic), centered
	const certStatement =
		'Has successfully met all requirements for organic certification and is hereby authorized to produce, process, handle and sell organic products in accordance with applicable organic standards.';
	doc.font('Helvetica-Oblique')
		.fontSize(11)
		.fillColor('#222')
		.text(certStatement, margin + 40, y, { align: 'center', width: pageW - 2 * (margin + 40), lineGap: 4 });

	y += 80;

	// Compliance badge + dates + signature area
	drawBottomSection(doc, data, pageW, margin, y);

	// Footer (security)
	drawSecurityFooter(doc, pageW, pageH, margin, footerHeight, data.certificateNumber);
};

/* -------------------------
   Outer border & corners
   ------------------------- */
const drawOuterBorder = (doc: PDFKitWithEllipse, pageW: number, pageH: number, margin: number): void => {
	const outer = margin - 12;
	doc.lineWidth(1.2)
		.strokeColor('#2d5a27')
		.rect(outer, outer, pageW - 2 * outer, pageH - 2 * outer)
		.stroke();

	const inner = outer + 10;
	doc.lineWidth(0.9)
		.strokeColor('#d4af37')
		.rect(inner, inner, pageW - 2 * inner, pageH - 2 * inner)
		.stroke();

	// corner flourishes
	const flourishLen = 12;
	const offset = outer + 6;
	doc.lineWidth(1).strokeColor('#d4af37');

	doc.moveTo(offset, offset + flourishLen)
		.lineTo(offset, offset)
		.lineTo(offset + flourishLen, offset)
		.stroke();
	doc.moveTo(pageW - offset - flourishLen, offset)
		.lineTo(pageW - offset, offset)
		.lineTo(pageW - offset, offset + flourishLen)
		.stroke();
	doc.moveTo(offset, pageH - offset - flourishLen)
		.lineTo(offset, pageH - offset)
		.lineTo(offset + flourishLen, pageH - offset)
		.stroke();
	doc.moveTo(pageW - offset - flourishLen, pageH - offset)
		.lineTo(pageW - offset, pageH - offset)
		.lineTo(pageW - offset, pageH - offset - flourishLen)
		.stroke();
};

/* -------------------------
   Header medallion (confined)
   ------------------------- */
const drawHeaderMedallion = (doc: PDFKitWithEllipse, pageW: number, margin: number, headerHeight: number): void => {
	const centerX = pageW / 2;
	const centerY = margin + Math.floor(headerHeight / 2);
	const outerR = Math.min(44, Math.floor(headerHeight / 2) - 8);

	doc.save();
	doc.rect(margin, margin - 6, pageW - 2 * margin, headerHeight + 6)
		.fillColor('#fbfbf8')
		.fillOpacity(1)
		.fill();
	doc.restore();

	doc.circle(centerX, centerY, outerR).lineWidth(2.4).strokeColor('#d4af37').stroke();
	doc.circle(centerX, centerY, outerR - 8)
		.fillColor('#1e5a2f')
		.fill();
	doc.circle(centerX, centerY, outerR - 20)
		.fillColor('#f6f3eb')
		.fill();

	drawLaurel(doc, centerX, centerY, outerR + 6);

	const ribbonW = outerR * 1.8;
	doc.roundedRect(centerX - ribbonW / 2, centerY + outerR - 8, ribbonW, 10, 3)
		.fillColor('#d4af37')
		.fill();

	doc.font('Helvetica-Bold')
		.fontSize(11)
		.fillColor('#fff')
		.text('CERTIFIED', centerX - (outerR - 10), centerY - 10, { width: (outerR - 10) * 2, align: 'center' });
	doc.font('Helvetica')
		.fontSize(9)
		.fillColor('#fff')
		.text('ORGANIC', centerX - (outerR - 10), centerY + 2, { width: (outerR - 10) * 2, align: 'center' });

	doc.font('Helvetica-Bold')
		.fontSize(7)
		.fillColor('#1e5a2f')
		.text('Organic', centerX - 12, centerY - 3, { width: 24, align: 'center' });
};

/* Laurel - ellipse leaves */
const drawLaurel = (doc: PDFKitWithEllipse, cx: number, cy: number, radius: number): void => {
	const leafCount = 9;
	const drawSide = (startDeg: number, endDeg: number, flip: boolean): void => {
		const start = (startDeg * Math.PI) / 180;
		const end = (endDeg * Math.PI) / 180;
		for (let i = 0; i <= leafCount; i++) {
			const t = start + (i / leafCount) * (end - start);
			const lx = cx + Math.cos(t) * radius;
			const ly = cy + Math.sin(t) * radius;
			doc.save();
			doc.translate(lx, ly);
			doc.rotate((t * 180) / Math.PI + (flip ? 90 : -90));
			doc.ellipse(0, 0, 5, 2.6).fillColor('#2d6b36').fill();
			doc.restore();
		}
	};
	drawSide(-118, -42, true);
	drawSide(222, 298, false);
};

/* -------------------------
   Title & certificate number
   ------------------------- */
const drawTitleBlock = (doc: PDFKitWithEllipse, pageW: number, margin: number): void => {
	doc.font('Helvetica-Bold')
		.fontSize(24)
		.fillColor('#1f5a2f')
		.text('CERTIFICATE', margin, 120, { align: 'center', width: pageW - 2 * margin });
	doc.font('Helvetica')
		.fontSize(14)
		.fillColor('#4a7c59')
		.text('OF ORGANIC COMPLIANCE', margin, 148, { align: 'center', width: pageW - 2 * margin });
};

const drawCertificateNumberLabel = (doc: PDFKitWithEllipse, pageW: number, certNo: string, topY: number): void => {
	const boxW = 300;
	const boxH = 28;
	const x = (pageW - boxW) / 2;
	const y = topY;

	doc.roundedRect(x, y, boxW, boxH, 4).lineWidth(0.8).strokeColor('#1f5a2f').stroke();

	doc.font('Helvetica-Bold')
		.fontSize(11)
		.fillColor('#1f5a2f')
		.text(`Certificate No: ${certNo}`, x, y + 7, { width: boxW, align: 'center' });
};

/* -------------------------
   Farm details grid
   ------------------------- */
const drawFarmDetailsGrid = (
	doc: PDFKitWithEllipse,
	data: CertificateData,
	pageW: number,
	margin: number,
	y: number,
): void => {
	const maxWidth = 520;
	const left = (pageW - maxWidth) / 2;
	const colW = maxWidth / 2;
	const gapY = 18;

	doc.font('Helvetica-Bold')
		.fontSize(12)
		.fillColor('#1f5a2f')
		.text('FARM CERTIFICATION DETAILS', left, y - 6, { width: maxWidth, align: 'center' });

	const r1x = left;
	const r2x = left + colW;

	doc.font('Helvetica')
		.fontSize(11)
		.fillColor('#333')
		.text(`Location: ${data.farmLocation || '-'}`, r1x, y + 18, { width: colW })
		.text(`Total Area: ${data.farmArea ?? '-'} hectares`, r1x, y + 18 + gapY, { width: colW });

	doc.font('Helvetica')
		.fontSize(11)
		.fillColor('#333')
		.text(`Compliance Score: ${Math.round(data.complianceScore)}%`, r2x, y + 18, { width: colW })
		.text(`Certified Inspector: ${data.inspectorName || '-'}`, r2x, y + 18 + gapY, { width: colW });
};

/* -------------------------
   Bottom section: badge + dates + signature
   ------------------------- */
const drawBottomSection = (
	doc: PDFKitWithEllipse,
	data: CertificateData,
	pageW: number,
	margin: number,
	y: number,
): void => {
	const leftX = margin + 40;
	const centerX = pageW / 2;

	// Compliance circular badge
	const badgeR = 42;
	const badgeX = leftX + badgeR;
	const badgeY = y + badgeR;

	doc.circle(badgeX, badgeY, badgeR).lineWidth(1).strokeColor('#4CAF50').stroke();
	doc.circle(badgeX, badgeY, badgeR - 6)
		.fillColor('#fff')
		.fill();
	doc.circle(badgeX, badgeY, badgeR - 10)
		.fillColor('#4CAF50')
		.fill();

	doc.font('Helvetica-Bold')
		.fontSize(16)
		.fillColor('#ffffff')
		.text(`${Math.round(data.complianceScore)}%`, badgeX - 24, badgeY - 10, { width: 48, align: 'center' });
	doc.font('Helvetica-Bold')
		.fontSize(8)
		.fillColor('#fff')
		.text('COMPLIANCE', badgeX - 28, badgeY + 6, { width: 56, align: 'center' });

	// Dates block roughly centered-right
	const datesX = centerX + 40;
	const dateGap = 18;
	doc.font('Helvetica-Bold')
		.fontSize(10)
		.fillColor('#1f5a2f')
		.text('ISSUED:', datesX, y + 6)
		.text('EXPIRES:', datesX, y + 6 + dateGap);

	doc.font('Helvetica')
		.fontSize(10)
		.fillColor('#333')
		.text(data.issueDate.toLocaleDateString('en-GB'), datesX + 70, y + 6)
		.text(data.expiryDate.toLocaleDateString('en-GB'), datesX + 70, y + 6 + dateGap);

	// Signature block on far right
	const sigX = pageW - margin - 190;
	const sigY = y;
	doc.font('Helvetica')
		.fontSize(10)
		.fillColor('#666')
		.text('Certified Inspector:', sigX, sigY + 6);

	const lineY = sigY + 28;
	doc.moveTo(sigX, lineY)
		.lineTo(sigX + 140, lineY)
		.lineWidth(0.9)
		.strokeColor('#333')
		.stroke();

	doc.font('Helvetica-Oblique')
		.fontSize(10)
		.fillColor('#222')
		.text(data.inspectorName || '-', sigX, lineY + 6, { width: 140, align: 'center' });
};

/* -------------------------
   Security footer
   ------------------------- */
const drawSecurityFooter = (
	doc: PDFKitWithEllipse,
	pageW: number,
	pageH: number,
	margin: number,
	footerHeight: number,
	certNo: string,
): void => {
	const top = pageH - margin - footerHeight + 24;
	const left = margin + 18;
	const right = pageW - margin - 18;

	doc.strokeColor('#e9ecef')
		.lineWidth(0.6)
		.moveTo(left, top - 6)
		.lineTo(right, top - 6)
		.stroke();

	const secText = `This certificate is valid for one year from issue date. For verification visit: verify | Security code: ${certNo}`;
	doc.font('Helvetica')
		.fontSize(8)
		.fillColor('#666')
		.text(secText, left, top, {
			width: pageW - 2 * left,
			align: 'center',
			lineGap: 3,
		});
};

export default {
	generateCertificatePdf,
};
