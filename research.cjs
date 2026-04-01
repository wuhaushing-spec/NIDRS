const axios = require('axios');
const fs = require('fs');
async function test() {
  const cfg = { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/115.0.0.0 Safari/537.36' } };
  try {
    const d1 = await axios.get('https://www.cdc.gov.tw/Category/List/B2m5bK06s-x387V62e15Aw', cfg);
    fs.writeFileSync('output_cat1.html', d1.data);
    console.log("Success");
  } catch(e) { console.error("Error", e.message); }
}
test();
