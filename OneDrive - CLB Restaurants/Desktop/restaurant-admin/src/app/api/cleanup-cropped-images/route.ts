import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service role key not available' }, { status: 500 });
    }

    // List all files in the events folder
    const { data: allFiles, error: listError } = await supabaseAdmin.storage
      .from('event-images')
      .list('events');

    if (listError) {
      console.error('Error listing files:', listError);
      return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
    }

    if (!allFiles) {
      return NextResponse.json({ message: 'No files found', cleaned: 0 });
    }

    // Find files that look like cropped images (contain 'cropped' in the name)
    const croppedFiles = allFiles.filter(file => 
      file.name.toLowerCase().includes('cropped') || 
      file.name.includes('cropped-')
    );

    let deletedCount = 0;
    const deletedFiles: string[] = [];

    // Delete cropped files from the events folder
    for (const file of croppedFiles) {
      const { error: deleteError } = await supabaseAdmin.storage
        .from('event-images')
        .remove([`events/${file.name}`]);
      
      if (deleteError) {
        console.error(`Error deleting file ${file.name}:`, deleteError);
      } else {
        deletedCount++;
        deletedFiles.push(file.name);
        console.log(`Deleted cropped file from events folder: ${file.name}`);
      }
    }

    return NextResponse.json({ 
      message: `Cleanup completed. Deleted ${deletedCount} cropped files from events folder.`,
      deletedCount,
      deletedFiles,
      totalFilesChecked: allFiles.length
    });
  } catch (error) {
    console.error('Error in POST /api/cleanup-cropped-images:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


