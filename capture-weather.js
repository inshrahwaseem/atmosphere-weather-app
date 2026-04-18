import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function capture() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Create screenshots directory
  const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const url = 'https://atmosphere-weather-app-ruddy.vercel.app/';

  try {
    console.log('Navigating to:', url);
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // Wait for some weather data to load if possible
    await page.waitForTimeout(5000); 

    console.log('Capturing home page...');
    await page.screenshot({ path: path.join(screenshotsDir, 'home.png') });

    // Try to find a search input or something to show more features
    // For now, let's just take a few different views/scrolls
    
    console.log('Capturing mobile view...');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({ path: path.join(screenshotsDir, 'mobile.png') });

    console.log('Screenshots captured successfully!');
  } catch (error) {
    console.error('Error capturing screenshots:', error);
  } finally {
    await browser.close();
  }
}

capture();
