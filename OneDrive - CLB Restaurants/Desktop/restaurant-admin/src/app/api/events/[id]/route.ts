import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service role key not available' }, { status: 500 });
    }

    const { id: eventId } = await params;

    const { data: event, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error in GET /api/events/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service role key not available' }, { status: 500 });
    }

    const { id: eventId } = await params;
    const updateData = await request.json();

    const { data, error } = await supabaseAdmin
      .from('events')
      .update(updateData)
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ event: data });
  } catch (error) {
    console.error('Error in PUT /api/events/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service role key not available' }, { status: 500 });
    }

    const { id: eventId } = await params;

    // First, fetch the event to get image URLs before deleting
    const { data: event, error: fetchError } = await supabaseAdmin
      .from('events')
      .select('hero_image, original_hero_image')
      .eq('id', eventId)
      .single();

    if (fetchError) {
      console.error('Error fetching event for deletion:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Delete images from Supabase Storage
    const imagesToDelete = [];
    
    if (event.hero_image) {
      imagesToDelete.push(event.hero_image);
    }
    
    if (event.original_hero_image) {
      imagesToDelete.push(event.original_hero_image);
    }

    // Delete each image from storage
    for (const imageUrl of imagesToDelete) {
      if (imageUrl && imageUrl.includes('supabase')) {
        try {
          // Extract the file path from the full URL
          const url = new URL(imageUrl);
          const pathParts = url.pathname.split('/');
          const bucket = pathParts[1]; // Should be 'event-images'
          const storagePath = pathParts.slice(2).join('/'); // Everything after bucket name

          console.log(`Deleting event image: ${storagePath} from bucket: ${bucket}`);

          const { error: storageError } = await supabaseAdmin.storage
            .from(bucket)
            .remove([storagePath]);

          if (storageError) {
            console.error(`Error deleting image ${storagePath}:`, storageError);
            // Continue with other images even if one fails
          } else {
            console.log(`Successfully deleted image: ${storagePath}`);
          }
        } catch (urlError) {
          console.error(`Error parsing image URL ${imageUrl}:`, urlError);
          // Continue with other images even if one fails
        }
      }
    }

    // Also delete any cropped images for this event
    try {
      const { data: croppedFiles, error: listError } = await supabaseAdmin.storage
        .from('event-images')
        .list('cropped', {
          search: eventId
        });

      if (!listError && croppedFiles && croppedFiles.length > 0) {
        const croppedPaths = croppedFiles.map(file => `cropped/${file.name}`);
        console.log(`Deleting ${croppedPaths.length} cropped images for event ${eventId}`);
        
        const { error: croppedError } = await supabaseAdmin.storage
          .from('event-images')
          .remove(croppedPaths);

        if (croppedError) {
          console.error('Error deleting cropped images:', croppedError);
        } else {
          console.log('Successfully deleted cropped images');
        }
      }
    } catch (croppedError) {
      console.error('Error listing/deleting cropped images:', croppedError);
      // Continue with event deletion even if cropped image cleanup fails
    }

    // Finally, delete the event from the database
    const { error } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) {
      console.error('Error deleting event:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Event and associated images deleted successfully',
      deletedImages: imagesToDelete.length
    });
  } catch (error) {
    console.error('Error in DELETE /api/events/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
