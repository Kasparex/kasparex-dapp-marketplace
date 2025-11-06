import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { UpdatesData, TimelineEntry, Category } from '@/lib/updates';
import { generateId } from '@/lib/updates';

const updatesFilePath = path.join(process.cwd(), 'data', 'updates.json');

async function readUpdatesFile(): Promise<UpdatesData> {
  try {
    const fileContents = await fs.readFile(updatesFilePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    // If file doesn't exist or is invalid, return empty structure
    return {
      updates: [],
      tasks: [],
      ideas: [],
      bugFixes: [],
    };
  }
}

// Use GitHub API to update the file (works on Vercel)
async function updateFileViaGitHub(data: UpdatesData): Promise<boolean> {
  const githubToken = process.env.GITHUB_TOKEN;
  const repoOwner = process.env.GITHUB_REPO_OWNER || 'Kasparex';
  const repoName = process.env.GITHUB_REPO_NAME || 'kasparex-dapp-marketplace';

  if (!githubToken) {
    console.warn('GITHUB_TOKEN not set - file updates will not persist. Set this in Vercel environment variables.');
    return false;
  }

  try {
    // Get current file SHA (required for update)
    const getFileResponse = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/contents/data/updates.json`,
      {
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    let sha: string | undefined;
    if (getFileResponse.ok) {
      const fileData = await getFileResponse.json();
      sha = fileData.sha;
    }

    // Encode content to base64
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

    // Update file via GitHub API
    const updateResponse = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/contents/data/updates.json`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Update timeline: ${new Date().toISOString()}`,
          content: content,
          sha: sha, // Required for update, undefined for create
        }),
      }
    );

    if (updateResponse.ok) {
      return true;
    } else {
      const error = await updateResponse.json();
      console.error('GitHub API error:', error);
      return false;
    }
  } catch (error: any) {
    console.error('Error updating file via GitHub:', error);
    return false;
  }
}

// GET: Read all updates
export async function GET() {
  try {
    const data = await readUpdatesFile();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error reading updates:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to read updates' },
      { status: 500 }
    );
  }
}

// POST: Add new entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, entry } = body;

    if (!category || !['updates', 'tasks', 'ideas', 'bugFixes'].includes(category)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category' },
        { status: 400 }
      );
    }

    if (!entry || !entry.title || !entry.description) {
      return NextResponse.json(
        { success: false, error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const data = await readUpdatesFile();
    const newEntry: TimelineEntry = {
      id: entry.id || generateId(),
      title: entry.title,
      description: entry.description,
      date: entry.date || new Date().toISOString(),
      type: entry.type || 'other',
      status: entry.status,
      priority: entry.priority,
    };

    data[category as Category].push(newEntry);

    // Try to update via GitHub API (for Vercel)
    const updated = await updateFileViaGitHub(data);
    
    if (!updated) {
      // Fallback: try local file system (works in development)
      try {
        const dir = path.dirname(updatesFilePath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(updatesFilePath, JSON.stringify(data, null, 2), 'utf8');
      } catch (localError: any) {
        // If both fail, return success but warn user
        console.warn('Could not persist update. Set GITHUB_TOKEN in Vercel environment variables for persistence.');
        return NextResponse.json({
          success: true,
          entry: newEntry,
          warning: 'Update added but may not persist. Set GITHUB_TOKEN environment variable.',
        });
      }
    }

    return NextResponse.json({ success: true, entry: newEntry });
  } catch (error: any) {
    console.error('Error adding entry:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add entry' },
      { status: 500 }
    );
  }
}

// PUT: Update existing entry
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, id, entry } = body;

    if (!category || !['updates', 'tasks', 'ideas', 'bugFixes'].includes(category)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category' },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    const data = await readUpdatesFile();
    const categoryEntries = data[category as Category];
    const index = categoryEntries.findIndex((e) => e.id === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Update entry
    categoryEntries[index] = {
      ...categoryEntries[index],
      ...entry,
      id, // Ensure ID doesn't change
    };

    // Try to update via GitHub API
    const updated = await updateFileViaGitHub(data);
    
    if (!updated) {
      try {
        const dir = path.dirname(updatesFilePath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(updatesFilePath, JSON.stringify(data, null, 2), 'utf8');
      } catch (localError: any) {
        return NextResponse.json({
          success: true,
          entry: categoryEntries[index],
          warning: 'Update may not persist. Set GITHUB_TOKEN environment variable.',
        });
      }
    }

    return NextResponse.json({ success: true, entry: categoryEntries[index] });
  } catch (error: any) {
    console.error('Error updating entry:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update entry' },
      { status: 500 }
    );
  }
}

// DELETE: Remove entry
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const id = searchParams.get('id');

    if (!category || !['updates', 'tasks', 'ideas', 'bugFixes'].includes(category)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category' },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    const data = await readUpdatesFile();
    const categoryEntries = data[category as Category];
    const index = categoryEntries.findIndex((e) => e.id === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Entry not found' },
        { status: 404 }
      );
    }

    categoryEntries.splice(index, 1);

    // Try to update via GitHub API
    const updated = await updateFileViaGitHub(data);
    
    if (!updated) {
      try {
        const dir = path.dirname(updatesFilePath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(updatesFilePath, JSON.stringify(data, null, 2), 'utf8');
      } catch (localError: any) {
        return NextResponse.json({
          success: true,
          warning: 'Update may not persist. Set GITHUB_TOKEN environment variable.',
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting entry:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete entry' },
      { status: 500 }
    );
  }
}
