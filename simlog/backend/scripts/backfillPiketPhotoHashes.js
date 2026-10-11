require('dotenv').config();

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/db');

const uploadDir = path.resolve(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');

async function backfillPhotoHashes() {
  const [rows] = await pool.query(`
    SELECT id, foto_url
    FROM piket_pelaksanaan
    WHERE foto_hash IS NULL AND foto_url IS NOT NULL
  `);

  let updated = 0;
  let duplicates = 0;
  let missingFiles = 0;

  for (const row of rows) {
    const photoPath = new URL(row.foto_url, 'http://localhost');
    if (!photoPath.pathname.startsWith('/uploads/')) continue;

    const filename = path.basename(photoPath.pathname);
    const filePath = path.join(uploadDir, filename);
    if (!fs.existsSync(filePath)) {
      missingFiles += 1;
      continue;
    }

    const hash = crypto.createHash('sha256').update(await fs.promises.readFile(filePath)).digest('hex');
    try {
      await pool.query('UPDATE piket_pelaksanaan SET foto_hash = ? WHERE id = ?', [hash, row.id]);
      updated += 1;
    } catch (error) {
      if (error.code !== 'ER_DUP_ENTRY') throw error;
      duplicates += 1;
    }
  }

  console.log(`[Piket photo hashes] Updated: ${updated}; duplicate historical photos: ${duplicates}; missing files: ${missingFiles}.`);
}

backfillPhotoHashes()
  .catch((error) => {
    console.error('[Piket photo hash backfill failed]', error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
