import { ipcMain, dialog } from 'electron';
import fs from 'fs';
import { getDb } from '../db/database';
import { exportResumeToPdf } from '../services/export/pdf-exporter';
import { exportResumeToDocx } from '../services/export/docx-exporter';
import * as cheerio from 'cheerio';
import type { StructuredResume, JobRequirements, OptimizationResult, OptimizationRecord } from '../../renderer/types';

export function registerHistoryIpc(): void {
  ipcMain.handle(
    'history:save-resume',
    (_event, filename: string, rawText: string, structured: StructuredResume): number => {
      const db = getDb();
      const result = db
        .prepare('INSERT INTO resumes (filename, raw_text, structured) VALUES (?, ?, ?)')
        .run(filename, rawText, JSON.stringify(structured));
      return result.lastInsertRowid as number;
    }
  );

  ipcMain.handle(
    'history:save-job',
    (_event, title: string, company: string, description: string, requirements: JobRequirements): number => {
      const db = getDb();
      const result = db
        .prepare('INSERT INTO jobs (title, company, description, requirements) VALUES (?, ?, ?, ?)')
        .run(title, company, description, JSON.stringify(requirements));
      return result.lastInsertRowid as number;
    }
  );

  ipcMain.handle(
    'history:save-optimization',
    (_event, resumeId: number, jobId: number, result: OptimizationResult): number => {
      const db = getDb();
      const dbResult = db
        .prepare('INSERT INTO optimizations (resume_id, job_id, result) VALUES (?, ?, ?)')
        .run(resumeId, jobId, JSON.stringify(result));
      return dbResult.lastInsertRowid as number;
    }
  );

  ipcMain.handle('history:get-optimizations', (): OptimizationRecord[] => {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT
          o.id, o.resume_id, o.job_id, o.result, o.created_at,
          r.filename as resume_filename,
          j.title as job_title,
          j.company as job_company
        FROM optimizations o
        LEFT JOIN resumes r ON o.resume_id = r.id
        LEFT JOIN jobs j ON o.job_id = j.id
        ORDER BY o.created_at DESC`
      )
      .all() as any[];

    return rows.map((row) => {
      let overallScore: number | undefined;
      try {
        const parsed = JSON.parse(row.result);
        overallScore = parsed.overallScore;
      } catch {
        // ignore parse errors
      }

      return {
        id: row.id,
        resumeId: row.resume_id,
        jobId: row.job_id,
        result: row.result,
        createdAt: row.created_at,
        resumeFilename: row.resume_filename,
        jobTitle: row.job_title,
        jobCompany: row.job_company,
        overallScore,
      };
    });
  });

  ipcMain.handle('history:get-optimization', (_event, id: number): OptimizationRecord | null => {
    const db = getDb();
    const row = db
      .prepare(
        `SELECT
          o.id, o.resume_id, o.job_id, o.result, o.created_at,
          r.filename as resume_filename,
          j.title as job_title,
          j.company as job_company
        FROM optimizations o
        LEFT JOIN resumes r ON o.resume_id = r.id
        LEFT JOIN jobs j ON o.job_id = j.id
        WHERE o.id = ?`
      )
      .get(id) as any | undefined;

    if (!row) return null;

    let overallScore: number | undefined;
    try {
      const parsed = JSON.parse(row.result);
      overallScore = parsed.overallScore;
    } catch {
      // ignore parse errors
    }

    return {
      id: row.id,
      resumeId: row.resume_id,
      jobId: row.job_id,
      result: row.result,
      createdAt: row.created_at,
      resumeFilename: row.resume_filename,
      jobTitle: row.job_title,
      jobCompany: row.job_company,
      overallScore,
    };
  });

  ipcMain.handle('history:delete-optimization', (_event, id: number): void => {
    const db = getDb();
    db.prepare('DELETE FROM optimizations WHERE id = ?').run(id);
  });

  ipcMain.handle('history:export-pdf', async (_event, resume: StructuredResume): Promise<string> => {
    const buffer = await exportResumeToPdf(resume);

    const result = await dialog.showSaveDialog({
      title: 'Export Resume as PDF',
      defaultPath: `${resume.contactInfo.name || 'resume'}_optimized.pdf`,
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    });

    if (result.canceled || !result.filePath) {
      throw new Error('Export cancelled');
    }

    fs.writeFileSync(result.filePath, buffer);
    return result.filePath;
  });

  ipcMain.handle('history:export-docx', async (_event, resume: StructuredResume): Promise<string> => {
    const buffer = await exportResumeToDocx(resume);

    const result = await dialog.showSaveDialog({
      title: 'Export Resume as DOCX',
      defaultPath: `${resume.contactInfo.name || 'resume'}_optimized.docx`,
      filters: [{ name: 'Word Documents', extensions: ['docx'] }],
    });

    if (result.canceled || !result.filePath) {
      throw new Error('Export cancelled');
    }

    fs.writeFileSync(result.filePath, buffer);
    return result.filePath;
  });

  ipcMain.handle('history:scrape-job-url', async (_event, url: string): Promise<string> => {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove script and style elements
    $('script, style, nav, footer, header, iframe, noscript').remove();

    // Get text content from body
    const text = $('body').text();

    // Clean up whitespace
    return text.replace(/\s+/g, ' ').trim();
  });
}
