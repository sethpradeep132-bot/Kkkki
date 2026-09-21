const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: 'new', 
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      console.log('FRAME NAVIGATED:', frame.url());
    }
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // Log state
  console.log('Initial history length:', await page.evaluate(() => window.history.length));

  // Let's test each portal
  const portals = ['Customer Portal', 'Seller Portal', 'Hub Logistic Portal', 'Rider Portal', 'Cluster Portal', 'Admin Portal'];

  for (const portal of ['Customer Portal', 'Seller Portal', 'Admin Portal']) {
    console.log(`\n--- TESTING ${portal} ---`);
    await page.evaluate((p) => {
      const els = Array.from(document.querySelectorAll('*'));
      const found = els.find(el => el.innerText && el.innerText.trim() === p);
      if (found) found.click();
    }, portal);

    await new Promise(r => setTimeout(r, 1000));
    console.log('After entering portal - history length:', await page.evaluate(() => window.history.length), 'state:', await page.evaluate(() => window.history.state));

    // Look at buttons in this portal
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map(b => ({
        text: b.innerText.trim(),
        html: b.innerHTML.slice(0, 50),
        visible: b.offsetWidth > 0 && b.offsetHeight > 0
      }));
    });
    console.log(`Visible buttons count: ${buttons.filter(b => b.visible).length}`);

    // If there is a sub-tab or sub-page, click it
    const subClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, nav button'));
      const target = btns.find(b => b.offsetWidth > 0 && (
        b.innerText.includes('Services') || 
        b.innerText.includes('Products') || 
        b.innerText.includes('Create ID') ||
        b.innerText.includes('Shipments')
      ));
      if (target) {
        target.click();
        return target.innerText;
      }
      return null;
    });
    console.log('Sub action clicked:', subClicked);
    await new Promise(r => setTimeout(r, 1000));
    console.log('After sub action - history length:', await page.evaluate(() => window.history.length), 'state:', await page.evaluate(() => window.history.state));

    // Press Back 1
    console.log('Pressing Back 1...');
    await page.evaluate(() => window.history.back());
    await new Promise(r => setTimeout(r, 1000));
    console.log('After Back 1 - history length:', await page.evaluate(() => window.history.length), 'state:', await page.evaluate(() => window.history.state));
    console.log('Selected portal in DOM / title:', await page.evaluate(() => document.title));

    // Press Back 2
    console.log('Pressing Back 2...');
    await page.evaluate(() => window.history.back());
    await new Promise(r => setTimeout(r, 1000));
    console.log('After Back 2 - history length:', await page.evaluate(() => window.history.length), 'state:', await page.evaluate(() => window.history.state));

    // Reset back to home for next portal
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 500));
  }

  await browser.close();
})().catch(e => console.error(e));
