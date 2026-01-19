import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fileUrl = searchParams.get('url');
  const filename = searchParams.get('filename');

  if (!fileUrl) {
    return new NextResponse('Missing file URL parameter', { status: 400 });
  }

  if (!filename) {
    return new NextResponse('Missing filename parameter', { status: 400 });
  }

  try {
    // Fetch the file from the original URL
    const fileResponse = await fetch(fileUrl);

    if (!fileResponse.ok) {
      return new NextResponse('Failed to fetch file', { status: fileResponse.status });
    }

    const fileBlob = await fileResponse.blob();
    
    // Set headers to trigger download
    const headers = new Headers();
    headers.set('Content-Type', fileBlob.type);
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Cache-Control', 'no-cache'); // Don't cache the download proxy response

    return new NextResponse(fileBlob, { status: 200, headers });
    
  } catch (error) {
    console.error('Download proxy error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
