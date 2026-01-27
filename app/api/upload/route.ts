import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename || !request.body) {
    return NextResponse.json({ error: 'Falta nombre o archivo' }, { status: 400 });
  }

  // Guardamos el archivo en la nube de Vercel
  const blob = await put(filename, request.body, {
    access: 'public',
  });

  // Devolvemos la URL pública del archivo
  return NextResponse.json(blob);
}