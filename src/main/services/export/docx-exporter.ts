import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Packer,
  AlignmentType,
  BorderStyle,
  TabStopPosition,
  TabStopType,
} from 'docx';
import type { StructuredResume } from '../../types';

export async function exportResumeToDocx(resume: StructuredResume): Promise<Buffer> {
  const sections: Paragraph[] = [];

  // Name header
  if (resume.contactInfo.name) {
    sections.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: resume.contactInfo.name,
            bold: true,
            size: 36,
            font: 'Helvetica',
          }),
        ],
      })
    );
  }

  // Contact info
  const contactParts: string[] = [];
  if (resume.contactInfo.email) contactParts.push(resume.contactInfo.email);
  if (resume.contactInfo.phone) contactParts.push(resume.contactInfo.phone);
  if (resume.contactInfo.location) contactParts.push(resume.contactInfo.location);
  if (resume.contactInfo.linkedin) contactParts.push(resume.contactInfo.linkedin);
  if (resume.contactInfo.website) contactParts.push(resume.contactInfo.website);

  if (contactParts.length > 0) {
    sections.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: contactParts.join('  |  '),
            size: 18,
            color: '555555',
            font: 'Helvetica',
          }),
        ],
      })
    );
  }

  // Helper to add section headers
  const addSectionHeader = (title: string) => {
    sections.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 80 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: '333333' },
        },
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: 24,
            color: '333333',
            font: 'Helvetica',
          }),
        ],
      })
    );
  };

  // Summary
  if (resume.summary) {
    addSectionHeader('Professional Summary');
    sections.push(
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({
            text: resume.summary,
            size: 20,
            font: 'Helvetica',
          }),
        ],
      })
    );
  }

  // Experience
  if (resume.experience.length > 0) {
    addSectionHeader('Experience');

    for (const exp of resume.experience) {
      sections.push(
        new Paragraph({
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          spacing: { before: 120, after: 40 },
          children: [
            new TextRun({
              text: exp.title,
              bold: true,
              size: 22,
              font: 'Helvetica',
            }),
            new TextRun({
              text: `\t${exp.startDate} - ${exp.endDate}`,
              size: 18,
              color: '777777',
              font: 'Helvetica',
            }),
          ],
        })
      );

      sections.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: `${exp.company}${exp.location ? ', ' + exp.location : ''}`,
              italics: true,
              size: 20,
              color: '555555',
              font: 'Helvetica',
            }),
          ],
        })
      );

      if (exp.description) {
        sections.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: exp.description,
                size: 20,
                font: 'Helvetica',
              }),
            ],
          })
        );
      }

      for (const highlight of exp.highlights) {
        sections.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 20 },
            children: [
              new TextRun({
                text: highlight,
                size: 20,
                font: 'Helvetica',
              }),
            ],
          })
        );
      }
    }
  }

  // Education
  if (resume.education.length > 0) {
    addSectionHeader('Education');

    for (const edu of resume.education) {
      sections.push(
        new Paragraph({
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          spacing: { before: 120, after: 40 },
          children: [
            new TextRun({
              text: edu.degree,
              bold: true,
              size: 22,
              font: 'Helvetica',
            }),
            new TextRun({
              text: `\t${edu.startDate} - ${edu.endDate}`,
              size: 18,
              color: '777777',
              font: 'Helvetica',
            }),
          ],
        })
      );

      const eduDetails = `${edu.institution}${edu.location ? ', ' + edu.location : ''}${edu.gpa ? ' | GPA: ' + edu.gpa : ''}`;
      sections.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: eduDetails,
              italics: true,
              size: 20,
              color: '555555',
              font: 'Helvetica',
            }),
          ],
        })
      );
    }
  }

  // Skills
  if (resume.skills.length > 0) {
    addSectionHeader('Skills');
    sections.push(
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({
            text: resume.skills.join(', '),
            size: 20,
            font: 'Helvetica',
          }),
        ],
      })
    );
  }

  // Certifications
  if (resume.certifications.length > 0) {
    addSectionHeader('Certifications');
    for (const cert of resume.certifications) {
      sections.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 20 },
          children: [
            new TextRun({
              text: cert,
              size: 20,
              font: 'Helvetica',
            }),
          ],
        })
      );
    }
  }

  // Languages
  if (resume.languages.length > 0) {
    addSectionHeader('Languages');
    sections.push(
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({
            text: resume.languages.join(', '),
            size: 20,
            font: 'Helvetica',
          }),
        ],
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sections,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
