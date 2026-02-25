import fs from 'fs';
import { PDFParse } from 'pdf-parse';

export async function parsePdf(filePath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(filePath);
  const pdf = new PDFParse({ data: dataBuffer, verbosity: 0 } as any);
  await pdf.load();
  const result = await pdf.getText();
  return result.text;
}
