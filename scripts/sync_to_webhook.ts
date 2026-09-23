import fs from 'fs';
import path from 'path';
import { PLACEMENT_SHEET_COLUMNS, extractTestRowValues } from '../src/utils/placementGoogleSheets';

async function syncAllToWebhook() {
  const webhookUrl = 'https://script.google.com/macros/s/AKfycbyR_WM6kpyQZmdODOT8Z0okH0YSFDdqi_yJZ8riYOcVOx7bXeAayesEdIMWzoLsVj-J/exec';
  const storagePath = path.join(process.cwd(), 'server-storage', 'placementTests.json');

  if (!fs.existsSync(storagePath)) {
    console.log('No placementTests.json found.');
    return;
  }

  const tests = JSON.parse(fs.readFileSync(storagePath, 'utf-8'));
  console.log(`Found ${tests.length} tests to push to Google Sheet Webhook.`);

  let successCount = 0;
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    const rowData = extractTestRowValues(test, i);
    const payload = {
      headers: PLACEMENT_SHEET_COLUMNS,
      row: rowData,
      test,
    };

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        successCount++;
        console.log(`[${i + 1}/${tests.length}] Synced: ${test.candidateName}`);
      } else {
        console.warn(`[${i + 1}/${tests.length}] Webhook returned status ${res.status} for ${test.candidateName}`);
      }
    } catch (err) {
      console.warn(`[${i + 1}/${tests.length}] Failed to sync ${test.candidateName}:`, err);
    }
  }

  console.log(`Webhook sync complete. Successfully synced ${successCount}/${tests.length} student test records.`);
}

syncAllToWebhook();
