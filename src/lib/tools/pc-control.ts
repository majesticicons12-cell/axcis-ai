import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Resolve common path shortcuts to absolute paths
function resolveUserPath(inputPath: string): string {
  const home = os.homedir();
  const lower = inputPath.toLowerCase().trim();
  
  // Handle common shortcuts
  if (lower === 'desktop' || lower === '~/desktop') return path.join(home, 'Desktop');
  if (lower === 'downloads' || lower === '~/downloads') return path.join(home, 'Downloads');
  if (lower === 'documents' || lower === '~/documents') return path.join(home, 'Documents');
  if (lower === 'home' || lower === '~') return home;
  
  // Handle paths starting with ~/
  if (inputPath.startsWith('~/') || inputPath.startsWith('~\\')) {
    return path.join(home, inputPath.slice(2));
  }
  
  // Already absolute or relative — use path.resolve
  return path.resolve(inputPath);
}

// Only block truly system-destroying commands
const BLOCKED_PATTERNS = [
  /format\s+[a-z]:/i,                            // formatting drives
  /del\s+\/[sfq].*[\\\/]windows/i,               // deleting windows folder
  /rm\s+-rf\s+[\/\\]$/i,                         // rm -rf /
  /reg\s+delete\s+hklm/i,                        // deleting system registry
  /bcdedit/i,                                     // boot config
  /diskpart/i,                                    // disk partitioning
  /cipher\s+\/w/i,                                // wiping free space
  /sfc\s+\/scannow/i,                             // system file checker (needs admin anyway)
];

function isSafeCommand(command: string): { safe: boolean; reason?: string } {
  const lower = command.toLowerCase().trim();
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(lower)) {
      return { safe: false, reason: `Blocked: This command could damage the operating system. Use with extreme caution.` };
    }
  }
  return { safe: true };
}

export async function runCommand(command: string): Promise<string> {
  const check = isSafeCommand(command);
  if (!check.safe) {
    return check.reason || 'Command blocked for safety.';
  }

  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: 60000,
      maxBuffer: 2 * 1024 * 1024,
      shell: 'cmd.exe',
    });
    const output = stdout || stderr || '(command completed with no output)';
    return output.length > 5000 ? output.substring(0, 5000) + '\n...(truncated)' : output;
  } catch (err) {
    if (err instanceof Error) {
      const execErr = err as { stderr?: string; stdout?: string };
      return `Error: ${err.message}\n${execErr.stderr || execErr.stdout || ''}`.substring(0, 3000);
    }
    return 'Error: Command failed';
  }
}

export async function runPowerShell(command: string): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(`powershell -NoProfile -Command "${command.replace(/"/g, '\\"')}"`, {
      timeout: 60000,
      maxBuffer: 2 * 1024 * 1024,
    });
    const output = stdout || stderr || '(command completed with no output)';
    return output.length > 5000 ? output.substring(0, 5000) + '\n...(truncated)' : output;
  } catch (err) {
    if (err instanceof Error) {
      const execErr = err as { stderr?: string; stdout?: string };
      return `Error: ${err.message}\n${execErr.stderr || execErr.stdout || ''}`.substring(0, 3000);
    }
    return 'Error: PowerShell command failed';
  }
}

export async function openApplication(appName: string): Promise<string> {
  const appMap: Record<string, string> = {
    'notepad': 'notepad',
    'calculator': 'calc',
    'paint': 'mspaint',
    'explorer': 'explorer',
    'file explorer': 'explorer',
    'task manager': 'taskmgr',
    'command prompt': 'cmd',
    'cmd': 'cmd',
    'terminal': 'wt',
    'powershell': 'powershell',
    'chrome': 'chrome',
    'google chrome': 'chrome',
    'firefox': 'firefox',
    'edge': 'msedge',
    'microsoft edge': 'msedge',
    'brave': 'brave',
    'settings': 'ms-settings:',
    'control panel': 'control',
    'word': 'winword',
    'excel': 'excel',
    'powerpoint': 'powerpnt',
    'outlook': 'outlook',
    'vscode': 'code',
    'visual studio code': 'code',
    'spotify': 'spotify',
    'discord': 'discord',
    'steam': 'steam',
    'snipping tool': 'snippingtool',
    'screenshot': 'snippingtool',
    'device manager': 'devmgmt.msc',
    'disk management': 'diskmgmt.msc',
    'services': 'services.msc',
    'registry editor': 'regedit',
    'remote desktop': 'mstsc',
    'magnifier': 'magnify',
    'on-screen keyboard': 'osk',
    'resource monitor': 'resmon',
    'performance monitor': 'perfmon',
  };

  const mapped = appMap[appName.toLowerCase()] || appName;

  try {
    await execAsync(`start "" "${mapped}"`, { shell: 'cmd.exe', timeout: 10000 });
    return `Opened: ${appName}`;
  } catch (e) {
    return `Failed to open ${appName}: ${e instanceof Error ? e.message : 'Unknown error'}. Try the exact executable name or full path.`;
  }
}

export async function getSystemInfo(): Promise<string> {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const uptimeSec = os.uptime();
  const hours = Math.floor(uptimeSec / 3600);
  const mins = Math.floor((uptimeSec % 3600) / 60);

  let diskInfo = '';
  try {
    const { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption', {
      shell: 'cmd.exe',
      timeout: 5000,
    });
    diskInfo = stdout.trim();
  } catch {
    diskInfo = 'Could not retrieve disk info';
  }

  let gpuInfo = '';
  try {
    const { stdout } = await execAsync('wmic path win32_videocontroller get name', {
      shell: 'cmd.exe',
      timeout: 5000,
    });
    gpuInfo = stdout.trim().split('\n').filter(l => l.trim() && l.trim() !== 'Name').join(', ');
  } catch {
    gpuInfo = 'Unknown';
  }

  return `## System Information

**Computer:** ${os.hostname()}
**OS:** ${os.type()} ${os.release()} (${os.arch()})
**CPU:** ${cpus[0]?.model || 'Unknown'} (${cpus.length} cores)
**GPU:** ${gpuInfo}
**Memory:** ${formatBytes(usedMem)} used / ${formatBytes(totalMem)} total (${Math.round(usedMem / totalMem * 100)}%)
**Free Memory:** ${formatBytes(freeMem)}
**Uptime:** ${hours}h ${mins}m
**User:** ${os.userInfo().username}
**Home:** ${os.homedir()}

**Disk:**
${diskInfo}`;
}

export async function listDirectory(dirPath: string): Promise<string> {
  try {
    const resolved = resolveUserPath(dirPath);
    const entries = fs.readdirSync(resolved, { withFileTypes: true });
    const items = entries.slice(0, 200).map(e => {
      const type = e.isDirectory() ? '[DIR]' : '[FILE]';
      let size = '';
      if (!e.isDirectory()) {
        try {
          const stats = fs.statSync(path.join(resolved, e.name));
          size = ` (${formatBytes(stats.size)})`;
        } catch { /* ignore */ }
      }
      return `${type} ${e.name}${size}`;
    });

    const header = `**Directory: ${resolved}** (${entries.length} items)\n\n`;
    return header + items.join('\n') + (entries.length > 200 ? '\n\n...(showing first 200)' : '');
  } catch (err) {
    return `Error listing directory: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

export async function readFileContent(filePath: string): Promise<string> {
  try {
    const resolved = resolveUserPath(filePath);
    const stats = fs.statSync(resolved);

    if (stats.size > 1024 * 1024) {
      return `File is too large (${formatBytes(stats.size)}). Maximum is 1MB.`;
    }

    const content = fs.readFileSync(resolved, 'utf-8');
    return `**File: ${resolved}** (${formatBytes(stats.size)})\n\n\`\`\`\n${content.substring(0, 8000)}\n\`\`\`${content.length > 8000 ? '\n\n...(truncated)' : ''}`;
  } catch (err) {
    return `Error reading file: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

export async function writeFileContent(filePath: string, content: string): Promise<string> {
  try {
    const resolved = resolveUserPath(filePath);
    const dir = path.dirname(resolved);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(resolved, content, 'utf-8');
    return `File written successfully: ${resolved} (${formatBytes(Buffer.byteLength(content))})`;
  } catch (err) {
    return `Error writing file: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

export async function createFolder(folderPath: string): Promise<string> {
  try {
    const resolved = resolveUserPath(folderPath);
    if (fs.existsSync(resolved)) {
      return `Folder already exists: ${resolved}`;
    }
    fs.mkdirSync(resolved, { recursive: true });
    return `Folder created: ${resolved}`;
  } catch (err) {
    return `Error creating folder: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

export async function deleteFileOrFolder(targetPath: string): Promise<string> {
  try {
    const resolved = resolveUserPath(targetPath);
    if (!fs.existsSync(resolved)) {
      return `Path does not exist: ${resolved}`;
    }
    const stats = fs.statSync(resolved);
    if (stats.isDirectory()) {
      fs.rmSync(resolved, { recursive: true, force: true });
      return `Folder deleted: ${resolved}`;
    } else {
      fs.unlinkSync(resolved);
      return `File deleted: ${resolved}`;
    }
  } catch (err) {
    return `Error deleting: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

export async function moveOrRename(sourcePath: string, destPath: string): Promise<string> {
  try {
    const src = resolveUserPath(sourcePath);
    const dest = resolveUserPath(destPath);
    if (!fs.existsSync(src)) {
      return `Source does not exist: ${src}`;
    }
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.renameSync(src, dest);
    return `Moved: ${src} -> ${dest}`;
  } catch (err) {
    return `Error moving: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

export async function copyFileOrFolder(sourcePath: string, destPath: string): Promise<string> {
  try {
    const src = resolveUserPath(sourcePath);
    const dest = resolveUserPath(destPath);
    if (!fs.existsSync(src)) {
      return `Source does not exist: ${src}`;
    }
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.cpSync(src, dest, { recursive: true });
    return `Copied: ${src} -> ${dest}`;
  } catch (err) {
    return `Error copying: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

export async function openUrl(url: string): Promise<string> {
  try {
    await execAsync(`start "" "${url}"`, { shell: 'cmd.exe', timeout: 5000 });
    return `Opened URL in default browser: ${url}`;
  } catch (err) {
    return `Error opening URL: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

export async function searchFiles(directory: string, pattern: string): Promise<string> {
  try {
    const resolved = resolveUserPath(directory);
    const { stdout } = await execAsync(
      `dir /s /b "${resolved}\\*${pattern}*"`,
      { shell: 'cmd.exe', timeout: 30000, maxBuffer: 2 * 1024 * 1024 }
    );
    const files = stdout.trim().split('\n').filter(Boolean).slice(0, 100);
    if (files.length === 0) return `No files found matching "${pattern}" in ${resolved}`;
    return `**Found ${files.length} files matching "${pattern}":**\n\n${files.join('\n')}`;
  } catch {
    return `No files found matching "${pattern}" in ${directory}`;
  }
}

export async function getRunningProcesses(): Promise<string> {
  try {
    const { stdout } = await execAsync(
      'tasklist /fo csv /nh | sort /r',
      { shell: 'cmd.exe', timeout: 10000, maxBuffer: 1024 * 1024 }
    );
    const lines = stdout.trim().split('\n').slice(0, 50);
    return `**Running Processes (top 50):**\n\n${lines.join('\n')}`;
  } catch (err) {
    return `Error getting processes: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

export async function killProcess(processName: string): Promise<string> {
  // Protect critical system processes
  const criticalProcesses = ['csrss', 'winlogon', 'services', 'lsass', 'smss', 'wininit', 'system'];
  if (criticalProcesses.includes(processName.toLowerCase().replace('.exe', ''))) {
    return `Cannot kill critical system process: ${processName}`;
  }
  try {
    const { stdout } = await execAsync(`taskkill /im "${processName}" /f`, {
      shell: 'cmd.exe',
      timeout: 10000,
    });
    return stdout || `Killed process: ${processName}`;
  } catch (err) {
    return `Error killing process: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

export async function getNetworkInfo(): Promise<string> {
  try {
    const interfaces = os.networkInterfaces();
    const lines: string[] = [];
    for (const [name, addrs] of Object.entries(interfaces)) {
      if (!addrs) continue;
      for (const addr of addrs) {
        if (addr.family === 'IPv4') {
          lines.push(`**${name}:** ${addr.address} (${addr.internal ? 'internal' : 'external'})`);
        }
      }
    }

    let publicIp = 'Could not determine';
    try {
      const { stdout } = await execAsync('curl -s https://api.ipify.org', { timeout: 5000 });
      publicIp = stdout.trim();
    } catch { /* ignore */ }

    return `## Network Information\n\n${lines.join('\n')}\n\n**Public IP:** ${publicIp}`;
  } catch (err) {
    return `Error getting network info: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

export async function setClipboard(text: string): Promise<string> {
  try {
    await execAsync(`echo ${text.replace(/[&|<>^]/g, '^$&')} | clip`, { shell: 'cmd.exe', timeout: 5000 });
    return `Copied to clipboard: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`;
  } catch (err) {
    return `Error setting clipboard: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

export async function getClipboard(): Promise<string> {
  try {
    const { stdout } = await execAsync(
      'powershell -NoProfile -Command "Get-Clipboard"',
      { timeout: 5000 }
    );
    return `**Clipboard contents:**\n${stdout.trim().substring(0, 2000)}`;
  } catch (err) {
    return `Error reading clipboard: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
