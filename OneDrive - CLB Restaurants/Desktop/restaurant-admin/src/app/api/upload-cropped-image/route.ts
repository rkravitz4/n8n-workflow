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
    const eventId = formData.get('eventId') as string;
    const deleteOldCropped = formData.get('deleteOldCropped') === 'true';
    
    if (!image) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Validate file type
    if (!image.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image size must be less than 5MB' }, { status: 400 });
    }

    // Delete old cropped images for this event if requested
    if (deleteOldCropped) {
      try {
        // List all files in the cropped folder
        const { data: existingFiles } = await supabaseAdmin.storage
          .from('event-images')
          .list('cropped');

        if (existingFiles) {
          // Find files that belong to this event (contain the event ID in the filename)
          const eventFiles = existingFiles.filter(file => 
            file.name.includes(`event-${eventId}`)
          );

          // Delete old cropped files for this event
          for (const file of eventFiles) {
            const { error: deleteError } = await supabaseAdmin.storage
              .from('event-images')
              .remove([`cropped/${file.name}`]);
            
            if (deleteError) {
              console.error(`Error deleting old cropped file ${file.name}:`, deleteError);
            } else {
              console.log(`Deleted old cropped file: ${file.name}`);
            }
          }
        }
      } catch (error) {
        console.error('Error deleting old cropped images:', error);
        // Continue with upload even if deletion fails
      }
    }

    // Convert File to ArrayBuffer for hashing
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename for cropped images
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileExtension = image.name.split('.').pop() || 'jpg';
    const fileName = `event-${eventId}-cropped-${timestamp}-${randomSuffix}.${fileExtension}`;
    const filePath = `cropped/${fileName}`;

    // Upload new cropped image
    const { data, error } = await supabaseAdmin.storage
      .from('event-images')
      .upload(filePath, buffer, {
        contentType: image.type,
        upsert: false // Don't overwrite existing files
      });

    if (error) {
      console.error('Error uploading cropped image to Supabase Storage:', error);
      return NextResponse.json({ error: 'Failed to upload cropped image to storage' }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('event-images')
      .getPublicUrl(filePath);

    return NextResponse.json({ 
      success: true,
      url: publicUrl,
      fileName: fileName,
      path: filePath,
      size: image.size,
      type: image.type,
      eventId: eventId,
      isCropped: true
    });
  } catch (error) {
    console.error('Error in POST /api/upload-cropped-image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


