import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File } from 'formidable';
import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Disable default body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// API Handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Ensure upload directories exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const imagesDir = path.join(process.cwd(), 'public', 'images');

    await fs.ensureDir(uploadsDir);
    await fs.ensureDir(imagesDir);

    // Parse form with formidable
    const form = formidable({ uploadDir: uploadsDir, keepExtensions: true });

    const files = await new Promise<{ file: File }>((resolve, reject) => {
      form.parse(req, (err, _, files) => {
        if (err) reject(err);
        resolve(files as { file: File });
      });
    });

    const uploadedFile = files.file;
    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = uploadedFile.filepath;
    const fileExtension = path.extname(filePath).toLowerCase();

    if (fileExtension !== '.pdf') {
      return res.status(400).json({ error: 'Only PDF files are supported' });
    }

    // Extract text using `pdftotext`
    const textOutputPath = path.join(uploadsDir, `${path.basename(filePath, '.pdf')}.txt`);
    await execPromise(`pdftotext "${filePath}" "${textOutputPath}"`);

    // Read extracted text
    const extractedText = await fs.readFile(textOutputPath, 'utf-8');

    // Convert PDF to images using `pdftoppm`
    const imageBaseName = path.join(imagesDir, path.basename(filePath, '.pdf'));
    await execPromise(`pdftoppm -png "${filePath}" "${imageBaseName}"`);

    // Retrieve generated images
    const imageFiles = fs
      .readdirSync(imagesDir)
      .filter(file => file.startsWith(path.basename(filePath, '.pdf')))
      .map(file => `/images/${file}`);

    // Send response
    return res.status(200).json({
      text: extractedText,
      images: imageFiles,
    });
  } catch (error) {
    console.error('Error processing upload:', error);
    return res.status(500).json({ error: 'Failed to process the uploaded file' });
  }
}
