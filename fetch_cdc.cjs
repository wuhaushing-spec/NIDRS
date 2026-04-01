const axios = require('axios');
const cheerio = require('cheerio');

async function inspectCDC() {
    try {
        const { data } = await axios.get('https://www.cdc.gov.tw/Category/List/u18bYw_q_sbd2IviVhf6Gg');
        const $ = cheerio.load(data);
        
        console.log("=== 網頁主標題 ===");
        console.log($('title').text());

        console.log("\n=== 第一個連結目標 (可能是第一類別) ===");
        // 尋找清單區塊 (通常是 .content-wrap 或 .list-box 或 a)
        const firstLink = $('div.content-wrap a').first();
        if (firstLink.length) {
            console.log("Text:", firstLink.text().trim());
            console.log("Href:", firstLink.attr('href'));
        }
        
        // 抓其中一個已知的分類頁面看看 (例如第一類傳染病)
        console.log("\n=== 深入探勘第一類傳染病列表頁籤 ===");
        const { data: subData } = await axios.get('https://www.cdc.gov.tw/Category/List/B2m5bK06s-x387V62e15Aw');
        const $2 = cheerio.load(subData);
        console.log($2('div.list').html()?.substring(0, 500) || $2('div.content-wrap').html()?.substring(0, 500));

    } catch (e) {
        console.error("抓取失敗:", e.message);
    }
}

inspectCDC();
