// Plain Node script (not TS) — deliberately dependency-free so it runs in
// CI with a single `node` invocation, no build step, no ts-node.
//
// Reads reports/merged-results.json (Playwright's json reporter output,
// produced by merge-reports.config.ts), computes overall + per-project
// pass/fail/flaky/skipped counts, and writes reports/email-summary.html —
// styled with INLINE attributes only, since Gmail/Outlook strip
// <head><style> blocks and any <script> tag entirely. This file is meant
// to be read as an email body, not viewed as a normal webpage.

const fs = require('fs');
const path = require('path');

const resultsPath = path.resolve(process.cwd(), 'reports/merged-results.json');
const outputPath = path.resolve(process.cwd(), 'reports/email-summary.html');

const raw = fs.readFileSync(resultsPath, 'utf-8');
const data = JSON.parse(raw);

// Recursively walk the suite tree collecting every test's final status
// and which project (browser) it ran under. Playwright nests suites
// arbitrarily deep (file suite > describe suite > spec > tests[]).
function collectTests(node, out) {
  for (const spec of node.specs || []) {
    for (const test of spec.tests || []) {
      out.push({ project: test.projectName || 'unknown', status: test.status });
    }
  }
  for (const suite of node.suites || []) {
    collectTests(suite, out);
  }
}

const allTests = [];
for (const suite of data.suites || []) {
  collectTests(suite, allTests);
}

function summarize(tests) {
  const summary = { total: tests.length, passed: 0, failed: 0, flaky: 0, skipped: 0 };
  for (const t of tests) {
    if (t.status === 'expected') summary.passed++;
    else if (t.status === 'unexpected') summary.failed++;
    else if (t.status === 'flaky') summary.flaky++;
    else if (t.status === 'skipped') summary.skipped++;
  }
  summary.passRate = summary.total
    ? Math.round(((summary.passed + summary.flaky) / summary.total) * 1000) / 10
    : 0;
  return summary;
}

const overall = summarize(allTests);

const byProject = {};
for (const t of allTests) {
  if (!byProject[t.project]) byProject[t.project] = [];
  byProject[t.project].push(t);
}
const projectRows = Object.keys(byProject)
  .sort()
  .map((project) => ({ project, ...summarize(byProject[project]) }));

const statusColor = overall.failed > 0 ? '#c0392b' : overall.flaky > 0 ? '#d68910' : '#1e8449';

function row(label, s) {
  return `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#333333;">${label}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#333333;text-align:center;">${s.total}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#1e8449;text-align:center;">${s.passed}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#d68910;text-align:center;">${s.flaky}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#c0392b;text-align:center;">${s.failed}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#888888;text-align:center;">${s.skipped}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;text-align:center;">${s.passRate}%</td>
    </tr>`;
}

const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#f4f4f4;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
          <tr>
            <td style="background-color:#111827;padding:20px 24px;">
              <span style="color:#ffffff;font-size:18px;font-weight:bold;">EventHub — Regression Report</span>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#555555;padding-bottom:6px;">Overall pass rate</td>
                </tr>
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;font-size:36px;font-weight:bold;color:${statusColor};padding-bottom:16px;">
                    ${overall.passRate}%
                  </td>
                </tr>
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#555555;padding-bottom:20px;">
                    ${overall.total} tests total &nbsp;•&nbsp;
                    <span style="color:#1e8449;">${overall.passed} passed</span> &nbsp;•&nbsp;
                    <span style="color:#d68910;">${overall.flaky} flaky</span> &nbsp;•&nbsp;
                    <span style="color:#c0392b;">${overall.failed} failed</span> &nbsp;•&nbsp;
                    <span style="color:#888888;">${overall.skipped} skipped</span>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e0e0;border-radius:6px;overflow:hidden;">
                <tr style="background-color:#f0f0f0;">
                  <td style="padding:8px 12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#555555;font-weight:bold;">Project</td>
                  <td style="padding:8px 12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#555555;font-weight:bold;text-align:center;">Total</td>
                  <td style="padding:8px 12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#555555;font-weight:bold;text-align:center;">Passed</td>
                  <td style="padding:8px 12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#555555;font-weight:bold;text-align:center;">Flaky</td>
                  <td style="padding:8px 12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#555555;font-weight:bold;text-align:center;">Failed</td>
                  <td style="padding:8px 12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#555555;font-weight:bold;text-align:center;">Skipped</td>
                  <td style="padding:8px 12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#555555;font-weight:bold;text-align:center;">Pass %</td>
                </tr>
                ${projectRows.map((p) => row(p.project, p)).join('')}
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#888888;">
                    Full HTML report attached (zip). Run: ${process.env.GITHUB_RUN_ID || 'local'} —
                    ${process.env.GITHUB_SERVER_URL || ''}/${process.env.GITHUB_REPOSITORY || ''}/actions/runs/${process.env.GITHUB_RUN_ID || ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, html, 'utf-8');

console.log(`Pass rate: ${overall.passRate}% (${overall.passed}/${overall.total} passed, ${overall.flaky} flaky, ${overall.failed} failed)`);

// Expose values to later CI steps (e.g. the email subject line) without
// re-parsing the JSON a second time.
if (process.env.GITHUB_ENV) {
  fs.appendFileSync(
    process.env.GITHUB_ENV,
    `PASS_RATE=${overall.passRate}\nTOTAL_TESTS=${overall.total}\nFAILED_TESTS=${overall.failed}\n`
  );
}