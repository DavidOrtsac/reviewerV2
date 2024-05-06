import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
    const { promptName } = req.query;
    const filePath = path.join(process.cwd(), 'prompts', `${promptName}.txt`);
    
    try {
        const fileContents = fs.readFileSync(filePath, 'utf8');
        res.status(200).json({ content: fileContents });
    } catch (error) {
        res.status(404).json({ error: 'Prompt not found' });
    }
}
