import * as fs from 'fs';

const CSV_FILE = 'vexboost_interchangeable_map.csv';
const VEX_FULL = 'vexboost_full.json';
const RAW_CATALOG = 'raw_catalog.json'; // fallback if vexboost_full is missing descriptions
const CHUNK_SIZE = 25;

async function prepareChunk(chunkIndex: number) {
    if (!fs.existsSync('temp_batches')) fs.mkdirSync('temp_batches');

    // 1. Полноценные данные Vexboost (с описаниями из raw_catalog)
    const rawVex = JSON.parse(fs.readFileSync(RAW_CATALOG, 'utf8')); 
    
    // 2. Читаем нашу карту
    const lines = fs.readFileSync(CSV_FILE, 'utf8').split('\n').filter(l => l.trim().length > 0);
    const headers = lines.shift();

    const start = chunkIndex * CHUNK_SIZE;
    const end = start + CHUNK_SIZE;
    const slice = lines.slice(start, end);

    const chunkData = slice.map(line => {
        const cols = line.split(';');
        const targetTier = cols[0].replace(/^"|"$/g, '');
        const matchId = cols[2].replace(/^"|"$/g, ''); // Vexboost_Match_1_ID
        
        let uglyName = cols[3].replace(/^"|"$/g, '');
        let uglyDesc = '';

        if (matchId) {
            // Ищем полное описание в raw_catalog
            const vexOrigin = rawVex.find((v: any) => String(v.service || v.id) === String(matchId));
            if (vexOrigin) {
                uglyName = vexOrigin.name || uglyName;
                uglyDesc = vexOrigin.description || '';
            }
        }

        return {
            targetSmmplanTier: targetTier,
            providerServiceId: matchId,
            uglyName,
            uglyDescription: uglyDesc
        };
    });

    const fileOut = `temp_batches/chunk_${chunkIndex + 1}_raw.json`;
    fs.writeFileSync(fileOut, JSON.stringify(chunkData, null, 2));
    console.log(`Подготовлен чанк ${chunkIndex + 1}: ${chunkData.length} услуг сохранены в ${fileOut}`);
}

prepareChunk(0).catch(console.error);
