import fs from 'fs';
import path from 'path';
import { createProject, getProject } from '@/lib/db';
import { generateId } from '@/lib/utils';

const IS_VERCEL = !!process.env.VERCEL;
const PROJECTS_DIR = IS_VERCEL ? path.join('/tmp', 'data', 'projects') : path.join(process.cwd(), 'data', 'projects');

function ensureProjectsDir(): void {
  if (!fs.existsSync(PROJECTS_DIR)) {
    fs.mkdirSync(PROJECTS_DIR, { recursive: true });
  }
}

export async function saveWebsiteFiles(
  projectName: string,
  files: Array<{ path: string; content: string }>,
  opts: { description?: string; conversationId?: string } = {}
): Promise<{ projectId: string; previewUrl: string; files: string[] }> {
  ensureProjectsDir();

  const projectId = generateId('proj');
  const projectDir = path.join(PROJECTS_DIR, projectId);
  fs.mkdirSync(projectDir, { recursive: true });

  const savedFiles: string[] = [];

  for (const file of files) {
    // Sanitize file path to prevent directory traversal
    const safePath = file.path.replace(/\.\./g, '').replace(/^\//, '');
    const fullPath = path.join(projectDir, safePath);
    const fileDir = path.dirname(fullPath);

    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }

    fs.writeFileSync(fullPath, file.content, 'utf-8');
    savedFiles.push(safePath);
  }

  // Save to database
  createProject(projectName, projectId, {
    description: opts.description,
    conversationId: opts.conversationId,
  });

  return {
    projectId,
    previewUrl: `/api/preview/${projectId}`,
    files: savedFiles,
  };
}

export async function updateProjectFile(
  projectId: string,
  filePath: string,
  content: string
): Promise<{ success: boolean; path: string }> {
  const project = getProject(projectId);
  if (!project) {
    throw new Error(`Project "${projectId}" not found`);
  }

  const projectDir = path.join(PROJECTS_DIR, projectId);
  const safePath = filePath.replace(/\.\./g, '').replace(/^\//, '');
  const fullPath = path.join(projectDir, safePath);
  const fileDir = path.dirname(fullPath);

  if (!fs.existsSync(fileDir)) {
    fs.mkdirSync(fileDir, { recursive: true });
  }

  fs.writeFileSync(fullPath, content, 'utf-8');

  return { success: true, path: safePath };
}
