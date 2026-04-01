import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputFile = path.join(__dirname, '../src/data/diseases.json');
const reportingFile = path.join(__dirname, '../src/data/reporting_times.json');

const axiosConfig = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    },
    timeout: 10000 // 防止無窮等待
};

// 輔助函式：延遲避免被封鎖
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function scrapeCDC() {
    console.log('--- 啟動二階深度探勘爬蟲 (Deep Crawler) ---');
    try {
        const reportingTimes = JSON.parse(fs.readFileSync(reportingFile, 'utf8'));
        const diseases = [];
        
        console.log('1. 正在掃描 CDC 官方傳染病全索引頁面...');
        const indexUrl = 'https://www.cdc.gov.tw/Disease/Index';
        const { data: indexData } = await axios.get(indexUrl, axiosConfig);
        const $index = cheerio.load(indexData);
        
        // 建立「疾病名稱 -> 專屬網址」的精準對應字典
        const exactUrls = {};
        $index('a[href^="/Disease/SubIndex/"]').each((i, el) => {
            const name = $index(el).text().trim();
            exactUrls[name] = 'https://www.cdc.gov.tw' + $index(el).attr('href');
        });
        
        console.log(`> 成功精確定位了 ${Object.keys(exactUrls).length} 種疾病的真實專屬網址！\n`);

        console.log('2. 開始執行【深度潛入掃描】：為每種疾病抓取真實內文與附檔...');
        
        const cat1 = ["鼠疫", "天花", "狂犬病", "嚴重急性呼吸道症候群"];
        const cat2 = ["霍亂", "傷寒", "副傷寒", "桿菌性痢疾", "阿米巴性痢疾", "腸道出血性大腸桿菌感染症", "炭疽病", "白喉", "流行性腦脊髓膜炎", "急性無力肢體麻痺", "麻疹", "德國麻疹", "登革熱", "西尼羅熱", "急性病毒性A型肝炎", "流行性斑疹傷寒", "瘧疾", "屈公病", "漢他病毒症候群", "茲卡病毒感染症", "多重抗藥性結核病", "M痘"];
        const cat3 = ["人類免疫缺乏病毒感染", "後天免疫缺乏症候群", "結核病", "漢生病", "百日咳", "破傷風", "日本腦炎", "急性病毒性B型肝炎", "急性病毒性C型肝炎", "急性病毒性D型肝炎", "急性病毒性E型肝炎", "急性病毒性肝炎未定型", "流行性腮腺炎", "腸病毒感染併發重症", "梅毒", "先天性梅毒", "淋病", "侵襲性b型嗜血桿菌感染症", "退伍軍人病", "先天性德國麻疹症候群", "新生兒破傷風"];
        const cat4 = ["疱疹Ｂ病毒感染症", "鉤端螺旋體病", "類鼻疽", "肉毒桿菌中毒", "發熱伴血小板減少綜合症", "李斯特菌症", "侵襲性肺炎鏈球菌感染症", "Q熱", "地方性斑疹傷寒", "萊姆病", "兔熱病", "恙蟲病", "水痘併發症", "弓形蟲感染症", "流感併發重症", "布氏桿菌病", "新冠併發重症", "庫賈氏病"];
        const cat5 = ["裂谷熱", "馬堡病毒出血熱", "黃熱病", "伊波拉病毒感染", "拉薩熱", "新型A型流感", "中東呼吸症候群冠狀病毒感染症"];

        let idCounter = 1;

        for (const [diseaseName, timeLimit] of Object.entries(reportingTimes)) {
            let category = "法定傳染病"; 
            if(timeLimit === "診斷後儘速通報") category = "重點監視項目";
            else if (cat1.includes(diseaseName)) category = "第一類";
            else if (cat2.includes(diseaseName)) category = "第二類";
            else if (cat3.includes(diseaseName)) category = "第三類";
            else if (cat4.includes(diseaseName)) category = "第四類";
            else if (cat5.includes(diseaseName)) category = "第五類";

            // 尋找真實專屬網址，若該名稱找不到，才退回搜尋引擎
            let realUrl = exactUrls[diseaseName] || exactUrls[diseaseName.replace('症', '')] || `https://www.cdc.gov.tw/Disease/Index?keyword=${encodeURIComponent(diseaseName)}`;
            
            let clinicalText = "請點擊下方連結進入專區查閱。";
            let pdfDownloadUrl = realUrl; // 預設指向該網頁
            
            // 如果我們有精準抓到該疾病的專區 (SubIndex)，進入二階段掃瞄
            if(realUrl.includes('/SubIndex/')) {
                process.stdout.write(`  [深潛中] 正在掃描 ${diseaseName}... `);
                try {
                    const { data: detailData } = await axios.get(realUrl, axiosConfig);
                    const $d = cheerio.load(detailData);
                    
                    // 【任務一：萃取網頁真實文章段落】
                    const paragraphs = [];
                    // 網羅 CDC 所有可能的文章容器
                    $d('.content-wrap p, .text-wrap p, .article-content p, div[class*="content"] p').each((i, el) => {
                        const txt = $d(el).text().trim();
                        // 過濾掉選單雜訊，只抓有意義的長句子
                        if(txt.length > 20 && !txt.includes('首頁') && !txt.includes('最新消息')) paragraphs.push(txt);
                    });
                    
                    if (paragraphs.length > 0) {
                        clinicalText = paragraphs.slice(0, 2).join('\n\n'); // 擷取前兩大精華段落
                    } else {
                        clinicalText = "*此疾病目前無網頁版介紹文字，詳細法規請下載下方官方附件查看。*";
                    }

                    // 【任務二：尋找真正的法規附檔連結】
                    let foundPdf = false;
                    $d('a[href$=".pdf"], a[href$=".doc"], a[href$=".docx"], a[href$=".odt"]').each((i, el) => {
                        const linkText = $d(el).text().trim();
                        const linkHref = $d(el).attr('href');
                        // 尋找最高優先權的文件
                        if(linkText.includes('定義') || linkText.includes('通報') || linkText.includes('指引') || linkText.includes('手冊')) {
                            // 判斷是否為相對路徑並補全 CDC 網址
                            pdfDownloadUrl = linkHref.startsWith('http') ? linkHref : 'https://www.cdc.gov.tw' + linkHref;
                            foundPdf = true;
                        }
                    });
                    
                    // 如果沒找到特定「定義」的 PDF，至少抓取第一個 PDF
                    if(!foundPdf) {
                         const anyPdf = $d('a[href$=".pdf"]').first();
                         if(anyPdf.length) {
                             const linkHref = anyPdf.attr('href');
                             pdfDownloadUrl = linkHref.startsWith('http') ? linkHref : 'https://www.cdc.gov.tw' + linkHref;
                         }
                    }

                    console.log(`OK! (已抓取 ${paragraphs.length} 段精華文字)`);
                } catch(e) {
                    console.log(`失敗! (${e.message})`);
                }
                // 每抓完一頁停頓 1.5 秒，避免把 CDC 伺服器打掛被封鎖
                await sleep(1500);
            } else {
                console.log(`  [跳過] ${diseaseName} 無專區，使用搜尋引擎。`);
            }

            diseases.push({
                id: `disease-${idCounter++}`,
                category: category,
                name: diseaseName,
                isRecentlyUpdated: false,
                caseDefinitions: {
                    clinicalCriteria: clinicalText,
                    labCriteria: `詳細檢驗條件與採檢規範，請查閱官方最新修訂之通報附件。`,
                    epidemiologyCriteria: "詳細流行病學條件請參閱官方文件。",
                    reportingCriteria: "符合上述條件並由醫師診斷通報。",
                    caseClassification: "詳細分類請參閱工作手冊。"
                },
                referenceLinks: {
                    workManual: pdfDownloadUrl
                }
            });
        }
        
        console.log(`\n🎉 深度掃描完畢！成功萃取整合了 ${diseases.length} 種疾病卡片！`);
        fs.writeFileSync(outputFile, JSON.stringify(diseases, null, 2));
        console.log('✅ 最終版「血肉」資料庫 (diseases.json) 已寫入完畢！');

    } catch (error) {
        console.error('❌ 爬蟲執行失敗：', error.message);
        process.exit(1);
    }
}

scrapeCDC();
