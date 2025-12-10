/**
 * Example Sentence View Component
 *
 * 显示单词的真实例句，支持TTS语音播放
 *
 * Features:
 * - 显示多个例句
 * - 来源标签（电影/新闻/文学/日常）
 * - TTS语音播放
 * - 播放速度控制
 * - 高亮显示目标单词
 *
 * @version 2.2.0
 */

import exampleSentenceService from '../services/ExampleSentenceService.js';

export default class ExampleSentenceView {
  constructor(container, wordId, wordText) {
    this.container = container;
    this.wordId = wordId;
    this.wordText = wordText;
    this.sentences = [];
    this.currentPlayingId = null;
    this.currentRate = 1.0;
  }

  /**
   * 渲染例句视图
   */
  async render() {
    // 显示加载状态
    this.container.innerHTML = `
      <div class="example-sentences-section">
        <div class="section-header">
          <h3>📚 真实例句 Example Sentences</h3>
        </div>
        <div class="loading-placeholder">
          <div class="spinner"></div>
          <p>加载例句中...</p>
        </div>
      </div>
    `;

    // 加载例句数据
    await this.loadSentences();

    // 渲染例句列表
    this.renderSentences();

    // 附加事件监听器
    this.attachEventListeners();
  }

  /**
   * 加载例句数据
   */
  async loadSentences() {
    const { data, error } = await exampleSentenceService.getExampleSentences(this.wordId, 3);

    if (error) {
      console.error('Failed to load sentences:', error);
      this.sentences = [];
      return;
    }

    this.sentences = data || [];
  }

  /**
   * 渲染例句列表
   */
  renderSentences() {
    if (this.sentences.length === 0) {
      this.container.innerHTML = `
        <div class="example-sentences-section">
          <div class="section-header">
            <h3>📚 真实例句 Example Sentences</h3>
          </div>
          <div class="no-sentences">
            <p>暂无例句数据</p>
            <small>我们正在努力添加更多例句...</small>
          </div>
        </div>
      `;
      return;
    }

    const sentencesHTML = this.sentences.map((sentence, index) => {
      const sourceIcon = exampleSentenceService.getSourceTypeIcon(sentence.source_type);
      const sourceName = exampleSentenceService.getSourceTypeName(sentence.source_type);
      const difficultyName = exampleSentenceService.getDifficultyName(sentence.difficulty_level);
      const highlightedEn = exampleSentenceService.highlightTargetWord(sentence.sentence_en, this.wordText);

      return `
        <div class="sentence-card" data-sentence-id="${sentence.id}" data-index="${index}">
          <div class="sentence-header">
            <span class="source-badge">
              ${sourceIcon} ${sourceName}
            </span>
            <span class="difficulty-badge difficulty-${sentence.difficulty_level}">
              ${difficultyName}
            </span>
          </div>

          <div class="sentence-content">
            <div class="sentence-en">
              ${highlightedEn}
              <button class="play-button" data-sentence-id="${sentence.id}" data-text="${sentence.sentence_en}" title="播放例句">
                🔊
              </button>
            </div>
            <div class="sentence-zh">
              ${sentence.sentence_zh}
            </div>
          </div>

          ${sentence.source_name ? `
            <div class="sentence-footer">
              <small>来源: ${sentence.source_name}</small>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="example-sentences-section">
        <div class="section-header">
          <h3>📚 真实例句 Example Sentences</h3>
          <div class="playback-controls">
            <label>播放速度:</label>
            <select class="rate-selector">
              <option value="0.75">0.75x</option>
              <option value="1.0" selected>1.0x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
            </select>
          </div>
        </div>

        <div class="sentences-list">
          ${sentencesHTML}
        </div>

        <div class="tts-tip">
          💡 提示: 点击🔊按钮可以听取例句的标准发音
        </div>
      </div>
    `;
  }

  /**
   * 附加事件监听器
   */
  attachEventListeners() {
    // 播放按钮点击事件
    const playButtons = this.container.querySelectorAll('.play-button');
    playButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const sentenceId = button.getAttribute('data-sentence-id');
        const text = button.getAttribute('data-text');
        this.handlePlaySentence(sentenceId, text, button);
      });
    });

    // 播放速度选择器
    const rateSelector = this.container.querySelector('.rate-selector');
    if (rateSelector) {
      rateSelector.addEventListener('change', (e) => {
        this.currentRate = parseFloat(e.target.value);
      });
    }

    // 卡片点击事件（可选：点击卡片播放）
    const sentenceCards = this.container.querySelectorAll('.sentence-card');
    sentenceCards.forEach(card => {
      card.addEventListener('click', (e) => {
        // 如果点击的不是播放按钮，则触发播放按钮
        if (!e.target.classList.contains('play-button')) {
          const playButton = card.querySelector('.play-button');
          if (playButton) {
            playButton.click();
          }
        }
      });
    });
  }

  /**
   * 处理播放例句
   * @param {string} sentenceId - 例句ID
   * @param {string} text - 例句文本
   * @param {HTMLElement} button - 播放按钮元素
   */
  async handlePlaySentence(sentenceId, text, button) {
    // 如果正在播放相同的例句，则停止
    if (this.currentPlayingId === sentenceId && exampleSentenceService.isSpeaking()) {
      exampleSentenceService.stopSpeaking();
      this.updatePlayButton(button, false);
      this.currentPlayingId = null;
      return;
    }

    // 停止当前播放
    if (exampleSentenceService.isSpeaking()) {
      exampleSentenceService.stopSpeaking();
      this.resetAllPlayButtons();
    }

    try {
      // 更新按钮状态
      this.updatePlayButton(button, true);
      this.currentPlayingId = sentenceId;

      // 播放例句
      await exampleSentenceService.speakSentence(text, 'en-US', this.currentRate);

      // 播放完成，重置按钮
      this.updatePlayButton(button, false);
      this.currentPlayingId = null;

      // 增加使用计数
      await exampleSentenceService.incrementUsageCount(sentenceId);

    } catch (error) {
      console.error('Failed to play sentence:', error);
      this.updatePlayButton(button, false);
      this.currentPlayingId = null;

      // 显示错误提示
      this.showError('播放失败，请检查浏览器是否支持语音合成功能');
    }
  }

  /**
   * 更新播放按钮状态
   * @param {HTMLElement} button - 按钮元素
   * @param {boolean} isPlaying - 是否正在播放
   */
  updatePlayButton(button, isPlaying) {
    if (isPlaying) {
      button.textContent = '⏸️';
      button.classList.add('playing');
      button.title = '停止播放';
    } else {
      button.textContent = '🔊';
      button.classList.remove('playing');
      button.title = '播放例句';
    }
  }

  /**
   * 重置所有播放按钮
   */
  resetAllPlayButtons() {
    const playButtons = this.container.querySelectorAll('.play-button');
    playButtons.forEach(button => {
      this.updatePlayButton(button, false);
    });
  }

  /**
   * 显示错误信息
   * @param {string} message - 错误信息
   */
  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'sentence-error';
    errorDiv.textContent = message;

    const header = this.container.querySelector('.section-header');
    if (header) {
      header.after(errorDiv);

      // 3秒后自动移除
      setTimeout(() => {
        errorDiv.remove();
      }, 3000);
    }
  }

  /**
   * 清理资源
   */
  destroy() {
    // 停止播放
    if (exampleSentenceService.isSpeaking()) {
      exampleSentenceService.stopSpeaking();
    }

    // 清空容器
    this.container.innerHTML = '';
  }

  /**
   * 刷新例句列表
   */
  async refresh() {
    await this.render();
  }
}
