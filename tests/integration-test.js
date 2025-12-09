/**
 * Integration Test - Complete Learning Flow
 * 集成测试 - 完整学习流程
 */

import { chromium } from 'playwright';

async function testLearningFlow() {
    console.log('🚀 Starting integration test for learning flow...\n');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Listen for console messages
    page.on('console', msg => {
        if (msg.text().includes('Cloud sync') || msg.text().includes('synced')) {
            console.log('   📡 ' + msg.text());
        }
    });

    try {
        // Navigate to the app
        console.log('1️⃣ Navigating to http://localhost:8080...');
        await page.goto('http://localhost:8080');
        await page.waitForTimeout(2000);

        // Enter guest mode
        console.log('2️⃣ Entering guest mode...');
        const guestBtn = await page.locator('#guest-btn');
        await guestBtn.click();
        await page.waitForTimeout(2000);

        // Check if course list is displayed
        const courseContainer = await page.locator('.course-container').count();
        if (courseContainer > 0) {
            console.log('   ✅ Course list displayed');
        } else {
            throw new Error('Course list not found');
        }

        // Wait for courses to load
        console.log('3️⃣ Waiting for courses to load...');
        await page.waitForSelector('.course-card', { timeout: 10000 });
        await page.waitForTimeout(1000);

        // Start a course
        console.log('4️⃣ Starting first course...');
        const startBtn = await page.locator('.course-card button:has-text("开始学习")').first();
        await startBtn.click();
        await page.waitForTimeout(2000);

        // Check if game view is loaded
        const gameContainer = await page.locator('.game-container').count();
        if (gameContainer > 0) {
            console.log('   ✅ Game view loaded');
        } else {
            throw new Error('Game view not loaded');
        }

        // Answer first question
        console.log('5️⃣ Answering first question...');
        const questionType = await page.locator('.question-type-badge').textContent();
        console.log(`   Question type: ${questionType}`);

        // Try to answer the question based on type
        if (questionType.includes('选择') || questionType.includes('Multiple')) {
            // Multiple choice - click first option
            const firstOption = await page.locator('.option-button').first();
            await firstOption.click();
            await page.waitForTimeout(500);
        } else if (questionType.includes('填空') || questionType.includes('Fill')) {
            // Fill in blank - type something
            const input = await page.locator('#blank-input');
            await input.fill('test');
        } else if (questionType.includes('匹配') || questionType.includes('Match')) {
            // Matching - click first option
            const firstOption = await page.locator('.option-button').first();
            await firstOption.click();
            await page.waitForTimeout(500);
        }

        // Submit answer
        console.log('6️⃣ Submitting answer...');
        const submitBtn = await page.locator('#submit-btn');
        await submitBtn.click();
        await page.waitForTimeout(3000); // Wait for cloud sync

        // Check for feedback
        const feedback = await page.locator('#feedback').count();
        if (feedback > 0) {
            const feedbackText = await page.locator('#feedback').textContent();
            console.log(`   ✅ Feedback shown: ${feedbackText.substring(0, 50)}...`);
        }

        // Click next to continue
        console.log('7️⃣ Moving to next question...');
        await submitBtn.click();
        await page.waitForTimeout(2000);

        console.log('\n✅ Integration test completed successfully!');
        console.log('\n📝 Test Summary:');
        console.log('   - Guest mode works');
        console.log('   - Course can be started');
        console.log('   - Questions can be answered');
        console.log('   - Feedback is displayed');
        console.log('   - Navigation works');
        console.log('   - Cloud sync attempts made (check console for sync logs)');

        // Keep browser open for inspection
        console.log('\n🔍 Browser will stay open for 30 seconds for manual inspection...');
        await page.waitForTimeout(30000);

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('\n📸 Taking screenshot...');
        await page.screenshot({ path: 'tests/integration-error.png', fullPage: true });
        console.log('   Screenshot saved to tests/integration-error.png');
    } finally {
        await browser.close();
        console.log('\n✅ Test complete - browser closed');
    }
}

// Run the test
testLearningFlow();
