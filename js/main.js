document.addEventListener('DOMContentLoaded', function() {
    AOS.init({
        once: true,    // 只執行一次動畫
        offset: 60
    });
    initAerialVideo();
    initPano();
});

// 區位全景圖：拖曳環視、滾輪／雙指縮放、開啟時自動對焦恆ONE、可自動環視
function initPano() {
    const modal = document.getElementById('modalPano');
    if (!modal) return;
    const stage = document.getElementById('panoStage');
    const img = document.getElementById('panoImg');
    const loading = document.getElementById('panoLoading');
    const hint = document.getElementById('panoHint');
    const tourBtn = modal.querySelector('[data-pano="tour"]');

    const IW = 4535, IH = 2551;          // 原圖尺寸
    const FOCUS = { x: 2954, y: 1030 };   // 恆ONE（上方 Logo ~ 下方大樓）的中心
    const MAX_SCALE = 2;

    let s = 1, tx = 0, ty = 0;           // 圖上 (x,y) → 畫面 (x*s+tx, y*s+ty)
    let anim = null, inertia = null, tour = null, tourDir = 1;
    let ready = false;

    function W() { return stage.clientWidth; }
    function H() { return stage.clientHeight; }
    function minScale() { return Math.max(W() / IW, H() / IH); }   // 圖永遠蓋滿畫面
    function focusScale() {
        return Math.min(MAX_SCALE, Math.max(minScale() * 1.3, W() / 2200, H() / 1480));
    }

    function clamp(state) {
        const sc = Math.min(MAX_SCALE, Math.max(minScale(), state.s));
        return {
            s: sc,
            tx: Math.min(0, Math.max(W() - IW * sc, state.tx)),
            ty: Math.min(0, Math.max(H() - IH * sc, state.ty))
        };
    }
    function apply(state) {
        const c = clamp(state);
        s = c.s; tx = c.tx; ty = c.ty;
        img.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + s + ')';
    }
    function centerOn(x, y, sc) {
        return { s: sc, tx: W() / 2 - x * sc, ty: H() / 2 - y * sc };
    }
    function zoomAt(px, py, factor) {
        const ns = Math.min(MAX_SCALE, Math.max(minScale(), s * factor));
        const ix = (px - tx) / s, iy = (py - ty) / s;
        return { s: ns, tx: px - ix * ns, ty: py - iy * ns };
    }

    function stopAll() {
        if (anim) cancelAnimationFrame(anim), anim = null;
        if (inertia) cancelAnimationFrame(inertia), inertia = null;
        setTour(false);
    }
    function animateTo(target, ms) {
        if (anim) cancelAnimationFrame(anim);
        const from = { s: s, tx: tx, ty: ty };
        const to = clamp(target);
        const t0 = performance.now();
        (function step(now) {
            const p = Math.min(1, (now - t0) / ms);
            const e = 1 - Math.pow(1 - p, 3);   // easeOutCubic
            apply({
                s: from.s + (to.s - from.s) * e,
                tx: from.tx + (to.tx - from.tx) * e,
                ty: from.ty + (to.ty - from.ty) * e
            });
            anim = p < 1 ? requestAnimationFrame(step) : null;
        })(t0);
    }

    function setTour(on) {
        if (!tourBtn) return;
        tourBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (tour) cancelAnimationFrame(tour), tour = null;
        if (!on) return;
        let last = performance.now();
        (function step(now) {
            const dt = Math.min(50, now - last); last = now;
            const before = tx;
            apply({ s: s, tx: tx - tourDir * dt * 0.06, ty: ty });
            if (tx === before) tourDir = -tourDir;   // 到邊緣就折返
            tour = requestAnimationFrame(step);
        })(last);
    }

    function hideHint() { hint.classList.add('hide'); }

    // 開啟：載入圖片 → 先看全圖 → 鏡頭推進到恆ONE
    modal.addEventListener('shown.bs.modal', function () {
        hint.classList.remove('hide');
        setTimeout(hideHint, 3500);
        function start() {
            ready = true;
            loading.style.display = 'none';
            apply(centerOn(IW / 2, IH / 2, minScale()));
            setTimeout(function () { animateTo(centerOn(FOCUS.x, FOCUS.y, focusScale()), 1600); }, 250);
        }
        if (!img.getAttribute('src')) {
            img.addEventListener('load', start, { once: true });
            img.src = img.dataset.src;
        } else {
            start();
        }
    });
    modal.addEventListener('hidden.bs.modal', stopAll);
    window.addEventListener('resize', function () { if (ready) apply({ s: s, tx: tx, ty: ty }); });

    // 拖曳（含慣性）＋雙指縮放
    const pointers = new Map();
    let lastPinch = null, vel = { x: 0, y: 0 }, lastMove = 0;

    stage.addEventListener('pointerdown', function (e) {
        if (!ready) return;
        stopAll(); hideHint();
        stage.setPointerCapture(e.pointerId);
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        stage.classList.add('dragging');
        vel = { x: 0, y: 0 }; lastMove = performance.now();
        lastPinch = null;
    });
    stage.addEventListener('pointermove', function (e) {
        if (!pointers.has(e.pointerId)) return;
        const prev = pointers.get(e.pointerId);
        const cur = { x: e.clientX, y: e.clientY };
        pointers.set(e.pointerId, cur);
        if (pointers.size === 1) {
            const dx = cur.x - prev.x, dy = cur.y - prev.y;
            const now = performance.now(), dt = Math.max(1, now - lastMove);
            vel = { x: dx / dt, y: dy / dt }; lastMove = now;
            apply({ s: s, tx: tx + dx, ty: ty + dy });
        } else if (pointers.size === 2) {
            const [a, b] = Array.from(pointers.values());
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            const rect = stage.getBoundingClientRect();
            const mid = { x: (a.x + b.x) / 2 - rect.left, y: (a.y + b.y) / 2 - rect.top };
            if (lastPinch) {
                const z = zoomAt(mid.x, mid.y, dist / lastPinch.dist);
                apply({ s: z.s, tx: z.tx + mid.x - lastPinch.mid.x, ty: z.ty + mid.y - lastPinch.mid.y });
            }
            lastPinch = { dist: dist, mid: mid };
        }
    });
    function endPointer(e) {
        if (!pointers.has(e.pointerId)) return;
        pointers.delete(e.pointerId);
        lastPinch = null;
        if (pointers.size) return;
        stage.classList.remove('dragging');
        if (performance.now() - lastMove > 80) return;    // 停住再放開就不滑
        let vx = vel.x * 16, vy = vel.y * 16;
        (function glide() {
            vx *= 0.92; vy *= 0.92;
            apply({ s: s, tx: tx + vx, ty: ty + vy });
            inertia = (Math.abs(vx) > 0.3 || Math.abs(vy) > 0.3) ? requestAnimationFrame(glide) : null;
        })();
    }
    stage.addEventListener('pointerup', endPointer);
    stage.addEventListener('pointercancel', endPointer);

    // 滾輪縮放（以游標為中心）
    stage.addEventListener('wheel', function (e) {
        if (!ready) return;
        e.preventDefault();
        stopAll(); hideHint();
        const rect = stage.getBoundingClientRect();
        apply(zoomAt(e.clientX - rect.left, e.clientY - rect.top, Math.exp(-e.deltaY * 0.0015)));
    }, { passive: false });

    // 雙擊放大
    stage.addEventListener('dblclick', function (e) {
        if (!ready) return;
        stopAll();
        const rect = stage.getBoundingClientRect();
        animateTo(zoomAt(e.clientX - rect.left, e.clientY - rect.top, 1.8), 500);
    });

    // 工具列
    modal.querySelector('.pano-tools').addEventListener('click', function (e) {
        const btn = e.target.closest('[data-pano]');
        if (!btn || !ready) return;
        const act = btn.dataset.pano;
        hideHint();
        if (act === 'tour') {
            const on = btn.getAttribute('aria-pressed') !== 'true';
            if (anim) cancelAnimationFrame(anim), anim = null;
            if (on && s < focusScale() * 0.95) {      // 太遠時先推近再環視
                animateTo(centerOn((W() / 2 - tx) / s, FOCUS.y, focusScale()), 700);
                setTimeout(function () { setTour(true); }, 720);
            } else {
                setTour(on);
            }
            return;
        }
        stopAll();
        if (act === 'in') animateTo(zoomAt(W() / 2, H() / 2, 1.5), 350);
        if (act === 'out') animateTo(zoomAt(W() / 2, H() / 2, 1 / 1.5), 350);
        if (act === 'focus') animateTo(centerOn(FOCUS.x, FOCUS.y, focusScale()), 900);
        if (act === 'all') animateTo(centerOn(IW / 2, IH / 2, minScale()), 900);
    });

    // 鍵盤：方向鍵移動、+/- 縮放
    modal.addEventListener('keydown', function (e) {
        if (!ready) return;
        const step = 80;
        const map = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
        if (map[e.key]) { stopAll(); animateTo({ s: s, tx: tx + map[e.key][0], ty: ty + map[e.key][1] }, 200); e.preventDefault(); }
        if (e.key === '+' || e.key === '=') { stopAll(); animateTo(zoomAt(W() / 2, H() / 2, 1.5), 300); }
        if (e.key === '-') { stopAll(); animateTo(zoomAt(W() / 2, H() / 2, 1 / 1.5), 300); }
    });
}

// 空拍影片：捲到附近才載入（省 Firebase 流量），離開畫面就暫停
function initAerialVideo() {
    const video = document.getElementById('aerialVideo');
    if (!video) return;
    const source = video.querySelector('source[data-src]');
    const toggle = document.querySelector('.video-toggle');
    let loaded = false;
    let userPaused = false;

    function setToggle() {
        if (!toggle) return;
        toggle.textContent = video.paused ? '▶' : '❚❚';
        toggle.setAttribute('aria-label', video.paused ? '播放影片' : '暫停影片');
    }
    function load() {
        if (loaded) return;
        loaded = true;
        source.src = source.dataset.src;
        video.load();
    }
    function play() {
        load();
        const p = video.play();
        if (p && p.catch) p.catch(function () {});
    }

    setToggle();
    video.addEventListener('play', setToggle);
    video.addEventListener('pause', setToggle);
    if (toggle) {
        toggle.addEventListener('click', function () {
            if (video.paused) { userPaused = false; play(); }
            else { userPaused = true; video.pause(); }
        });
    }

    if (!('IntersectionObserver' in window)) { play(); return; }
    new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) { if (!userPaused) play(); }
            else if (!video.paused) video.pause();
        });
    }, { threshold: 0.25 }).observe(video);
}

// 粉專 / LINE@ 網址尚未設定時，點擊給提示而非跳頁
document.addEventListener('click', function (e) {
    const a = e.target.closest('a[data-todo]');
    if (!a || a.getAttribute('href') !== '#') return;
    e.preventDefault();
    Swal.fire({ title: '敬請期待', text: '歡迎來電 03-315-1313 洽詢', icon: 'info', confirmButtonColor: '#b0964e', confirmButtonText: '關閉' });
});

// 禁止右鍵
document.addEventListener('contextmenu', function(event) {
    event.preventDefault();
});

const FORM_URL = 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSeVoxicRPBWg7ZgqDQMCQTLeNj8Zeslqjs83FWo3e11dXJ4gg/formResponse';

let submitting = false;

function showWarning(title, text) {
    Swal.fire({
        title: title,
        text: text,
        icon: 'warning',
        confirmButtonText: '繼續填寫',
        confirmButtonColor: "#b0964e",
    });
}

function showSuccessMessage() {
    Swal.fire({
        title: "表單送出成功！",
        text: "我們將由專人盡快與您聯繫",
        icon: "success",
        confirmButtonColor: "#b0964e",
        confirmButtonText: '關閉',
    });
}

$('#bookingForm').on('submit', function (e) {
    e.preventDefault();
    if (submitting) return;

    const form = this;
    const name = $('#name').val().trim();
    const phone = $('#phone').val().replace(/\D/g, '');
    const email = $('#email').val().trim();

    if (name === '') {
        showWarning('請輸入姓名');
        return;
    }
    if (phone.length < 8) {
        showWarning('請輸入正確的電話號碼');
        return;
    }
    if (email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showWarning('請輸入正確的 E-mail');
        return;
    }
    if (!$('#terms').is(':checked')) {
        showWarning('未勾選同意書', '請閱讀並勾選「隱私權聲明」同意書');
        return;
    }

    // 防機器人：隱藏欄位被填寫時，假裝成功但不送出
    if ($('#hp_check').val() !== '') {
        form.reset();
        showSuccessMessage();
        return;
    }

    const formData = new URLSearchParams({
        "entry.1818746267": name,
        "entry.1757153005": $('#phone').val(),
        "entry.342666587": email,
        "entry.361700726": $('#space').val(),
        "entry.1326398902": $('#remark').val(),
    });

    submitting = true;
    $('#sendMail').prop('disabled', true).text('送出中…');

    // Google 表單不回 CORS 標頭，用 no-cors 送出：
    // 請求有送達即 resolve（無法讀回應內容），網路失敗才會 reject。
    fetch(FORM_URL, { method: 'POST', mode: 'no-cors', body: formData })
        .then(function () {
            form.reset();
            showSuccessMessage();
            // 給 GTM 的轉換事件（需在 GTM 建立「自訂事件 = form_submit_success」觸發條件）
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({ event: 'form_submit_success' });
        })
        .catch(function () {
            Swal.fire({
                title: '送出失敗',
                text: '請確認網路連線後再試一次',
                icon: 'error',
                confirmButtonText: '繼續填寫',
                confirmButtonColor: "#b0964e",
            });
        })
        .finally(function () {
            submitting = false;
            $('#sendMail').prop('disabled', false).text('送出表單');
        });
});
