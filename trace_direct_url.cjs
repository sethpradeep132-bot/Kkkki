const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: 'new', 
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('portal_auth_customer', JSON.stringify({
      id: 'mock-customer-id',
      email: 'customer@test.com',
      full_name: 'Test Customer'
    }));

    const log = (msg) => console.log('[INSTRUMENT]', msg);

    const origReload = window.location.reload.bind(window.location);
    window.location.reload = function(...args) {
      log('location.reload CALLED! Stack: ' + new Error().stack);
      return origReload(...args);
    };

    window.addEventListener('popstate', (e) => {
      log('popstate event! state: ' + JSON.stringify(e.state));
    });

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

  console.log('1. Loading /customer...');
  await page.goto('http://localhost:3000/customer', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));

  console.log('2. History length:', await page.evaluate(() => window.history.length));

  console.log('3. Pressing Back 1...');
  try {
    await page.goBack();
    await new Promise(r => setTimeout(r, 1000));
  } catch (e) {
    console.log('Error Back 1:', e.message);
  }

  console.log('4. Pressing Back 2...');
  try {
    await page.goBack();
    await new Promise(r => setTimeout(r, 1000));
  } catch (e) {
    console.log('Error Back 2:', e.message);
  }

  await browser.close();
})().catch(e => console.error(e));
