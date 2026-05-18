import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return Response.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY || process.env.groq_api_key;
    if (!apiKey || apiKey.startsWith('your-')) {
      return Response.json({ error: 'GROQ_API_KEY not configured' }, { status: 400 });
    }

    const Groq = (await import('groq-sdk')).default;
    const groq = new Groq({ apiKey });

    const transcription = await groq.audio.transcriptions.create({
      file: file,
      model: 'whisper-large-v3-turbo',
      response_format: 'text',
    });

    return Response.json({ text: transcription });
  } catch (err) {
    return Response.json({
      error: err instanceof Error ? err.message : 'Transcription failed',
    }, { status: 500 });
  }
}
