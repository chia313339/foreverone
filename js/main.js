document.addEventListener('DOMContentLoaded', function() {
    AOS.init({
        once: true,    // 只執行一次動畫
        offset: 60
    });
    initAerialVideo();
});

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
