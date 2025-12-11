/**
 * Service Worker Registration Manager
 * V3.1 Feature: PWA Installation and Update Management
 */

class ServiceWorkerManager {
    constructor() {
        this.swRegistration = null;
        this.isUpdateAvailable = false;
        this.updateNotificationShown = false;
    }

    /**
     * Register Service Worker
     */
    async register() {
        // Check if Service Worker is supported
        if (!('serviceWorker' in navigator)) {
            console.log('[PWA] Service Worker not supported in this browser');
            return false;
        }

        try {
            // Register the service worker
            this.swRegistration = await navigator.serviceWorker.register('/service-worker.js', {
                scope: '/'
            });

            console.log('[PWA] Service Worker registered successfully:', this.swRegistration.scope);

            // Listen for updates
            this.swRegistration.addEventListener('updatefound', () => {
                this.handleUpdateFound();
            });

            // Check for updates on page load
            this.swRegistration.update();

            // Check for updates periodically (every hour)
            setInterval(() => {
                this.swRegistration.update();
            }, 60 * 60 * 1000);

            // Listen for controlling service worker changes
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('[PWA] New service worker activated, reloading page...');
                window.location.reload();
            });

            return true;

        } catch (error) {
            console.error('[PWA] Service Worker registration failed:', error);
            return false;
        }
    }

    /**
     * Handle Service Worker update found
     */
    handleUpdateFound() {
        const newWorker = this.swRegistration.installing;

        console.log('[PWA] New Service Worker found, installing...');

        newWorker.addEventListener('statechange', () => {
            console.log('[PWA] Service Worker state changed:', newWorker.state);

            if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                    // New service worker available
                    console.log('[PWA] New version available!');
                    this.isUpdateAvailable = true;
                    this.showUpdateNotification();
                } else {
                    // First time installation
                    console.log('[PWA] Content cached for offline use');
                    this.showInstallNotification();
                }
            }
        });
    }

    /**
     * Show update notification to user
     */
    showUpdateNotification() {
        if (this.updateNotificationShown) return;
        this.updateNotificationShown = true;

        // Create update banner
        const updateBanner = document.createElement('div');
        updateBanner.className = 'pwa-update-banner';
        updateBanner.innerHTML = `
            <div class="pwa-update-content">
                <div class="pwa-update-message">
                    <span class="pwa-update-icon">🎉</span>
                    <div class="pwa-update-text">
                        <strong>新版本可用！</strong>
                        <p>更新以获得最新功能</p>
                    </div>
                </div>
                <div class="pwa-update-actions">
                    <button id="pwa-update-btn" class="btn btn-primary btn-sm">
                        立即更新
                    </button>
                    <button id="pwa-dismiss-btn" class="btn btn-secondary btn-sm">
                        稍后
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(updateBanner);

        // Animate in
        setTimeout(() => updateBanner.classList.add('show'), 100);

        // Attach event listeners
        document.getElementById('pwa-update-btn').addEventListener('click', () => {
            this.applyUpdate();
        });

        document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
            updateBanner.classList.remove('show');
            setTimeout(() => updateBanner.remove(), 300);
        });
    }

    /**
     * Show first-time installation notification
     */
    showInstallNotification() {
        console.log('[PWA] App is ready for offline use');

        // Optional: Show a toast notification
        const toast = document.createElement('div');
        toast.className = 'pwa-toast';
        toast.innerHTML = `
            <span class="pwa-toast-icon">✅</span>
            <span class="pwa-toast-message">应用已可离线使用</span>
        `;

        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Apply the update (skip waiting and reload)
     */
    applyUpdate() {
        if (this.swRegistration && this.swRegistration.waiting) {
            // Tell the waiting service worker to skip waiting
            this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
    }

    /**
     * Get current Service Worker version
     */
    async getVersion() {
        if (!this.swRegistration || !this.swRegistration.active) {
            return null;
        }

        return new Promise((resolve) => {
            const messageChannel = new MessageChannel();

            messageChannel.port1.onmessage = (event) => {
                resolve(event.data.version);
            };

            this.swRegistration.active.postMessage(
                { type: 'GET_VERSION' },
                [messageChannel.port2]
            );
        });
    }

    /**
     * Clear all caches (for debugging/reset)
     */
    async clearCache() {
        if (!this.swRegistration || !this.swRegistration.active) {
            return false;
        }

        return new Promise((resolve) => {
            const messageChannel = new MessageChannel();

            messageChannel.port1.onmessage = (event) => {
                resolve(event.data.success);
            };

            this.swRegistration.active.postMessage(
                { type: 'CLEAR_CACHE' },
                [messageChannel.port2]
            );
        });
    }

    /**
     * Check if app is running as PWA
     */
    isRunningAsPWA() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true;
    }

    /**
     * Show PWA install prompt (if available)
     */
    setupInstallPrompt() {
        let deferredPrompt = null;

        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();

            // Stash the event so it can be triggered later
            deferredPrompt = e;

            console.log('[PWA] Install prompt available');

            // Show custom install button
            this.showInstallButton(deferredPrompt);
        });

        // Listen for successful installation
        window.addEventListener('appinstalled', () => {
            console.log('[PWA] App installed successfully');
            deferredPrompt = null;

            // Show success message
            const toast = document.createElement('div');
            toast.className = 'pwa-toast';
            toast.innerHTML = `
                <span class="pwa-toast-icon">🎉</span>
                <span class="pwa-toast-message">应用已安装！</span>
            `;
            document.body.appendChild(toast);

            setTimeout(() => toast.classList.add('show'), 100);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        });
    }

    /**
     * Show install button in navbar or banner
     */
    showInstallButton(deferredPrompt) {
        // Check if already installed
        if (this.isRunningAsPWA()) {
            return;
        }

        // Create install banner
        const installBanner = document.createElement('div');
        installBanner.className = 'pwa-install-banner';
        installBanner.innerHTML = `
            <div class="pwa-install-content">
                <div class="pwa-install-message">
                    <span class="pwa-install-icon">📱</span>
                    <div class="pwa-install-text">
                        <strong>安装应用</strong>
                        <p>添加到主屏幕，离线学习</p>
                    </div>
                </div>
                <div class="pwa-install-actions">
                    <button id="pwa-install-btn" class="btn btn-primary btn-sm">
                        安装
                    </button>
                    <button id="pwa-install-dismiss-btn" class="btn btn-text btn-sm">
                        ×
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(installBanner);

        // Animate in
        setTimeout(() => installBanner.classList.add('show'), 100);

        // Install button click
        document.getElementById('pwa-install-btn').addEventListener('click', async () => {
            if (!deferredPrompt) return;

            // Show the install prompt
            deferredPrompt.prompt();

            // Wait for the user's response
            const { outcome } = await deferredPrompt.userChoice;
            console.log('[PWA] User response:', outcome);

            // Clear the deferred prompt
            deferredPrompt = null;

            // Hide the install banner
            installBanner.classList.remove('show');
            setTimeout(() => installBanner.remove(), 300);
        });

        // Dismiss button click
        document.getElementById('pwa-install-dismiss-btn').addEventListener('click', () => {
            installBanner.classList.remove('show');
            setTimeout(() => installBanner.remove(), 300);
        });
    }

    /**
     * Log PWA diagnostics
     */
    async logDiagnostics() {
        console.group('[PWA] Diagnostics');
        console.log('Service Worker supported:', 'serviceWorker' in navigator);
        console.log('Service Worker registered:', !!this.swRegistration);
        console.log('Running as PWA:', this.isRunningAsPWA());
        console.log('Update available:', this.isUpdateAvailable);

        if (this.swRegistration) {
            console.log('Registration scope:', this.swRegistration.scope);
            console.log('Installing:', this.swRegistration.installing);
            console.log('Waiting:', this.swRegistration.waiting);
            console.log('Active:', this.swRegistration.active);

            const version = await this.getVersion();
            console.log('Version:', version);
        }

        console.groupEnd();
    }
}

// Export singleton instance
const swManager = new ServiceWorkerManager();
export default swManager;

// Initialize PWA features on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        swManager.register();
        swManager.setupInstallPrompt();
    });
} else {
    swManager.register();
    swManager.setupInstallPrompt();
}
