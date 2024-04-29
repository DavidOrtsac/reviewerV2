// pages/api/chat/pdfparsing.js

import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import pdfParse from 'pdf-parse';

export const config = {
  api: {
    bodyParser: false,
  },
};

const parseForm = (req) => {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve(files);
    });
  });
};

export default async function handler(req, res) {
  try {
    const files = await parseForm(req);
    if (!files || !files.file) {
      return res.status(400).json({ error: 'No file was uploaded' });
    }
    const file = Array.isArray(files.file) ? files.file[0] : files.file; // Handle single file
    const buffer = await fs.readFile(file.filepath);
    const data = await pdfParse(buffer);
    await fs.unlink(file.filepath); // Cleanup temp file
    res.status(200).json({ text: data.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error parsing the form or the PDF' });
  }
}