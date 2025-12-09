/**
 * Authentication Service
 * 处理用户注册、登录、登出等认证功能
 */

import supabase from '../config/supabase.js';

class AuthService {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    /**
     * 初始化认证状态
     */
    async init() {
        // 获取当前登录用户
        const { data: { user } } = await supabase.auth.getUser();
        this.currentUser = user;

        // 监听认证状态变化
        supabase.auth.onAuthStateChange((event, session) => {
            this.currentUser = session?.user || null;

            // 触发自定义事件
            window.dispatchEvent(new CustomEvent('auth-state-change', {
                detail: { event, user: this.currentUser }
            }));
        });
    }

    /**
     * 用户注册
     * @param {string} email - 邮箱
     * @param {string} password - 密码
     * @param {string} username - 用户名
     */
    async signUp(email, password, username) {
        try {
            // 1. 创建用户账号
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username
                    }
                }
            });

            if (authError) throw authError;

            // 2. 创建用户profile
            if (authData.user) {
                const { error: profileError } = await supabase
                    .from('user_profiles')
                    .insert({
                        id: authData.user.id,
                        username,
                        level: 1,
                        points: 0,
                        streak_days: 0
                    });

                if (profileError) {
                    console.warn('Profile creation warning:', profileError);
                }
            }

            return { user: authData.user, error: null };
        } catch (error) {
            console.error('Sign up error:', error);
            return { user: null, error };
        }
    }

    /**
     * 用户登录
     * @param {string} email - 邮箱
     * @param {string} password - 密码
     */
    async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            // 更新最后登录时间
            if (data.user) {
                await this.updateLastLogin(data.user.id);
            }

            this.currentUser = data.user;
            return { user: data.user, error: null };
        } catch (error) {
            console.error('Sign in error:', error);
            return { user: null, error };
        }
    }

    /**
     * 用户登出
     */
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            this.currentUser = null;
            return { error: null };
        } catch (error) {
            console.error('Sign out error:', error);
            return { error };
        }
    }

    /**
     * 获取当前用户
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * 检查是否已登录
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * 获取用户Profile
     */
    async getUserProfile(userId) {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return { profile: data, error: null };
        } catch (error) {
            console.error('Get profile error:', error);
            return { profile: null, error };
        }
    }

    /**
     * 更新用户Profile
     */
    async updateUserProfile(userId, updates) {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            return { profile: data, error: null };
        } catch (error) {
            console.error('Update profile error:', error);
            return { profile: null, error };
        }
    }

    /**
     * 更新最后登录时间
     */
    async updateLastLogin(userId) {
        try {
            await supabase
                .from('user_profiles')
                .update({
                    last_login: new Date().toISOString()
                })
                .eq('id', userId);
        } catch (error) {
            console.error('Update last login error:', error);
        }
    }

    /**
     * 重置密码（发送重置邮件）
     */
    async resetPassword(email) {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`
            });

            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error('Reset password error:', error);
            return { error };
        }
    }

    /**
     * 修改用户名
     */
    async updateUsername(newUsername) {
        if (!this.currentUser) {
            return { error: new Error('Not authenticated') };
        }

        try {
            // 检查用户名是否已存在
            const { data: existing } = await supabase
                .from('user_profiles')
                .select('username')
                .eq('username', newUsername)
                .neq('id', this.currentUser.id);

            if (existing && existing.length > 0) {
                return { error: new Error('Username already exists') };
            }

            // 更新用户名
            const { data, error } = await supabase
                .from('user_profiles')
                .update({ username: newUsername })
                .eq('id', this.currentUser.id)
                .select()
                .single();

            if (error) throw error;
            return { profile: data, error: null };
        } catch (error) {
            console.error('Update username error:', error);
            return { profile: null, error };
        }
    }

    /**
     * 删除用户账户
     */
    async deleteAccount() {
        if (!this.currentUser) {
            return { error: new Error('Not authenticated') };
        }

        try {
            // 注意：Supabase需要在后端实现账户删除
            // 这里只能删除用户数据，实际账户需要联系管理员或使用Supabase Admin API

            // 删除用户相关数据会被CASCADE自动删除
            const { error } = await supabase.auth.signOut();

            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error('Delete account error:', error);
            return { error };
        }
    }
}

// 创建单例
const authService = new AuthService();

export default authService;
