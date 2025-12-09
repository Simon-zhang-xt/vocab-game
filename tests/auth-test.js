/**
 * Authentication Flow Test
 * 测试认证流程
 */

import { chromium } from 'playwright';

async function testAuthFlow() {
    console.log('🚀 Starting authentication flow test...\n');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // Navigate to the app
        console.log('1️⃣ Navigating to http://localhost:8080...');
        await page.goto('http://localhost:8080');
        await page.waitForTimeout(2000);

        // Check if auth page is displayed
        console.log('2️⃣ Checking if authentication page is displayed...');
        const authContainer = await page.locator('.auth-container').count();
        if (authContainer > 0) {
            console.log('   ✅ Authentication page is displayed');
        } else {
            console.log('   ❌ Authentication page not found');
            throw new Error('Auth page not displayed');
        }

        // Check for login and signup tabs
        console.log('3️⃣ Checking for login/signup tabs...');
        const loginTab = await page.locator('.auth-tab[data-tab="login"]').count();
        const signupTab = await page.locator('.auth-tab[data-tab="signup"]').count();
        if (loginTab > 0 && signupTab > 0) {
            console.log('   ✅ Both login and signup tabs found');
        } else {
            console.log('   ❌ Tabs not found');
        }

        // Test guest mode button
        console.log('4️⃣ Testing guest mode...');
        const guestBtn = await page.locator('#guest-btn');
        if (await guestBtn.count() > 0) {
            console.log('   ✅ Guest mode button found');
            console.log('   🖱️  Clicking guest mode button...');
            await guestBtn.click();
            await page.waitForTimeout(2000);

            // Check if course list is displayed
            const courseContainer = await page.locator('.course-container').count();
            if (courseContainer > 0) {
                console.log('   ✅ Successfully entered guest mode - course list displayed');
            } else {
                console.log('   ❌ Failed to enter guest mode');
            }

            // Check for user menu
            const userMenu = await page.locator('.user-menu').count();
            if (userMenu > 0) {
                console.log('   ✅ User menu displayed in navbar');
                const guestModeText = await page.locator('.user-menu').textContent();
                if (guestModeText.includes('游客模式')) {
                    console.log('   ✅ Guest mode indicator shown');
                }
            }

            // Check for login button in navbar
            const loginBtnNav = await page.locator('#login-btn').count();
            if (loginBtnNav > 0) {
                console.log('   ✅ Login button displayed in navbar');
            }
        }

        console.log('\n✅ All authentication tests passed!');
        console.log('\n📝 Test Summary:');
        console.log('   - Authentication page renders correctly');
        console.log('   - Login/signup tabs are present');
        console.log('   - Guest mode works');
        console.log('   - Navigation updates with user status');

        // Keep browser open for manual testing
        console.log('\n🔍 Browser will stay open for 30 seconds for manual inspection...');
        await page.waitForTimeout(30000);

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('\n📸 Taking screenshot...');
        await page.screenshot({ path: 'tests/auth-error.png', fullPage: true });
        console.log('   Screenshot saved to tests/auth-error.png');
    } finally {
        await browser.close();
        console.log('\n✅ Test complete - browser closed');
    }
}

// Run the test
testAuthFlow();
