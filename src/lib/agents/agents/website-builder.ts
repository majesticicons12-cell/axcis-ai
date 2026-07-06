import type { AgentConfig } from '../types';
import { saveWebsiteFiles, updateProjectFile } from '@/lib/tools/file-writer';

export const websiteBuilderAgent: AgentConfig = {
  id: 'website-builder',
  name: 'Website Builder',
  description: 'Building websites, web apps, landing pages, SaaS products, HTML/CSS/JS, React components, and any web development tasks',
  icon: '🌐',
  systemPrompt: `You are AXCIS AI's Website Builder agent — an expert full-stack web developer.

Your job is to generate complete, production-quality websites based on the user's description.

Rules:
- Always generate COMPLETE, runnable files — never partial snippets
- Use modern HTML5, CSS3, and vanilla JavaScript by default
- Create beautiful, responsive designs with good typography and spacing
- Include all necessary files: index.html, styles.css, script.js
- Use the save_website tool to save the generated files so the user can preview them
- If the user wants changes to an existing project, use update_file to modify specific files
- Make the designs visually impressive — use gradients, shadows, animations, and modern UI patterns
- Always include meta viewport tag for mobile responsiveness

When the user describes what they want, generate the full website and save it immediately.`,
  tools: [
    {
      name: 'save_website',
      description: 'Save a complete website project with multiple files. Returns a project ID and preview URL.',
      input_schema: {
        type: 'object' as const,
        properties: {
          projectName: {
            type: 'string',
            description: 'A short name for the project (e.g., "portfolio-site")',
          },
          description: {
            type: 'string',
            description: 'Brief description of the website',
          },
          files: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'File path relative to project root (e.g., "index.html")' },
                content: { type: 'string', description: 'Full file content' },
              },
              required: ['path', 'content'],
            },
            description: 'Array of files to create',
          },
        },
        required: ['projectName', 'files'],
      },
      execute: async (input, context) => {
        const { projectName, description, files } = input as {
          projectName: string;
          description?: string;
          files: Array<{ path: string; content: string }>;
        };
        const result = await saveWebsiteFiles(projectName, files, {
          description,
          conversationId: context.conversationId,
        });
        return JSON.stringify(result);
      },
    },
    {
      name: 'update_file',
      description: 'Update a single file in an existing website project.',
      input_schema: {
        type: 'object' as const,
        properties: {
          projectId: { type: 'string', description: 'The project ID to update' },
          path: { type: 'string', description: 'File path relative to project root' },
          content: { type: 'string', description: 'New file content' },
        },
        required: ['projectId', 'path', 'content'],
      },
      execute: async (input) => {
        const { projectId, path, content } = input as {
          projectId: string;
          path: string;
          content: string;
        };
        const result = await updateProjectFile(projectId, path, content);
        return JSON.stringify(result);
      },
    },
  ],
  model: 'google/gemma-4-12B-it',
  maxTokens: 8192,
};
