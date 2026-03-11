import { execSync } from 'child_process';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Настройки
const YANDEX_USER = 'Art@artmspektr.ru';
const YANDEX_PASS = 'gtdcjtxfjlmfnjwf'; // Пароль приложения для Диска
const WEBDAV_URL = 'https://webdav.yandex.ru';

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const DATE_STR = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const FILE_NAME = `smmplan_db_backup_${DATE_STR}.sql`;
const FILE_PATH = path.join(BACKUP_DIR, FILE_NAME);

async function runBackup() {
  console.log('--- STARTING DATABASE BACKUP TO YANDEX DISK ---');

  try {
    // 1. Создаем папку для бэкапов, если ее нет
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR);
    }

    // 2. Создаем дамп БД из Docker-контейнера
    // Имя контейнера обычно project_db_1 или по названию папки smmplan-db-1
    // Мы попробуем найти его автоматически
    console.log('Step 1: Creating database dump...');
    
    // Команда для создания дампа (предполагаем, что контейнер называется smmplan-db-1 или smmplan_db_1)
    // Используем pg_dump, который встроен в образ postgres
    try {
      execSync(`docker exec smmplan-db pg_dump -U smmuser smmplan > "${FILE_PATH}"`, { stdio: 'inherit' });
    } catch (e) {
      console.log('Failed to execute pg_dump...');
      throw e;
    }

    const stats = fs.statSync(FILE_PATH);
    console.log(`✅ Dump created: ${FILE_NAME} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

    // 3. Создаем папку на Яндекс Диске (если нет)
    console.log('Step 2: Preparing Yandex Disk directory...');
    const authHeader = `Basic ${Buffer.from(`${YANDEX_USER}:${YANDEX_PASS}`).toString('base64')}`;
    
    try {
      await axios({
        method: 'MKCOL',
        url: `${WEBDAV_URL}/backups`,
        headers: { Authorization: authHeader }
      });
    } catch (e) {
      // Папка уже может существовать, игнорируем ошибку
    }

    // 4. Загружаем файл на Яндекс Диск
    console.log('Step 3: Uploading to Yandex Disk...');
    const fileStream = fs.createReadStream(FILE_PATH);
    
    await axios({
      method: 'PUT',
      url: `${WEBDAV_URL}/backups/${FILE_NAME}`,
      data: fileStream,
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/octet-stream'
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log('-----------------------------------');
    console.log('✅ BACKUP SUCCESSFUL!');
    console.log(`File: backups/${FILE_NAME} is now on your Yandex Disk.`);
    console.log('-----------------------------------');

    // 5. Удаляем локальный файл (опционально, чтобы не занимать место)
    // fs.unlinkSync(FILE_PATH);

  } catch (error: any) {
    console.error('❌ BACKUP FAILED:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

runBackup();
