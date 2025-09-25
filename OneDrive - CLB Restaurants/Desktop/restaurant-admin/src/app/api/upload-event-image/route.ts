import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service role key not available' }, { status: 500 });
    }

    const formData = await request.formData();
    const image = formData.get('image') as File;
    
    if (!image) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Validate file type
    if (!image.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image size must be less than 5MB' }, { status: 400 });
    }

    // Convert File to ArrayBuffer for hashing
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate content hash for deduplication
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const fileExtension = image.name.split('.').pop() || 'jpg';
    const fileName = `event-${hash}.${fileExtension}`;
    const filePath = `events/${fileName}`;

    // Check if image with this hash already exists
    const { data: existingFiles } = await supabaseAdmin.storage
      .from('event-images')
      .list('events', {
        search: fileName
      });

    let publicUrl: string;
    let uploadedPath: string;

    if (existingFiles && existingFiles.length > 0) {
      // Image already exists, return existing URL
      console.log(`Image with hash ${hash} already exists, reusing existing file`);
      const { data: { publicUrl: existingUrl } } = supabaseAdmin.storage
        .from('event-images')
        .getPublicUrl(filePath);
      
      publicUrl = existingUrl;
      uploadedPath = filePath;
    } else {
      // Upload new image
      const { data, error } = await supabaseAdmin.storage
        .from('event-images')
        .upload(filePath, buffer, {
          contentType: image.type,
          upsert: false // Don't overwrite existing files
        });

      if (error) {
        console.error('Error uploading to Supabase Storage:', error);
        return NextResponse.json({ error: 'Failed to upload image to storage' }, { status: 500 });
      }

      // Get public URL
      const { data: { publicUrl: newUrl } } = supabaseAdmin.storage
        .from('event-images')
        .getPublicUrl(filePath);
      
      publicUrl = newUrl;
      uploadedPath = data.path;
    }

    return NextResponse.json({ 
      success: true,
      url: publicUrl,
      fileName: fileName,
      path: uploadedPath,
      size: image.size,
      type: image.type,
      hash: hash,
      isDuplicate: existingFiles && existingFiles.length > 0
    });
  } catch (error) {
    console.error('Error in POST /api/upload-event-image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
