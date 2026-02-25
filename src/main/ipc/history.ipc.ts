import { ipcMain, dialog } from 'electron';
import fs from 'fs';
import { getDb } from '../db/database';
import { exportResumeToPdf } from '../services/export/pdf-exporter';
import { exportResumeToDocx } from '../services/export/docx-exporter';
import * as cheerio from 'cheerio';
import { CodexCliProvider } from '../services/ai/codex-cli-provider';
import { extractJson } from '../services/ai/cli-utils';
import { ATS_SCORE_PROMPT, LINKEDIN_SCORE_PROMPT, STRUCTURE_RESUME_PROMPT } from '../services/ai/prompts';
import type { StructuredResume, JobRequirements, OptimizationResult, OptimizationRecord, ResumeRecord, AtsScore, LinkedInScore } from '../../renderer/types';

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

  ipcMain.handle('history:get-resumes', (): ResumeRecord[] => {
    const db = getDb();
    const rows = db
      .prepare('SELECT id, filename, raw_text, structured, created_at FROM resumes ORDER BY created_at DESC')
      .all() as any[];
    return rows.map((row) => ({
      id: row.id,
      filename: row.filename,
      rawText: row.raw_text,
      structured: row.structured,
      createdAt: row.created_at,
    }));
  });

  ipcMain.handle('history:get-resume', (_event, id: number): ResumeRecord | null => {
    const db = getDb();
    const row = db
      .prepare('SELECT id, filename, raw_text, structured, created_at FROM resumes WHERE id = ?')
      .get(id) as any | undefined;
    if (!row) return null;
    return {
      id: row.id,
      filename: row.filename,
      rawText: row.raw_text,
      structured: row.structured,
      createdAt: row.created_at,
    };
  });

  ipcMain.handle('history:delete-resume', (_event, id: number): void => {
    const db = getDb();
    db.prepare('DELETE FROM ats_scores WHERE resume_id = ?').run(id);
    db.prepare('DELETE FROM linkedin_scores WHERE resume_id = ?').run(id);
    db.prepare('DELETE FROM optimizations WHERE resume_id = ?').run(id);
    db.prepare('DELETE FROM resumes WHERE id = ?').run(id);
  });

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

  // ATS Scores
  ipcMain.handle('history:get-distinct-job-titles', (): string[] => {
    const db = getDb();
    const jobTitles = db
      .prepare('SELECT DISTINCT title FROM jobs WHERE title IS NOT NULL AND title != \'\'')
      .all() as { title: string }[];
    const atsTitles = db
      .prepare('SELECT DISTINCT target_role FROM ats_scores WHERE target_role IS NOT NULL AND target_role != \'\'')
      .all() as { target_role: string }[];

    const linkedinTitles = db
      .prepare('SELECT DISTINCT target_role FROM linkedin_scores WHERE target_role IS NOT NULL AND target_role != \'\'')
      .all() as { target_role: string }[];

    const set = new Set<string>();
    for (const row of jobTitles) set.add(row.title);
    for (const row of atsTitles) set.add(row.target_role);
    for (const row of linkedinTitles) set.add(row.target_role);
    return Array.from(set).sort();
  });

  ipcMain.handle('history:get-ats-scores', (_event, targetRole: string): AtsScore[] => {
    const db = getDb();
    const rows = db
      .prepare('SELECT id, resume_id, target_role, ats_score, quality_score, tips, created_at FROM ats_scores WHERE target_role = ?')
      .all(targetRole) as any[];
    return rows.map((row) => ({
      id: row.id,
      resumeId: row.resume_id,
      targetRole: row.target_role,
      atsScore: row.ats_score,
      qualityScore: row.quality_score,
      tips: JSON.parse(row.tips),
      createdAt: row.created_at,
    }));
  });

  ipcMain.handle('history:compute-ats-score', async (_event, resumeId: number, targetRole: string): Promise<AtsScore> => {
    const db = getDb();
    const row = db
      .prepare('SELECT id, filename, raw_text, structured, created_at FROM resumes WHERE id = ?')
      .get(resumeId) as any | undefined;
    if (!row) throw new Error(`Resume with id ${resumeId} not found`);

    const structured = JSON.parse(row.structured) as StructuredResume;
    const provider = new CodexCliProvider();
    const userMessage = `Resume:\n${JSON.stringify(structured, null, 2)}\n\nTarget Role: ${targetRole}`;
    const response = await provider.chat(ATS_SCORE_PROMPT, userMessage);
    const result = extractJson<{ atsScore: number; qualityScore: number; tips: string[] }>(response);

    db.prepare(
      'INSERT INTO ats_scores (resume_id, target_role, ats_score, quality_score, tips) VALUES (?, ?, ?, ?, ?) ON CONFLICT(resume_id, target_role) DO UPDATE SET ats_score = excluded.ats_score, quality_score = excluded.quality_score, tips = excluded.tips, created_at = CURRENT_TIMESTAMP'
    ).run(resumeId, targetRole, result.atsScore, result.qualityScore, JSON.stringify(result.tips));

    const inserted = db
      .prepare('SELECT id, resume_id, target_role, ats_score, quality_score, tips, created_at FROM ats_scores WHERE resume_id = ? AND target_role = ?')
      .get(resumeId, targetRole) as any;

    return {
      id: inserted.id,
      resumeId: inserted.resume_id,
      targetRole: inserted.target_role,
      atsScore: inserted.ats_score,
      qualityScore: inserted.quality_score,
      tips: JSON.parse(inserted.tips),
      createdAt: inserted.created_at,
    };
  });

  ipcMain.handle('history:delete-ats-scores', (_event, resumeId: number): void => {
    const db = getDb();
    db.prepare('DELETE FROM ats_scores WHERE resume_id = ?').run(resumeId);
  });

  // LinkedIn Scores
  ipcMain.handle('history:get-linkedin-scores', (_event, targetRole: string): LinkedInScore[] => {
    const db = getDb();
    const rows = db
      .prepare('SELECT id, resume_id, target_role, visibility_score, impact_score, tips, created_at FROM linkedin_scores WHERE target_role = ?')
      .all(targetRole) as any[];
    return rows.map((row) => ({
      id: row.id,
      resumeId: row.resume_id,
      targetRole: row.target_role,
      visibilityScore: row.visibility_score,
      impactScore: row.impact_score,
      tips: JSON.parse(row.tips),
      createdAt: row.created_at,
    }));
  });

  ipcMain.handle('history:compute-linkedin-score', async (_event, resumeId: number, targetRole: string): Promise<LinkedInScore> => {
    const db = getDb();
    const row = db
      .prepare('SELECT id, filename, raw_text, structured, created_at FROM resumes WHERE id = ?')
      .get(resumeId) as any | undefined;
    if (!row) throw new Error(`Resume with id ${resumeId} not found`);

    const provider = new CodexCliProvider();
    const userMessage = `LinkedIn Profile Content:\n${row.raw_text}\n\nTarget Role: ${targetRole}`;
    const response = await provider.chat(LINKEDIN_SCORE_PROMPT, userMessage);
    const result = extractJson<{ visibilityScore: number; impactScore: number; tips: string[] }>(response);

    db.prepare(
      'INSERT INTO linkedin_scores (resume_id, target_role, visibility_score, impact_score, tips) VALUES (?, ?, ?, ?, ?) ON CONFLICT(resume_id, target_role) DO UPDATE SET visibility_score = excluded.visibility_score, impact_score = excluded.impact_score, tips = excluded.tips, created_at = CURRENT_TIMESTAMP'
    ).run(resumeId, targetRole, result.visibilityScore, result.impactScore, JSON.stringify(result.tips));

    const inserted = db
      .prepare('SELECT id, resume_id, target_role, visibility_score, impact_score, tips, created_at FROM linkedin_scores WHERE resume_id = ? AND target_role = ?')
      .get(resumeId, targetRole) as any;

    return {
      id: inserted.id,
      resumeId: inserted.resume_id,
      targetRole: inserted.target_role,
      visibilityScore: inserted.visibility_score,
      impactScore: inserted.impact_score,
      tips: JSON.parse(inserted.tips),
      createdAt: inserted.created_at,
    };
  });

  ipcMain.handle('history:delete-linkedin-scores', (_event, resumeId: number): void => {
    const db = getDb();
    db.prepare('DELETE FROM linkedin_scores WHERE resume_id = ?').run(resumeId);
  });

  ipcMain.handle('history:import-linkedin-profile', async (_event, url: string): Promise<ResumeRecord> => {
    if (!url || !url.startsWith('https://www.linkedin.com/in/')) {
      throw new Error('URL invalida. Use o formato: https://www.linkedin.com/in/nome-do-perfil');
    }

    // Use a hidden BrowserWindow to load LinkedIn with a real browser context
    // LinkedIn blocks plain HTTP requests (999) but allows real browser loads
    const { BrowserWindow } = await import('electron');
    const win = new BrowserWindow({
      show: false,
      width: 1280,
      height: 900,
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    });

    let rawText: string;
    try {
      await win.loadURL(url);
      // Wait for content to render (LinkedIn uses client-side rendering)
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const html = await win.webContents.executeJavaScript('document.documentElement.outerHTML');

      const $ = cheerio.load(html);
      $('script, style, nav, footer, header, iframe, noscript').remove();
      rawText = $('body').text().replace(/\s+/g, ' ').trim();
    } catch (err: any) {
      throw new Error(`Failed to load LinkedIn profile: ${err?.message || 'unknown error'}`);
    } finally {
      if (!win.isDestroyed()) win.destroy();
    }

    if (!rawText || rawText.length < 50) {
      throw new Error('Could not extract enough content from LinkedIn profile. The profile may be private or require login.');
    }

    const provider = new CodexCliProvider();
    const aiResponse = await provider.chat(STRUCTURE_RESUME_PROMPT, rawText);
    const structured = extractJson<StructuredResume>(aiResponse);

    const db = getDb();
    const result = db
      .prepare('INSERT INTO resumes (filename, raw_text, structured) VALUES (?, ?, ?)')
      .run(url, rawText, JSON.stringify(structured));

    return {
      id: result.lastInsertRowid as number,
      filename: url,
      rawText,
      structured: JSON.stringify(structured),
      createdAt: new Date().toISOString(),
    };
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
