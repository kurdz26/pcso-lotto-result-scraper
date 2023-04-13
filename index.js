const puppeteer = require('puppeteer');
const express = require('express');
const cors = require('cors');

var corsOptions = {
  origin: 'http://localhost:4200',
  optionsSuccessStatus: 200
}

const path = __dirname + '/static/';

const app = express();
const port = 8080;
const endpoint = '/scrapper/v1';

const pcsoUrl = 'https://www.pcso.gov.ph/SearchLottoResult.aspx';

app.use(cors(corsOptions));
app.use(express.static(path));
app.get('/', function (req,res) {
  res.sendFile(path + "index.html");
});

let gameList = [];
let yearFromTo = '';
let numberCombi = [];

let optionsYear;

app.get(`${endpoint}/games`, (req, res) => {
  res.send({
    games: gameList,
    yearFromTo
  });
});

app.get(`${endpoint}/game/:id`, async (req, res) => {
  await scrapeLottoResults(req.params['id']);
  res.send({
    numbers: numberCombi
  });
});

async function scrapeGames() {
  await scraper(async (page) => {
    const sortNum = (a,b) => { if (a > b) return 1; if (a < b) return -1; return 0; };
    optionsYear = await page.$$eval('#cphContainer_cpContent_ddlStartYear option', options => {
      return options.map(option => parseInt(option.textContent, 10));
    });
    optionsYear.sort(sortNum);

    gameList = await page.$$eval('#cphContainer_cpContent_ddlSelectGame option', options => {
      return options.map(option => {console.log(option); return {
        value: option.value,
        label: option.textContent
      };});
    });
    gameList.splice(0, 1); // remove 'All Games'

    yearFromTo = `${optionsYear[0]} - ${optionsYear[optionsYear.length-1]}`;
  });
}

async function scrapeLottoResults(gameCode) {
  await scraper(async (page) => {
    await page.select('#cphContainer_cpContent_ddlStartMonth', 'January');
    await page.select('#cphContainer_cpContent_ddlStartDate', '1');
    await page.select('#cphContainer_cpContent_ddlStartYear', optionsYear[0].toString());

    await page.select('#cphContainer_cpContent_ddlEndMonth', 'January');
    await page.select('#cphContainer_cpContent_ddlEndDay', '31');
    await page.select('#cphContainer_cpContent_ddlEndYear',  optionsYear[optionsYear.length-1].toString());
    
    await page.select('#cphContainer_cpContent_ddlSelectGame', gameCode);

    await page.evaluate(() => {
      document.querySelector('input[type=submit]').click();
    });
    await page.waitForNavigation();
    numberCombi =  await page.evaluate(() => {
        let data = [];
        let table = document.getElementById('cphContainer_cpContent_GridView1');
        
        const sortNum = (a,b) => { if (a > b) return 1; if (a < b) return -1; return 0; };

      for (var i = 1; i < table.rows.length; i++) {
        let objCells = table.rows.item(i).cells;
        data.push({
          numbers: objCells.item(1).innerHTML.split('-').map(e => parseInt(e, 10)).sort(sortNum),
          drawDt: objCells.item(2).innerHTML
        });
      }

      return data;
    });
  });
}

async function scraper(callback) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(pcsoUrl);
  await callback(page);
  browser.close();
}

scrapeGames().then(() => {
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
});

