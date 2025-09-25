# Scripts Directory

This directory contains utility scripts for managing the restaurant admin application.

## Image Cleanup Script

### `cleanup-duplicate-images.js`

This script helps identify and remove duplicate images from Supabase Storage that were uploaded before the deduplication feature was implemented.

#### Usage

1. **View duplicates (safe, no deletion):**
   ```bash
   node scripts/cleanup-duplicate-images.js
   ```

2. **Delete duplicates (WARNING: permanent deletion):**
   ```bash
   node scripts/cleanup-duplicate-images.js --delete
   ```

#### What it does

- Scans all images in the `events/` folder of your Supabase Storage
- Groups files by size for efficient comparison
- Downloads files to compute SHA-256 content hashes
- Identifies true duplicates (files with identical content)
- Shows a report of duplicates and space that can be saved
- Optionally deletes duplicate files (only when `--delete` flag is used)

#### Safety Features

- **No deletion by default** - only shows report unless `--delete` flag is used
- **Clear warnings** before any deletion
- **Detailed logging** of all operations
- **Error handling** for failed operations

#### Example Output

```
🔍 Scanning for duplicate images in Supabase Storage...
📁 Found 10 files in events folder
🔍 Found 3 groups of files with matching sizes

📋 Checking group of 4 files with size 165376 bytes:
✅ Unique: event-1758297441483.jpg
🔄 Duplicate found: event-1758297532555.jpg (same as event-1758297441483.jpg)
🔄 Duplicate found: event-1758297589335.jpg (same as event-1758297441483.jpg)
🔄 Duplicate found: event-1758297645499.jpg (same as event-1758297441483.jpg)

🗑️  Found 3 duplicate files to delete:
   - event-1758297532555.jpg (161.5 KB) - duplicate of event-1758297441483.jpg
   - event-1758297589335.jpg (161.5 KB) - duplicate of event-1758297441483.jpg
   - event-1758297645499.jpg (161.5 KB) - duplicate of event-1758297441483.jpg

💾 Total space to be saved: 484.5 KB
```

#### Requirements

- Node.js environment with access to your `.env.local` file
- Valid Supabase credentials
- Network access to your Supabase project


