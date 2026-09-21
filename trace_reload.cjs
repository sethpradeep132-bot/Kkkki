const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: 'new', 
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();

  await page.evaluateOnNewDocument(() => {
    window.__logs = [];
    const log = (msg) => {
      console.log('[INSTRUMENT]', msg);
    };

    // Track reload
    const origReload = window.location.reload.bind(window.location);
    window.location.reload = function(...args) {
      log('location.reload CALLED! Stack: ' + new Error().stack);
      return origReload(...args);
    };

    // Track history.back
    const origBack = window.history.back.bind(window.history);
    window.history.back = function(...args) {
      log('history.back CALLED! Stack: ' + new Error().stack);
      return origBack(...args);
    };

    // Track history.pushState
    const origPush = window.history.pushState.bind(window.history);
    window.history.pushState = function(state, title, url) {
      log('history.pushState CALLED with state: ' + JSON.stringify(state) + ' url: ' + url + ' Stack: ' + new Error().stack);
      return origPush(state, title, url);
    };

    // Track click on elements
    document.addEventListener('click', (e) => {
      const target = e.target;
      log('Click on: <' + target.tagName + '> class: ' + target.className + ' text: ' + (target.innerText || '').slice(0, 30));
    }, true);

    // Track popstate
    window.addEventListener('popstate', (e) => {
      log('popstate event! state: ' + JSON.stringify(e.state));
    });

    // Track beforeunload
    window.addEventListener('beforeunload', (e) => {
      log('beforeunload event! Current state: ' + JSON.stringify(window.history.state));
    });
  });

  page.on('console', msg => console.log('PAGE:', msg.text()));
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      console.log('--- FRAME NAVIGATED:', frame.url());
    }
  });

  console.log('1. Loading page...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));

  console.log('2. Clicking Customer Portal...');
  await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*'));
    const found = els.find(el => el.innerText && el.innerText.trim() === 'Customer Portal');
    if (found) found.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  console.log('3. Pressing Back 1...');
  await page.goBack();
  await new Promise(r => setTimeout(r, 1000));

  console.log('4. Pressing Back 2...');
  await page.goBack();
  await new Promise(r => setTimeout(r, 1500));

  await browser.close();
})().catch(e => console.error(e));
