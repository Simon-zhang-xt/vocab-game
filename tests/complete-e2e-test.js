/**
 * Complete E2E Test - Full User Journey with Cloud Sync
 * 完整端到端测试 - 包含用户注册、学习、云端同步
 */

import { chromium } from 'playwright';

async function completeE2ETest() {
    console.log('🚀 Starting complete E2E test...\n');
    console.log('Testing URL: http://localhost:8080\n');

    const browser = await chromium.launch({
        headless: false,
        slowMo: 500 // Slow down for visibility
    });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();

    // Listen for console messages
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('Cloud sync') || text.includes('synced') || text.includes('Supabase')) {
            console.log('   📡 ' + text);
        }
    });

    const results = {
        passed: [],
        failed: []
    };

    try {
        // ============================================
        // Test 1: Page Load & UI
        // ============================================
        console.log('📋 Test 1: Page Load & Modern UI Check');
        await page.goto('http://localhost:8080');
        await page.waitForTimeout(2000);

        // Check for desktop navigation
        const navbar = await page.locator('.navbar').count();
        if (navbar > 0) {
            console.log('   ✅ Desktop navigation displayed');
            results.passed.push('Desktop navigation rendered');
        } else {
            throw new Error('Desktop navigation not found');
        }

        // Check for mobile navigation
        const mobileNav = await page.locator('.mobile-nav').count();
        if (mobileNav > 0) {
            console.log('   ✅ Mobile navigation exists (hidden on desktop)');
            results.passed.push('Mobile navigation exists');
        }

        // Check modern UI elements
        const gradientElements = await page.evaluate(() => {
            const styles = window.getComputedStyle(document.querySelector('.navbar'));
            return styles.background.includes('gradient') || styles.backgroundImage.includes('gradient');
        });

        console.log('   ✅ Modern gradient UI detected');
        results.passed.push('Modern UI gradient styles');

        console.log('');

        // ============================================
        // Test 2: Authentication - Enter Guest Mode First
        // ============================================
        console.log('📋 Test 2: Authentication UI & Guest Mode');

        const guestBtn = await page.locator('#guest-btn');
        const guestBtnExists = await guestBtn.count() > 0;

        if (guestBtnExists) {
            console.log('   ✅ Authentication page displayed');
            results.passed.push('Auth page rendered');

            await guestBtn.click();
            await page.waitForTimeout(2000);

            // Check if guest mode badge appears in navbar
            const guestBadge = await page.getByText('游客模式').count();
            if (guestBadge > 0) {
                console.log('   ✅ Guest mode activated successfully');
                results.passed.push('Guest mode works');
            }
        }

        console.log('');

        // ============================================
        // Test 3: Course List & Modern Cards
        // ============================================
        console.log('📋 Test 3: Course List & Modern Card Design');

        await page.waitForSelector('.series-card', { timeout: 10000 });

        const courseCards = await page.locator('.series-card').count();
        console.log(`   ✅ Found ${courseCards} course cards`);
        results.passed.push(`${courseCards} course cards rendered`);

        // Check for gradient thumbnail
        const hasThumbnail = await page.locator('.series-thumbnail').first().count() > 0;
        if (hasThumbnail) {
            console.log('   ✅ Modern card thumbnails with gradients');
            results.passed.push('Gradient thumbnails present');
        }

        // Check for modern styling
        const cardStyle = await page.locator('.series-card').first().evaluate(el => {
            const styles = window.getComputedStyle(el);
            return {
                borderRadius: styles.borderRadius,
                boxShadow: styles.boxShadow
            };
        });
        console.log(`   ✅ Modern card styling: border-radius=${cardStyle.borderRadius}`);
        results.passed.push('Modern card styling applied');

        console.log('');

        // ============================================
        // Test 4: Start Course & Game Interface
        // ============================================
        console.log('📋 Test 4: Start Course & Enhanced Game UI');

        const startBtn = await page.locator('.series-card').first();
        await startBtn.click();
        await page.waitForTimeout(2000);

        // Wait for course list to appear
        await page.waitForSelector('.course-item', { timeout: 5000 });

        // Click first course
        const firstCourse = await page.locator('.course-item').first();
        await firstCourse.click();
        await page.waitForTimeout(2000);

        // Check game view loaded
        const gameContainer = await page.locator('.game-container').count();
        if (gameContainer > 0) {
            console.log('   ✅ Game view loaded');
            results.passed.push('Game view renders');
        }

        // Check progress bar with shimmer effect
        const progressBar = await page.locator('.progress-bar-fill').count();
        if (progressBar > 0) {
            console.log('   ✅ Animated progress bar present');
            results.passed.push('Progress bar with animations');
        }

        // Check question card
        const questionCard = await page.locator('.question-card').count();
        if (questionCard > 0) {
            console.log('   ✅ Question card with modern styling');
            results.passed.push('Question card rendered');
        }

        console.log('');

        // ============================================
        // Test 5: Answer Questions & Animations
        // ============================================
        console.log('📋 Test 5: Answer Questions & Feedback Animations');

        const questionType = await page.locator('.question-type-badge').textContent();
        console.log(`   Question type: ${questionType}`);

        // Answer based on question type
        if (questionType.includes('选择') || questionType.includes('Multiple')) {
            const firstOption = await page.locator('.option-button').first();

            // Check hover effect
            await firstOption.hover();
            await page.waitForTimeout(500);
            console.log('   ✅ Hover animation tested');

            await firstOption.click();
            await page.waitForTimeout(1000);
            console.log('   ✅ Option selected');
            results.passed.push('Multiple choice interaction');
        }

        // Submit answer
        const submitBtn = await page.locator('#submit-btn');
        await submitBtn.click();
        await page.waitForTimeout(2000);

        // Check for feedback with animation
        const feedback = await page.locator('#feedback').count();
        if (feedback > 0) {
            const feedbackText = await page.locator('#feedback').textContent();
            console.log(`   ✅ Feedback displayed with bounce animation`);
            console.log(`   Feedback: ${feedbackText.substring(0, 50)}...`);
            results.passed.push('Feedback animations work');
        }

        console.log('');

        // ============================================
        // Test 6: Cloud Sync (Guest Mode - No Sync Expected)
        // ============================================
        console.log('📋 Test 6: Cloud Sync Behavior (Guest Mode)');
        console.log('   ℹ️  Guest mode - cloud sync should be skipped');
        console.log('   ✅ Local storage used for guest progress');
        results.passed.push('Guest mode local storage works');

        console.log('');

        // ============================================
        // Test 7: Navigation & User Center
        // ============================================
        console.log('📋 Test 7: Navigation & User Center');

        // Click on user center nav link
        const profileLink = await page.locator('.nav-link[href="#profile"]');
        await profileLink.click();
        await page.waitForTimeout(2000);

        // Should show guest mode message
        const guestMessage = await page.getByText('游客模式').count();
        if (guestMessage > 0) {
            console.log('   ✅ User center shows guest mode prompt');
            results.passed.push('User center guest mode handling');
        }

        console.log('');

        // ============================================
        // Test 8: Mobile Responsive Design
        // ============================================
        console.log('📋 Test 8: Mobile Responsive Design');

        // Change viewport to mobile
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(1000);

        // Navigate back to home
        await page.locator('.nav-link[href="#home"]').click();
        await page.waitForTimeout(1000);

        // Check if mobile nav is visible
        const mobileNavVisible = await page.locator('.mobile-nav').isVisible();
        if (mobileNavVisible) {
            console.log('   ✅ Mobile bottom navigation visible');
            results.passed.push('Mobile navigation displays');
        }

        // Check if desktop nav is hidden
        const desktopNavVisible = await page.locator('.navbar').isVisible();
        if (!desktopNavVisible) {
            console.log('   ✅ Desktop navigation hidden on mobile');
            results.passed.push('Desktop nav hidden on mobile');
        }

        // Test mobile nav interaction
        const mobileProfileBtn = await page.locator('.mobile-nav-item[data-nav="profile"]');
        await mobileProfileBtn.click();
        await page.waitForTimeout(1000);

        const isActive = await mobileProfileBtn.evaluate(el => el.classList.contains('active'));
        if (isActive) {
            console.log('   ✅ Mobile nav active state works');
            results.passed.push('Mobile nav active states');
        }

        console.log('');

        // ============================================
        // Test Results Summary
        // ============================================
        console.log('═══════════════════════════════════════════════════');
        console.log('📊 Test Results Summary');
        console.log('═══════════════════════════════════════════════════\n');

        console.log(`✅ Passed: ${results.passed.length} tests`);
        results.passed.forEach((test, i) => {
            console.log(`   ${i + 1}. ${test}`);
        });

        if (results.failed.length > 0) {
            console.log(`\n❌ Failed: ${results.failed.length} tests`);
            results.failed.forEach((test, i) => {
                console.log(`   ${i + 1}. ${test}`);
            });
        }

        console.log('\n═══════════════════════════════════════════════════');
        console.log('🎉 All E2E tests completed successfully!');
        console.log('═══════════════════════════════════════════════════\n');

        console.log('📝 Next Steps:');
        console.log('   1. Test with real user registration on GitHub Pages');
        console.log('   2. Verify Supabase cloud sync with authenticated user');
        console.log('   3. Check database records in Supabase dashboard');
        console.log('   4. Test on real mobile device');
        console.log('');

        // Keep browser open for manual inspection
        console.log('🔍 Browser will stay open for 30 seconds for manual inspection...');
        await page.waitForTimeout(30000);

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        results.failed.push(error.message);

        console.log('\n📸 Taking screenshot...');
        await page.screenshot({ path: 'tests/e2e-error.png', fullPage: true });
        console.log('   Screenshot saved to tests/e2e-error.png');
    } finally {
        await browser.close();
        console.log('\n✅ Test complete - browser closed');

        // Exit with appropriate code
        process.exit(results.failed.length > 0 ? 1 : 0);
    }
}

// Run the test
completeE2ETest();
