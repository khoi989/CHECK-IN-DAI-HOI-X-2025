// ===== CONFIG — PASTE your Apps Script Web App URL (must end with /exec)
const CONFIG = {
  WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbzRxmw2xKw03lOMN5jtjibEx1dRpEvfKlwvG2BrRd3kgBFHH2NLaDfmJY4jgp83J_W4/exec'
};

// ---------- helpers ----------
const $ = (id) => document.getElementById(id);

function htmlEscape(s) {
  const str = s == null ? '' : String(s);
  return str.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function showMessage(kind, seat = '') {
  const el = $('result');
  let html = "";

  if (kind === 'ok') {
    html = `<div class="ok">
      <div><strong>Check-In thành công!</strong></div>
      <div><strong>Số ghế của bạn: ${htmlEscape(seat)}</strong></div>
      <div class="muted"><em>Cảm ơn bạn đã tham dự chương trình ĐẠI HỘI X 2025. 
      Xin vui lòng di chuyển lên hội trường và ngồi đúng số ghế đã chỉ định.</em></div>
    </div>`;
  } else if (kind === 'err') {
    html = `<div class="err">
      <div><strong>Check-In không thành công!</strong></div>
      <div class="muted"><em>Xin vui lòng kiểm tra lại các thông tin hoặc di chuyển tới khu vực lễ tân để được hỗ trợ.</em></div>
    </div>`;
  } else {
    html = `<div class="warn">
      <div><strong>Vui lòng điền đầy đủ thông tin</strong></div>
    </div>`;
  }

  el.innerHTML = html;
}

// JSONP helper (with timeout)
function jsonp(url, params = {}, timeoutMs = 15000) {
  const qs = new URLSearchParams({ ...params }).toString();
  const fullUrl = `${url}?${qs}`;

  return fetch(fullUrl)
    .then(response => response.json())
    .then(data => data)
    .catch(error => {
      console.error('Fetch error:', error);
      throw new Error('JSONP network error');
    });
}


// ---------- main ----------
document.addEventListener('DOMContentLoaded', () => {
  const form = $('seat-form');
  const submitBtn = $('submitBtn');
  const resultEl = $('result');

  // NEW: mode selection
  const modeButtons = document.querySelectorAll('.mode-btn');
  let currentMode = null; // 'existing' or 'new'

  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentMode = btn.dataset.mode;

      // Visual selection (without changing overall design colors)
      modeButtons.forEach(b => {
        if (b === btn) {
          b.style.opacity = '1';
        } else {
          b.style.opacity = '0.7';
        }
      });

      // Clear previous messages when switching mode
      resultEl.innerHTML = '';
    });
  });

  if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(CONFIG.WEB_APP_URL)) {
    showMessage('err');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Must choose case 1 or case 2 before submit
    if (!currentMode) {
      showMessage('warn');
      return;
    }

    const name = $('name').value.trim();
    const studentID = $('studentID').value.trim();
    const lop = $('lop').value.trim();

    if (!name || !studentID || !lop) {
      showMessage('warn');
      return;
    }

    const cleanName = name.replace(/\s+/g, ' ');
    const cleanLop  = lop.replace(/\s+/g, ' ');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang kiểm tra…';

    try {
      const res = await jsonp(CONFIG.WEB_APP_URL, {
        name: cleanName,
        studentID,
        lop: cleanLop,
        mode: currentMode   // NEW: tell backend which case
      });

      if (res && res.ok) {
        showMessage('ok', res.seat || '');
      } else {
        showMessage('err');
      }
    } catch (err) {
      showMessage('err');
      console.error(err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Check in';
    }
  });
});
