// script.js
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否设置了"记住我"
    const remember = localStorage.getItem('rememberLogin') === 'true';
    if(remember) {
        const savedUsername = localStorage.getItem('savedUsername');
        if(savedUsername) {
            document.getElementById('username').value = savedUsername;
            document.getElementById('remember').checked = true;
        }
    }

    // 密码显示/隐藏功能
    const passwordInput = document.getElementById('password');
    const showPasswordBtn = document.querySelector('.show-password');

    showPasswordBtn.addEventListener('click', function() {
        if(passwordInput.type === 'password') {
            passwordInput.type = 'text';
            showPasswordBtn.innerHTML = `
                <svg viewBox="0 0 24 24">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
            `;
        } else {
            passwordInput.type = 'password';
            showPasswordBtn.innerHTML = `
                <svg viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>
            `;
        }
    });
});

async function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const remember = document.getElementById('remember').checked;
    const message = document.getElementById('message');

    // 重置消息样式
    message.textContent = "";
    message.className = "message";

    if (!username || !password) {
        showMessage(message, "用户名和密码不能为空", true);
        return;
    }

    // 记住用户名
    if(remember) {
        localStorage.setItem('rememberLogin', 'true');
        localStorage.setItem('savedUsername', username);
    } else {
        localStorage.removeItem('rememberLogin');
        localStorage.removeItem('savedUsername');
    }

    try {
        // 在实际应用中，请替换为正确的API端点
        const response = await axios.post('http://localhost:8080/user/login', {
            username,
            password
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = response.data;

        if (data.code === 1) {
            sessionStorage.setItem('userData', JSON.stringify(data.data));
            showMessage(message, "登录成功！正在跳转...", false);

            setTimeout(() => {
                window.location.href = "mymusic.html";
            }, 500);
        } else {
            showMessage(message, data.msg || "登录失败，请检查用户名和密码", true);
        }
    } catch (error) {
        console.error('请求失败:', error);

        let errorMsg = "登录失败，请重试";
        if (error.response) {
            // 服务器返回了错误状态码（4xx/5xx）
            if (error.response.status === 401) {
                errorMsg = "用户名或密码错误";
            } else {
                errorMsg = `服务器错误: ${error.response.status}`;
            }
        } else if (error.request) {
            // 请求已发送但无响应
            errorMsg = "网络连接失败，请检查网络";
        }

        showMessage(message, errorMsg, true);
    }
}

function showMessage(element, text, isError) {
    element.textContent = text;
    element.className = isError ? "message error" : "message success";
}