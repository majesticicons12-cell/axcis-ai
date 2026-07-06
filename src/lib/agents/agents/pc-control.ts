import type { AgentConfig } from '../types';
import {
  runCommand,
  openApplication,
  getSystemInfo,
  listDirectory,
  readFileContent,
  writeFileContent,
  openUrl,
  searchFiles,
  getRunningProcesses,
} from '@/lib/tools/pc-control';

export const pcControlAgent: AgentConfig = {
  id: 'pc-control',
  name: 'PC Control',
  description: 'Controlling the local PC: running commands, opening apps, managing files, getting system info, browsing directories, and any local system task',
  icon: '💻',
  systemPrompt: `You are AXCIS AI's PC Control Agent — you can interact with the user's Windows PC.

Your capabilities:
- Run shell commands (cmd.exe)
- Open applications by name
- Get system information (CPU, RAM, disk, uptime)
- List, read, write, and search files
- Open URLs in the default browser
- View running processes

Rules:
- ALWAYS confirm destructive operations before executing (deleting files, stopping processes, etc.)
- For dangerous commands, explain what the command does before running it
- Use the simplest approach — don't overcomplicate things
- When listing files, use list_directory rather than running dir commands
- Present system info in a clean, readable format
- If a command fails, explain the error and suggest alternatives
- You are running on Windows — use Windows commands and paths (backslashes)
- Never run commands that could damage the system (formatting drives, deleting system files, etc.)`,
  tools: [
    {
      name: 'run_command',
      description: 'Execute a shell command on the PC (cmd.exe). Use for any command-line operation.',
      input_schema: {
        type: 'object' as const,
        properties: {
          command: { type: 'string', description: 'The command to execute' },
        },
        required: ['command'],
      },
      execute: async (input) => {
        const { command } = input as { command: string };
        return await runCommand(command);
      },
    },
    {
      name: 'open_application',
      description: 'Open an application by name (e.g., "chrome", "notepad", "calculator", "file explorer").',
      input_schema: {
        type: 'object' as const,
        properties: {
          appName: { type: 'string', description: 'Application name or executable path' },
        },
        required: ['appName'],
      },
      execute: async (input) => {
        const { appName } = input as { appName: string };
        return await openApplication(appName);
      },
    },
    {
      name: 'get_system_info',
      description: 'Get system information: CPU, memory, disk usage, uptime, and more.',
      input_schema: {
        type: 'object' as const,
        properties: {},
      },
      execute: async () => {
        return await getSystemInfo();
      },
    },
    {
      name: 'list_directory',
      description: 'List files and folders in a directory.',
      input_schema: {
        type: 'object' as const,
        properties: {
          path: { type: 'string', description: 'Directory path to list (e.g., "C:\\Users" or "D:\\Projects")' },
        },
        required: ['path'],
      },
      execute: async (input) => {
        const { path } = input as { path: string };
        return await listDirectory(path);
      },
    },
    {
      name: 'read_file',
      description: 'Read the contents of a file.',
      input_schema: {
        type: 'object' as const,
        properties: {
          path: { type: 'string', description: 'Full file path to read' },
        },
        required: ['path'],
      },
      execute: async (input) => {
        const { path } = input as { path: string };
        return await readFileContent(path);
      },
    },
    {
      name: 'write_file',
      description: 'Write content to a file. Creates the file if it does not exist.',
      input_schema: {
        type: 'object' as const,
        properties: {
          path: { type: 'string', description: 'Full file path to write' },
          content: { type: 'string', description: 'Content to write to the file' },
        },
        required: ['path', 'content'],
      },
      execute: async (input) => {
        const { path, content } = input as { path: string; content: string };
        return await writeFileContent(path, content);
      },
    },
    {
      name: 'open_url',
      description: 'Open a URL in the default web browser.',
      input_schema: {
        type: 'object' as const,
        properties: {
          url: { type: 'string', description: 'The URL to open' },
        },
        required: ['url'],
      },
      execute: async (input) => {
        const { url } = input as { url: string };
        return await openUrl(url);
      },
    },
    {
      name: 'search_files',
      description: 'Search for files matching a pattern in a directory (recursive).',
      input_schema: {
        type: 'object' as const,
        properties: {
          directory: { type: 'string', description: 'Directory to search in' },
          pattern: { type: 'string', description: 'File name pattern to search for (e.g., "report", ".pdf")' },
        },
        required: ['directory', 'pattern'],
      },
      execute: async (input) => {
        const { directory, pattern } = input as { directory: string; pattern: string };
        return await searchFiles(directory, pattern);
      },
    },
    {
      name: 'get_processes',
      description: 'List running processes on the PC.',
      input_schema: {
        type: 'object' as const,
        properties: {},
      },
      execute: async () => {
        return await getRunningProcesses();
      },
    },
  ],
  model: 'google/gemma-4-12B-it',
  maxTokens: 4096,
};
