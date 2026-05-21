// app-memory-system.js - Human-like Memory System
// 类人记忆系统核心引擎
//
// 设计理念：模拟人脑的四层记忆结构 + 艾宾浩斯遗忘曲线 + 情感加权 + 联想检索
//
// 四层记忆：
//   - 感觉记忆（Sensory）    ：当前对话窗口，不持久化
//   - 短期记忆（Short-term） ：半衰期3天，容量20条/联系人
//   - 长期记忆（Long-term）  ：半衰期30天，容量50条/联系人
//   - 核心记忆（Core）       ：永不遗忘，容量15条/联系人（关系定义性事件）
//
// 模块组成：
//   MemoryStore     - 数据存储层（分层池+归档）
//   MemoryPipeline  - 记忆生成管道（统一入口，不再区分线上/线下/通话）
//   MemoryDecay     - 遗忘引擎（衰减+晋升+淘汰）
//   MemoryRecall    - 联想检索（关键词匹配+情感权重+层级权重）
//   MemoryEmotion   - 情感分析（AI评分+关键词提取）
//   MemoryMigration - 数据迁移（旧memorySummaries → 新memorySystem）
//
// 向后兼容：保留 store.memorySummaries 作为只读投影，所有外部接口不变

(function(global) {
    'use strict';

    // ==================== 常量配置 ====================
    const MEMORY_VERSION = 3;
    const TIER_CONFIG = {
        short: {
            capacity: 20,
            halfLifeDays: 3,
            decayLambda: Math.LN2 / 3,        // ≈ 0.231
            promoteThreshold: { accessCount: 3, emotion: 0.7 },
            forgetStrength: 0.20,              // strength < 0.20 → 归档
            tierWeight: 0.6                     // 召回权重
        },
        long: {
            capacity: 50,
            halfLifeDays: 30,
            decayLambda: Math.LN2 / 30,        // ≈ 0.023
            promoteThreshold: { accessCount: 8, coreEvent: true },
            forgetStrength: 0.15,              // strength < 0.15 → 降级为短期
            tierWeight: 1.0
        },
        core: {
            capacity: 15,
            halfLifeDays: Infinity,
            decayLambda: 0,                     // 不衰减
            promoteThreshold: null,
            forgetStrength: 0,                  // 永不遗忘
            tierWeight: 1.5
        }
    };
    const MAINTAIN_INTERVAL_MS = 60 * 60 * 1000; // 最多每小时维护一次

    // ==================== 工具函数 ====================
    function _uid(prefix) {
        return (prefix || 'mem_') + Date.now() + '_' + Math.floor(Math.random() * 10000);
    }

    function _now() { return Date.now(); }

    function _daysBetween(t1, t2) {
        return Math.abs(t2 - t1) / (1000 * 60 * 60 * 24);
    }

    function _clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function _sanitizeText(text) {
        if (!text || typeof text !== 'string') return text || '';
        return text
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
            .replace(/[\u200B-\u200F\u2028-\u202F\uFEFF\uFFF9-\uFFFC]/g, '')
            .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '')
            .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');
    }

    // 安全获取 store（全局单例，由 app-part1.js 初始化）
    // [FIX-记忆系统-store桥接] app-part1.js 的 store 是 let 声明的闭包变量，
    // 不会自动挂到 window 上。优先通过 window.__getAppStore() 获取，拿不到时
    // 再回退到直接读 global.store（兼容旧路径）。getter 方式保证重新赋值后
    // 我们永远拿到最新引用，避免引用脱钩。
    function _getStore() {
        if (typeof global.__getAppStore === 'function') {
            const s = global.__getAppStore();
            if (s && typeof s === 'object') return s;
        }
        return (typeof global.store === 'object' && global.store) ? global.store : null;
    }

    function _safeSave() {
        try {
            if (typeof global.save === 'function') global.save();
        } catch (e) { console.warn('[MemorySystem] save failed:', e); }
    }

    // ==================== 中文关键词提取（简单版） ====================
    // 由于没有引入分词库，采用"字符二元组 + 命名实体模式匹配"的轻量级方案
    // 对于中文效果：提取2-4字的重复出现片段 + 明显的命名实体特征
    const STOP_WORDS = new Set([
        '的', '了', '是', '我', '你', '他', '她', '它', '们', '这', '那', '和', '与', '在', '有',
        '也', '都', '就', '还', '但', '又', '很', '太', '会', '要', '想', '说', '把', '被', '给',
        '让', '从', '向', '为', '对', '到', '上', '下', '里', '外', '前', '后', '中', '时', '着',
        '过', '来', '去', '做', '看', '吃', '喝', '啊', '呀', '吧', '呢', '嗯', '哦', '啦', '嘛',
        '不', '没', '一个', '一些', '什么', '怎么', '为什么', '怎样', '如何', '哪里', '谁', '今天',
        '昨天', '明天', '现在', '以前', '以后', '已经', '正在', '可以', '应该', '可能', '一直',
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
        'and', 'or', 'but', 'if', 'in', 'on', 'at', 'to', 'of', 'for', 'with', 'by', 'this', 'that'
    ]);

    const MemoryKeywords = {
        /**
         * 从文本提取关键词（中文友好）
         * @param {string} text
         * @param {number} maxCount
         * @returns {string[]}
         */
        extract(text, maxCount) {
            maxCount = maxCount || 8;
            if (!text || typeof text !== 'string') return [];
            const clean = _sanitizeText(text);

            const freq = new Map();

            // 1) 提取 2-4 字的中文片段
            const chineseRuns = clean.match(/[\u4e00-\u9fa5]+/g) || [];
            chineseRuns.forEach(run => {
                for (let len = 2; len <= 4; len++) {
                    for (let i = 0; i + len <= run.length; i++) {
                        const gram = run.slice(i, i + len);
                        if (STOP_WORDS.has(gram)) continue;
                        // 纯重复字符（如"啊啊"）跳过
                        if (/^(.)\1+$/.test(gram)) continue;
                        freq.set(gram, (freq.get(gram) || 0) + 1);
                    }
                }
            });

            // 2) 提取英文单词（≥3字母）
            const englishWords = clean.toLowerCase().match(/[a-z]{3,}/g) || [];
            englishWords.forEach(w => {
                if (STOP_WORDS.has(w)) return;
                freq.set(w, (freq.get(w) || 0) + 2); // 英文词权重略高
            });

            // 3) 提取数字+单位（如"3天"、"20岁"、"5月1号"）
            const numPatterns = clean.match(/\d+[年月日天岁号点]/g) || [];
            numPatterns.forEach(n => freq.set(n, (freq.get(n) || 0) + 1));

            // 4) 按频率排序，取 top-K
            // 对于中文，优先保留长词（3-4字 > 2字），因为长词更有判别力
            const entries = Array.from(freq.entries())
                .filter(([w, c]) => c >= 1)
                .sort((a, b) => {
                    // 优先级：英文词 > 数字词 > 长中文词 > 短中文词
                    const scoreA = a[1] * (a[0].length >= 3 ? 1.5 : 1.0);
                    const scoreB = b[1] * (b[0].length >= 3 ? 1.5 : 1.0);
                    return scoreB - scoreA;
                });

            // 5) 去除被更长词包含的短词（如有"小橘猫"就去掉"小橘"、"橘猫"）
            const result = [];
            for (const [word] of entries) {
                let subsumed = false;
                for (const kept of result) {
                    if (kept.length > word.length && kept.includes(word)) {
                        subsumed = true;
                        break;
                    }
                }
                if (!subsumed) result.push(word);
                if (result.length >= maxCount) break;
            }
            return result;
        },

        /**
         * 计算两组关键词的重叠度（0-1）
         */
        overlap(kwA, kwB) {
            if (!kwA || !kwB || kwA.length === 0 || kwB.length === 0) return 0;
            const setB = new Set(kwB);
            let hits = 0;
            for (const k of kwA) {
                if (setB.has(k)) { hits++; continue; }
                // 子串匹配（处理"小橘"匹配"小橘猫"的情况）
                for (const b of kwB) {
                    if (b.length >= 2 && k.length >= 2 && (b.includes(k) || k.includes(b))) {
                        hits += 0.5;
                        break;
                    }
                }
            }
            return _clamp(hits / Math.max(kwA.length, kwB.length), 0, 1);
        }
    };

    // ==================== 情感分析模块 ====================
    // 用关键词规则做快速判断；AI生成记忆时会同时输出结构化元数据，这里作为fallback
    const EMOTION_KEYWORDS = {
        love:    ['喜欢', '爱', '心动', '暖', '温柔', '想你', '表白', '亲亲', '抱抱', '男朋友', '女朋友', '老公', '老婆', '宝贝'],
        joy:     ['哈哈', '开心', '高兴', '快乐', '幸福', '棒', '太好了', '赞', '笑', '有趣'],
        sadness: ['难过', '伤心', '痛', '哭', '眼泪', '孤独', '失望', '遗憾', '想哭', '心碎'],
        anger:   ['生气', '讨厌', '烦', '气死', '可恶', '凭什么', '滚', '混蛋', '吵架', '分手'],
        surprise:['惊', '竟然', '没想到', '居然', '天哪', '卧槽', '真的假的', '震惊'],
        fear:    ['害怕', '恐惧', '担心', '紧张', '怕', '不安', '焦虑']
    };
    const CORE_EVENT_KEYWORDS = [
        '表白', '告白', '在一起', '做男女朋友', '做男朋友', '做女朋友',
        '分手', '离婚', '绝交', '再也不见',
        '结婚', '求婚', '订婚',
        '答应我', '承诺', '约定', '发誓',
        '我爱你', '爱你', '喜欢你',
        '对不起', '原谅我', '和好',
        '第一次'
    ];

    const MemoryEmotion = {
        /**
         * 分析文本的情感分数和类型
         * @returns {{score: number, type: string, isCoreEvent: boolean}}
         */
        analyze(text) {
            if (!text) return { score: 0.3, type: 'neutral', isCoreEvent: false };
            const lower = text.toLowerCase();

            let maxScore = 0;
            let dominantType = 'neutral';

            Object.entries(EMOTION_KEYWORDS).forEach(([type, kws]) => {
                let hits = 0;
                for (const kw of kws) {
                    if (text.includes(kw) || lower.includes(kw.toLowerCase())) hits++;
                }
                // 情感强度：命中1词=0.5，2词=0.7，3+词=0.9
                const score = hits === 0 ? 0 : (0.3 + Math.min(hits * 0.2, 0.6));
                if (score > maxScore) {
                    maxScore = score;
                    dominantType = type;
                }
            });

            // 是否为关系定义性事件
            const isCoreEvent = CORE_EVENT_KEYWORDS.some(kw => text.includes(kw));
            if (isCoreEvent && maxScore < 0.8) maxScore = 0.85;

            // 感叹号/问号多 → 情感强度加成
            const exclamations = (text.match(/[!！?？]/g) || []).length;
            if (exclamations >= 3) maxScore = Math.min(1.0, maxScore + 0.1);

            // 完全无情感关键词 → 给个基础分
            if (maxScore === 0) maxScore = 0.3;

            return {
                score: _clamp(maxScore, 0, 1),
                type: dominantType,
                isCoreEvent: isCoreEvent
            };
        },

        /**
         * 从AI返回的记忆文本中提取metadata JSON
         * 约定：AI在回复末尾可以附加 <META>{"emotion":0.8,"type":"love",...}</META>
         */
        parseMetaFromAIResponse(text) {
            if (!text) return null;
            const match = text.match(/<META>\s*(\{[\s\S]*?\})\s*<\/META>/i);
            if (!match) return null;
            try {
                return JSON.parse(match[1]);
            } catch (e) {
                console.warn('[MemoryEmotion] Failed to parse META:', e);
                return null;
            }
        },

        /**
         * 移除记忆文本中的META标记
         */
        stripMeta(text) {
            if (!text) return text;
            return text.replace(/<META>[\s\S]*?<\/META>/gi, '').trim();
        }
    };

    // ==================== 数据存储层 ====================
    const MemoryStore = {
        /**
         * 初始化store结构
         */
        init() {
            const s = _getStore();
            if (!s) return null;
            if (!s.memorySystem) {
                s.memorySystem = { version: MEMORY_VERSION, contacts: {} };
            }
            if (s.memorySystem.version < MEMORY_VERSION) {
                s.memorySystem.version = MEMORY_VERSION;
            }
            if (!s.memorySystem.contacts) s.memorySystem.contacts = {};
            return s.memorySystem;
        },

        /**
         * 获取（或创建）某联系人的记忆容器
         */
        getContactMem(contactId) {
            if (!contactId) return null;
            const sys = this.init();
            if (!sys) return null;
            if (!sys.contacts[contactId]) {
                sys.contacts[contactId] = {
                    short: [],
                    long: [],
                    core: [],
                    archive: [],
                    keywordIndex: {},
                    meta: {
                        lastSummaryAt: { chat: 0, offline: 0, call: 0 },
                        totalMemories: 0,
                        lastMaintenanceAt: 0
                    }
                };
            }
            // 防止旧数据缺字段
            const c = sys.contacts[contactId];
            if (!c.short) c.short = [];
            if (!c.long) c.long = [];
            if (!c.core) c.core = [];
            if (!c.archive) c.archive = [];
            if (!c.keywordIndex) c.keywordIndex = {};
            if (!c.meta) c.meta = { lastSummaryAt: {}, totalMemories: 0, lastMaintenanceAt: 0 };
            if (!c.meta.lastSummaryAt) c.meta.lastSummaryAt = {};
            return c;
        },

        /**
         * 获取所有活跃记忆（short + long + core，不含archive）
         */
        getAllActive(contactId) {
            const c = this.getContactMem(contactId);
            if (!c) return [];
            return [...c.core, ...c.long, ...c.short];
        },

        /**
         * 添加记忆到指定层级
         */
        addMemory(contactId, memory, tier) {
            tier = tier || 'short';
            const c = this.getContactMem(contactId);
            if (!c) return null;
            memory.tier = tier;
            memory.contactId = contactId;
            if (!memory.id) memory.id = _uid('mem_');
            c[tier].push(memory);
            c.meta.totalMemories = (c.meta.totalMemories || 0) + 1;
            // 容量控制：超出容量的按 strength 排序保留top，多余的降级或归档
            this._enforceCapacity(c, tier);
            return memory;
        },

        /**
         * 容量控制
         */
        _enforceCapacity(contactMem, tier) {
            const cfg = TIER_CONFIG[tier];
            if (!cfg) return;
            const pool = contactMem[tier];
            if (pool.length <= cfg.capacity) return;

            // 按 strength 排序（需要先计算）
            pool.forEach(m => { m._tmpStrength = MemoryDecay.calculateStrength(m); });
            pool.sort((a, b) => b._tmpStrength - a._tmpStrength);

            const keep = pool.slice(0, cfg.capacity);
            const overflow = pool.slice(cfg.capacity);
            pool.length = 0;
            pool.push(...keep);

            // 溢出的处理：short→archive, long→short, core不应溢出（硬上限）
            overflow.forEach(m => {
                delete m._tmpStrength;
                if (tier === 'short') {
                    contactMem.archive.push(m);
                } else if (tier === 'long') {
                    m.tier = 'short';
                    m.strength = 0.5;
                    contactMem.short.push(m);
                } else if (tier === 'core') {
                    m.tier = 'long';
                    contactMem.long.push(m);
                }
            });

            // 清理临时字段
            pool.forEach(m => delete m._tmpStrength);
        },

        /**
         * 按 id 查找记忆（全层级）
         */
        findById(contactId, memId) {
            const c = this.getContactMem(contactId);
            if (!c) return null;
            for (const tier of ['core', 'long', 'short', 'archive']) {
                const found = c[tier].find(m => m.id === memId);
                if (found) return { memory: found, tier: tier };
            }
            return null;
        },

        /**
         * 删除记忆
         */
        deleteMemory(contactId, memId) {
            const c = this.getContactMem(contactId);
            if (!c) return false;
            for (const tier of ['short', 'long', 'core', 'archive']) {
                const idx = c[tier].findIndex(m => m.id === memId);
                if (idx >= 0) {
                    c[tier].splice(idx, 1);
                    return true;
                }
            }
            return false;
        },

        /**
         * 移动记忆到另一层级（手动晋升/降级）
         */
        moveToTier(contactId, memId, targetTier) {
            if (!['short', 'long', 'core', 'archive'].includes(targetTier)) return false;
            const c = this.getContactMem(contactId);
            if (!c) return false;
            const found = this.findById(contactId, memId);
            if (!found) return false;
            if (found.tier === targetTier) return true;

            // 从原池移除
            const srcPool = c[found.tier];
            const idx = srcPool.findIndex(m => m.id === memId);
            if (idx >= 0) srcPool.splice(idx, 1);

            // 加入目标池
            found.memory.tier = targetTier;
            if (targetTier === 'core') {
                found.memory.strength = 1.0;
                found.memory.reinforceCount = (found.memory.reinforceCount || 0) + 1;
            } else if (targetTier === 'long') {
                found.memory.strength = Math.max(found.memory.strength || 0.5, 0.8);
            }
            c[targetTier].push(found.memory);
            return true;
        },

        /**
         * 清空某联系人的所有记忆
         */
        clearContact(contactId) {
            const sys = this.init();
            if (!sys) return;
            if (sys.contacts[contactId]) {
                delete sys.contacts[contactId];
            }
        },

        /**
         * 记录最近一次总结位置（用于增量总结）
         */
        markSummarized(contactId, channel, position) {
            const c = this.getContactMem(contactId);
            if (!c) return;
            if (!c.meta.lastSummaryAt) c.meta.lastSummaryAt = {};
            c.meta.lastSummaryAt[channel || 'chat'] = position;
        },

        /**
         * 获取上次总结位置
         */
        getLastSummaryAt(contactId, channel) {
            const c = this.getContactMem(contactId);
            if (!c) return 0;
            return (c.meta.lastSummaryAt && c.meta.lastSummaryAt[channel || 'chat']) || 0;
        }
    };

    // ==================== 遗忘引擎 ====================
    const MemoryDecay = {
        /**
         * 计算记忆当前强度（考虑时间衰减+情感加成+强化加成）
         */
        calculateStrength(memory) {
            if (!memory) return 0;
            if (memory.tier === 'core') return 1.0;
            if (memory.pinned) return 1.0; // 用户置顶的不衰减

            const cfg = TIER_CONFIG[memory.tier] || TIER_CONFIG.short;
            const lastAccess = memory.lastAccessedAt || memory.createdAt || _now();
            const daysSince = _daysBetween(lastAccess, _now());

            const baseDecay = Math.exp(-cfg.decayLambda * daysSince);
            const emotionBoost = (memory.emotionScore || 0) * 0.3;
            const reinforceBoost = Math.min((memory.reinforceCount || 0) * 0.08, 0.4);

            return _clamp(baseDecay + emotionBoost + reinforceBoost, 0, 1);
        },

        /**
         * 对某联系人的记忆进行维护（衰减+晋升+淘汰）
         */
        maintain(contactId, options) {
            options = options || {};
            const c = MemoryStore.getContactMem(contactId);
            if (!c) return { promoted: 0, demoted: 0, archived: 0 };

            // 防止频繁维护
            if (!options.force) {
                const lastMt = c.meta.lastMaintenanceAt || 0;
                if (_now() - lastMt < MAINTAIN_INTERVAL_MS) {
                    return { promoted: 0, demoted: 0, archived: 0, skipped: true };
                }
            }

            let promoted = 0, demoted = 0, archived = 0;

            // 1. 短期 → 长期 晋升
            const shortToPromote = [];
            c.short.forEach(m => {
                m.strength = this.calculateStrength(m);
                const cfg = TIER_CONFIG.short;
                if ((m.accessCount || 0) >= cfg.promoteThreshold.accessCount
                    || (m.emotionScore || 0) >= cfg.promoteThreshold.emotion) {
                    shortToPromote.push(m);
                }
            });
            shortToPromote.forEach(m => {
                c.short.splice(c.short.indexOf(m), 1);
                m.tier = 'long';
                m.strength = Math.max(m.strength, 0.8);
                c.long.push(m);
                promoted++;
            });

            // 2. 长期 → 核心 晋升
            const longToPromote = [];
            c.long.forEach(m => {
                m.strength = this.calculateStrength(m);
                const cfg = TIER_CONFIG.long;
                if ((m.accessCount || 0) >= cfg.promoteThreshold.accessCount || m.isCoreEvent) {
                    longToPromote.push(m);
                }
            });
            longToPromote.forEach(m => {
                c.long.splice(c.long.indexOf(m), 1);
                m.tier = 'core';
                m.strength = 1.0;
                c.core.push(m);
                promoted++;
            });

            // 3. 短期淘汰：strength < 阈值 → 归档
            const toArchive = [];
            c.short.forEach(m => {
                const s = this.calculateStrength(m);
                if (s < TIER_CONFIG.short.forgetStrength) {
                    toArchive.push(m);
                }
            });
            toArchive.forEach(m => {
                c.short.splice(c.short.indexOf(m), 1);
                m.tier = 'archive';
                c.archive.push(m);
                archived++;
            });

            // 4. 长期降级：strength < 阈值 → 短期
            const toDemote = [];
            c.long.forEach(m => {
                const s = this.calculateStrength(m);
                if (s < TIER_CONFIG.long.forgetStrength) {
                    toDemote.push(m);
                }
            });
            toDemote.forEach(m => {
                c.long.splice(c.long.indexOf(m), 1);
                m.tier = 'short';
                m.strength = Math.max(m.strength, 0.3);
                c.short.push(m);
                demoted++;
            });

            // 5. 容量强制（可能有超出）
            MemoryStore._enforceCapacity(c, 'short');
            MemoryStore._enforceCapacity(c, 'long');
            MemoryStore._enforceCapacity(c, 'core');

            // 6. 归档容量控制（最多保留100条）
            if (c.archive.length > 100) {
                c.archive.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                c.archive.length = 100;
            }

            c.meta.lastMaintenanceAt = _now();
            return { promoted, demoted, archived };
        },

        /**
         * 强化一条记忆（被访问/提及时调用）
         */
        reinforce(contactId, memId) {
            const found = MemoryStore.findById(contactId, memId);
            if (!found) return;
            const m = found.memory;
            m.lastAccessedAt = _now();
            m.accessCount = (m.accessCount || 0) + 1;
            m.strength = Math.min(1.0, (m.strength || 0.5) + 0.05);
        }
    };

    // ==================== 关键词记忆索引（KeywordMemoryIndex） ====================
    // 模拟人脑的"语义节点"：反复听到一个词，这个词相关的记忆就越牢固
    // 追踪每个关键词的提及次数、时间线、关联记忆，实现"越提越深"的效果
    const KEYWORD_INDEX_CONFIG = {
        maxTimelineEntries: 20,    // 每个关键词最多保留20条时间线记录
        maxKeywordsPerContact: 200, // 每个联系人最多追踪200个关键词
        minMentionForStrong: 3,    // 提及>=3次算"记得清楚"
        minMentionForDeep: 6,      // 提及>=6次算"刻在脑子里"
        decayBaseRate: 0.1,        // 基础衰减速率（会被频次降低）
        strengthCap: 1.0           // 强度上限
    };

    const KeywordMemoryIndex = {
        /**
         * 获取（或创建）某联系人的关键词索引
         */
        getIndex(contactId) {
            const c = MemoryStore.getContactMem(contactId);
            if (!c) return {};
            if (!c.keywordIndex) c.keywordIndex = {};
            return c.keywordIndex;
        },

        /**
         * 用户发消息时调用：扫描消息中的关键词，更新索引
         * @param {string} contactId
         * @param {string} messageText - 用户发送的消息文本
         * @param {object} options - { timestamp, contextSnippet }
         */
        onUserMessage(contactId, messageText, options) {
            if (!contactId || !messageText || messageText.length < 2) return;
            options = options || {};
            const timestamp = options.timestamp || _now();

            const index = this.getIndex(contactId);
            if (!index) return;

            // 提取消息中的关键词
            const msgKeywords = MemoryKeywords.extract(messageText, 10);
            if (msgKeywords.length === 0) return;

            // 生成简短上下文片段（最多30字）
            const contextSnippet = options.contextSnippet
                || messageText.substring(0, 30).replace(/\n/g, ' ');

            let updated = false;
            for (const kw of msgKeywords) {
                // 检查是否命中已有索引中的关键词（精确匹配 + 子串匹配）
                const matchedKey = this._findMatchingKey(index, kw);

                if (matchedKey) {
                    // 已有关键词：更新频次和时间线
                    const entry = index[matchedKey];
                    entry.mentionCount = (entry.mentionCount || 0) + 1;
                    entry.lastMentionAt = timestamp;
                    entry.decayBase = timestamp; // 重置衰减起算点

                    // 追加时间线（限制最大条数）
                    if (!entry.mentionTimeline) entry.mentionTimeline = [];
                    entry.mentionTimeline.push({
                        at: timestamp,
                        context: contextSnippet
                    });
                    if (entry.mentionTimeline.length > KEYWORD_INDEX_CONFIG.maxTimelineEntries) {
                        entry.mentionTimeline = entry.mentionTimeline.slice(-KEYWORD_INDEX_CONFIG.maxTimelineEntries);
                    }

                    // 重算强度
                    entry.strength = this.calcStrength(entry);

                    // 强化关联记忆
                    this._reinforceLinkedMemories(contactId, entry);
                    updated = true;
                } else {
                    // 新关键词：检查是否在已有记忆中出现过
                    const linkedIds = this._findLinkedMemories(contactId, kw);
                    if (linkedIds.length > 0) {
                        // 只有在已有记忆中出现过的关键词才建立索引（避免噪音）
                        index[kw] = {
                            keyword: kw,
                            mentionCount: 1,
                            firstMentionAt: timestamp,
                            lastMentionAt: timestamp,
                            mentionTimeline: [{ at: timestamp, context: contextSnippet }],
                            linkedMemoryIds: linkedIds,
                            strength: 0.3, // 首次提及的初始强度
                            decayBase: timestamp
                        };
                        updated = true;
                    }
                }
            }

            // 容量控制
            if (updated) {
                this._enforceCapacity(index);
            }
        },

        /**
         * 记忆生成后调用：将新记忆的关键词注册到索引
         * @param {string} contactId
         * @param {object} memory - 新生成的记忆条目
         */
        onMemoryCreated(contactId, memory) {
            if (!contactId || !memory || !memory.keywords) return;
            const index = this.getIndex(contactId);
            if (!index) return;

            const timestamp = memory.createdAt || _now();

            for (const kw of memory.keywords) {
                if (!kw || kw.length < 2) continue;

                if (index[kw]) {
                    // 已有索引：追加关联记忆ID
                    if (!index[kw].linkedMemoryIds) index[kw].linkedMemoryIds = [];
                    if (!index[kw].linkedMemoryIds.includes(memory.id)) {
                        index[kw].linkedMemoryIds.push(memory.id);
                    }
                } else {
                    // 新建索引条目
                    index[kw] = {
                        keyword: kw,
                        mentionCount: 0, // 记忆生成不算用户主动提及
                        firstMentionAt: timestamp,
                        lastMentionAt: timestamp,
                        mentionTimeline: [],
                        linkedMemoryIds: [memory.id],
                        strength: 0.2, // 仅从记忆生成的初始强度较低
                        decayBase: timestamp
                    };
                }
            }

            this._enforceCapacity(index);
        },

        /**
         * 计算关键词记忆强度
         * 公式：频次对数增长 × 时间衰减（衰减速度随频次降低）
         */
        calcStrength(entry) {
            if (!entry) return 0;
            const count = entry.mentionCount || 0;
            const lastMention = entry.lastMentionAt || entry.decayBase || _now();
            const daysSinceLast = _daysBetween(lastMention, _now());

            // 频次基础强度：对数增长（提1次=0.3, 3次=0.55, 6次=0.75, 10次=0.85）
            const freqBase = count === 0
                ? 0.15
                : _clamp(0.2 + Math.log2(count + 1) * 0.2, 0, KEYWORD_INDEX_CONFIG.strengthCap);

            // 衰减速率随频次降低：提得多 → 忘得慢
            // 提1次: rate=0.1, 提3次: rate=0.058, 提6次: rate=0.041, 提10次: rate=0.032
            const decayRate = Math.max(0.01, KEYWORD_INDEX_CONFIG.decayBaseRate / Math.sqrt(Math.max(count, 1)));

            // 时间衰减
            const timeDecay = Math.exp(-decayRate * daysSinceLast);

            return _clamp(freqBase * timeDecay, 0, KEYWORD_INDEX_CONFIG.strengthCap);
        },

        /**
         * 获取某关键词的时间描述（对接 perception 体系）
         * @param {object} entry - 关键词索引条目
         * @returns {string} 人类可读的时间描述
         */
        getTimeDescription(entry) {
            if (!entry) return '';
            const s = _getStore();
            const perception = s && s.perception;
            const percEnabled = perception && perception.master;

            const count = entry.mentionCount || 0;
            const firstAt = entry.firstMentionAt;
            const lastAt = entry.lastMentionAt;

            if (!percEnabled) {
                // 时间感知关闭：模糊描述
                if (count === 0) return '';
                if (count === 1) return '提过一次';
                if (count <= 3) return '提过几次';
                if (count <= 6) return '经常提起';
                return '反复提起很多次';
            }

            // 时间感知开启：用具体时间
            const useVirtualDate = percEnabled && perception.customDate && perception.dateVal;

            const formatDate = (ts) => {
                if (!ts) return '之前';
                if (useVirtualDate) {
                    // 虚拟时间模式：直接用虚拟日期（因为记忆时间戳是真实的，这里只能给模糊描述）
                    return perception.dateVal;
                }
                const d = new Date(ts);
                const month = d.getMonth() + 1;
                const day = d.getDate();
                return `${month}月${day}日`;
            };

            if (count === 0) return '';
            if (count === 1) {
                return `${formatDate(firstAt)}提过一次`;
            }

            const firstDesc = formatDate(firstAt);
            const lastDesc = formatDate(lastAt);
            if (count <= 3) {
                return `${firstDesc}第一次提起，共提过${count}次，最近一次${lastDesc}`;
            }
            return `${firstDesc}第一次提起，之后反复提了${count}次，最近一次${lastDesc}`;
        },

        /**
         * 获取某联系人中与上下文最相关的高强度关键词
         * @param {string} contactId
         * @param {string[]} contextKeywords - 当前上下文的关键词
         * @returns {Array<{keyword, strength, entry}>}
         */
        getRelevantStrongKeywords(contactId, contextKeywords) {
            const index = this.getIndex(contactId);
            if (!index || !contextKeywords || contextKeywords.length === 0) return [];

            const results = [];
            for (const ckw of contextKeywords) {
                const matchedKey = this._findMatchingKey(index, ckw);
                if (matchedKey) {
                    const entry = index[matchedKey];
                    const strength = this.calcStrength(entry);
                    if (strength > 0.1) {
                        results.push({ keyword: matchedKey, strength, entry });
                    }
                }
            }

            // 按强度排序
            results.sort((a, b) => b.strength - a.strength);
            return results;
        },

        /**
         * 计算某条记忆的关键词加权分（用于 Recall 评分）
         * 返回 1.0 ~ 1.5 的加权系数
         */
        getMemoryKeywordBoost(contactId, memory, contextKeywords) {
            if (!memory || !memory.keywords || !contextKeywords) return 1.0;
            const index = this.getIndex(contactId);
            if (!index) return 1.0;

            let maxStrength = 0;
            for (const mkw of memory.keywords) {
                const matchedKey = this._findMatchingKey(index, mkw);
                if (matchedKey) {
                    // 只有当上下文也包含这个关键词时才加权
                    const contextHit = contextKeywords.some(ckw =>
                        ckw === matchedKey || ckw.includes(matchedKey) || matchedKey.includes(ckw)
                    );
                    if (contextHit) {
                        const s = this.calcStrength(index[matchedKey]);
                        if (s > maxStrength) maxStrength = s;
                    }
                }
            }

            // 加权系数：1.0（无加成）到 1.5（最大加成）
            return 1.0 + maxStrength * 0.5;
        },

        // ---- 内部方法 ----

        /**
         * 在索引中查找匹配的key（精确 + 子串）
         */
        _findMatchingKey(index, keyword) {
            if (!index || !keyword) return null;
            // 精确匹配
            if (index[keyword]) return keyword;
            // 子串匹配（当前关键词包含索引中的词，或被包含）
            for (const key of Object.keys(index)) {
                if (key.length >= 2 && keyword.length >= 2) {
                    if (key.includes(keyword) || keyword.includes(key)) {
                        return key;
                    }
                }
            }
            return null;
        },

        /**
         * 查找包含某关键词的已有记忆ID
         */
        _findLinkedMemories(contactId, keyword) {
            const allMems = MemoryStore.getAllActive(contactId);
            const linked = [];
            for (const m of allMems) {
                if (m.keywords && m.keywords.some(k => k === keyword || k.includes(keyword) || keyword.includes(k))) {
                    linked.push(m.id);
                }
                if (m.content && m.content.includes(keyword)) {
                    if (!linked.includes(m.id)) linked.push(m.id);
                }
                if (linked.length >= 10) break; // 限制关联数
            }
            return linked;
        },

        /**
         * 强化关联记忆的 strength 和 accessCount
         */
        _reinforceLinkedMemories(contactId, kwEntry) {
            if (!kwEntry || !kwEntry.linkedMemoryIds) return;
            const count = kwEntry.mentionCount || 1;
            // 强化力度随提及次数递减（避免过度强化）
            const reinforceAmount = Math.max(0.02, 0.05 / Math.sqrt(count));

            for (const memId of kwEntry.linkedMemoryIds) {
                const found = MemoryStore.findById(contactId, memId);
                if (found && found.memory) {
                    const m = found.memory;
                    m.lastAccessedAt = _now();
                    m.accessCount = (m.accessCount || 0) + 1;
                    m.strength = _clamp((m.strength || 0.5) + reinforceAmount, 0, 1);
                    m.reinforceCount = (m.reinforceCount || 0) + 1;
                }
            }
        },

        /**
         * 容量控制：超出上限时移除最弱的关键词
         */
        _enforceCapacity(index) {
            const keys = Object.keys(index);
            if (keys.length <= KEYWORD_INDEX_CONFIG.maxKeywordsPerContact) return;

            // 按强度排序，保留强的
            const entries = keys.map(k => ({ key: k, strength: this.calcStrength(index[k]) }));
            entries.sort((a, b) => b.strength - a.strength);

            const toRemove = entries.slice(KEYWORD_INDEX_CONFIG.maxKeywordsPerContact);
            for (const item of toRemove) {
                delete index[item.key];
            }
        }
    };

    // ==================== 联想检索 ====================
    const MemoryRecall = {
        /**
         * 根据当前上下文联想检索相关记忆
         * @param {string} contactId
         * @param {string|string[]} context - 当前对话内容（单条或多条）
         * @param {object} options - { maxResults, includeArchive, minRelevance, forAssociative }
         * @returns {Array} 按相关性排序的记忆列表
         */
        recall(contactId, context, options) {
            options = options || {};
            const maxResults = options.maxResults || 10;
            const minRelevance = options.minRelevance !== undefined ? options.minRelevance : 0.15;

            const c = MemoryStore.getContactMem(contactId);
            if (!c) return [];

            // 触发维护（有频率限制，内部会跳过）
            MemoryDecay.maintain(contactId);

            // 提取上下文关键词
            const contextText = Array.isArray(context) ? context.join(' ') : (context || '');
            const contextKeywords = MemoryKeywords.extract(contextText, 12);

            // 收集候选记忆（不含archive，除非options.includeArchive）
            const candidates = [...c.core, ...c.long, ...c.short];
            if (options.includeArchive) candidates.push(...c.archive);

            // [FIX-串记忆v4] 过滤越界泄漏的记忆：
            // 默认严格模式：直接剔除 crossContactLeak=true 的记忆，防止A联系人看到B的私事
            // 传 strictCrossFilter=false 可降级为降权模式（不推荐）
            const _strictCrossFilter = options.strictCrossFilter !== false;
            const _filteredCandidates = _strictCrossFilter
                ? candidates.filter(m => !m.crossContactLeak)
                : candidates;

            // 评分（加入关键词索引强度加权）
            const scored = _filteredCandidates.map(m => {
                const strength = MemoryDecay.calculateStrength(m);
                const relevance = this._calcRelevance(m, contextKeywords, contextText);
                const tierW = TIER_CONFIG[m.tier] ? TIER_CONFIG[m.tier].tierWeight : 0.6;
                const emotionBoost = 1 + (m.emotionScore || 0) * 0.2;
                // [FIX-串记忆v4] 即使非严格模式，越界记忆也大幅降权
                const leakPenalty = m.crossContactLeak ? 0.15 : 1.0;
                // [关键词索引加权] 用户反复提及的关键词关联的记忆优先召回
                const kwBoost = KeywordMemoryIndex.getMemoryKeywordBoost(contactId, m, contextKeywords);
                const finalScore = relevance * strength * tierW * emotionBoost * leakPenalty * kwBoost;
                return { memory: m, relevance, strength, finalScore, kwBoost };
            });

            // 1. 核心记忆保底：至少注入最近创建的 min(3, coreCount) 条（即使相关性低）
            // [FIX-串记忆v4] 核心记忆也要过滤越界泄漏的
            const coreMustInclude = c.core
                .filter(m => !m.crossContactLeak)
                .slice()
                .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                .slice(0, Math.min(3, c.core.length));
            const coreIds = new Set(coreMustInclude.map(m => m.id));

            // 2. 其他按finalScore排序，取相关性达标的
            const others = scored
                .filter(s => !coreIds.has(s.memory.id))
                .filter(s => s.relevance >= minRelevance)
                .sort((a, b) => b.finalScore - a.finalScore);

            const result = [
                ...coreMustInclude.map(m => ({
                    memory: m,
                    relevance: 1.0,
                    strength: 1.0,
                    finalScore: 999,
                    coreForced: true
                })),
                ...others
            ].slice(0, maxResults);

            // 3. 被召回的记忆触发强化
            if (options.reinforce !== false) {
                result.forEach(r => MemoryDecay.reinforce(contactId, r.memory.id));
            }

            return result;
        },

        /**
         * 计算相关性（关键词 + 实体 + 内容模糊）
         */
        _calcRelevance(memory, contextKeywords, contextText) {
            const memKw = memory.keywords || [];
            const memEntities = memory.entities || [];
            const memContent = (memory.content || '').toLowerCase();

            let score = 0;

            // 关键词匹配
            const kwOverlap = MemoryKeywords.overlap(contextKeywords, memKw);
            score += kwOverlap * 0.5;

            // 实体匹配（权重更高）
            for (const entity of memEntities) {
                if (contextText && contextText.includes(entity)) {
                    score += 0.25;
                }
            }

            // 内容直接匹配关键词
            for (const kw of contextKeywords) {
                if (kw.length >= 2 && memContent.includes(kw)) {
                    score += 0.1;
                }
            }

            return _clamp(score, 0, 1);
        },

        /**
         * 生成注入 prompt 的自然语言文本
         * @param {string} contactId
         * @param {string} context - 当前对话内容
         * @param {object} options - { userName, maxResults, compact }
         * @returns {string}
         */
        buildMemoryPrompt(contactId, context, options) {
            options = options || {};
            const userName = options.userName || '对方';
            const recalled = this.recall(contactId, context, {
                maxResults: options.maxResults || 10,
                minRelevance: options.minRelevance,
                reinforce: options.reinforce
            });

            if (recalled.length === 0) return '';

            // [FIX-串记忆v5] 最终安全网：对召回的记忆做运行时内容检查，
            // 过滤掉包含其他联系人名字/备注名的记忆（兜底旧数据没有 crossContactLeak 标记的情况）
            // v5: 对名字相似的联系人（互为子串），先替换当前联系人名字再检测，避免误杀
            let _safeRecalled = recalled;
            try {
                const _s = typeof store !== 'undefined' ? store : (_getStore());
                if (_s && _s.contacts) {
                    // 当前联系人的名字变体
                    const _curContact = _s.contacts.find(c => c && c.id === contactId);
                    const _selfNames = new Set();
                    if (_curContact) {
                        if (_curContact.name) _selfNames.add(_curContact.name);
                        if (_curContact.remark && _curContact.remark !== _curContact.name) _selfNames.add(_curContact.remark);
                    }

                    // 收集其他联系人名字，标记是否与当前联系人名字相似
                    const _otherNameMap = new Map();
                    _s.contacts.forEach(oc => {
                        if (!oc || oc.isGroup || oc.id === contactId) return;
                        const names = [];
                        if (oc.name && oc.name.length >= 2) names.push(oc.name);
                        if (oc.remark && oc.remark.length >= 2 && oc.remark !== oc.name) names.push(oc.remark);
                        names.forEach(nm => {
                            let isSimilar = false;
                            for (const selfNm of _selfNames) {
                                if (selfNm.includes(nm) || nm.includes(selfNm)) { isSimilar = true; break; }
                            }
                            _otherNameMap.set(nm, isSimilar);
                        });
                    });

                    if (_otherNameMap.size > 0) {
                        _safeRecalled = recalled.filter(r => {
                            const txt = r.memory.content || '';
                            for (const [nm, isSimilar] of _otherNameMap) {
                                if (isSimilar) {
                                    // 先替换当前联系人名字再检测
                                    let cleaned = txt;
                                    for (const selfNm of _selfNames) {
                                        cleaned = cleaned.split(selfNm).join('');
                                    }
                                    if (cleaned.includes(nm)) return false;
                                } else {
                                    if (txt.includes(nm)) return false;
                                }
                            }
                            return true;
                        });
                    }
                }
            } catch(_e) {}
            if (_safeRecalled.length === 0) return '';

            // 按层级分组
            const byTier = { core: [], long: [], short: [] };
            _safeRecalled.forEach(r => {
                const t = r.memory.tier;
                if (byTier[t]) byTier[t].push(r);
            });

            // [关键词时间感知] 获取关键词索引，用于生成时间描述
            const _kwIndex = KeywordMemoryIndex.getIndex(contactId);

            // [FIX-记忆重构v3] 生成记忆条目的时间标注——优先使用事件时间
            const _buildTimeTag = (memory) => {
                // 优先使用 AI 生成的时间描述
                if (memory.timeDescription) return `（${memory.timeDescription}）`;
                // 优先使用事件时间范围
                const eventTs = (memory.eventTimeRange && memory.eventTimeRange.start) || null;
                if (eventTs) return this._formatMemoryTime(eventTs);
                // 其次尝试关键词索引时间
                if (memory.keywords && memory.keywords.length > 0) {
                    let bestEntry = null;
                    let bestStrength = 0;
                    for (const kw of memory.keywords) {
                        const matchedKey = KeywordMemoryIndex._findMatchingKey(_kwIndex, kw);
                        if (matchedKey && _kwIndex[matchedKey]) {
                            const entry = _kwIndex[matchedKey];
                            const s = KeywordMemoryIndex.calcStrength(entry);
                            if (s > bestStrength && (entry.mentionCount || 0) > 0) {
                                bestStrength = s;
                                bestEntry = entry;
                            }
                        }
                    }
                    if (bestEntry) {
                        const timeDesc = KeywordMemoryIndex.getTimeDescription(bestEntry);
                        if (timeDesc) return `（${timeDesc}）`;
                    }
                }
                // 兜底：用创建时间
                return this._formatMemoryTime(memory.createdAt);
            };

            const lines = [];

            if (byTier.core.length > 0) {
                lines.push('【刻在我心里的事】');
                byTier.core.forEach(r => {
                    const timeTag = _buildTimeTag(r.memory);
                    lines.push('- ' + _sanitizeText((r.memory.content || '').substring(0, 400)) + timeTag);
                });
            }

            if (byTier.long.length > 0) {
                lines.push((byTier.core.length > 0 ? '\n' : '') + '【我记得很清楚的事】');
                byTier.long.forEach(r => {
                    const prefix = r.memory.fictional ? '[虚构] ' : '';
                    const timeTag = _buildTimeTag(r.memory);
                    lines.push('- ' + prefix + _sanitizeText((r.memory.content || '').substring(0, 300)) + timeTag);
                });
            }

            if (byTier.short.length > 0) {
                lines.push((lines.length > 0 ? '\n' : '') + '【最近的印象】');
                byTier.short.forEach(r => {
                    const prefix = r.memory.fictional ? '[虚构] ' : '';
                    const strengthTag = r.strength < 0.4 ? '(有点模糊了)' : '';
                    const timeTag = _buildTimeTag(r.memory);
                    lines.push('- ' + prefix + _sanitizeText((r.memory.content || '').substring(0, 250)) + timeTag + strengthTag);
                });
            }

            const body = lines.join('\n');
            if (options.compact) return body;

            return `我和${userName}之间的回忆：

${body}

刻在心里的事我永远记得，最近的事印象鲜明，有点模糊的是快要忘了的——这很正常。话题相关时自然提起就好。`;
        },

        /**
         * [FIX-记忆重构v3] 格式化记忆时间——始终输出时间标注，不再依赖 perception 开关
         * 解决：角色分不清记忆时间点的问题
         * @param {number} timestamp - 优先传入事件时间，其次创建时间
         */
        _formatMemoryTime(timestamp) {
            if (!timestamp) return '';

            const s = _getStore();
            const perception = s && s.perception;
            const percEnabled = perception && perception.master;
            const useVirtualDate = percEnabled && perception.customDate && perception.dateVal;

            // [FIX-记忆时间戳] 始终带上年月日精确日期，防止联系人记忆混乱
            const d = new Date(timestamp);
            const now = new Date();
            const daysDiff = Math.floor((now - d) / 86400000);
            const month = d.getMonth() + 1;
            const day = d.getDate();
            const year = d.getFullYear();
            const dateStr = year === now.getFullYear() ? `${month}月${day}日` : `${year}年${month}月${day}日`;

            // 相对描述 + 精确日期，双重标注
            if (daysDiff <= 0) return `（${dateStr}/今天）`;
            if (daysDiff === 1) return `（${dateStr}/昨天）`;
            if (daysDiff === 2) return `（${dateStr}/前天）`;
            if (daysDiff <= 7) return `（${dateStr}/${daysDiff}天前）`;

            // 虚拟时间模式：也带上精确日期，但额外加模糊描述
            if (useVirtualDate) {
                if (daysDiff <= 30) return `（${dateStr}/大约${Math.ceil(daysDiff / 7)}周前）`;
                if (daysDiff <= 90) return `（${dateStr}/大约${Math.ceil(daysDiff / 30)}个月前）`;
                return `（${dateStr}/较早前）`;
            }

            // 正常模式：精确日期
            return `（${dateStr}）`;
        }
    };

    // ==================== 数据迁移 ====================
    const MemoryMigration = {
        /**
         * 从旧 store.memorySummaries 迁移到新 store.memorySystem
         */
        migrateFromLegacy() {
            const s = _getStore();
            if (!s) return false;

            const sys = MemoryStore.init();

            // 如果已经迁移过（有数据且版本>=2），跳过
            if (sys.version >= MEMORY_VERSION && Object.keys(sys.contacts).length > 0) {
                return false;
            }

            const legacy = s.memorySummaries || {};
            let migratedCount = 0;

            Object.entries(legacy).forEach(([contactId, memos]) => {
                if (!Array.isArray(memos) || memos.length === 0) return;

                memos.forEach(memo => {
                    if (!memo || !memo.content) return;

                    // 情感分析
                    const emotion = MemoryEmotion.analyze(memo.content);
                    // 关键词提取
                    const keywords = MemoryKeywords.extract(memo.content, 6);

                    const newMemo = {
                        id: memo.id || _uid('mem_'),
                        contactId: contactId,
                        content: memo.content,
                        keywords: keywords,
                        entities: [],
                        tier: 'long',
                        createdAt: memo.date || _now(),
                        lastAccessedAt: memo.date || _now(),
                        accessCount: 1,
                        emotionScore: emotion.score,
                        emotionType: emotion.type,
                        isCoreEvent: emotion.isCoreEvent,
                        source: 'unified',
                        sourceDetail: {
                            channel: memo.source || 'chat',
                            scene: this._sourceToScene(memo.source)
                        },
                        strength: 0.7,
                        reinforceCount: 0,
                        fictional: !!memo.fictional,
                        pinned: false,
                        tags: [],
                        _migrated: true
                    };

                    // 核心事件直接晋升到core
                    if (emotion.isCoreEvent && emotion.score >= 0.8) {
                        newMemo.tier = 'core';
                        newMemo.strength = 1.0;
                    }

                    MemoryStore.addMemory(contactId, newMemo, newMemo.tier);
                    migratedCount++;
                });
            });

            sys.version = MEMORY_VERSION;
            console.log(`[MemorySystem] Migrated ${migratedCount} memories from legacy store`);
            _safeSave();
            return true;
        },

        _sourceToScene(source) {
            const map = {
                'online': '微信聊天',
                'offline': '线下见面',
                'voice_call': '语音通话',
                'video_call': '视频通话',
                'call_summary': '通话总结',
                'manual': '手动记录',
                'mail': '邮件往来',
                'forum': '论坛互动',
                'moment': '朋友圈'
            };
            return map[source] || '聊天';
        },

        /**
         * 同步新系统回旧结构（向后兼容：让旧代码能继续读 memorySummaries）
         */
        syncToLegacyStore() {
            const s = _getStore();
            if (!s) return;
            const sys = s.memorySystem;
            if (!sys || !sys.contacts) return;

            s.memorySummaries = s.memorySummaries || {};

            Object.entries(sys.contacts).forEach(([contactId, cm]) => {
                // [FIX-记忆丢失] 归档记忆也要同步到旧结构，否则衰减后记忆从memorySummaries消失
                const active = [...cm.core, ...cm.long, ...cm.short, ...cm.archive];
                const synced = active.map(m => ({
                    id: m.id,
                    // [FIX-时间戳v5] 优先使用事件时间范围（对话实际发生时间），而非createdAt（总结时间）
                    // 解决：21号聊天22号总结，记忆时间戳全显示22号的问题
                    date: (m.eventTimeRange && m.eventTimeRange.start && m.eventTimeRange.start > 0) ? m.eventTimeRange.start : m.createdAt,
                    content: m.content,
                    source: (m.sourceDetail && m.sourceDetail.channel) || 'chat',
                    fictional: !!m.fictional,
                    // [FIX-串记忆v4] 同步越界标记到旧结构，让 buildContactGlobalMemory 的过滤器能识别
                    crossContactLeak: !!m.crossContactLeak,
                    // 新增字段（旧代码会忽略，新代码可用）
                    tier: m.tier,
                    emotionScore: m.emotionScore,
                    strength: m.strength || MemoryDecay.calculateStrength(m)
                }));

                // [FIX-记忆丢失v2] 保留旧系统中标记为"待同步"的记忆（新系统不可用时的回退数据）
                // 防止新系统空数据覆盖旧系统中用户刚总结的记忆
                const existingLegacy = s.memorySummaries[contactId] || [];
                const syncedIds = new Set(synced.map(m => m.id));
                const pendingMemos = existingLegacy.filter(m =>
                    m && m._pendingSync && !syncedIds.has(m.id)
                );
                // [FIX-记忆丢失v2] 同时保留日程/课表等特殊条目（这些不属于对话记忆，不应被新系统同步覆盖）
                const specialMemos = existingLegacy.filter(m => {
                    if (!m || !m.content || syncedIds.has(m.id)) return false;
                    if (m._pendingSync) return false; // 已在pendingMemos中
                    if (m.content.indexOf('[日程:') >= 0) return true;
                    if (m.content.indexOf('[课表信息]') >= 0) return true;
                    if (m.id && (String(m.id).startsWith('sch_') || String(m.id).startsWith('tt_'))) return true;
                    return false;
                });

                s.memorySummaries[contactId] = [...synced, ...pendingMemos, ...specialMemos];
            });
        }
    };

    // ==================== 记忆生成管道 ====================
    const MemoryPipeline = {
        /**
         * 统一的记忆生成入口
         * @param {string} contactId
         * @param {Array} chatHistory - 对话记录
         * @param {object} options - { channel, userName, contactName, scene, silent }
         * @returns {Promise<object|null>} 新生成的记忆条目
         */
        async ingest(contactId, chatHistory, options) {
            options = options || {};
            if (!contactId || !chatHistory || chatHistory.length === 0) return null;

            const s = _getStore();
            if (!s) return null;

            const contactObj = (s.contacts || []).find(c => c.id === contactId) || {};
            const contactName = options.contactName || contactObj.name || '对方';
            const userName = options.userName
                || (typeof global.getUserPersonaName === 'function'
                    ? global.getUserPersonaName(contactObj, (s.user && s.user.name) || '用户')
                    : ((s.user && s.user.name) || '用户'));
            const channel = options.channel || 'chat';

            // [FIX-群聊记忆视角] 群聊用第三人称+成员实名，私聊保持第一人称
            const isGroup = !!contactObj.isGroup;
            let memberNames = [];
            if (isGroup && Array.isArray(contactObj.members)) {
                memberNames = contactObj.members
                    .map(mid => {
                        const mc = (s.contacts || []).find(c => c.id === mid);
                        return mc ? mc.name : '';
                    })
                    .filter(Boolean);
            }

            // [FIX-记忆重构v3] 提取对话的事件时间范围（而非总结时间）
            const eventTimeRange = this._extractEventTimeRange(chatHistory);

            // 格式化历史（群聊使用成员实名，私聊保留 我/userName）
            const historyText = this._formatHistory(chatHistory, userName, channel, {
                isGroup: isGroup,
                store: s
            });

            // 检测虚构内容
            const isFictional = this._detectFictional(chatHistory);

            // [FIX-串记忆v5] 收集与当前联系人名字相似的其他联系人名字，传给prompt做区分警告
            let _similarNames = [];
            try {
                const _selfNames = [contactObj.name, contactObj.remark].filter(Boolean);
                (s.contacts || []).forEach(c => {
                    if (!c || c.isGroup || c.id === contactId) return;
                    const cNames = [c.name, c.remark].filter(n => n && n.length >= 2);
                    cNames.forEach(cn => {
                        for (const sn of _selfNames) {
                            if (sn && (sn.includes(cn) || cn.includes(sn))) {
                                _similarNames.push(cn);
                                break;
                            }
                        }
                    });
                });
            } catch(_e) {}

            // 调用AI生成摘要+元数据
            // [FIX-记忆重构v3] 传入事件时间范围供 prompt 注入时间上下文
            const sysPrompt = this._buildIngestPrompt(contactName, userName, channel, isFictional, _similarNames, {
                isGroup: isGroup,
                memberNames: memberNames,
                eventTimeRange: eventTimeRange
            });

            try {
                if (!global.API || typeof global.API.chatCompletion !== 'function') {
                    console.warn('[MemoryPipeline] API not available');
                    return null;
                }

                const data = await global.API.chatCompletion([
                    { role: 'system', content: sysPrompt },
                    { role: 'user', content: historyText }
                ], { scene: 'memory', silent: options.silent });

                let rawContent = (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
                if (!rawContent) return null;

                // 解析META
                const meta = MemoryEmotion.parseMetaFromAIResponse(rawContent);
                const cleanContent = MemoryEmotion.stripMeta(rawContent);

                // 如果AI没提供META，本地fallback分析
                const localEmotion = MemoryEmotion.analyze(cleanContent);
                const emotionScore = meta && typeof meta.emotion === 'number' ? meta.emotion : localEmotion.score;
                const emotionType = (meta && meta.type) || localEmotion.type;
                const isCoreEvent = meta && typeof meta.isCoreEvent === 'boolean' ? meta.isCoreEvent : localEmotion.isCoreEvent;
                const keywords = (meta && Array.isArray(meta.keywords) && meta.keywords.length > 0)
                    ? meta.keywords
                    : MemoryKeywords.extract(cleanContent, 6);
                const entities = (meta && Array.isArray(meta.entities)) ? meta.entities : [];

                // 决定初始层级
                let initialTier = 'short';
                if (isCoreEvent && emotionScore >= 0.8) initialTier = 'core';
                else if (emotionScore >= 0.75) initialTier = 'long';

                // [FIX-串记忆v5] 越界过滤：AI 生成的摘要如果提到了"其他联系人的名字或备注名"，
                // 则打标 crossContactLeak=true，后续 Recall/注入时会剔除。
                // v5: 增强名字相似联系人的检测——对互为子串的名字使用"排除当前联系人名后再检测"策略
                let _crossLeak = false;
                let _leakNames = [];
                try {
                    // 当前联系人的所有名字变体（name + remark）
                    const _selfNames = new Set();
                    if (contactObj.name) _selfNames.add(contactObj.name);
                    if (contactObj.remark && contactObj.remark !== contactObj.name) _selfNames.add(contactObj.remark);

                    // 收集所有其他联系人的名字+备注名，同时记录与当前联系人名字相似的（互为子串）
                    const _otherNameMap = new Map(); // name -> { exact: string, isSimilar: boolean }
                    (s.contacts || []).forEach(c => {
                        if (!c || c.isGroup || c.id === contactId) return;
                        const names = [];
                        if (c.name && c.name.length >= 2) names.push(c.name);
                        if (c.remark && c.remark.length >= 2 && c.remark !== c.name) names.push(c.remark);
                        names.forEach(nm => {
                            // 检测是否与当前联系人名字互为子串（名字相似）
                            let isSimilar = false;
                            for (const selfNm of _selfNames) {
                                if (selfNm.includes(nm) || nm.includes(selfNm)) {
                                    isSimilar = true;
                                    break;
                                }
                            }
                            _otherNameMap.set(nm, { exact: nm, isSimilar: isSimilar });
                        });
                    });

                    const _content = cleanContent || '';
                    for (const [_nm, _info] of _otherNameMap) {
                        if (_info.isSimilar) {
                            // [FIX-串记忆v5] 名字相似的联系人：先把当前联系人的名字替换掉再检测
                            // 例如当前联系人"小雨儿"，其他联系人"小雨"：
                            // 摘要中"小雨儿说..."→替换后"___说..."→不包含"小雨"→不误判
                            // 摘要中"小雨说..."→替换后"小雨说..."→包含"小雨"→正确标记越界
                            let _cleaned = _content;
                            for (const selfNm of _selfNames) {
                                // 用不可能匹配的占位符替换当前联系人名字
                                _cleaned = _cleaned.split(selfNm).join('___SELF___');
                            }
                            if (_cleaned.includes(_nm)) {
                                _crossLeak = true;
                                _leakNames.push(_nm);
                            }
                        } else {
                            // 普通检测：直接子串匹配
                            if (_content.includes(_nm)) {
                                _crossLeak = true;
                                _leakNames.push(_nm);
                            }
                        }
                        if (_leakNames.length >= 3) break;
                    }
                    if (_crossLeak) {
                        console.warn('[MemoryPipeline] 越界检测：摘要中提及其他联系人，打标 crossContactLeak。contactId=' + contactId + ' leak=' + _leakNames.join(','));
                    }
                } catch(_leakErr) {}

                const newMemo = {
                    id: _uid('mem_'),
                    contactId: contactId,
                    // [FIX-虚构记忆] 不在正文硬拼 [小剧场] 前缀，由 fictional 字段承担标注；
                    // 同时剥离 AI 可能遗留的前缀，统一来源
                    content: (cleanContent || '').replace(/^\s*\[(小剧场|虚构)\]\s*/g, ''),
                    // [FIX-串记忆v3] 越界标记，供 Recall 层决定是否降权/剔除
                    crossContactLeak: _crossLeak,
                    leakNames: _leakNames,
                    keywords: keywords,
                    entities: entities,
                    tier: initialTier,
                    // [FIX-时间戳v4] createdAt 使用事件发生时间而非总结时间
                    // 用户21号聊天、23号总结，createdAt 应该是21号
                    createdAt: (eventTimeRange && eventTimeRange.start && eventTimeRange.start < _now() - 60000) ? eventTimeRange.start : _now(),
                    summarizedAt: _now(),
                    lastAccessedAt: _now(),
                    accessCount: 1,
                    emotionScore: emotionScore,
                    emotionType: emotionType,
                    isCoreEvent: isCoreEvent,
                    source: 'unified',
                    sourceDetail: {
                        channel: channel,
                        scene: options.scene || MemoryMigration._sourceToScene(channel)
                    },
                    strength: 1.0,
                    reinforceCount: 0,
                    fictional: isFictional,
                    pinned: false,
                    tags: [],
                    // [FIX-记忆重构v3] 事件时间范围（对话实际发生时间）
                    eventTimeRange: eventTimeRange,
                    // [FIX-记忆重构v3] 参与者身份上下文
                    participants: {
                        user: {
                            displayName: userName,
                            identity: options.isAltPhone ? 'alt_phone' : 'main',
                            altPhoneNumber: options.altPhoneNumber || null
                        },
                        contact: {
                            displayName: contactName,
                            isGroup: isGroup
                        }
                    },
                    // [FIX-记忆重构v3] AI提取的时间描述 或 从META获取
                    timeDescription: (meta && meta.eventTime) || this._generateTimeDescription(eventTimeRange),
                    // [FIX-记忆重构v3] 摘要视角
                    perspective: isGroup ? 'observer' : 'first_person_contact'
                };

                MemoryStore.addMemory(contactId, newMemo, initialTier);
                // [关键词索引] 记忆生成后更新关键词索引
                try { KeywordMemoryIndex.onMemoryCreated(contactId, newMemo); } catch(_) {}
                // 维护（异步不阻塞）
                setTimeout(() => {
                    try { MemoryDecay.maintain(contactId); } catch(_) {}
                    try { MemoryMigration.syncToLegacyStore(); } catch(_) {}
                    // [PersonaBrain] 记忆生成后联动更新联系人心情
                    try {
                        if (global.PersonaBrain && global.PersonaBrain.State && emotionType) {
                            global.PersonaBrain.State.applyEmotion(contactId, emotionType, emotionScore);
                        }
                    } catch(_) {}
                    _safeSave();
                }, 100);

                return newMemo;
            } catch (e) {
                console.error('[MemoryPipeline] ingest failed:', e);
                return null;
            }
        },

        /**
         * 手动添加记忆（不调用AI）
         * [FIX-记忆重构v3] 新增 options.eventTime / options.isAltPhone / options.altPhoneNumber / options.participants
         */
        addManual(contactId, content, options) {
            options = options || {};
            if (!contactId || !content) return null;
            const emotion = MemoryEmotion.analyze(content);
            const keywords = MemoryKeywords.extract(content, 6);
            // [FIX-邮件记忆分类] 支持调用方传入 channel/scene 覆盖默认的"手动记录"
            const _channel = options.channel
                || (Array.isArray(options.tags) && options.tags.length > 0 ? options.tags[0] : null)
                || 'manual';
            const _scene = options.scene || MemoryMigration._sourceToScene(_channel) || '手动记录';
            // [FIX-记忆重构v3] 构建事件时间范围
            const _eventTs = options.eventTime || _now();
            const _eventTimeRange = options.eventTimeRange || { start: _eventTs, end: _eventTs };
            // [FIX-记忆重构v3] 构建参与者信息
            const _participants = options.participants || {
                user: {
                    displayName: options.userName || '用户',
                    identity: options.isAltPhone ? 'alt_phone' : 'main',
                    altPhoneNumber: options.altPhoneNumber || null
                },
                contact: { displayName: options.contactName || '对方', isGroup: false }
            };
            const memo = {
                id: _uid('mem_'),
                contactId: contactId,
                content: content,
                keywords: keywords,
                entities: [],
                tier: options.tier || (emotion.isCoreEvent ? 'core' : 'long'),
                // [FIX-时间戳v4] 手动添加的记忆也优先使用事件时间
                createdAt: (_eventTimeRange.start && _eventTimeRange.start < _now() - 60000) ? _eventTimeRange.start : _now(),
                summarizedAt: _now(),
                lastAccessedAt: _now(),
                accessCount: 1,
                emotionScore: emotion.score,
                emotionType: emotion.type,
                isCoreEvent: emotion.isCoreEvent,
                source: 'unified',
                sourceDetail: { channel: _channel, scene: _scene },
                strength: 1.0,
                reinforceCount: 0,
                fictional: !!options.fictional,
                pinned: !!options.pinned,
                tags: options.tags || [],
                // [FIX-记忆重构v3] 新增字段
                eventTimeRange: _eventTimeRange,
                participants: _participants,
                timeDescription: options.timeDescription || this._generateTimeDescription(_eventTimeRange),
                perspective: options.perspective || 'first_person_contact'
            };
            MemoryStore.addMemory(contactId, memo, memo.tier);
            // [关键词索引] 手动添加记忆也更新关键词索引
            try { KeywordMemoryIndex.onMemoryCreated(contactId, memo); } catch(_) {}
            MemoryMigration.syncToLegacyStore();
            _safeSave();
            return memo;
        },

        // ==================== [FIX-记忆重构v3] 新增工具方法 ====================

        /**
         * 从对话历史中提取事件时间范围（对话实际发生时间）
         * 解决：createdAt 是总结时间，不是事件时间的问题
         */
        _extractEventTimeRange(chatHistory) {
            let earliest = Infinity, latest = 0;
            if (chatHistory && chatHistory.length > 0) {
                chatHistory.forEach(m => {
                    const t = m.timestamp || m.time || m.date || m.t || 0;
                    if (t && t > 0) {
                        if (t < earliest) earliest = t;
                        if (t > latest) latest = t;
                    }
                });
            }
            if (earliest === Infinity) earliest = _now();
            if (latest === 0) latest = _now();
            return { start: earliest, end: latest };
        },

        /**
         * 生成人类可读的时间描述
         */
        _generateTimeDescription(eventTimeRange) {
            if (!eventTimeRange || !eventTimeRange.start) return '';
            const d = new Date(eventTimeRange.start);
            const now = new Date();
            const daysDiff = Math.floor((now - d) / 86400000);

            if (daysDiff <= 0) return '今天';
            if (daysDiff === 1) return '昨天';
            if (daysDiff === 2) return '前天';
            if (daysDiff <= 7) return `${daysDiff}天前`;
            if (daysDiff <= 30) return `大约${Math.ceil(daysDiff / 7)}周前`;

            const m = d.getMonth() + 1, day = d.getDate();
            if (d.getFullYear() === now.getFullYear()) return `${m}月${day}日`;
            return `${d.getFullYear()}年${m}月${day}日`;
        },

        // [FIX-虚构记忆-检测收紧] 旧实现对线下长叙事文本极易误判（"假装/扮演/出戏"等
        // 都是叙事常用词），导致线下见面总结几乎必被标为虚构。新实现：
        //   1) 强指令类关键词：只在前若干条用户消息中匹配（用户开场声明才算真指令）
        //   2) 弱关键词：需全文命中 ≥2 种不同短语才算虚构（避免孤例触发）
        _detectFictional(chatHistory) {
            if (!chatHistory || chatHistory.length === 0) return false;
            const strongCommandKeywords = [
                '小剧场', '剧场模式', '开始剧场', '开始表演', '开始小剧场',
                '角色扮演', '我们来角色扮演', '来演一个', '来演一下',
                '你来演一个', '你来演一下', '我们来演', '你扮演一个', '我扮演一个',
                '情景模拟', '场景模拟'
            ];
            const weakKeywords = [
                '虚构', '设定是', '背景设定', '故事设定', '这是假的', '只是虚构'
            ];
            const getText = (m) => (typeof m.content === 'string') ? m.content : '';

            // 强信号：仅扫描前 6 条用户消息（开场指令）
            const firstUserMsgs = chatHistory
                .filter(m => m && (m.sender === 'me' || m.sender === 'user'))
                .slice(0, 6)
                .map(getText)
                .join(' ');
            for (const kw of strongCommandKeywords) {
                if (firstUserMsgs.includes(kw)) return true;
            }

            // 弱信号 + 阈值：≥2 种不同弱关键词才算
            const fullText = chatHistory.map(getText).join(' ');
            let weakHits = 0;
            for (const kw of weakKeywords) {
                if (fullText.includes(kw)) weakHits++;
                if (weakHits >= 2) return true;
            }
            return false;
        },

        _formatHistory(chatHistory, userName, channel, opts) {
            opts = opts || {};
            const isGroup = !!opts.isGroup;
            const store = opts.store || _getStore();
            return chatHistory.map(m => {
                // 通话记录：直接用 content
                if (channel === 'call' || m.sender === 'call_record') {
                    return m.content || '';
                }

                let sender;
                // [FIX-群聊记忆视角] 群聊里每条消息用成员实名前缀，
                // 用户消息使用 userName，避免 AI 把"我"当成单一发言人。
                if (isGroup) {
                    if (m.sender === 'me' || m.sender === 'user') {
                        sender = userName;
                    } else {
                        const _mc = store && store.contacts
                            ? store.contacts.find(c => c.id === m.sender)
                            : null;
                        sender = m.goSenderName || m.memberName || (_mc ? _mc.name : (m.sender || '群成员'));
                    }
                } else if (channel === 'offline') {
                    sender = (m.sender === 'user' || m.sender === 'me') ? userName : '我';
                } else {
                    sender = m.sender === 'me' ? userName : '我';
                }
                const text = typeof m.content === 'string'
                    ? m.content.replace(/\[HEARTBEAT:[^\]]*\]/g, '').trim()
                    : (m.textVal || m.type || '');
                return `${sender}: ${text}`;
            }).filter(s => s.length > 2).join('\n');
        },

        _buildIngestPrompt(contactName, userName, channel, isFictional, similarNames, opts) {
            opts = opts || {};
            const isGroup = !!opts.isGroup;
            const memberNames = Array.isArray(opts.memberNames) ? opts.memberNames : [];

            const sceneDesc = {
                'chat': '线上聊天',
                'online': '线上聊天',
                'offline': '线下见面',
                'call': '语音/视频通话',
                'voice_call': '语音通话',
                'video_call': '视频通话'
            }[channel] || '聊天';

            // [FIX-记忆重构v3] 时间上下文注入
            let timeContextHint = '';
            if (opts.eventTimeRange && opts.eventTimeRange.start) {
                const d = new Date(opts.eventTimeRange.start);
                const dEnd = opts.eventTimeRange.end ? new Date(opts.eventTimeRange.end) : d;
                const dateStr = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
                const isSameDay = d.toDateString() === dEnd.toDateString();
                timeContextHint = isSameDay
                    ? `\n📅 这段对话发生在：${dateStr}。请在摘要中适当体现时间信息（如"X月X日…"），帮助后续回忆时定位时间。`
                    : `\n📅 这段对话发生在：${dateStr} 至 ${dEnd.getFullYear()}年${dEnd.getMonth() + 1}月${dEnd.getDate()}日。请在摘要中适当体现时间信息。`;
            }

            // [FIX-虚构记忆] 由 memo.fictional 字段承担标注，不再让AI在正文加前缀
            const fictionalHint = isFictional
                ? '\n⚠️ 注意：这段对话包含小剧场/角色扮演/虚构内容。请在摘要中明确指出哪些人名、情节是虚构的扮演。不要在开头加任何标签前缀。'
                : '';

            // [FIX-串记忆v5] 如果存在名字相似的联系人，在prompt中明确警告AI区分
            let similarNameWarning = '';
            if (similarNames && similarNames.length > 0) {
                if (isGroup) {
                    similarNameWarning = `\n\n🚫 严重警告——身份区分：存在名字相似的其他联系人：${similarNames.map(n => '"' + n + '"').join('、')}。
这段对话发生在群聊"${contactName}"中。你必须：
- 只总结这段群聊中实际发生的内容，不要混入其他联系人的信息
- 如果对话中没有提到上述相似名字的人，摘要中绝对不能出现他们的名字
- 如果对话中确实提到了上述名字，请用引号标注并注明"（对话中提及的第三方）"`;
                } else {
                    similarNameWarning = `\n\n🚫 严重警告——身份区分：你有名字相似的其他联系人：${similarNames.map(n => '"' + n + '"').join('、')}。
这段对话只属于"${contactName}"和"${userName}"之间。你必须：
- 只总结这段对话中实际发生的内容，不要混入其他联系人的信息
- 摘要中只能出现"${contactName}"（用"我"代替）和"${userName}"这两个身份
- 如果对话中没有提到上述相似名字的人，摘要中绝对不能出现他们的名字
- 如果对话中确实提到了上述名字，请用引号标注并注明"（对话中提及的第三方）"`;
                }
            }

            // [FIX-记忆重构v3] META 模板（统一含 eventTime 字段）
            const metaTemplate = `
⚠️ 重要：在记忆摘要末尾，必须附加一段结构化元数据，格式如下：
<META>{"emotion": 0.7, "type": "joy", "keywords": ["关键词1","关键词2","关键词3"], "entities": ["人名/地名"], "isCoreEvent": false, "eventTime": "5月15日下午"}</META>

元数据字段说明：
- emotion: 情感强度 0-1（0=平淡，0.5=普通，0.8=强烈，1.0=刻骨铭心）
- type: joy(开心)/sadness(难过)/anger(生气)/surprise(惊讶)/fear(害怕)/love(喜爱)/neutral(中性)
- keywords: 3-6个关键词（用于联想检索，选最能代表这段记忆的词）
- entities: 提到的人名/地名/物品名/宠物名（如"小橘"、"北京"）
- isCoreEvent: 是否为关系定义性事件（表白/分手/重大承诺/重大冲突）true/false
- eventTime: 对话中提到或可推断的事件时间描述（如"周末""下午三点""5月15号"），没有则留空字符串`;

            // [FIX-群聊记忆视角] 群聊统一第三人称旁观者视角，避免成员记忆串味
            if (isGroup) {
                const _members = memberNames.length > 0 ? memberNames.join('、') : '若干成员';
                return `你是一个客观的第三人称记录者。请根据以下群聊"${contactName}"（成员：${userName}、${_members}）的${sceneDesc}对话记录，以第三人称旁观者视角提取关键信息生成记忆条目。${timeContextHint}

要求：
1. ⚠️ 严格使用第三人称——用每个人的名字称呼他们（如"${userName}"、各成员名），绝对不要用"我"
2. 不要把任何一个成员当作发言主体，你是旁观者，不是参与者
3. 重点提取（按优先级）：
   a) 各成员提到的个人信息（工作、学校、家庭、宠物、住址等）
   b) 成员间的互动和关系变化
   c) 群里达成的重要约定、承诺、计划
   d) 关系变化、情感转折点、争吵/和好
   e) 提到的具体人名、地名、时间点
   f) 各成员分享的具体经历、故事、近况
4. 不要泛泛而谈，要提取具体事实。好的例子："${userName}告诉大家ta养了一只叫小橘的猫"、"小明说下周二要去北京出差"、"群里约好周末一起去西湖玩"
5. 坏的例子（禁止）："大家聊了很多"、"群里讨论了近况"、"气氛很好"，以及任何用"我"作为主语的句子
6. 如果对话中提到了时间线索（什么时候发生的事、约的什么时间），务必在摘要中保留
7. 150-300字，尽可能多地提取具体信息点，用分号分隔多个要点${fictionalHint}${similarNameWarning}
${metaTemplate}
示例输出（注意：全程第三人称，不出现"我"）：
${userName}告诉群里ta养了一只叫小橘的橘猫；小明说自己最讨厌吃香菜；群里约好周末一起去西湖玩；小红和小明因为话题A产生了争论后又和好。
<META>{"emotion": 0.6, "type": "joy", "keywords": ["小橘","香菜","西湖","约定","和好"], "entities": ["小橘","西湖"], "isCoreEvent": false, "eventTime": ""}</META>`;
            }

            return `你是${contactName}，请以你（${contactName}）的第一人称视角，根据以下${sceneDesc}的对话记录提取关键信息生成记忆条目。${timeContextHint}

要求：
1. 用"我"称呼自己（${contactName}），用"${userName}"称呼对方
2. 重点提取（按优先级）：
   a) ${userName}提到的个人信息（名字、年龄、工作、学校、家庭、宠物、住址等）
   b) ${userName}的偏好/习惯/喜好/讨厌的东西
   c) 你们之间的重要约定、承诺、计划
   d) 关系变化、情感转折点、吵架/和好
   e) 提到的具体人名、地名、时间点
   f) ${userName}分享的具体经历、故事、近况
3. 不要泛泛而谈，要提取具体事实。好的例子："${userName}告诉我ta养了一只叫小橘的猫"、"我跟${userName}说我下周二要去北京出差"
4. 坏的例子（禁止）："我们聊了很多"、"${userName}分享了近况"、"我们关系更好了"
5. 如果对话中提到了时间线索（什么时候发生的事、约的什么时间），务必在摘要中保留
6. 150-300字，用分号分隔多个要点${fictionalHint}${similarNameWarning}
${metaTemplate}
示例输出：
${userName}告诉我ta养了一只叫小橘的橘猫，3岁了很粘人；${userName}说最讨厌吃香菜，以后点外卖要避开；我们约好下周六一起去看电影。
<META>{"emotion": 0.6, "type": "joy", "keywords": ["小橘","猫","香菜","看电影","约定"], "entities": ["小橘"], "isCoreEvent": false, "eventTime": ""}</META>`;
        }
    };

    // ==================== 启动自检 & 兼容桥接 ====================
    const MemorySystem = {
        version: MEMORY_VERSION,
        Store: MemoryStore,
        Decay: MemoryDecay,
        Recall: MemoryRecall,
        Emotion: MemoryEmotion,
        Pipeline: MemoryPipeline,
        Migration: MemoryMigration,
        Keywords: MemoryKeywords,
        KeywordIndex: KeywordMemoryIndex,
        TIER_CONFIG: TIER_CONFIG,
        KEYWORD_INDEX_CONFIG: KEYWORD_INDEX_CONFIG,

        /**
         * 系统启动初始化（在 store 加载后调用）
         */
        boot() {
            try {
                const s = _getStore();
                if (!s) {
                    console.warn('[MemorySystem] store not ready, will retry');
                    return false;
                }
                MemoryStore.init();
                // 迁移旧数据
                const migrated = MemoryMigration.migrateFromLegacy();
                // [FIX-记忆重构v3] 升级已有V2记忆到V3（补充时间+身份字段）
                this._upgradeToV3(s);
                // [FIX-记忆丢失v3] boot完成后，补同步所有标记为_pendingSync的旧系统记忆
                this._syncPendingMemos(s);
                // 同步投影到旧结构（向后兼容）
                MemoryMigration.syncToLegacyStore();
                if (migrated) {
                    console.log('[MemorySystem] Boot complete with migration');
                }
                return true;
            } catch (e) {
                console.error('[MemorySystem] boot failed:', e);
                return false;
            }
        },

        /**
         * [FIX-记忆重构v3] 将已有V2记忆升级到V3——补充 eventTimeRange / participants / timeDescription
         */
        _upgradeToV3(s) {
            try {
                const sys = s.memorySystem;
                if (!sys || !sys.contacts) return;
                // 只在版本刚升级时执行一次
                if (sys._v3Upgraded) return;
                let upgraded = 0;
                Object.entries(sys.contacts).forEach(([contactId, cm]) => {
                    const contact = (s.contacts || []).find(c => c.id === contactId);
                    const contactName = contact ? contact.name : '对方';
                    for (const tier of ['core', 'long', 'short', 'archive']) {
                        if (!cm[tier]) continue;
                        cm[tier].forEach(m => {
                            // 补充 eventTimeRange
                            if (!m.eventTimeRange) {
                                const ts = m.createdAt || _now();
                                m.eventTimeRange = { start: ts, end: ts };
                                upgraded++;
                            }
                            // 补充 participants
                            if (!m.participants) {
                                m.participants = {
                                    user: { displayName: '用户', identity: 'main', altPhoneNumber: null },
                                    contact: { displayName: contactName, isGroup: contact ? !!contact.isGroup : false }
                                };
                            }
                            // 补充 timeDescription
                            if (!m.timeDescription) {
                                m.timeDescription = '';
                            }
                            // 补充 perspective
                            if (!m.perspective) {
                                m.perspective = (contact && contact.isGroup) ? 'observer' : 'first_person_contact';
                            }
                        });
                    }
                });
                sys._v3Upgraded = true;
                if (upgraded > 0) {
                    console.log(`[MemorySystem] V3升级：为 ${upgraded} 条旧记忆补充了时间和身份字段`);
                    _safeSave();
                }
            } catch (e) {
                console.warn('[MemorySystem] _upgradeToV3 failed:', e);
            }
        },

        /**
         * [FIX-记忆丢失v3] 补同步旧系统中标记为_pendingSync的记忆到新系统
         */
        _syncPendingMemos(s) {
            try {
                const legacy = s.memorySummaries || {};
                let syncedCount = 0;
                Object.entries(legacy).forEach(([contactId, memos]) => {
                    if (!Array.isArray(memos)) return;
                    memos.forEach(memo => {
                        if (!memo || !memo._pendingSync || !memo.content) return;
                        // 跳过日程/课表等特殊条目
                        if (memo.content.indexOf('[日程:') >= 0 || memo.content.indexOf('[课表信息]') >= 0) return;
                        if (memo.id && (String(memo.id).startsWith('sch_') || String(memo.id).startsWith('tt_'))) return;
                        // 检查新系统中是否已存在同ID记忆
                        const existing = MemoryStore.findById(contactId, memo.id);
                        if (existing) {
                            delete memo._pendingSync;
                            return;
                        }
                        // 写入新系统
                        const emotion = MemoryEmotion.analyze(memo.content);
                        const keywords = MemoryKeywords.extract(memo.content, 6);
                        const newMemo = {
                            id: memo.id || _uid('mem_'),
                            contactId: contactId,
                            content: memo.content,
                            keywords: keywords,
                            entities: [],
                            tier: emotion.isCoreEvent && emotion.score >= 0.8 ? 'core' : 'long',
                            createdAt: memo.date || _now(),
                            lastAccessedAt: memo.date || _now(),
                            accessCount: 1,
                            emotionScore: emotion.score,
                            emotionType: emotion.type,
                            isCoreEvent: emotion.isCoreEvent,
                            source: 'unified',
                            sourceDetail: { channel: memo.source || 'chat', scene: MemoryMigration._sourceToScene(memo.source) },
                            strength: 0.8,
                            reinforceCount: 0,
                            fictional: !!memo.fictional,
                            pinned: false,
                            tags: []
                        };
                        MemoryStore.addMemory(contactId, newMemo, newMemo.tier);
                        delete memo._pendingSync;
                        syncedCount++;
                    });
                });
                if (syncedCount > 0) {
                    console.log('[MemorySystem] 补同步了', syncedCount, '条pending记忆');
                    _safeSave();
                }
            } catch (e) {
                console.warn('[MemorySystem] _syncPendingMemos failed:', e);
            }
        },

        /**
         * 快速接口：获取某联系人所有活跃记忆（平铺格式，兼容旧代码）
         */
        getMemories(contactId) {
            return MemoryStore.getAllActive(contactId).map(m => ({
                id: m.id,
                date: m.createdAt,
                content: m.content,
                source: (m.sourceDetail && m.sourceDetail.channel) || 'chat',
                fictional: !!m.fictional,
                tier: m.tier,
                emotionScore: m.emotionScore,
                strength: MemoryDecay.calculateStrength(m)
            }));
        }
    };

    // 导出到全局
    global.MemorySystem = MemorySystem;

    // 自动启动（延迟到store可用时）
    function _tryBoot(retries) {
        retries = retries || 0;
        if (_getStore()) {
            MemorySystem.boot();
        } else if (retries < 50) {
            setTimeout(() => _tryBoot(retries + 1), 200);
        } else {
            console.warn('[MemorySystem] store never became available');
        }
    }
    if (typeof document !== 'undefined') {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setTimeout(_tryBoot, 100);
        } else {
            document.addEventListener('DOMContentLoaded', () => setTimeout(_tryBoot, 100));
        }
    }

})(typeof window !== 'undefined' ? window : this);
