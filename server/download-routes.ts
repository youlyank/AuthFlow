import { Router } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

// Simple download page
router.get('/export-download', (_req, res) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Authflow Export Download</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 { color: #2196F3; }
    .download-btn {
      display: inline-block;
      background: #2196F3;
      color: white;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 10px 0;
      font-weight: bold;
    }
    .download-btn:hover {
      background: #1976D2;
    }
    .file-info {
      background: #f0f0f0;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .success { color: #4CAF50; }
    .info { color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📦 Authflow Export Downloads</h1>
    <p>Your complete Authflow project and database are ready to download!</p>
    
    <div class="file-info">
      <h3>Available Downloads:</h3>
      <p class="success">✅ Complete Package (185 KB) - Includes everything</p>
      <p class="info">• Full source code (client + server + shared)</p>
      <p class="info">• Database export (JSON + SQL)</p>
      <p class="info">• All documentation and setup guides</p>
    </div>

    <a href="/api/download/complete-package" class="download-btn" download>
      ⬇️ Download Complete Package (tar.gz)
    </a>
    <br>
    <a href="/api/download/database-json" class="download-btn" download>
      ⬇️ Download Database Only (JSON)
    </a>
    <br>
    <a href="/api/download/database-sql" class="download-btn" download>
      ⬇️ Download Database Only (SQL)
    </a>

    <div class="file-info">
      <h3>📖 After Download:</h3>
      <ol>
        <li>Extract the complete package on your computer</li>
        <li>Open <code>README_DOWNLOAD.md</code> for setup instructions</li>
        <li>Import to new Replit account or deploy to VPS</li>
        <li>Follow the setup guide to restore your data</li>
      </ol>
    </div>

    <p class="info">
      <strong>Note:</strong> Keep these files secure as they contain your database data.
    </p>
  </div>
</body>
</html>
  `;
  res.send(html);
});

// Download complete package
router.get('/download/complete-package', (_req, res) => {
  const filePath = path.join(process.cwd(), 'authflow_complete_package.tar.gz');
  
  if (fs.existsSync(filePath)) {
    res.download(filePath, 'authflow_complete_package.tar.gz', (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).send('Error downloading file');
      }
    });
  } else {
    res.status(404).send('File not found');
  }
});

// Download database JSON
router.get('/download/database-json', (_req, res) => {
  const filePath = path.join(process.cwd(), 'authflow_export_2025-10-14.json');
  
  if (fs.existsSync(filePath)) {
    res.download(filePath, 'authflow_export_2025-10-14.json', (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).send('Error downloading file');
      }
    });
  } else {
    res.status(404).send('File not found');
  }
});

// Download database SQL
router.get('/download/database-sql', (_req, res) => {
  const filePath = path.join(process.cwd(), 'authflow_download_package/authflow_database_backup.sql');
  
  if (fs.existsSync(filePath)) {
    res.download(filePath, 'authflow_database_backup.sql', (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).send('Error downloading file');
      }
    });
  } else {
    res.status(404).send('File not found');
  }
});

export default router;
