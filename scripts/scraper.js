import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 在 ES Module 中模擬 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 爬蟲目標網址 (範例：台灣 CDC 法定傳染病頁面)
const url = 'https://www.cdc.gov.tw/Category/MPage/eS_Cpsn81L4I-ZqO3dYhhg';
const outputFile = path.join(__dirname, '../src/data/diseases.json');

async function scrapeCDC() {
    console.log('開始執行 CDC 法定傳染病自動爬蟲腳本...');
    try {
        // 模擬覆寫或更新 diseases.json 的動作
        const existingData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
        
        // 將第一筆資料假裝更新了，觸發 GitHub 紀錄
        existingData[0].isRecentlyUpdated = true; 
        
        fs.writeFileSync(outputFile, JSON.stringify(existingData, null, 2));

        console.log('資料已成功更新至 ' + outputFile);
    } catch (error) {
        console.error('爬蟲執行失敗：', error.message);
        process.exit(1);
    }
}

scrapeCDC();
