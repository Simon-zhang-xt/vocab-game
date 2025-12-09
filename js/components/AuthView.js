/**
 * Authentication View Component
 * 登录/注册界面组件
 */

import authService from '../services/AuthService.js';

class AuthView {
    constructor(container, onAuthSuccess) {
        this.container = container;
        this.onAuthSuccess = onAuthSuccess;
        this.mode = 'login'; // 'login' or 'signup'
    }

    /**
     * 渲染认证界面
     */
    render() {
        this.container.innerHTML = `
            <div class="auth-container fade-in">
                <div class="auth-card">
                    <div class="auth-header">
                        <h1>📚 词汇游戏</h1>
                        <p>Vocabulary Learning Game</p>
                    </div>

                    <!-- Tab切换 -->
                    <div class="auth-tabs">
                        <button class="auth-tab ${this.mode === 'login' ? 'active' : ''}" data-tab="login">
                            登录 Login
                        </button>
                        <button class="auth-tab ${this.mode === 'signup' ? 'active' : ''}" data-tab="signup">
                            注册 Sign Up
                        </button>
                    </div>

                    <!-- 登录表单 -->
                    <div id="login-form" class="auth-form ${this.mode === 'login' ? 'active' : 'hidden'}">
                        <div class="form-group">
                            <label>邮箱 Email</label>
                            <input type="email" id="login-email" placeholder="your@email.com" required>
                        </div>
                        <div class="form-group">
                            <label>密码 Password</label>
                            <input type="password" id="login-password" placeholder="••••••••" required>
                        </div>
                        <div class="form-footer">
                            <a href="#" id="forgot-password" class="text-link">忘记密码？</a>
                        </div>
                        <button id="login-btn" class="btn btn-primary btn-large">
                            登录 Sign In
                        </button>
                        <div id="login-error" class="error-message hidden"></div>
                    </div>

                    <!-- 注册表单 -->
                    <div id="signup-form" class="auth-form ${this.mode === 'signup' ? 'active' : 'hidden'}">
                        <div class="form-group">
                            <label>用户名 Username</label>
                            <input type="text" id="signup-username" placeholder="选择一个用户名" required>
                            <small>3-20个字符，可以包含字母、数字、下划线</small>
                        </div>
                        <div class="form-group">
                            <label>邮箱 Email</label>
                            <input type="email" id="signup-email" placeholder="your@email.com" required>
                        </div>
                        <div class="form-group">
                            <label>密码 Password</label>
                            <input type="password" id="signup-password" placeholder="至少6位" required>
                            <small>至少6个字符</small>
                        </div>
                        <div class="form-group">
                            <label>确认密码 Confirm Password</label>
                            <input type="password" id="signup-password-confirm" placeholder="再次输入密码" required>
                        </div>
                        <button id="signup-btn" class="btn btn-primary btn-large">
                            注册 Sign Up
                        </button>
                        <div id="signup-error" class="error-message hidden"></div>
                        <div id="signup-success" class="success-message hidden"></div>
                    </div>

                    <!-- 游客模式 -->
                    <div class="auth-divider">
                        <span>或</span>
                    </div>
                    <button id="guest-btn" class="btn btn-secondary btn-large">
                        🎮 游客模式（本地存储）
                    </button>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    /**
     * 绑定事件监听
     */
    attachEventListeners() {
        // Tab切换
        const tabs = this.container.querySelectorAll('.auth-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const mode = e.target.dataset.tab;
                this.switchMode(mode);
            });
        });

        // 登录按钮
        const loginBtn = this.container.querySelector('#login-btn');
        loginBtn.addEventListener('click', () => this.handleLogin());

        // 注册按钮
        const signupBtn = this.container.querySelector('#signup-btn');
        signupBtn.addEventListener('click', () => this.handleSignup());

        // 游客模式
        const guestBtn = this.container.querySelector('#guest-btn');
        guestBtn.addEventListener('click', () => this.handleGuestMode());

        // 忘记密码
        const forgotPassword = this.container.querySelector('#forgot-password');
        forgotPassword.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleForgotPassword();
        });

        // 回车键登录
        const loginEmail = this.container.querySelector('#login-email');
        const loginPassword = this.container.querySelector('#login-password');
        [loginEmail, loginPassword].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleLogin();
                }
            });
        });
    }

    /**
     * 切换登录/注册模式
     */
    switchMode(mode) {
        this.mode = mode;

        // 更新Tab
        const tabs = this.container.querySelectorAll('.auth-tab');
        tabs.forEach(tab => {
            if (tab.dataset.tab === mode) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // 更新表单显示
        const loginForm = this.container.querySelector('#login-form');
        const signupForm = this.container.querySelector('#signup-form');

        if (mode === 'login') {
            loginForm.classList.remove('hidden');
            loginForm.classList.add('active');
            signupForm.classList.remove('active');
            signupForm.classList.add('hidden');
        } else {
            signupForm.classList.remove('hidden');
            signupForm.classList.add('active');
            loginForm.classList.remove('active');
            loginForm.classList.add('hidden');
        }

        // 清除错误信息
        this.clearMessages();
    }

    /**
     * 处理登录
     */
    async handleLogin() {
        const email = this.container.querySelector('#login-email').value.trim();
        const password = this.container.querySelector('#login-password').value;
        const errorDiv = this.container.querySelector('#login-error');
        const loginBtn = this.container.querySelector('#login-btn');

        // 验证
        if (!email || !password) {
            this.showError(errorDiv, '请填写邮箱和密码');
            return;
        }

        // 显示加载状态
        loginBtn.disabled = true;
        loginBtn.textContent = '登录中... Signing in...';

        try {
            const { user, error } = await authService.signIn(email, password);

            if (error) {
                throw new Error(error.message || '登录失败');
            }

            // 登录成功
            if (user && this.onAuthSuccess) {
                this.onAuthSuccess(user);
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError(errorDiv, error.message || '登录失败，请检查邮箱和密码');
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = '登录 Sign In';
        }
    }

    /**
     * 处理注册
     */
    async handleSignup() {
        const username = this.container.querySelector('#signup-username').value.trim();
        const email = this.container.querySelector('#signup-email').value.trim();
        const password = this.container.querySelector('#signup-password').value;
        const passwordConfirm = this.container.querySelector('#signup-password-confirm').value;
        const errorDiv = this.container.querySelector('#signup-error');
        const successDiv = this.container.querySelector('#signup-success');
        const signupBtn = this.container.querySelector('#signup-btn');

        // 验证
        if (!username || !email || !password) {
            this.showError(errorDiv, '请填写所有必填项');
            return;
        }

        if (username.length < 3 || username.length > 20) {
            this.showError(errorDiv, '用户名必须在3-20个字符之间');
            return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            this.showError(errorDiv, '用户名只能包含字母、数字和下划线');
            return;
        }

        if (password.length < 6) {
            this.showError(errorDiv, '密码至少需要6个字符');
            return;
        }

        if (password !== passwordConfirm) {
            this.showError(errorDiv, '两次输入的密码不一致');
            return;
        }

        // 显示加载状态
        signupBtn.disabled = true;
        signupBtn.textContent = '注册中... Signing up...';

        try {
            const { user, error } = await authService.signUp(email, password, username);

            if (error) {
                throw new Error(error.message || '注册失败');
            }

            // 注册成功
            this.showSuccess(successDiv, '注册成功！请查看邮箱确认链接（部分邮箱服务需要）');

            // 自动切换到登录
            setTimeout(() => {
                this.switchMode('login');
                // 预填邮箱
                this.container.querySelector('#login-email').value = email;
            }, 2000);

        } catch (error) {
            console.error('Signup error:', error);
            this.showError(errorDiv, error.message || '注册失败，请稍后重试');
        } finally {
            signupBtn.disabled = false;
            signupBtn.textContent = '注册 Sign Up';
        }
    }

    /**
     * 处理游客模式
     */
    handleGuestMode() {
        // 游客模式：使用LocalStorage，不登录
        localStorage.setItem('guest_mode', 'true');
        if (this.onAuthSuccess) {
            this.onAuthSuccess(null); // null表示游客模式
        }
    }

    /**
     * 处理忘记密码
     */
    async handleForgotPassword() {
        const email = prompt('请输入您的邮箱地址：');
        if (!email) return;

        const { error } = await authService.resetPassword(email);

        if (error) {
            alert('发送失败：' + error.message);
        } else {
            alert('密码重置邮件已发送，请查收邮箱！');
        }
    }

    /**
     * 显示错误信息
     */
    showError(element, message) {
        element.textContent = '⚠️ ' + message;
        element.classList.remove('hidden');
        setTimeout(() => {
            element.classList.add('hidden');
        }, 5000);
    }

    /**
     * 显示成功信息
     */
    showSuccess(element, message) {
        element.textContent = '✅ ' + message;
        element.classList.remove('hidden');
    }

    /**
     * 清除所有消息
     */
    clearMessages() {
        const messages = this.container.querySelectorAll('.error-message, .success-message');
        messages.forEach(msg => msg.classList.add('hidden'));
    }
}

export default AuthView;
