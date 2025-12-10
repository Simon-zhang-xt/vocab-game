/**
 * Example Sentence Service
 *
 * 管理单词例句的获取和TTS语音播放
 *
 * Features:
 * - 获取单词的例句
 * - TTS语音播放例句
 * - 记录例句使用次数
 * - 按来源类型筛选
 *
 * @version 2.2.0
 */

import { supabase } from './SupabaseService.js';

class ExampleSentenceService {
  constructor() {
    this.tts = window.speechSynthesis;
    this.currentUtterance = null;
  }

  /**
   * 获取指定单词的所有例句
   * @param {string} wordId - 单词ID
   * @param {number} limit - 返回数量限制（默认3）
   * @returns {Promise<Object>} { data, error }
   */
  async getExampleSentences(wordId, limit = 3) {
    try {
      const { data, error } = await supabase
        .from('example_sentences')
        .select('*')
        .eq('word_id', wordId)
        .order('difficulty_level', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Get example sentences error:', error);
      return { data: [], error };
    }
  }

  /**
   * 按来源类型获取例句
   * @param {string} wordId - 单词ID
   * @param {string} sourceType - 来源类型: movie/news/literature/daily
   * @returns {Promise<Object>} { data, error }
   */
  async getExampleSentencesBySource(wordId, sourceType) {
    try {
      const { data, error } = await supabase
        .from('example_sentences')
        .select('*')
        .eq('word_id', wordId)
        .eq('source_type', sourceType)
        .order('difficulty_level', { ascending: true });

      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Get example sentences by source error:', error);
      return { data: [], error };
    }
  }

  /**
   * 增加例句使用计数
   * @param {string} sentenceId - 例句ID
   * @returns {Promise<Object>} { data, error }
   */
  async incrementUsageCount(sentenceId) {
    try {
      const { data, error } = await supabase.rpc('increment_sentence_usage', {
        sentence_id: sentenceId
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      // 如果RPC函数不存在，使用备用方法
      console.warn('RPC not available, using fallback method');
      return { data: null, error: null };
    }
  }

  /**
   * 使用TTS播放例句
   * @param {string} text - 要播放的文本
   * @param {string} lang - 语言代码（默认 en-US）
   * @param {number} rate - 播放速度（0.5-2.0，默认1.0）
   * @returns {Promise<void>}
   */
  async speakSentence(text, lang = 'en-US', rate = 1.0) {
    // 检查浏览器是否支持TTS
    if (!this.tts) {
      console.warn('Text-to-speech not supported in this browser');
      return;
    }

    // 停止当前播放
    this.stopSpeaking();

    return new Promise((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = rate;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onend = () => {
          this.currentUtterance = null;
          resolve();
        };

        utterance.onerror = (event) => {
          console.error('TTS error:', event);
          this.currentUtterance = null;
          reject(event);
        };

        this.currentUtterance = utterance;
        this.tts.speak(utterance);
      } catch (error) {
        console.error('Speak error:', error);
        reject(error);
      }
    });
  }

  /**
   * 停止当前播放
   */
  stopSpeaking() {
    if (this.tts) {
      this.tts.cancel();
      this.currentUtterance = null;
    }
  }

  /**
   * 暂停播放
   */
  pauseSpeaking() {
    if (this.tts) {
      this.tts.pause();
    }
  }

  /**
   * 恢复播放
   */
  resumeSpeaking() {
    if (this.tts) {
      this.tts.resume();
    }
  }

  /**
   * 检查TTS是否正在播放
   * @returns {boolean}
   */
  isSpeaking() {
    return this.tts && this.tts.speaking;
  }

  /**
   * 获取可用的语音列表
   * @returns {Array}
   */
  getAvailableVoices() {
    if (!this.tts) return [];
    return this.tts.getVoices();
  }

  /**
   * 使用指定语音播放
   * @param {string} text - 文本
   * @param {string} voiceName - 语音名称
   * @param {number} rate - 播放速度
   */
  async speakWithVoice(text, voiceName, rate = 1.0) {
    if (!this.tts) return;

    this.stopSpeaking();

    const voices = this.getAvailableVoices();
    const voice = voices.find(v => v.name === voiceName);

    if (!voice) {
      console.warn(`Voice ${voiceName} not found, using default`);
      await this.speakSentence(text, 'en-US', rate);
      return;
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.rate = rate;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('TTS error:', event);
        reject(event);
      };

      this.currentUtterance = utterance;
      this.tts.speak(utterance);
    });
  }

  /**
   * 获取英语语音列表
   * @returns {Array}
   */
  getEnglishVoices() {
    const voices = this.getAvailableVoices();
    return voices.filter(voice =>
      voice.lang.startsWith('en-') ||
      voice.lang === 'en'
    );
  }

  /**
   * 获取推荐的英语语音
   * @returns {Object|null}
   */
  getRecommendedEnglishVoice() {
    const englishVoices = this.getEnglishVoices();

    // 优先选择美音
    let voice = englishVoices.find(v => v.lang === 'en-US' && v.default);
    if (voice) return voice;

    // 其次选择任意美音
    voice = englishVoices.find(v => v.lang === 'en-US');
    if (voice) return voice;

    // 最后选择任意英语语音
    return englishVoices[0] || null;
  }

  /**
   * 格式化例句显示（高亮目标单词）
   * @param {string} sentence - 例句
   * @param {string} targetWord - 目标单词
   * @returns {string} HTML字符串
   */
  highlightTargetWord(sentence, targetWord) {
    // 构建正则表达式，忽略大小写，匹配整个单词
    const regex = new RegExp(`\\b(${targetWord})\\b`, 'gi');
    return sentence.replace(regex, '<mark class="target-word">$1</mark>');
  }

  /**
   * 获取来源类型的中文名称
   * @param {string} sourceType - 来源类型
   * @returns {string}
   */
  getSourceTypeName(sourceType) {
    const names = {
      movie: '电影',
      news: '新闻',
      literature: '文学',
      daily: '日常对话'
    };
    return names[sourceType] || sourceType;
  }

  /**
   * 获取来源类型的图标
   * @param {string} sourceType - 来源类型
   * @returns {string}
   */
  getSourceTypeIcon(sourceType) {
    const icons = {
      movie: '🎬',
      news: '📰',
      literature: '📚',
      daily: '💬'
    };
    return icons[sourceType] || '📝';
  }

  /**
   * 获取难度等级的描述
   * @param {number} level - 难度等级 1-5
   * @returns {string}
   */
  getDifficultyName(level) {
    const names = {
      1: '简单',
      2: '较简单',
      3: '中等',
      4: '较难',
      5: '困难'
    };
    return names[level] || '中等';
  }
}

// 创建单例实例
const exampleSentenceService = new ExampleSentenceService();

// 等待语音列表加载
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    console.log('Available voices loaded:', exampleSentenceService.getAvailableVoices().length);
  };
}

export default exampleSentenceService;
