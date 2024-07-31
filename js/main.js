document.addEventListener('DOMContentLoaded', function() {
    AOS.init({
        once: true     // 只執行一次動畫
    });
});

// 禁止右鍵
document.addEventListener('contextmenu', function(event) {
    event.preventDefault();
});

document.addEventListener('DOMContentLoaded', (event) => {
    const video = document.getElementById('myVideo');
    video.play().catch((error) => {
        console.log('Autoplay was prevented:', error);
    });
});



let submitted = false;

function showSuccessMessage() {
    Swal.fire({
        title: "表單送出成功！",
        text: "我們將由專人盡快與您聯繫",
        icon: "success",
        confirmButtonColor: "#b0964e",
        confirmButtonText: '關閉',
    });
}

$('#sendMail').click(function (e) {
    e.preventDefault();
    if ($('#name').val() == '') {
        Swal.fire({
            title: '請輸入姓名',
            icon: 'warning',
            confirmButtonText: '繼續填寫',
            confirmButtonColor: "#b0964e",
        });
    } else {
        let phone = $('#phone').val();
        let iphone = parseInt(phone);
        if (isNaN(iphone)) {
            Swal.fire({
                title: '請輸入正確的電話號碼',
                icon: 'warning',
                confirmButtonText: '繼續填寫',
                confirmButtonColor: "#b0964e",
            });
        } else {
            if ($('#terms').is(':checked')) {
                let formData = {
                    "entry.1818746267": $('#name').val(),  
                    "entry.1757153005": $('#phone').val(), 
                    "entry.342666587": $('#email').val(), 
                    "entry.361700726": $('#space').val(), 
                    "entry.1326398902": $('#remark').val(),
                };
                $.ajax({
                    url: 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSeVoxicRPBWg7ZgqDQMCQTLeNj8Zeslqjs83FWo3e11dXJ4gg/formResponse',
                    type: 'POST',
                    data: formData,
                    dataType: 'xml',
                    complete: function() {
                        Swal.fire({
                            title: "表單送出成功！",
                            text: "我們將由專人盡快與您聯繫",
                            icon: "success",
                            confirmButtonColor: "#b0964e",
                            confirmButtonText: '關閉',
                        });
                    },
                    error: function() {
                        Swal.fire({
                            title: '送出失敗',
                            text: '請稍後再試',
                            icon: 'error',
                            confirmButtonText: '繼續填寫',
                            confirmButtonColor: "#b0964e",
                        });
                    }
                });
            } else {
                Swal.fire({
                    title: '未勾選同意書',
                    text: '請閱讀並勾選「隱私權聲明」同意書',
                    icon: 'warning',
                    confirmButtonText: '繼續填寫',
                    confirmButtonColor: "#b0964e",
                });
            }
        }
    }
});

