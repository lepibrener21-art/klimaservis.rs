/**
 * Servis Klima M - Main JavaScript
 * Version: 4.0
 * Form submissions → Telegram Bot (replaces Formspree)
 *
 * ============================================================
 * SETUP — do this once before uploading (takes ~10 minutes):
 *
 * STEP 1 — Create your Telegram Bot:
 *   1. Open Telegram, search for @BotFather
 *   2. Send: /newbot
 *   3. Give it a name, e.g. "Servis Klima M Leads"
 *   4. Give it a username, e.g. "ServisKlimaMBot"
 *   5. BotFather replies with a TOKEN — copy it
 *   6. Paste it below as TELEGRAM_BOT_TOKEN
 *
 * STEP 2 — Get your Chat ID:
 *   1. Search for your new bot in Telegram and send it any message (e.g. "hi")
 *   2. Open this URL in your browser (replace YOUR_TOKEN):
 *      https://api.telegram.org/botYOUR_TOKEN/getUpdates
 *   3. Find "chat":{"id": 123456789} — that number is your Chat ID
 *   4. Paste it below as TELEGRAM_CHAT_ID
 *
 * ============================================================
 */

// ============================================
// TELEGRAM CONFIG — fill these in!
// ============================================
const TELEGRAM_BOT_TOKEN = '8779677533:AAHM9GFhOmqRZysstiJX1t8vR0siSvrESX0';   // e.g. '7123456789:AAFxxxxxxxxxxxxxxxxxxxxxx'
const TELEGRAM_CHAT_ID   = '502091066';     // e.g. '123456789'

// ============================================
// DOM Elements
// ============================================
const scrollTopBtn      = document.getElementById('scrollTopBtn');
const cookieBanner      = document.getElementById('cookieBanner');
const acceptCookiesBtn  = document.getElementById('acceptCookies');
const rejectCookiesBtn  = document.getElementById('rejectCookies');
const leadForm          = document.getElementById('leadForm');
const successMessage    = document.getElementById('successMessage');
const phoneCallBtns     = document.querySelectorAll('a[href^="tel:"]');
const ctaButtons        = document.querySelectorAll('#navCtaBtn, #heroCtaBtn, #ctaFormBtn');

// ============================================
// DOMContentLoaded — initial state setup
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  const privacyModal = document.getElementById('privacyModal');
  if (privacyModal) {
    privacyModal.classList.remove('show');
    privacyModal.style.display = 'none';
  }

  const cookieBanner = document.getElementById('cookieBanner');
  if (cookieBanner) {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setTimeout(() => cookieBanner.classList.add('show'), 1000);
    } else if (consent === 'granted') {
      updateConsent('granted');
    }
  }
});

// ============================================
// Google Consent Mode v2
// ============================================
function updateConsent(state) {
  if (typeof gtag === 'undefined') return;
  if (state === 'granted') {
    gtag('consent', 'update', {
      'analytics_storage': 'granted',
      'ad_storage': 'granted',
      'ad_user_data': 'granted',
      'ad_personalization': 'granted'
    });
  } else {
    gtag('consent', 'update', {
      'analytics_storage': 'denied',
      'ad_storage': 'denied',
      'ad_user_data': 'denied',
      'ad_personalization': 'denied'
    });
  }
}

// ============================================
// Cookie Consent
// ============================================
if (cookieBanner && acceptCookiesBtn) {
  acceptCookiesBtn.addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'granted');
    cookieBanner.classList.remove('show');
    updateConsent('granted');
  });
}

if (cookieBanner && rejectCookiesBtn) {
  rejectCookiesBtn.addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'denied');
    cookieBanner.classList.remove('show');
    updateConsent('denied');
  });
}

// ============================================
// Send to Telegram helper
// ============================================
async function sendToTelegram(formData) {
  const now = new Date();
  const timestamp = now.toLocaleString('sr-Latn-RS', {
    timeZone: 'Europe/Belgrade',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  // HTML parse mode: only <, >, & need escaping — no dot/dash issues
  const message = [
    '🔔 <b>NOVI UPIT — Servis Klima M</b>',
    '─────────────────────',
    `👤 <b>Ime:</b> ${escHtml(formData.get('ime') || '—')}`,
    `📞 <b>Telefon:</b> ${escHtml(formData.get('telefon') || '—')}`,
    `📧 <b>Email:</b> ${escHtml(formData.get('email') || '—')}`,
    `🔧 <b>Usluga:</b> ${escHtml(formData.get('usluga') || '—')}`,
    `💬 <b>Napomena:</b> ${escHtml(formData.get('poruka') || '—')}`,
    '─────────────────────',
    `🕐 ${timestamp}`,
    `🌐 klimaservism.rs`
  ].join('\n');

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.description || 'Telegram API error');
  }

  return response.json();
}

// Escape special chars for Telegram HTML parse mode
function escHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ============================================
// Lead Form Submission
// ============================================
if (leadForm) {
  leadForm.removeAttribute('action');

  const submitBtn = document.getElementById('submitBtn');

  leadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const ime     = leadForm.querySelector('[name="ime"]');
    const telefon = leadForm.querySelector('[name="telefon"]');
    const usluga  = leadForm.querySelector('[name="usluga"]');

    if (!ime.value.trim() || !telefon.value.trim() || !usluga.value) {
      showFormError('Molimo popunite sva obavezna polja.');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Slanje...';
    }

    const formData = new FormData(leadForm);

    if (typeof gtag !== 'undefined') {
      gtag('event', 'generated_lead');
    }

    try {
      await sendToTelegram(formData);

      if (successMessage) successMessage.classList.add('show');
      leadForm.reset();

      setTimeout(() => {
        if (successMessage) successMessage.classList.remove('show');
      }, 8000);

    } catch (err) {
      console.error('Telegram send error:', err);
      showFormError('Greška pri slanju. Pozovite nas direktno na 📞 064 3888858.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Pošaljite upit →';
      }
    }
  });
}

function showFormError(msg) {
  let errEl = document.getElementById('formError');
  if (!errEl) {
    errEl = document.createElement('div');
    errEl.id = 'formError';
    errEl.style.cssText = 'background:#fee2e2;color:#991b1b;padding:12px 16px;border-radius:40px;text-align:center;margin-top:12px;font-size:0.9rem;';
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.insertAdjacentElement('afterend', errEl);
  }
  errEl.textContent = msg;
  errEl.style.display = 'block';
  setTimeout(() => { errEl.style.display = 'none'; }, 6000);
}

// ============================================
// Scroll to Top
// ============================================
if (scrollTopBtn) {
  window.addEventListener('scroll', () => {
    scrollTopBtn.classList.toggle('show', window.pageYOffset > 300);
  });
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (typeof gtag !== 'undefined') {
      gtag('event', 'scroll_to_top', { 'event_category': 'engagement' });
    }
  });
}

// ============================================
// Phone Call Tracking
// ============================================
if (phoneCallBtns.length > 0) {
  phoneCallBtns.forEach(link => {
    link.addEventListener('click', () => {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'phone_call_click', { 'event_category': 'engagement', 'event_label': 'telefon_klik' });
      }
    });
  });
}

// ============================================
// CTA Buttons
// ============================================
if (ctaButtons.length > 0) {
  ctaButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof gtag !== 'undefined') {
        gtag('event', 'cta_click', { 'event_category': 'engagement', 'event_label': btn.id || 'cta_button' });
      }
      const contactForm = document.getElementById('kontakt-forma');
      if (contactForm) contactForm.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

// ============================================
// Smooth Scroll
// ============================================
document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const targetId = this.getAttribute('href');
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      e.preventDefault();
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.pushState(null, null, targetId);
    }
  });
});

// ============================================
// Privacy Policy Modal
// ============================================
const privacyModal        = document.getElementById('privacyModal');
const privacyLinks        = document.querySelectorAll('#privacyPolicyLink, #privacyPolicyLinkCopyright, #privacyPolicyLinkCookie');
const closeModalBtn       = document.querySelector('.privacy-modal-close');
const closeModalFooterBtn = document.getElementById('closePrivacyModal');

function openPrivacyModal(e) {
  if (e) e.preventDefault();
  if (privacyModal) {
    privacyModal.style.display = '';
    privacyModal.classList.add('show');
    document.body.style.overflow = 'hidden';
    const firstFocusable = privacyModal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) firstFocusable.focus();
  }
}

function closePrivacyModal() {
  if (privacyModal) {
    privacyModal.classList.remove('show');
    document.body.style.overflow = '';
  }
}

if (privacyLinks.length > 0) privacyLinks.forEach(link => link.addEventListener('click', openPrivacyModal));
if (closeModalBtn) {
  closeModalBtn.addEventListener('click', closePrivacyModal);
  closeModalBtn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') closePrivacyModal(); });
}
if (closeModalFooterBtn) closeModalFooterBtn.addEventListener('click', closePrivacyModal);
if (privacyModal) privacyModal.addEventListener('click', (e) => { if (e.target === privacyModal) closePrivacyModal(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && privacyModal && privacyModal.classList.contains('show')) closePrivacyModal();
});

// ============================================
// Page Load Tracking
// ============================================
window.addEventListener('load', () => {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'page_view', { 'page_title': document.title, 'page_location': window.location.href });
  }
});
