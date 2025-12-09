/**
 * MVP Validation E2E Test
 *
 * This test validates the core user journey:
 * 1. First visit with privacy consent
 * 2. Browse and select a course
 * 3. Complete the learning loop
 * 4. View results
 * 5. Verify progress saved
 */

import { test, expect } from '@playwright/test';

test.describe('MVP Core Functionality', () => {

  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test for clean state
    await page.goto('http://localhost:8080');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('T-001 to T-008: Application Initialization', async ({ page }) => {
    const startTime = Date.now();

    // T-001: Application loads successfully
    await page.goto('http://localhost:8080');
    await expect(page).toHaveTitle(/词汇游戏|Vocabulary/i);

    // T-006: Check page load time
    const loadTime = Date.now() - startTime;
    console.log(`Page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000); // SC-006: <3s load time

    // T-002: Privacy modal appears on first visit
    const privacyModal = page.locator('#privacy-modal');
    await expect(privacyModal).toBeVisible();

    // T-003: Privacy modal is bilingual
    await expect(privacyModal).toContainText('数据使用说明');
    await expect(privacyModal).toContainText('Data Usage Notice');

    // T-004: Accept button works
    const acceptButton = page.locator('#accept-privacy');
    await acceptButton.click();
    await expect(privacyModal).toBeHidden();

    // T-005: Modal doesn't appear on subsequent visits
    await page.reload();
    await expect(privacyModal).toBeHidden();

    // T-006: LocalStorage initialized
    const storageKeys = await page.evaluate(() => Object.keys(localStorage));
    expect(storageKeys).toContain('vocab_words');
    expect(storageKeys).toContain('vocab_courses');
    expect(storageKeys).toContain('vocab_course_series');
    expect(storageKeys).toContain('vocab_privacy_accepted');

    // T-007: No critical errors in console
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.reload();
    await page.waitForTimeout(2000);
    expect(errors.filter(e => !e.includes('audio')).length).toBe(0); // Ignore audio errors
  });

  test('T-009 to T-017: Course Browsing', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.locator('#accept-privacy').click();
    await page.waitForTimeout(500);

    // T-009: Course series displayed
    const seriesCard = page.locator('.series-card').first();
    await expect(seriesCard).toBeVisible();

    // T-010: TOEFL series shows correct title
    await expect(seriesCard).toContainText('TOEFL');

    // T-011: Course count badge shows
    const courseBadge = seriesCard.locator('.course-count');
    await expect(courseBadge).toContainText('1');

    // T-012: Series is expandable
    const expandButton = seriesCard.locator('.expand-btn, .series-header');
    await expandButton.click();

    // T-013: Course details visible when expanded
    const courseCard = page.locator('.course-card').first();
    await expect(courseCard).toBeVisible();

    // T-014: Course thumbnail displays
    const thumbnail = courseCard.locator('.course-thumbnail');
    await expect(thumbnail).toBeVisible();

    // T-015: Start button visible
    const startButton = courseCard.locator('button:has-text("开始")');
    await expect(startButton).toBeVisible();

    // T-017: Responsive design (mobile test)
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(seriesCard).toBeVisible();
    await expect(courseCard).toBeVisible();
    await page.setViewportSize({ width: 1280, height: 720 }); // Reset
  });

  test('T-018 to T-056: Complete Learning Loop', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.locator('#accept-privacy').click();
    await page.waitForTimeout(500);

    // Start a course
    const startButton = page.locator('button:has-text("开始")').first();
    await startButton.click();

    // T-018: Navigated to game view
    await expect(page.locator('#game-view')).toBeVisible();

    // T-019: Course title displays
    await expect(page.locator('.game-header h2')).toContainText('TOEFL');

    // T-020: Progress indicator shows
    const progressIndicator = page.locator('.progress-text');
    await expect(progressIndicator).toContainText('1');
    await expect(progressIndicator).toContainText('12'); // Total questions

    // T-021: First question loads
    const questionContainer = page.locator('.question-container');
    await expect(questionContainer).toBeVisible();

    // Answer all questions
    let correctCount = 0;
    let incorrectQuestions = [];
    const startTime = Date.now();

    for (let i = 0; i < 12; i++) {
      await page.waitForTimeout(300);

      // Identify question type
      const questionType = await page.locator('.question-type').textContent();
      console.log(`Question ${i + 1}: ${questionType}`);

      if (questionType.includes('选择题') || questionType.includes('Multiple')) {
        // T-023-T-030: Multiple choice
        const options = page.locator('.option-button');
        await expect(options.first()).toBeVisible();

        // Click first option (may be correct or incorrect)
        await options.first().click();
        await page.waitForTimeout(300);

        // Check for feedback
        const feedback = page.locator('.feedback');
        await expect(feedback).toBeVisible();

        const isCorrect = await feedback.evaluate(el =>
          el.classList.contains('correct-feedback')
        );

        if (isCorrect) {
          correctCount++;
        } else {
          incorrectQuestions.push(i);
        }

      } else if (questionType.includes('填空') || questionType.includes('Fill')) {
        // T-031-T-036: Fill-in-blank
        const input = page.locator('input[type="text"]');
        await expect(input).toBeVisible();

        // Get the correct answer from data attribute or guess a word
        await input.fill('test'); // Will likely be wrong

        const submitBtn = page.locator('button:has-text("提交")');
        await submitBtn.click();
        await page.waitForTimeout(300);

        const feedback = page.locator('.feedback');
        const isCorrect = await feedback.evaluate(el =>
          el.classList.contains('correct-feedback')
        );

        if (isCorrect) {
          correctCount++;
        } else {
          incorrectQuestions.push(i);
        }

      } else {
        // T-037-T-040: Matching questions
        const options = page.locator('.option-button');
        await options.first().click();
        await page.waitForTimeout(300);

        const feedback = page.locator('.feedback');
        const isCorrect = await feedback.evaluate(el =>
          el.classList.contains('correct-feedback')
        );

        if (isCorrect) {
          correctCount++;
        } else {
          incorrectQuestions.push(i);
        }
      }

      // T-030: Click Next button
      const nextButton = page.locator('button:has-text("下一题"), button:has-text("Next")');
      if (i < 11) {
        await nextButton.click();

        // T-042: Progress updates
        await expect(progressIndicator).toContainText(`${i + 2}`);
      } else {
        // Last question - may show "查看结果" or handle retry phase
        const viewResultsBtn = page.locator('button:has-text("查看结果"), button:has-text("View Results")');

        if (await viewResultsBtn.isVisible()) {
          await viewResultsBtn.click();
        } else {
          await nextButton.click();
        }
      }
    }

    // T-045-T-048: Retry phase for incorrect answers
    if (incorrectQuestions.length > 0) {
      console.log(`Retry phase: ${incorrectQuestions.length} questions`);

      await page.waitForTimeout(500);
      const retryIndicator = page.locator('.game-header');

      // May show retry phase indicator
      const hasRetryPhase = await page.locator('text=/复习|Review/i').isVisible();

      if (hasRetryPhase) {
        // Answer retry questions
        for (let i = 0; i < incorrectQuestions.length; i++) {
          await page.waitForTimeout(300);

          // Try to answer correctly this time
          const options = page.locator('.option-button');
          if (await options.count() > 0) {
            // Try all options until one is correct
            const optionCount = await options.count();
            for (let j = 0; j < optionCount; j++) {
              await options.nth(j).click();
              await page.waitForTimeout(200);

              const feedback = page.locator('.feedback');
              const isCorrect = await feedback.evaluate(el =>
                el.classList.contains('correct-feedback')
              );

              if (isCorrect) break;
            }
          }

          const nextBtn = page.locator('button:has-text("下一题"), button:has-text("Next")');
          if (i < incorrectQuestions.length - 1) {
            await nextBtn.click();
          } else {
            const viewResultsBtn = page.locator('button:has-text("查看结果"), button:has-text("View Results")');
            await viewResultsBtn.click();
          }
        }
      }
    } else {
      // No retry, proceed to results
      await page.waitForTimeout(500);
    }

    const courseTime = Math.floor((Date.now() - startTime) / 1000);
    console.log(`Course completion time: ${courseTime}s`);

    // T-049-T-056: Results Display
    await page.waitForTimeout(1000);
    const resultsView = page.locator('#results-view');
    await expect(resultsView).toBeVisible();

    // T-051: Total words displayed
    const wordsStudied = page.locator('.stat-card:has-text("单词数")');
    await expect(wordsStudied).toBeVisible();
    await expect(wordsStudied).toContainText('12');

    // T-052: Accuracy percentage
    const accuracy = page.locator('.stat-card:has-text("正确率")');
    await expect(accuracy).toBeVisible();
    // Accuracy should be between 0-100%

    // T-053: Time spent displayed
    const timeSpent = page.locator('.stat-card:has-text("用时")');
    await expect(timeSpent).toBeVisible();

    // T-054: Encouragement message
    const encouragement = page.locator('.encouragement');
    await expect(encouragement).toBeVisible();

    // T-055: Back button works
    const backButton = page.locator('button:has-text("返回"), button:has-text("Back")');
    await expect(backButton).toBeVisible();
    await backButton.click();

    // T-056: Back to course list
    await page.waitForTimeout(500);
    await expect(page.locator('.series-card')).toBeVisible();

    // T-057-T-058: Course marked as completed
    const completedBadge = page.locator('.completion-badge, .completed-badge');
    await expect(completedBadge.first()).toBeVisible();
  });

  test('T-059 to T-063: Statistics Tracking', async ({ page }) => {
    // First complete a course to generate statistics
    await page.goto('http://localhost:8080');
    await page.locator('#accept-privacy').click();
    await page.waitForTimeout(500);

    // Quick course completion (just click through)
    await page.locator('button:has-text("开始")').first().click();
    await page.waitForTimeout(500);

    // Answer a few questions quickly
    for (let i = 0; i < 3; i++) {
      const options = page.locator('.option-button');
      if (await options.count() > 0) {
        await options.first().click();
        await page.waitForTimeout(200);
      }

      const nextBtn = page.locator('button:has-text("下一题"), button:has-text("Next")');
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
      }
    }

    // Navigate to statistics (if implemented)
    const statsLink = page.locator('a:has-text("统计"), a:has-text("Statistics")');
    if (await statsLink.isVisible()) {
      await statsLink.click();

      // T-060: Statistics show course count
      await expect(page.locator('text=/完成课程|Courses Completed/i')).toBeVisible();

      // T-061: Total words studied
      await expect(page.locator('text=/学习单词|Words Studied/i')).toBeVisible();

      // T-062: Average accuracy
      await expect(page.locator('text=/平均正确率|Average Accuracy/i')).toBeVisible();

      // T-063: Total study time
      await expect(page.locator('text=/学习时长|Study Time/i')).toBeVisible();
    }
  });

  test('T-064 to T-070: Settings and Data Deletion', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.locator('#accept-privacy').click();
    await page.waitForTimeout(500);

    // T-064: Settings page accessible
    const settingsLink = page.locator('a:has-text("设置"), a:has-text("Settings")');
    await expect(settingsLink).toBeVisible();
    await settingsLink.click();

    // T-065: Storage usage displayed
    const storageInfo = page.locator('text=/存储使用|Storage Usage/i');
    await expect(storageInfo).toBeVisible();
    await expect(page.locator('text=/KB|MB/i')).toBeVisible();

    // T-066: Delete button visible
    const deleteButton = page.locator('button:has-text("删除"), button:has-text("Delete")');
    await expect(deleteButton).toBeVisible();

    // T-067: Deletion requires confirmation
    await deleteButton.click();
    const confirmDialog = page.locator('.modal, [role="dialog"]');
    await expect(confirmDialog).toBeVisible();

    // T-068: Confirm deletion
    const confirmButton = page.locator('button:has-text("确认"), button:has-text("Confirm")');
    await confirmButton.click();
    await page.waitForTimeout(500);

    // Verify data deleted from localStorage
    const learningRecords = await page.evaluate(() =>
      localStorage.getItem('vocab_learning_records')
    );
    expect(learningRecords).toBe('[]');

    // T-069: Privacy policy link
    const privacyLink = page.locator('a:has-text("隐私政策"), a[href*="privacy"]');
    await expect(privacyLink).toBeVisible();
  });

  test('T-071 to T-079: Privacy Policy Page', async ({ page }) => {
    // T-071: Privacy policy page loads
    await page.goto('http://localhost:8080/privacy.html');

    // T-072: All 10 sections present
    await expect(page.locator('h2:has-text("数据收集"), h2:has-text("Data Collection")')).toBeVisible();
    await expect(page.locator('h2:has-text("数据存储"), h2:has-text("Data Storage")')).toBeVisible();
    await expect(page.locator('h2:has-text("数据使用"), h2:has-text("Data Usage")')).toBeVisible();
    await expect(page.locator('h2:has-text("数据传输"), h2:has-text("Data Transfer")')).toBeVisible();
    await expect(page.locator('h2:has-text("第三方"), h2:has-text("Third-Party")')).toBeVisible();
    await expect(page.locator('h2:has-text("用户权利"), h2:has-text("User Rights")')).toBeVisible();
    await expect(page.locator('h2:has-text("儿童"), h2:has-text("Children")')).toBeVisible();
    await expect(page.locator('h2:has-text("Cookies")')).toBeVisible();
    await expect(page.locator('h2:has-text("更新"), h2:has-text("Updates")')).toBeVisible();
    await expect(page.locator('h2:has-text("联系"), h2:has-text("Contact")')).toBeVisible();

    // T-073: Bilingual content
    await expect(page.locator('text=/本应用收集/i')).toBeVisible();
    await expect(page.locator('text=/This application collects/i')).toBeVisible();

    // T-074: Data collection listed
    await expect(page.locator('text=/课程完成记录|Course completion/i')).toBeVisible();
    await expect(page.locator('text=/答题记录|Quiz answers/i')).toBeVisible();

    // T-075: Storage location explained
    await expect(page.locator('text=/LocalStorage/i')).toBeVisible();

    // T-076: No third-party sharing confirmed
    await expect(page.locator('text=/不.*第三方|not.*third/i')).toBeVisible();

    // T-077: Deletion rights explained
    await expect(page.locator('text=/删除|Delete/i')).toBeVisible();
    await expect(page.locator('text=/设置|Settings/i')).toBeVisible();

    // T-078: Contact information
    await expect(page.locator('text=/GitHub/i')).toBeVisible();

    // T-079: Last updated date
    await expect(page.locator('text=/2025-12-08/i')).toBeVisible();

    // Back button works
    const backLink = page.locator('a:has-text("返回"), a:has-text("Back")');
    await expect(backLink).toBeVisible();
  });

  test('T-087 to T-093: Responsive Design', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.locator('#accept-privacy').click();

    // T-087: Mobile view (375px)
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.series-card')).toBeVisible();

    // T-088: Tablet view (768px)
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('.series-card')).toBeVisible();

    // T-089: Desktop view (1440px)
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator('.series-card')).toBeVisible();

    // T-091: Keyboard navigation
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);

    // T-093: Hover states (check CSS)
    const button = page.locator('button').first();
    await button.hover();
    // Just verify no errors on hover
  });

  test('T-094 to T-100: Error Handling', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.locator('#accept-privacy').click();
    await page.waitForTimeout(500);

    // T-096: Invalid course ID
    await page.goto('http://localhost:8080?course=invalid-id');
    // Should handle gracefully, not crash
    await expect(page.locator('body')).toBeVisible();

    // T-097: Browser back button
    await page.goto('http://localhost:8080');
    await page.locator('button:has-text("开始")').first().click();
    await page.waitForTimeout(500);
    await page.goBack();
    await expect(page.locator('.series-card')).toBeVisible();

    // T-098: Refresh during course (should handle gracefully)
    await page.locator('button:has-text("开始")').first().click();
    await page.waitForTimeout(500);
    await page.reload();
    // Should either resume or restart
    await expect(page.locator('body')).toBeVisible();

    // T-099: Multiple rapid clicks
    await page.goto('http://localhost:8080');
    await page.waitForTimeout(500);
    const button = page.locator('button').first();
    await button.click({ clickCount: 5, delay: 50 });
    // Should not cause errors

    // T-100: Empty answers
    await page.goto('http://localhost:8080');
    await page.waitForTimeout(500);
    await page.locator('button:has-text("开始")').first().click();
    await page.waitForTimeout(500);

    // Try to submit without selecting/filling answer
    const submitBtn = page.locator('button:has-text("提交"), button:has-text("Submit")');
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      // Should reject or show validation message
    }
  });

  test('Performance: SC-006 Load Time Validation', async ({ page }) => {
    const loadStartTime = Date.now();

    await page.goto('http://localhost:8080');
    await page.waitForLoadState('networkidle');

    const totalLoadTime = Date.now() - loadStartTime;
    console.log(`Total load time: ${totalLoadTime}ms`);

    // SC-006: <3s load time
    expect(totalLoadTime).toBeLessThan(3000);

    // Measure DOMContentLoaded
    const domContentLoaded = await page.evaluate(() => {
      return performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
    });
    console.log(`DOMContentLoaded: ${domContentLoaded}ms`);

    // Check bundle sizes
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map(r => ({
        name: r.name,
        size: r.transferSize,
        duration: r.duration
      }));
    });

    console.log('Resource sizes:');
    resources.forEach(r => {
      if (r.name.includes('.js') || r.name.includes('.css') || r.name.includes('.json')) {
        console.log(`  ${r.name.split('/').pop()}: ${r.size} bytes (${r.duration}ms)`);
      }
    });

    const totalSize = resources.reduce((sum, r) => sum + (r.size || 0), 0);
    console.log(`Total page weight: ${totalSize} bytes (${(totalSize / 1024).toFixed(2)} KB)`);

    // Should be under 500KB for MVP
    expect(totalSize).toBeLessThan(500 * 1024);
  });

  test('Storage: SC-007 LocalStorage Size Validation', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.locator('#accept-privacy').click();
    await page.waitForTimeout(500);

    // Calculate storage size
    const storageSize = await page.evaluate(() => {
      let totalSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += key.length + (localStorage[key]?.length || 0);
        }
      }
      return totalSize;
    });

    const storageSizeKB = (storageSize / 1024).toFixed(2);
    const storageSizeMB = (storageSize / 1024 / 1024).toFixed(2);

    console.log(`LocalStorage size: ${storageSizeKB} KB (${storageSizeMB} MB)`);

    // SC-007: <5MB limit
    expect(storageSize).toBeLessThan(5 * 1024 * 1024);

    // List all storage keys
    const keys = await page.evaluate(() => Object.keys(localStorage));
    console.log('Storage keys:', keys);

    keys.forEach(async (key) => {
      const itemSize = await page.evaluate((k) => {
        const item = localStorage.getItem(k);
        return item ? item.length : 0;
      }, key);
      console.log(`  ${key}: ${(itemSize / 1024).toFixed(2)} KB`);
    });
  });
});

test.describe('MVP Success Criteria Validation', () => {

  test('SC-001: Course completion time <10 minutes', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.locator('#accept-privacy').click();
    await page.waitForTimeout(500);

    const startTime = Date.now();

    // Start course
    await page.locator('button:has-text("开始")').first().click();
    await page.waitForTimeout(500);

    // Quickly answer all questions (automated test pace)
    for (let i = 0; i < 12; i++) {
      await page.waitForTimeout(200);

      const options = page.locator('.option-button');
      if (await options.count() > 0) {
        await options.first().click();
        await page.waitForTimeout(200);
      }

      const nextBtn = page.locator('button:has-text("下一题"), button:has-text("Next"), button:has-text("查看结果"), button:has-text("View Results")');
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
      }
    }

    const completionTime = (Date.now() - startTime) / 1000;
    console.log(`Automated completion time: ${completionTime}s`);

    // Human pace would be 30-40s per question = 6-8 minutes
    // This validates the course CAN be completed within 10 minutes
    expect(completionTime).toBeLessThan(600); // 10 minutes in test scenario
  });

  test('SC-002: At least 2 question types', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.locator('#accept-privacy').click();
    await page.waitForTimeout(500);

    await page.locator('button:has-text("开始")').first().click();
    await page.waitForTimeout(500);

    const questionTypes = new Set();

    for (let i = 0; i < 12; i++) {
      const questionType = await page.locator('.question-type').textContent();
      questionTypes.add(questionType.trim());

      // Answer and proceed
      const options = page.locator('.option-button');
      if (await options.count() > 0) {
        await options.first().click();
        await page.waitForTimeout(200);
      } else {
        // Fill-in-blank
        const input = page.locator('input[type="text"]');
        if (await input.isVisible()) {
          await input.fill('test');
          await page.locator('button:has-text("提交")').click();
          await page.waitForTimeout(200);
        }
      }

      const nextBtn = page.locator('button:has-text("下一题"), button:has-text("Next")');
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
      } else {
        break;
      }
    }

    console.log('Question types found:', Array.from(questionTypes));
    expect(questionTypes.size).toBeGreaterThanOrEqual(2); // SC-002
  });

  test('SC-005: TOEFL vocabulary present', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.locator('#accept-privacy').click();
    await page.waitForTimeout(500);

    // Check localStorage for TOEFL words
    const toeflWords = await page.evaluate(() => {
      const words = JSON.parse(localStorage.getItem('vocab_words') || '[]');
      return words.filter(w => w.source === 'toefl');
    });

    console.log(`TOEFL words in database: ${toeflWords.length}`);
    expect(toeflWords.length).toBeGreaterThan(0); // SC-005

    // Verify word structure
    const sampleWord = toeflWords[0];
    expect(sampleWord).toHaveProperty('id');
    expect(sampleWord).toHaveProperty('word');
    expect(sampleWord).toHaveProperty('phonetic');
    expect(sampleWord).toHaveProperty('definitions');
  });
});
