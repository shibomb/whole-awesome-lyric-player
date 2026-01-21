import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LINKS_JSON_URL = 'https://l.32keta.com/external_links.json';
const INDEX_HTML_PATH = path.join(__dirname, '../index.html');

async function fetchLinks() {
    const response = await fetch(LINKS_JSON_URL);
    if (!response.ok) {
        throw new Error(`Failed to fetch links: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

function generateHtml(categories) {
    let html = '';

    for (const category of categories) {
        html += `                <nav class="flex flex-col gap-1">\n`;
        html += `                    <span class="text-[10px] font-black uppercase tracking-[0.2em] text-base-content/30">${category.title}</span>\n`;
        for (const link of category.links) {
            html += `                    <a href="${link.url}" target="_blank" rel="noopener noreferrer"\n`;
            html += `                        class="text-xs font-bold text-base-content/60 hover:text-primary transition-colors">${link.title}</a>\n`;
        }
        html += `                </nav>\n`;
    }

    return html.trimEnd(); // remove trailing newline for cleaner insertion
}

async function updateIndexHtml() {
    try {
        console.log(`Fetching links from ${LINKS_JSON_URL}...`);
        const categories = await fetchLinks();

        console.log('Generating HTML...');
        const newContent = generateHtml(categories);

        console.log(`Reading ${INDEX_HTML_PATH}...`);
        let indexHtml = await fs.readFile(INDEX_HTML_PATH, 'utf-8');

        const startMarker = '<!-- AUTO_GENERATED_LINKS_START -->';
        const endMarker = '<!-- AUTO_GENERATED_LINKS_END -->';

        const startIndex = indexHtml.indexOf(startMarker);
        const endIndex = indexHtml.indexOf(endMarker);

        if (startIndex === -1 || endIndex === -1) {
            throw new Error('Markers not found in index.html');
        }

        const updatedHtml = indexHtml.substring(0, startIndex + startMarker.length) +
            '\n' + newContent + '\n' +
            indexHtml.substring(endIndex);

        await fs.writeFile(INDEX_HTML_PATH, updatedHtml, 'utf-8');
        console.log('Successfully updated index.html');

    } catch (error) {
        console.error('Error updating external links:', error);
        process.exit(1);
    }
}

updateIndexHtml();
