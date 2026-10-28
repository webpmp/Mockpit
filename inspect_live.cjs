const { chromium } = require('playwright-core');

async function run() {
  const browser = await chromium.launch({
    executablePath: '/ms-playwright/chrome-headless-shell-linux64/chrome-headless-shell',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  // Skip intro if present
  const skipBtn = await page.$('text=Skip Intro');
  if (skipBtn) {
    await skipBtn.click();
    await page.waitForTimeout(500);
  }

  // Click Load Example Configuration if present
  const loadExampleBtn = await page.$('text=Load Example Configuration');
  if (loadExampleBtn) {
    await loadExampleBtn.click();
    await page.waitForTimeout(800);
  }

  // Navigate to Vehicle screen
  await page.evaluate(() => {
    const store = (window.__MOCKPIT_STORE__ || window.useMockpitStore)?.getState();
    const vehicleScreen = store.screens.find(s => s.name.toLowerCase().includes('vehicle'));
    if (vehicleScreen) {
      store.setActiveView(vehicleScreen.id);
    }
  });
  await page.waitForTimeout(800);

  const getInspectionData = async (modeName) => {
    return await page.evaluate((label) => {
      const store = (window.__MOCKPIT_STORE__ || window.useMockpitStore)?.getState();
      const testingStore = (window.__USER_TESTING_STORE__ || window.useUserTestingStore)?.getState?.();
      const activeScreen = store?.screens?.find((s) => s.id === store.activeView);
      const comps = store?.componentsByScreen?.[store.activeView] || [];
      const explodedComp = comps.find((c) => c.type === 'vehicleExplodedView');

      const beforeImg = document.querySelector('[data-testid="before-image-layer"]');
      const explodedImg = document.querySelector('[data-testid="exploded-image-layer"]');
      const frameEl = document.querySelector('[data-testid="exploded-view-frame"]');

      return {
        inspectionMode: label,
        activeScreenId: store?.activeView,
        activeScreenName: activeScreen?.name,
        componentId: explodedComp?.id,
        componentType: explodedComp?.type,
        currentScreenMode: store?.screenMode,
        isParticipantMode: Boolean(testingStore?.isParticipantMode),
        isAuditorMode: store?.screenMode === 'audit',
        staticProps_imageUrl: explodedComp?.staticProps?.imageUrl,
        staticProps_beforeImageUrl: explodedComp?.staticProps?.beforeImageUrl,
        staticProps_editorPreview: explodedComp?.staticProps?.editorPreview,
        activePresentationCalloutId: store?.activePresentationCalloutId,
        dom_before: beforeImg
          ? {
              src_prefix: beforeImg.src ? beforeImg.src.slice(0, 80) : null,
              src_length: beforeImg.src?.length,
              is_data_url: beforeImg.src?.startsWith('data:'),
              style_opacity: beforeImg.style.opacity,
              computed_opacity: window.getComputedStyle(beforeImg).opacity,
              offsetWidth: beforeImg.offsetWidth,
              offsetHeight: beforeImg.offsetHeight,
              naturalWidth: beforeImg.naturalWidth,
              naturalHeight: beforeImg.naturalHeight,
              ariaHidden: beforeImg.getAttribute('aria-hidden'),
              alt: beforeImg.getAttribute('alt'),
            }
          : null,
        dom_exploded: explodedImg
          ? {
              src_prefix: explodedImg.src ? explodedImg.src.slice(0, 80) : null,
              src_length: explodedImg.src?.length,
              is_data_url: explodedImg.src?.startsWith('data:'),
              style_opacity: explodedImg.style.opacity,
              computed_opacity: window.getComputedStyle(explodedImg).opacity,
              offsetWidth: explodedImg.offsetWidth,
              offsetHeight: explodedImg.offsetHeight,
              naturalWidth: explodedImg.naturalWidth,
              naturalHeight: explodedImg.naturalHeight,
              ariaHidden: explodedImg.getAttribute('aria-hidden'),
              alt: explodedImg.getAttribute('alt'),
            }
          : null,
        frame: frameEl
          ? {
              offsetWidth: frameEl.offsetWidth,
              offsetHeight: frameEl.offsetHeight,
              style_left: frameEl.style.left,
              style_top: frameEl.style.top,
              style_width: frameEl.style.width,
              style_height: frameEl.style.height,
            }
          : null,
      };
    }, modeName);
  };

  console.log('--- LIVE INSPECTION: EDITOR MODE ---');
  console.log(JSON.stringify(await getInspectionData('Editor'), null, 2));

  // Switch to Presenter Mode
  await page.evaluate(() => {
    const store = (window.__MOCKPIT_STORE__ || window.useMockpitStore)?.getState();
    store.setScreenMode('presentation');
  });
  await page.waitForTimeout(800);

  console.log('--- LIVE INSPECTION: PRESENTER MODE (INITIAL LOAD) ---');
  console.log(JSON.stringify(await getInspectionData('Presenter (Initial)'), null, 2));

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
