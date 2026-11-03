document.addEventListener('DOMContentLoaded', function() {
    AOS.init({
        once: true     // 只執行一次動畫
    });
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
            $('#sendMail').prop('disabled', false).text('送出');
        });
});
