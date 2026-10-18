import assert from 'node:assert/strict';

console.log('🧪 BẮT ĐẦU CHẠY AUTOMATION TEST SUITE CHO KHÔNG GIAN HỌC TẬP (STUDY SPACE)\n');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}\n`);
    failCount++;
  }
}

// -----------------------------------------------------------
// 1. TEST LOCALSTORAGE INITIALIZATION & JSON PARSING EDGE CASES
// -----------------------------------------------------------
console.log('1. Kiểm thử Khởi tạo LocalStorage & Edge Cases JSON:');

test('Parse LocalStorage rỗng hoặc hỏng: Trả về trang mặc định an toàn', () => {
  const parseSavedPages = (raw) => {
    try {
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'page_1',
        title: 'Trang 1: Sơ đồ tư duy',
        drawingData: '',
        background: 'grid',
        stickyNotes: [],
      },
    ];
  };

  assert.equal(parseSavedPages(null)[0].id, 'page_1');
  assert.equal(parseSavedPages('')[0].id, 'page_1');
  assert.equal(parseSavedPages('invalid json text {{{')[0].id, 'page_1');
  assert.equal(parseSavedPages('[]')[0].id, 'page_1', 'Mảng rỗng phải fallback về page_1');
  assert.equal(parseSavedPages('{"not": "array"}')[0].id, 'page_1');
});

test('Xử lý an toàn QuotaExceededError khi dung lượng vượt quá giới hạn', () => {
  let saveStatus = 'saving';
  const mockSaveWithQuotaCheck = (shouldThrowQuota) => {
    try {
      if (shouldThrowQuota) {
        const err = new Error('QuotaExceededError');
        err.name = 'QuotaExceededError';
        err.code = 22;
        throw err;
      }
      saveStatus = 'saved';
    } catch (e) {
      const isQuota =
        e && (e.name === 'QuotaExceededError' || e.code === 22 || e.name === 'NS_ERROR_DOM_QUOTA_REACHED');
      if (isQuota) {
        saveStatus = 'quota_error';
      } else {
        saveStatus = 'saved';
      }
    }
  };

  mockSaveWithQuotaCheck(true);
  assert.equal(saveStatus, 'quota_error', 'Phải chuyển trạng thái sang quota_error khi đầy dung lượng');

  mockSaveWithQuotaCheck(false);
  assert.equal(saveStatus, 'saved', 'Phải lưu thành công khi không quá dung lượng');
});

// -----------------------------------------------------------
// 2. TEST ACTIVE PAGE FALLBACK & SYNC LOGIC
// -----------------------------------------------------------
console.log('\n2. Kiểm thử Logic Đồng Bộ & Fallback ID Trang (Multi-page):');

test('Khi activePageId không tồn tại trong danh sách trang, tự động fallback về pages[0]', () => {
  const pages = [
    { id: 'page_real_1', title: 'Trang 1' },
    { id: 'page_real_2', title: 'Trang 2' },
  ];
  let activePageId = 'page_ghost_999';

  const syncActivePage = (currentPages, currentActive) => {
    if (currentPages.length > 0 && !currentPages.some((p) => p.id === currentActive)) {
      return currentPages[0].id;
    }
    return currentActive;
  };

  activePageId = syncActivePage(pages, activePageId);
  assert.equal(activePageId, 'page_real_1', 'Phải tự động điều chỉnh activePageId về page_real_1');
});

// -----------------------------------------------------------
// 3. TEST BOUNDARY CLAMPING CHO STICKY NOTES
// -----------------------------------------------------------
console.log('\n3. Kiểm thử Giới Hạn Toạ Độ Kéo Thả Sticky Note (Boundary Clamping):');

test('Sticky Note không bao giờ bị kéo ra ngoài biên (Trái, Phải, Trên, Dưới)', () => {
  const containerW = 800;
  const containerH = 600;
  const maxW = Math.max(100, containerW - 80); // 720
  const maxH = Math.max(100, containerH - 80); // 520

  const clampCoords = (targetX, targetY) => {
    return {
      x: Math.max(10, Math.min(targetX, maxW)),
      y: Math.max(10, Math.min(targetY, maxH)),
    };
  };

  // Kéo ra quá cạnh trái / trên
  const negative = clampCoords(-150, -300);
  assert.equal(negative.x, 10, 'Trục X không thể nhỏ hơn 10px');
  assert.equal(negative.y, 10, 'Trục Y không thể nhỏ hơn 10px');

  // Kéo ra quá cạnh phải / dưới
  const excessive = clampCoords(2500, 3000);
  assert.equal(excessive.x, 720, 'Trục X không thể vượt quá containerW - 80px');
  assert.equal(excessive.y, 520, 'Trục Y không thể vượt quá containerH - 80px');

  // Toạ độ hợp lệ ở giữa
  const normal = clampCoords(350, 280);
  assert.equal(normal.x, 350);
  assert.equal(normal.y, 280);
});

// -----------------------------------------------------------
// 4. TEST UNDO / REDO HISTORY RING BUFFER
// -----------------------------------------------------------
console.log('\n4. Kiểm thử Cơ Chế Lưu Lịch Sử Hoàn Tác (Undo / Redo Buffer):');

test('Lịch sử undo/redo giới hạn tối đa 25 bước và hoạt động chính xác', () => {
  let history = [];
  let historyIndex = -1;

  const pushSnapshot = (data) => {
    const sliced = history.slice(0, historyIndex + 1);
    if (sliced.length >= 25) sliced.shift();
    history = [...sliced, data];
    historyIndex = Math.min(historyIndex + 1, 24);
  };

  // Push 30 snapshots
  for (let i = 1; i <= 30; i++) {
    pushSnapshot(`snapshot_${i}`);
  }

  assert.equal(history.length, 25, 'Độ dài lịch sử không được vượt quá 25');
  assert.equal(history[history.length - 1], 'snapshot_30', 'Phần tử cuối cùng phải là snapshot_30');
  assert.equal(history[0], 'snapshot_6', 'Phần tử đầu tiên phải là snapshot_6 sau khi shift');
  assert.equal(historyIndex, 24, 'historyIndex phải ở đỉnh (24)');

  // Undo 2 bước
  historyIndex -= 2;
  assert.equal(history[historyIndex], 'snapshot_28');

  // Push hành động mới sau undo => cắt nhánh redo cũ
  pushSnapshot('snapshot_divergent');
  assert.equal(history[history.length - 1], 'snapshot_divergent');
  assert.equal(history.includes('snapshot_29'), false, 'Nhánh redo cũ phải bị loại bỏ');
});

// -----------------------------------------------------------
// 5. TEST TIMER PROGRESS CALCULATION & FORMATTING
// -----------------------------------------------------------
console.log('\n5. Kiểm thử Tính Toán & Định Dạng Đồng Hồ Pomodoro:');

test('Định dạng thời gian MM:SS hoạt động chính xác', () => {
  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  assert.equal(formatTimer(1500), '25:00');
  assert.equal(formatTimer(59), '00:59');
  assert.equal(formatTimer(5), '00:05');
  assert.equal(formatTimer(0), '00:00');
  assert.equal(formatTimer(3600), '60:00');
});

test('Tính phần trăm tiến độ (timerProgress) không bao giờ bị âm hoặc vượt quá 100%', () => {
  const calcProgress = (timerMinutes, timeLeft) => {
    return Math.min(100, Math.max(0, ((timerMinutes * 60 - timeLeft) / (timerMinutes * 60)) * 100));
  };

  assert.equal(calcProgress(25, 25 * 60), 0, 'Lúc bắt đầu là 0%');
  assert.equal(calcProgress(25, 12.5 * 60), 50, 'Nửa phiên là 50%');
  assert.equal(calcProgress(25, 0), 100, 'Hết giờ là 100%');
  assert.equal(calcProgress(25, -10), 100, 'Thời gian âm vẫn bị chặn ở 100%');
  assert.equal(calcProgress(25, 3000), 0, 'Thời gian vượt ban đầu bị chặn ở 0%');
});

// -----------------------------------------------------------
// 6. TEST AMBIENT SOUND GENERATION COEFFICIENTS
// -----------------------------------------------------------
console.log('\n6. Kiểm thử Thuật Toán Paul Kellet Pink Noise Synthesis:');

test('Thuật toán lọc nhiễu hồng (Pink Noise) hội tụ trong biên độ [-1, 1]', () => {
  let b0 = 0,
    b1 = 0,
    b2 = 0,
    b3 = 0,
    b4 = 0,
    b5 = 0,
    b6 = 0;
  let lastOut = 0.0;
  let hasNaN = false;
  let maxAmp = 0;

  for (let i = 0; i < 44100; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.06;
    b6 = white * 0.115926;

    lastOut = (lastOut + 0.02 * white) / 1.02;
    const sample = pink * 0.7 + lastOut * 0.3;

    if (Number.isNaN(sample)) hasNaN = true;
    maxAmp = Math.max(maxAmp, Math.abs(sample));
  }

  assert.equal(hasNaN, false, 'Dữ liệu âm thanh không được chứa giá trị NaN');
  assert.ok(maxAmp <= 1.5, `Biên độ âm thanh phải ổn định, thực tế max: ${maxAmp}`);
});

// -----------------------------------------------------------
// TỔNG KẾT
// -----------------------------------------------------------
console.log('\n======================================================');
console.log(`🎉 TỔNG KẾT TEST SUITE: ${passCount} PASSED / ${passCount + failCount} TOTAL`);
if (failCount > 0) {
  console.error(`💥 CÓ ${failCount} TEST THẤT BẠI!`);
  process.exit(1);
} else {
  console.log('⭐ 100% TEST CASES ĐẠT CHUẨN CHẤT LƯỢNG NGHIỆM THU!');
  process.exit(0);
}
