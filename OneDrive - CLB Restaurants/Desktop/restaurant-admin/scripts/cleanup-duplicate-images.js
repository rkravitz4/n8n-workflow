#!/usr/bin/env node

/**
 * Cleanup Duplicate Images Script
 * 
 * This script helps identify and optionally remove duplicate images from Supabase Storage.
 * Run with: node scripts/cleanup-duplicate-images.js
 * 
 * WARNING: This script will DELETE files. Make sure to backup your data first.
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupDuplicateImages() {
  try {
    console.log('🔍 Scanning for duplicate images in Supabase Storage...');
    
    // List all files in the events folder
    const { data: files, error } = await supabase.storage
      .from('event-images')
      .list('events', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'asc' }
      });

    if (error) {
      console.error('❌ Error listing files:', error);
      return;
    }

    if (!files || files.length === 0) {
      console.log('✅ No files found in events folder');
      return;
    }

    console.log(`📁 Found ${files.length} files in events folder`);

    // Group files by size (quick first pass)
    const sizeGroups = {};
    files.forEach(file => {
      if (!sizeGroups[file.metadata?.size]) {
        sizeGroups[file.metadata?.size] = [];
      }
      sizeGroups[file.metadata?.size].push(file);
    });

    // Only process groups with more than one file
    const potentialDuplicates = Object.values(sizeGroups).filter(group => group.length > 1);
    
    if (potentialDuplicates.length === 0) {
      console.log('✅ No potential duplicates found by size');
      return;
    }

    console.log(`🔍 Found ${potentialDuplicates.length} groups of files with matching sizes`);

    const duplicatesToDelete = [];
    let totalSizeSaved = 0;

    // Check each group for actual duplicates
    for (const group of potentialDuplicates) {
      console.log(`\n📋 Checking group of ${group.length} files with size ${group[0].metadata?.size} bytes:`);
      
      const hashes = {};
      
      for (const file of group) {
        try {
          // Download file to compute hash
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('event-images')
            .download(`events/${file.name}`);

          if (downloadError) {
            console.error(`❌ Error downloading ${file.name}:`, downloadError);
            continue;
          }

          // Convert to buffer and compute hash
          const arrayBuffer = await fileData.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const hash = crypto.createHash('sha256').update(buffer).digest('hex');

          if (hashes[hash]) {
            // Found a duplicate!
            console.log(`🔄 Duplicate found: ${file.name} (same as ${hashes[hash]})`);
            duplicatesToDelete.push({
              name: file.name,
              duplicateOf: hashes[hash],
              size: file.metadata?.size || 0,
              created: file.created_at
            });
            totalSizeSaved += file.metadata?.size || 0;
          } else {
            hashes[hash] = file.name;
            console.log(`✅ Unique: ${file.name}`);
          }
        } catch (error) {
          console.error(`❌ Error processing ${file.name}:`, error);
        }
      }
    }

    if (duplicatesToDelete.length === 0) {
      console.log('\n✅ No actual duplicates found!');
      return;
    }

    console.log(`\n🗑️  Found ${duplicatesToDelete.length} duplicate files to delete:`);
    duplicatesToDelete.forEach(dup => {
      console.log(`   - ${dup.name} (${(dup.size / 1024).toFixed(1)} KB) - duplicate of ${dup.duplicateOf}`);
    });

    console.log(`\n💾 Total space to be saved: ${(totalSizeSaved / 1024).toFixed(1)} KB`);

    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will permanently delete files from Supabase Storage!');
    console.log('To proceed with deletion, run: node scripts/cleanup-duplicate-images.js --delete');
    console.log('To just see the report (no deletion), run: node scripts/cleanup-duplicate-images.js');

    // If --delete flag is passed, proceed with deletion
    if (process.argv.includes('--delete')) {
      console.log('\n🗑️  Proceeding with deletion...');
      
      for (const dup of duplicatesToDelete) {
        try {
          const { error: deleteError } = await supabase.storage
            .from('event-images')
            .remove([`events/${dup.name}`]);

          if (deleteError) {
            console.error(`❌ Error deleting ${dup.name}:`, deleteError);
          } else {
            console.log(`✅ Deleted: ${dup.name}`);
          }
        } catch (error) {
          console.error(`❌ Error deleting ${dup.name}:`, error);
        }
      }

      console.log(`\n🎉 Cleanup complete! Deleted ${duplicatesToDelete.length} duplicate files.`);
      console.log(`💾 Space saved: ${(totalSizeSaved / 1024).toFixed(1)} KB`);
    }

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the cleanup
cleanupDuplicateImages();


