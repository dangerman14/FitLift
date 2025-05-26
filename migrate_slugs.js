const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

neonConfig.webSocketConstructor = ws;

function generateSlug(name) {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .substring(0, 30); // Limit length
  
  // Generate random 6-character alphanumeric string
  const randomString = Math.random().toString(36).substring(2, 8);
  
  return `${baseSlug}-${randomString}`;
}

async function migrateExistingSlugs() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Get all workout templates without slugs
    const { rows: templates } = await pool.query('SELECT id, name FROM workout_templates WHERE slug IS NULL');
    
    console.log(`Found ${templates.length} templates without slugs`);
    
    for (const template of templates) {
      const slug = generateSlug(template.name);
      await pool.query('UPDATE workout_templates SET slug = $1 WHERE id = $2', [slug, template.id]);
      console.log(`Updated template "${template.name}" with slug: ${slug}`);
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrateExistingSlugs();
