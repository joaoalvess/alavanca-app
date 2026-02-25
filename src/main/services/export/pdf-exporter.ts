import type { StructuredResume } from '../../types';
import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';

export async function exportResumeToPdf(resume: StructuredResume): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfMake = require('pdfmake/build/pdfmake');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfFonts = require('pdfmake/build/vfs_fonts');
  pdfMake.vfs = pdfFonts;

  const content: Content[] = [];

  // Header - Name
  if (resume.contactInfo.name) {
    content.push({
      text: resume.contactInfo.name,
      style: 'name',
      alignment: 'center' as const,
    });
  }

  // Contact info line
  const contactParts: string[] = [];
  if (resume.contactInfo.email) contactParts.push(resume.contactInfo.email);
  if (resume.contactInfo.phone) contactParts.push(resume.contactInfo.phone);
  if (resume.contactInfo.location) contactParts.push(resume.contactInfo.location);
  if (resume.contactInfo.linkedin) contactParts.push(resume.contactInfo.linkedin);
  if (resume.contactInfo.website) contactParts.push(resume.contactInfo.website);

  if (contactParts.length > 0) {
    content.push({
      text: contactParts.join('  |  '),
      style: 'contactInfo',
      alignment: 'center' as const,
    });
  }

  // Summary
  if (resume.summary) {
    content.push({ text: 'PROFESSIONAL SUMMARY', style: 'sectionHeader' });
    content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#333333' }] } as any);
    content.push({ text: resume.summary, style: 'body', margin: [0, 5, 0, 10] as [number, number, number, number] });
  }

  // Experience
  if (resume.experience.length > 0) {
    content.push({ text: 'EXPERIENCE', style: 'sectionHeader' });
    content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#333333' }] } as any);

    for (const exp of resume.experience) {
      content.push({
        columns: [
          { text: `${exp.title}`, style: 'jobTitle', width: '*' },
          { text: `${exp.startDate} - ${exp.endDate}`, style: 'dates', width: 'auto', alignment: 'right' as const },
        ],
        margin: [0, 5, 0, 0] as [number, number, number, number],
      });
      content.push({
        text: `${exp.company}${exp.location ? ', ' + exp.location : ''}`,
        style: 'company',
      });
      if (exp.description) {
        content.push({ text: exp.description, style: 'body' });
      }
      if (exp.highlights.length > 0) {
        content.push({
          ul: exp.highlights,
          style: 'body',
          margin: [10, 2, 0, 8] as [number, number, number, number],
        });
      }
    }
  }

  // Education
  if (resume.education.length > 0) {
    content.push({ text: 'EDUCATION', style: 'sectionHeader' });
    content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#333333' }] } as any);

    for (const edu of resume.education) {
      content.push({
        columns: [
          { text: edu.degree, style: 'jobTitle', width: '*' },
          { text: `${edu.startDate} - ${edu.endDate}`, style: 'dates', width: 'auto', alignment: 'right' as const },
        ],
        margin: [0, 5, 0, 0] as [number, number, number, number],
      });
      content.push({
        text: `${edu.institution}${edu.location ? ', ' + edu.location : ''}${edu.gpa ? ' | GPA: ' + edu.gpa : ''}`,
        style: 'company',
        margin: [0, 0, 0, 5] as [number, number, number, number],
      });
    }
  }

  // Skills
  if (resume.skills.length > 0) {
    content.push({ text: 'SKILLS', style: 'sectionHeader' });
    content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#333333' }] } as any);
    content.push({ text: resume.skills.join(', '), style: 'body', margin: [0, 5, 0, 10] as [number, number, number, number] });
  }

  // Certifications
  if (resume.certifications.length > 0) {
    content.push({ text: 'CERTIFICATIONS', style: 'sectionHeader' });
    content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#333333' }] } as any);
    content.push({
      ul: resume.certifications,
      style: 'body',
      margin: [10, 5, 0, 10] as [number, number, number, number],
    });
  }

  // Languages
  if (resume.languages.length > 0) {
    content.push({ text: 'LANGUAGES', style: 'sectionHeader' });
    content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#333333' }] } as any);
    content.push({ text: resume.languages.join(', '), style: 'body', margin: [0, 5, 0, 10] as [number, number, number, number] });
  }

  const docDefinition: TDocumentDefinitions = {
    content,
    defaultStyle: {
      font: 'Roboto',
    },
    styles: {
      name: {
        fontSize: 20,
        bold: true,
        margin: [0, 0, 0, 2],
      },
      contactInfo: {
        fontSize: 9,
        color: '#555555',
        margin: [0, 0, 0, 15],
      },
      sectionHeader: {
        fontSize: 12,
        bold: true,
        color: '#333333',
        margin: [0, 10, 0, 2],
      },
      jobTitle: {
        fontSize: 11,
        bold: true,
      },
      company: {
        fontSize: 10,
        italics: true,
        color: '#555555',
        margin: [0, 0, 0, 3],
      },
      dates: {
        fontSize: 9,
        color: '#777777',
      },
      body: {
        fontSize: 10,
        lineHeight: 1.3,
      },
    },
    pageMargins: [40, 40, 40, 40],
  };

  return new Promise<Buffer>((resolve, reject) => {
    const pdfDoc = pdfMake.createPdf(docDefinition);
    pdfDoc.getBuffer((buffer: Uint8Array) => {
      try {
        resolve(Buffer.from(buffer));
      } catch (err) {
        reject(err);
      }
    });
  });
}
