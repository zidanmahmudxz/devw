import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export const maxDuration = 120; // 120 seconds (Railway/Render supports this)
export const dynamic = 'force-dynamic';

// Helper: add a log entry to the slip
async function addLog(id, type, message, currentLogs = []) {
  const entry = {
    timestamp: new Date().toISOString(),
    type,    // 'info' | 'success' | 'error' | 'warning'
    message,
  };

  const updatedLogs = [...(currentLogs || []), entry];

  await supabaseAdmin
    .from('slips')
    .update({ log_entries: updatedLogs })
    .eq('id', id);

  return updatedLogs;
}

// POST /api/generate-link/[id]
export async function POST(request, { params }) {
  const { id } = params;

  // 1. Fetch slip data
  const { data: slip, error: fetchError } = await supabaseAdmin
    .from('slips')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !slip) {
    return NextResponse.json({ error: 'Slip not found' }, { status: 404 });
  }

  let logs = slip.log_entries || [];

  // Mark as processing
  await supabaseAdmin
    .from('slips')
    .update({ status: 'processing' })
    .eq('id', id);

  logs = await addLog(id, 'info', 'Starting browser automation...', logs);

  let browser;
  try {
    // 2. Launch Puppeteer
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1280,900',
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // Set a realistic user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    logs = await addLog(id, 'info', 'Navigating to wafid.com...', logs);

    // 3. Navigate to form
    await page.goto('https://wafid.com/en/book-appointment/', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    logs = await addLog(id, 'info', 'Page loaded. Filling form fields...', logs);

    // Helper: select by name + value
    async function selectField(name, value) {
      if (!value) return;
      try {
        await page.select(`select[name="${name}"]`, value);
        await new Promise(r => setTimeout(r, 800));
      } catch (e) {
        logs = await addLog(id, 'warning', `Could not select ${name}: ${e.message}`, logs);
      }
    }

    // Helper: type into input
    async function typeField(name, value) {
      if (!value) return;
      try {
        await page.focus(`input[name="${name}"], textarea[name="${name}"]`);
        await page.evaluate((n, v) => {
          const el = document.querySelector(`input[name="${n}"], textarea[name="${n}"]`);
          if (el) {
            el.value = '';
            el.dispatchEvent(new Event('focus'));
          }
        }, name, value);
        await page.type(`input[name="${name}"]`, value, { delay: 40 });
      } catch (e) {
        logs = await addLog(id, 'warning', `Could not type into ${name}: ${e.message}`, logs);
      }
    }

    // 4. Fill appointment location
    await selectField('country', slip.country);
    logs = await addLog(id, 'info', `Country selected: ${slip.country}`, logs);

    // Wait for city options to load
    await new Promise(r => setTimeout(r, 1500));
    await selectField('city', slip.city);
    logs = await addLog(id, 'info', `City selected: ${slip.city}`, logs);

    await selectField('traveled_country', slip.traveled_country);
    logs = await addLog(id, 'info', `Destination country: ${slip.traveled_country}`, logs);

    // Wait for appointment type section to appear
    await new Promise(r => setTimeout(r, 1000));

    // 5. Select appointment type
    try {
      const radioSelector = `input[name="appointment_type"][value="${slip.appointment_type || 'standard'}"]`;
      await page.waitForSelector(radioSelector, { timeout: 5000 });
      await page.click(radioSelector);
      await new Promise(r => setTimeout(r, 800));
    } catch (e) {
      logs = await addLog(id, 'warning', `Appointment type radio not found: ${e.message}`, logs);
    }

    // 6. If premium - select medical center and date
    if (slip.appointment_type === 'premium') {
      await new Promise(r => setTimeout(r, 1000));
      await selectField('premium_medical_center', slip.premium_medical_center);

      if (slip.appointment_date) {
        await new Promise(r => setTimeout(r, 1000));
        // Set the date via JS (calendar widget)
        await page.evaluate((dateVal) => {
          const input = document.querySelector('input[name="appointment_date"]');
          if (input) {
            input.removeAttribute('disabled');
            input.value = dateVal;
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, slip.appointment_date);
        logs = await addLog(id, 'info', `Appointment date set: ${slip.appointment_date}`, logs);
      }
    } else {
      // Standard - select medical center if available
      await new Promise(r => setTimeout(r, 1000));
      if (slip.medical_center) {
        await selectField('medical_center', slip.medical_center);
      }
    }

    // 7. Fill candidate information
    await typeField('first_name', slip.first_name);
    await typeField('last_name', slip.last_name);
    logs = await addLog(id, 'info', `Name filled: ${slip.first_name} ${slip.last_name}`, logs);

    // Date of birth
    if (slip.dob) {
      await page.evaluate((dob) => {
        const input = document.querySelector('input[name="dob"]');
        if (input) { input.value = dob; input.dispatchEvent(new Event('change', { bubbles: true })); }
      }, slip.dob);
    }

    await selectField('nationality', slip.nationality);
    await selectField('gender', slip.gender);
    await selectField('marital_status', slip.marital_status);

    // Passport fields
    await typeField('passport', slip.passport);
    await typeField('confirm_passport', slip.confirm_passport);

    if (slip.passport_issue_date) {
      await page.evaluate((d) => {
        const el = document.querySelector('input[name="passport_issue_date"]');
        if (el) { el.value = d; el.dispatchEvent(new Event('change', { bubbles: true })); }
      }, slip.passport_issue_date);
    }

    await typeField('passport_issue_place', slip.passport_issue_place);

    if (slip.passport_expiry_on) {
      await page.evaluate((d) => {
        const el = document.querySelector('input[name="passport_expiry_on"]');
        if (el) { el.value = d; el.dispatchEvent(new Event('change', { bubbles: true })); }
      }, slip.passport_expiry_on);
    }

    await selectField('visa_type', slip.visa_type);
    await typeField('email', slip.email);
    await typeField('phone', slip.phone);
    await typeField('national_id', slip.national_id);
    await selectField('applied_position', slip.applied_position);

    if (slip.applied_position === '108' && slip.applied_position_other) {
      await typeField('applied_position_other', slip.applied_position_other);
    }

    logs = await addLog(id, 'info', 'All form fields filled. Handling reCAPTCHA...', logs);

    // 8. Handle reCAPTCHA (v3 - automatic)
    // reCAPTCHA v3 runs automatically, we just need to wait
    await new Promise(r => setTimeout(r, 3000));

    // 9. Check confirm checkbox
    try {
      const checkbox = await page.$('input[name="confirm"]');
      if (checkbox) {
        await page.evaluate(() => {
          const cb = document.querySelector('input[name="confirm"]');
          if (cb && !cb.checked) cb.click();
        });
      }
    } catch (e) {
      logs = await addLog(id, 'warning', `Confirm checkbox issue: ${e.message}`, logs);
    }

    logs = await addLog(id, 'info', 'Submitting form...', logs);

    // 10. Click submit
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(() => null),
      page.evaluate(() => {
        const btn = document.querySelector('button[type="submit"].submit');
        if (btn) btn.click();
      }),
    ]);

    await new Promise(r => setTimeout(r, 3000));

    const currentUrl = page.url();
    logs = await addLog(id, 'info', `Redirected to: ${currentUrl}`, logs);

    // 11. Check for OTP modal or payment page
    let finalUrl = currentUrl;
    let successLink = null;

    // Check if we're on a payment page
    if (currentUrl.includes('/pay/') || currentUrl.includes('/appointment/')) {
      successLink = currentUrl;
      logs = await addLog(id, 'success', `✅ Success! Payment link generated: ${successLink}`, logs);

      await supabaseAdmin
        .from('slips')
        .update({
          status: 'submitted',
          generated_link: successLink,
          log_entries: logs,
        })
        .eq('id', id);

    } else {
      // Check for OTP modal
      const otpModalVisible = await page.evaluate(() => {
        const modal = document.querySelector('.email-otp-modal');
        return modal && (modal.style.display !== 'none' || modal.classList.contains('visible'));
      });

      if (otpModalVisible) {
        logs = await addLog(id, 'warning', '⚠️ OTP modal appeared. Manual OTP verification required on wafid.com', logs);
        finalUrl = currentUrl;
      }

      // Check for error messages on page
      const errorText = await page.evaluate(() => {
        const errEl = document.querySelector('.ui.error.message, .error-message, [class*="error"]');
        return errEl ? errEl.innerText : null;
      });

      if (errorText) {
        logs = await addLog(id, 'error', `Form error: ${errorText}`, logs);
      }

      // Take a screenshot for debugging
      logs = await addLog(id, 'info', `Current URL: ${currentUrl}`, logs);

      await supabaseAdmin
        .from('slips')
        .update({
          status: otpModalVisible ? 'otp_required' : 'error',
          log_entries: logs,
        })
        .eq('id', id);
    }

    await browser.close();
    return NextResponse.json({ success: true, url: finalUrl, logs });

  } catch (err) {
    if (browser) await browser.close().catch(() => {});

    logs = await addLog(id, 'error', `❌ Automation failed: ${err.message}`, logs);

    await supabaseAdmin
      .from('slips')
      .update({ status: 'error', log_entries: logs })
      .eq('id', id);

    return NextResponse.json({ error: err.message, logs }, { status: 500 });
  }
}
