import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service role key not available' }, { status: 500 });
    }

    const { imagePath } = await request.json();

    if (!imagePath) {
      return NextResponse.json({ error: 'Image path is required' }, { status: 400 });
    }

    // Extract the file path from the full URL
    const url = new URL(imagePath);
    const pathParts = url.pathname.split('/');
    const bucket = pathParts[1]; // Should be 'event-images'
    const fileName = pathParts[pathParts.length - 1];

    // Construct the storage path
    const storagePath = pathParts.slice(2).join('/'); // Everything after bucket name

    console.log(`Attempting to delete image: ${storagePath} from bucket: ${bucket}`);

    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([storagePath]);

    if (error) {
      console.error('Error deleting image:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`Successfully deleted image: ${storagePath}`);
    return NextResponse.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/delete-image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


