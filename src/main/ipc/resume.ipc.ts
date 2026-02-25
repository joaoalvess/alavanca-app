import { ipcMain, dialog } from 'electron';
import path from 'path';
import { parsePdf } from '../services/parser/pdf-parser';
import { parseDocx } from '../services/parser/docx-parser';

export function registerResumeIpc(): void {
  ipcMain.handle('resume:select-file', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Resume File',
      filters: [
        { name: 'Resume Files', extensions: ['pdf', 'docx'] },
        { name: 'PDF Files', extensions: ['pdf'] },
        { name: 'Word Documents', extensions: ['docx'] },
      ],
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  ipcMain.handle('resume:parse', async (_event, filePath: string) => {
    const ext = path.extname(filePath).toLowerCase();
    const filename = path.basename(filePath);

    let text: string;
    if (ext === '.pdf') {
      text = await parsePdf(filePath);
    } else if (ext === '.docx') {
      text = await parseDocx(filePath);
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }

    return { text, filename };
  });
}
