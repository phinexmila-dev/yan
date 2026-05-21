// ========== STUDY APP MODULE ==========
// 学习中心：资料管理、复习计划、随堂测试、网课、聊天弹窗提问
(function(){
    'use strict';

    // ==================== 数据初始化 ====================
    function initStudyData() {
        if (!store.study) store.study = {};
        if (!store.study.materials) store.study.materials = [];
        if (!store.study.plans) store.study.plans = [];
        if (!store.study.quizHistory) store.study.quizHistory = [];
        if (!store.study.lectureHistory) store.study.lectureHistory = [];
        if (!store.study.lectureSessions) store.study.lectureSessions = [];
        if (!store.study.favorites) store.study.favorites = [];
        // 迁移旧 lectureHistory 到 lectureSessions
        if (store.study.lectureHistory.length > 0 && store.study.lectureSessions.length === 0) {
            store.study.lectureSessions = store.study.lectureHistory.map(h => ({
                id: h.id || ('ls_' + Date.now() + '_' + Math.random().toString(36).slice(2,5)),
                title: (h.teacherName || '未知') + '的课堂',
                teacherId: h.teacherId,
                teacherName: h.teacherName,
                teacherAvatar: h.teacherAvatar || '',
                materialId: h.materialId,
                materialName: h.materialName,
                messages: h.messages || [],
                currentSection: h.sectionsCompleted || 0,
                status: 'ended',
                createdAt: h.date || Date.now(),
                updatedAt: h.date || Date.now()
            }));
            save();
        }
        if (!store.study.settings) store.study.settings = {
            masterSwitch: false,
            popupInterval: 15,
            quizFrequency: 10,
            usePersona: true,
            pronunciation: false
        };
        if (!store.study.stats) store.study.stats = {
            totalQuizzes: 0,
            totalCorrect: 0,
            todayCompleted: 0,
            todayTotal: 0,
            todayQuizzes: 0,
            todayCorrect: 0,
            lastDate: ''
        };
        // 内置学习资料
        if (store.study.materials.length === 0) {
            loadBuiltinMaterials();
        }
    }

    // ==================== 内置学习资料 ====================
    function loadBuiltinMaterials() {
        const builtins = [
            {
                id: 'builtin_cet4_vocab',
                name: '四级高频词汇500',
                category: 'cet4',
                builtin: true,
                isEnglish: true,
                content: generateCET4Vocab(),
                addedTime: Date.now()
            },
            {
                id: 'builtin_cet6_vocab',
                name: '六级核心词汇300',
                category: 'cet6',
                builtin: true,
                isEnglish: true,
                content: generateCET6Vocab(),
                addedTime: Date.now()
            },
            {
                id: 'builtin_civil_common',
                name: '公务员常识判断精选',
                category: 'civil_national',
                builtin: true,
                isEnglish: false,
                content: generateCivilCommon(),
                addedTime: Date.now()
            },
            {
                id: 'builtin_civil_logic',
                name: '行测逻辑推理精练',
                category: 'civil_national',
                builtin: true,
                isEnglish: false,
                content: generateCivilLogic(),
                addedTime: Date.now()
            },
            {
                id: 'builtin_ncre_choice',
                name: '计算机二级选择题精选',
                category: 'ncre',
                builtin: true,
                isEnglish: false,
                content: generateNCREContent(),
                addedTime: Date.now()
            },
            {
                id: 'builtin_civil_provincial',
                name: '省考申论写作要点',
                category: 'civil_provincial',
                builtin: true,
                isEnglish: false,
                content: generateProvincialContent(),
                addedTime: Date.now()
            }
        ];
        store.study.materials = builtins;
    }

    function generateCET4Vocab() {
        return `abandon v. 放弃；抛弃
ability n. 能力；才能
abnormal adj. 异常的；不正常的
aboard prep. 在船/飞机/车上
abolish v. 废除；废止
absorb v. 吸收；吸引
abstract adj. 抽象的 n. 摘要
absurd adj. 荒谬的；可笑的
abundant adj. 丰富的；大量的
academic adj. 学术的；学院的
accelerate v. 加速；促进
access n. 接近；进入 v. 访问
accommodate v. 容纳；适应
accompany v. 陪伴；伴随
accomplish v. 完成；实现
account n. 账户；描述 v. 占比
accumulate v. 积累；聚集
accurate adj. 准确的；精确的
accuse v. 指控；指责
achieve v. 实现；达到
acknowledge v. 承认；感谢
acquire v. 获得；学到
adapt v. 适应；改编
adequate adj. 充足的；适当的
adjust v. 调整；适应
administration n. 管理；行政
admire v. 钦佩；赞赏
admit v. 承认；准许进入
adopt v. 采纳；收养
advance v. 前进；提高 n. 进展
advantage n. 优势；有利条件
adventure n. 冒险；奇遇
advertise v. 做广告；宣传
advocate v. 提倡；拥护
affect v. 影响；感动
afford v. 负担得起；提供
aggressive adj. 侵略性的；好斗的
agriculture n. 农业
alternative adj. 替代的 n. 选择
ambiguous adj. 模棱两可的
ambitious adj. 有雄心的
amount n. 数量；总额
analysis n. 分析
ancestor n. 祖先
annual adj. 年度的；每年的
anticipate v. 预期；期待
anxiety n. 焦虑；忧虑
apparent adj. 明显的；表面的
appeal v. 呼吁；吸引 n. 上诉
appetite n. 食欲；欲望
application n. 应用；申请
appreciate v. 欣赏；感激
approach v. 接近 n. 方法
appropriate adj. 适当的
approve v. 批准；赞同
arise v. 出现；产生
arrange v. 安排；整理
artificial adj. 人造的；虚伪的
aspect n. 方面；外观
assemble v. 集合；组装
assess v. 评估；评价
assign v. 分配；指定
assist v. 帮助；协助
associate v. 联系；交往
assume v. 假设；承担
assure v. 保证；使确信
atmosphere n. 大气；氛围
attach v. 附上；连接
attain v. 达到；获得
attempt v. 尝试 n. 企图
attitude n. 态度；看法
attribute v. 归因于 n. 属性
authority n. 权威；当局
available adj. 可用的；有空的
average adj. 平均的 n. 平均值
aware adj. 意识到的`;
    }

    function generateCET6Vocab() {
        return `abolish v. 彻底废除（法律、制度等）
absurd adj. 荒谬的，不合理的
accommodate v. 为…提供住宿；容纳；适应
accumulate v. 积累，积聚
acquaint v. 使熟悉，使了解
adequate adj. 足够的，胜任的
adhere v. 粘附；坚持
adjacent adj. 邻近的，毗邻的
advocate n. 提倡者 v. 提倡
aesthetic adj. 审美的，美学的
afflict v. 使苦恼，折磨
aggregate n. 总计 adj. 聚合的
agitate v. 搅动；激动；煽动
allegation n. 指控，断言
alleviate v. 减轻，缓和
allocate v. 分配，拨出
allusion n. 暗示，引用
ambiguity n. 模棱两可，歧义
amend v. 修正，修改
analogy n. 类比，相似
anonymous adj. 匿名的
apparatus n. 器械，仪器
append v. 附加，增补
appraisal n. 评价，估价
apt adj. 恰当的；易于…的
arbitrary adj. 任意的，专横的
articulate v. 清楚地表达 adj. 能说会道的
ascribe v. 归因于，归咎于
aspire v. 渴望，有志于
assert v. 断言，主张
asset n. 资产；有价值的东西
assimilate v. 吸收，同化
attain v. 达到，获得
attribute v. 把…归因于 n. 属性
audit n./v. 审计
authentic adj. 真实的，可靠的
authorize v. 授权，批准
autonomous adj. 自治的，自主的
avert v. 避开，防止
baffle v. 使困惑，难住`;
    }

    function generateCivilCommon() {
        return `Q: 中华人民共和国的根本制度是什么？
A: 社会主义制度

Q: 中华人民共和国的根本政治制度是什么？
A: 人民代表大会制度

Q: 我国的国家结构形式是什么？
A: 单一制

Q: 中国共产党的最高理想和最终目标是什么？
A: 实现共产主义

Q: "四个全面"战略布局的内容是什么？
A: 全面建设社会主义现代化国家、全面深化改革、全面依法治国、全面从严治党

Q: 我国最高国家权力机关是什么？
A: 全国人民代表大会

Q: 我国的政党制度是什么？
A: 中国共产党领导的多党合作和政治协商制度

Q: 中国特色社会主义的本质要求是什么？
A: 共同富裕

Q: "五大发展理念"的内容是什么？
A: 创新、协调、绿色、开放、共享

Q: 我国基本经济制度是什么？
A: 公有制为主体、多种所有制经济共同发展

Q: 宪法规定公民的基本权利包括哪些？
A: 平等权、政治权利和自由、宗教信仰自由、人身自由权、社会经济权、文化教育权

Q: 行政法的基本原则包括哪些？
A: 合法行政原则、合理行政原则、程序正当原则、高效便民原则、诚实守信原则、权责统一原则

Q: 马克思主义哲学的两大特征是什么？
A: 实践性和阶级性（科学性和革命性的统一）

Q: 认识的辩证运动过程是什么？
A: 从感性认识到理性认识，从理性认识到实践

Q: 社会主义核心价值观的内容是什么？
A: 富强、民主、文明、和谐（国家层面）；自由、平等、公正、法治（社会层面）；爱国、敬业、诚信、友善（个人层面）

Q: GDP（国内生产总值）的含义是什么？
A: 一个国家或地区在一定时期内所生产的全部最终产品和服务的市场价值总和

Q: 通货膨胀和通货紧缩的区别是什么？
A: 通货膨胀是物价持续上涨，货币贬值；通货紧缩是物价持续下降，货币升值

Q: 光年是什么单位？
A: 距离单位，光在一年中传播的距离，约9.46万亿千米

Q: 世界三大短篇小说巨匠是谁？
A: 莫泊桑（法国）、契诃夫（俄国）、欧·亨利（美国）

Q: 中国四大发明是什么？
A: 造纸术、印刷术、火药、指南针`;
    }

    function generateCivilLogic() {
        return `Q: 所有的鱼都会游泳，金鱼是鱼，所以金鱼会游泳。这个推理属于什么类型？
A: 三段论推理（演绎推理）

Q: 甲乙丙丁四人中只有一人说了真话。甲说"我没做"，乙说"甲做了"，丙说"乙做了"，丁说"我没做"。请问谁做了？
A: 丙做了。因为甲乙说法矛盾必有一真，所以丙丁都说假话，丁说的"我没做"为假即丁做了——但需要验证。实际上甲乙矛盾，真话在甲乙之间，丙说假话（乙没做），丁说假话（丁做了），但题目只有一人做，矛盾。重新分析：如果甲做了，甲说假话，乙说真话，丙说假话，丁说真话——两个真话矛盾。如果丙做了，甲说真话，乙说假话，丙说假话，丁说真话——两个真话矛盾。答案需要根据具体条件分析。

Q: 数字推理：2, 5, 10, 17, 26, ?
A: 37。规律：差为3,5,7,9,11（等差数列，公差为2）

Q: 数字推理：1, 1, 2, 3, 5, 8, ?
A: 13。斐波那契数列，每个数等于前两个数之和。

Q: 类比推理：医生:医院 = 教师:?
A: 学校。职业与工作场所的关系。

Q: 类比推理：画家:画笔 = 作家:?
A: 钢笔/键盘。工作者与工具的关系。

Q: 图形推理的常见规律有哪些？
A: 旋转、翻转、平移、对称、元素增减、叠加、去同存异、去异存同

Q: 削弱型论证题的解题思路是什么？
A: 1.找论点和论据 2.找论点与论据的关系 3.优先否定论点>拆桥>否定论据>他因削弱

Q: 加强型论证题的解题思路是什么？
A: 1.找论点和论据 2.搭桥（建立论点与论据的联系）3.补充新论据 4.排除他因

Q: 定义判断题的解题技巧是什么？
A: 提取定义的关键信息（主体、客体、目的、条件、方式、结果），逐一对比选项`;
    }

    function generateNCREContent() {
        return `Q: 计算机中数据的最小单位是什么？
A: 位（bit），即二进制位

Q: 1KB等于多少字节？
A: 1024字节（Byte）

Q: CPU的主要组成部分是什么？
A: 运算器（ALU）和控制器（CU）

Q: 什么是操作系统？
A: 操作系统是管理计算机硬件和软件资源、控制程序运行的系统软件，是用户与计算机之间的接口

Q: 冯·诺依曼计算机的基本工作原理是什么？
A: 存储程序和程序控制原理——将程序和数据存储在存储器中，在控制器控制下自动执行

Q: 计算机网络按覆盖范围分为哪几类？
A: 局域网（LAN）、城域网（MAN）、广域网（WAN）

Q: IP地址由几位二进制数组成？
A: 32位（IPv4），分为4段，每段8位

Q: 关系数据库的基本操作有哪些？
A: 选择（Select）、投影（Project）、连接（Join）

Q: SQL中用于查询数据的语句是什么？
A: SELECT语句。基本格式：SELECT 列名 FROM 表名 WHERE 条件

Q: 什么是算法的时间复杂度？
A: 算法执行所需要的计算工作量，通常用大O表示法，如O(n)、O(n²)、O(log n)

Q: Python中列表（list）和元组（tuple）的区别是什么？
A: 列表是可变序列，用方括号[]；元组是不可变序列，用圆括号()

Q: 什么是面向对象编程的三大特征？
A: 封装、继承、多态

Q: 什么是数据结构中的栈？
A: 栈是一种后进先出（LIFO）的线性数据结构，只能在一端（栈顶）进行插入和删除操作

Q: 什么是二叉树的中序遍历？
A: 先访问左子树，再访问根节点，最后访问右子树（左-根-右）

Q: 常见的排序算法有哪些？
A: 冒泡排序、选择排序、插入排序、快速排序、归并排序、堆排序

Q: HTTP协议的默认端口号是多少？
A: 80（HTTPS的默认端口号是443）

Q: 什么是数据库的三范式？
A: 1NF：字段不可再分；2NF：非主属性完全依赖于主键；3NF：非主属性不传递依赖于主键`;
    }

    function generateProvincialContent() {
        return `Q: 申论考试的基本题型有哪些？
A: 概括归纳题、综合分析题、提出对策题、贯彻执行题（应用文写作）、大作文

Q: 概括归纳题的答题要点是什么？
A: 1.审清题目要求 2.回到材料找要点 3.分类整理 4.规范作答（总分结构）

Q: 综合分析题的答题结构是什么？
A: 总-分-总结构。先表明观点/解释含义，再多角度分析，最后总结/提出对策

Q: 提出对策题的常用对策方向有哪些？
A: 思想认识、制度建设、监管执法、科技手段、人才培养、资金保障、宣传教育、社会参与

Q: 应用文写作常见文种有哪些？
A: 通知、报告、简报、发言稿、倡议书、建议书、调研报告、工作方案

Q: 大作文的结构模式有哪些？
A: 五段三分式（开头-分论点1-分论点2-分论点3-结尾）、起承转合式、递进式

Q: 申论大作文开头的常用方法有哪些？
A: 引言式、排比式、案例式、背景式、设问式

Q: 申论材料阅读的技巧有哪些？
A: 1.先审题后读材料 2.标注关键词和高频词 3.注意转折词和总结词 4.区分观点和事实 5.注意首尾段

Q: 公文写作的基本要求是什么？
A: 格式规范、语言准确、内容完整、层次清晰、简明扼要

Q: 如何提炼分论点？
A: 从材料中提取核心观点，围绕总论点从不同角度（是什么、为什么、怎么办）展开，确保分论点之间并列且不重叠`;
    }

    // ==================== 渲染首页 ====================
    function renderStudyHome() {
        initStudyData();
        resetTodayStats();
        updateStudyProgress();
        renderTodayPlans();
        updateMasterBanner();
    }

    function resetTodayStats() {
        const today = new Date().toLocaleDateString();
        if (store.study.stats.lastDate !== today) {
            store.study.stats.todayCompleted = 0;
            store.study.stats.todayQuizzes = 0;
            store.study.stats.todayCorrect = 0;
            store.study.stats.lastDate = today;
            // 重置今日计划完成状态
            store.study.plans.forEach(p => {
                if (p.todayCompleted) p.todayCompleted = false;
            });
        }
        store.study.stats.todayTotal = store.study.plans.filter(p => p.status === 'active').length;
    }

    function updateStudyProgress() {
        const stats = store.study.stats;
        const el = (id) => document.getElementById(id);
        if (el('study-stat-completed')) el('study-stat-completed').innerText = stats.todayCompleted;
        if (el('study-stat-total')) el('study-stat-total').innerText = stats.todayTotal;
        if (el('study-stat-quizzes')) el('study-stat-quizzes').innerText = stats.todayQuizzes;
        const accuracy = stats.todayQuizzes > 0 ? Math.round(stats.todayCorrect / stats.todayQuizzes * 100) : 0;
        if (el('study-stat-accuracy')) el('study-stat-accuracy').innerText = accuracy + '%';
        const progress = stats.todayTotal > 0 ? Math.round(stats.todayCompleted / stats.todayTotal * 100) : 0;
        if (el('study-progress-bar')) el('study-progress-bar').style.width = progress + '%';
        if (el('study-today-date')) el('study-today-date').innerText = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });
    }

    function updateMasterBanner() {
        const banner = document.getElementById('study-master-banner');
        const icon = document.getElementById('study-master-icon');
        if (banner) banner.style.display = store.study.settings.masterSwitch ? 'flex' : 'none';
        if (icon) icon.style.color = store.study.settings.masterSwitch ? '#111' : '#999';
    }

    // ==================== 今日计划渲染 ====================
    function renderTodayPlans() {
        const container = document.getElementById('study-today-plans');
        if (!container) return;
        const activePlans = store.study.plans.filter(p => p.status === 'active');
        if (activePlans.length === 0) {
            container.innerHTML = '<div class="study-empty-hint">暂无今日计划，点击"复习计划"创建</div>';
            return;
        }
        container.innerHTML = activePlans.map(plan => {
            const mat = store.study.materials.find(m => m.id === plan.materialId);
            const completed = plan.todayCompleted || false;
            return `<div class="study-plan-item">
                <div class="plan-check ${completed ? 'completed' : ''}" onclick="studyTogglePlanComplete('${plan.id}')"></div>
                <div class="plan-info">
                    <div class="plan-name">${escapeHtml(plan.name)}</div>
                    <div class="plan-meta">${mat ? mat.name : '未知资料'} · 每日${plan.dailyAmount}个</div>
                </div>
                <div class="plan-actions">
                    <button onclick="studyStartReview('${plan.id}')" class="study-modal-btn-primary">开始</button>
                </div>
            </div>`;
        }).join('');
    }

    // ==================== Tab切换 ====================
    function studySwitchTab(tab, btnEl) {
        // 隐藏所有tab
        document.querySelectorAll('.study-tab').forEach(t => t.classList.remove('active'));
        // 显示目标tab
        const targetTab = document.getElementById('study-tab-' + tab);
        if (targetTab) targetTab.classList.add('active');

        // 确保底部导航栏"学习"高亮（内部tab切换时保持学习tab高亮）
        const bottomItems = document.querySelectorAll('.study-bottom-nav .study-bottom-item');
        bottomItems.forEach(b => b.classList.remove('active'));
        if (bottomItems[0]) bottomItems[0].classList.add('active');

        // 切换tab时隐藏网课输入框（除非正在网课中）
        const inputWrapper = document.getElementById('study-lecture-input-wrapper');
        if (inputWrapper) {
            if (tab === 'lecture' && lectureState.active) {
                inputWrapper.style.display = 'flex';
            } else {
                inputWrapper.style.display = 'none';
            }
        }

        // 渲染对应内容
        if (tab === 'home') renderStudyHome();
        if (tab === 'materials') renderMaterials();
        if (tab === 'plan') renderPlans();
        if (tab === 'lecture') {
            if (lectureState.active) {
                document.getElementById('study-lecture-sessions').style.display = 'none';
                document.getElementById('study-lecture-setup').style.display = 'none';
                document.getElementById('study-lecture-active').style.display = 'block';
            } else {
                studyShowLectureSessions();
            }
        }
        if (tab === 'favorites') renderStudyFavorites();
    }

    // ==================== 资料管理 ====================
    let studyMaterialFilter = 'all';

    function renderMaterials() {
        initStudyData();
        const container = document.getElementById('study-materials-list');
        if (!container) return;
        let materials = store.study.materials;
        if (studyMaterialFilter !== 'all') {
            materials = materials.filter(m => m.category === studyMaterialFilter);
        }
        if (materials.length === 0) {
            container.innerHTML = '<div class="study-empty-hint">' +
                '<div>还没有学习资料</div>' +
                '<button onclick="studyUploadMaterial()" class="study-btn-primary" style="margin-top:14px;">去上传资料</button>' +
            '</div>';
            return;
        }
        const catLabels = {
            cet4: '四级', cet6: '六级', civil_national: '国考',
            civil_provincial: '省考', ncre: '计算机二级', custom: '自定义'
        };
        container.innerHTML = materials.map(mat => {
            const preview = (mat.content || '').substring(0, 100).replace(/\n/g, ' ');
            const lines = (mat.content || '').split('\n').filter(l => l.trim()).length;
            return `<div class="study-material-card">
                <div class="mat-header">
                    <div class="mat-name">${escapeHtml(mat.name)}</div>
                    <div class="mat-badge ${mat.builtin ? 'builtin' : ''}">${mat.builtin ? '内置' : (catLabels[mat.category] || '自定义')}</div>
                </div>
                <div class="mat-preview">${escapeHtml(preview)}</div>
                <div class="mat-footer">
                    <span>${lines}条知识点 ${mat.isEnglish ? '· 英文' : ''}</span>
                    <div class="mat-actions">
                        <button onclick="studyViewMaterial('${mat.id}')"><i class="fas fa-eye"></i> 查看</button>
                        ${!mat.builtin ? `<button onclick="studyDeleteMaterial('${mat.id}')" class="mat-delete-btn"><i class="fas fa-trash"></i></button>` : ''}
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    function studyFilterCategory(cat, el) {
        studyMaterialFilter = cat;
        document.querySelectorAll('.study-cat-tab').forEach(t => t.classList.remove('active'));
        if (el) el.classList.add('active');
        renderMaterials();
    }

    function studyUploadMaterial() {
        document.getElementById('modal-study-upload').style.display = 'flex';
        document.getElementById('study-upload-name').value = '';
        document.getElementById('study-upload-content').value = '';
        document.getElementById('study-upload-english').checked = false;
    }

    function saveStudyMaterial() {
        const name = document.getElementById('study-upload-name').value.trim();
        const content = document.getElementById('study-upload-content').value.trim();
        const category = document.getElementById('study-upload-category').value;
        const isEnglish = document.getElementById('study-upload-english').checked;
        if (!name) { showToast('请输入资料名称', 'error'); return; }
        if (!content) { showToast('请输入资料内容', 'error'); return; }

        initStudyData();
        store.study.materials.push({
            id: 'mat_' + Date.now(),
            name: name,
            category: category,
            builtin: false,
            isEnglish: isEnglish,
            content: content,
            addedTime: Date.now()
        });
        save();
        // [FIX-词书同步] 上传新资料后自动同步到背单词词书
        if (isEnglish && typeof buildWordBooksFromMaterials === 'function') {
            try { buildWordBooksFromMaterials(); } catch(e) { console.warn('[词书同步] 同步失败', e); }
        }
        document.getElementById('modal-study-upload').style.display = 'none';
        showToast('资料上传成功', 'success');
        renderMaterials();
    }

    function handleStudyFileUpload(input) {
        const files = input.files;
        if (!files || files.length === 0) return;
        const file = files[0]; // 处理第一个文件
        const fileName = file.name;
        const ext = fileName.split('.').pop().toLowerCase();

        // 自动填入文件名
        if (!document.getElementById('study-upload-name').value) {
            document.getElementById('study-upload-name').value = fileName.replace(/\.[^.]+$/, '');
        }

        const contentArea = document.getElementById('study-upload-content');

        if (ext === 'pdf') {
            // 解析 PDF 文件
            handlePDFUpload(file, contentArea);
        } else if (ext === 'docx') {
            // 解析 DOCX 文件
            handleDOCXUpload(file, contentArea);
        } else if (ext === 'doc') {
            // .doc 格式无法在前端直接解析，提示用户转为docx
            showToast('暂不支持 .doc 格式，请转换为 .docx 后上传', 'error');
        } else {
            // txt, md, csv, json 等纯文本
            handleTextUpload(file, contentArea);
        }
        input.value = '';
    }

    async function handlePDFUpload(file, contentArea) {
        contentArea.value = '正在解析PDF文件，请稍候...';
        try {
            if (typeof pdfjsLib === 'undefined') {
                showToast('PDF解析库加载失败，请刷新页面重试', 'error');
                contentArea.value = '';
                return;
            }
            // 设置 worker
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const totalPages = pdf.numPages;
            let fullText = '';

            for (let i = 1; i <= totalPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                if (pageText.trim()) {
                    fullText += `--- 第${i}页 ---\n${pageText.trim()}\n\n`;
                }
                // 更新进度
                contentArea.value = `正在解析PDF... (${i}/${totalPages}页)`;
            }

            if (!fullText.trim()) {
                showToast('PDF未能提取到文字，可能是扫描版PDF', 'error');
                contentArea.value = '';
                return;
            }

            contentArea.value = fullText.trim();
            autoDetectEnglish(fullText);
            showToast(`PDF解析完成，共${totalPages}页`, 'success');
        } catch (e) {
            console.error('[Study] PDF解析失败:', e);
            showToast('PDF解析失败: ' + e.message, 'error');
            contentArea.value = '';
        }
    }

    async function handleDOCXUpload(file, contentArea) {
        contentArea.value = '正在解析DOCX文件，请稍候...';
        try {
            if (typeof mammoth === 'undefined') {
                showToast('DOCX解析库加载失败，请刷新页面重试', 'error');
                contentArea.value = '';
                return;
            }

            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
            const text = result.value;

            if (!text.trim()) {
                showToast('DOCX未能提取到文字内容', 'error');
                contentArea.value = '';
                return;
            }

            contentArea.value = text.trim();
            autoDetectEnglish(text);
            showToast('DOCX解析完成', 'success');

            if (result.messages && result.messages.length > 0) {
                console.warn('[Study] DOCX解析警告:', result.messages);
            }
        } catch (e) {
            console.error('[Study] DOCX解析失败:', e);
            showToast('DOCX解析失败: ' + e.message, 'error');
            contentArea.value = '';
        }
    }

    function handleTextUpload(file, contentArea) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            contentArea.value = content;
            autoDetectEnglish(content);
            showToast('文件读取成功', 'success');
        };
        reader.onerror = function() {
            showToast('文件读取失败', 'error');
        };
        reader.readAsText(file);
    }

    function autoDetectEnglish(content) {
        if (!content) return;
        const englishRatio = (content.match(/[a-zA-Z]/g) || []).length / content.length;
        if (englishRatio > 0.5) {
            document.getElementById('study-upload-english').checked = true;
        }
    }

    function studyViewMaterial(matId) {
        const mat = store.study.materials.find(m => m.id === matId);
        if (!mat) return;
        // 使用现有的 HTML 弹窗来显示
        const htmlContent = `<div style="padding:12px; max-height:60vh; overflow-y:auto;">
            <h3 style="margin:0 0 12px; font-size:16px; font-weight:700; color:#111; letter-spacing:-0.3px;">${escapeHtml(mat.name)}</h3>
            <pre style="white-space:pre-wrap; word-wrap:break-word; font-size:13px; line-height:1.8; background:#F5F5F5; padding:16px; border-radius:12px; color:#333; border:1px solid #EEEEEE;">${escapeHtml(mat.content)}</pre>
        </div>`;
        document.getElementById('wb-html-popup-title').innerText = mat.name;
        document.getElementById('wb-html-popup-content').innerHTML = htmlContent;
        const overlay = document.getElementById('wb-html-popup-overlay');
        overlay.style.display = '';  // 清除内联样式，让CSS class控制
        overlay.classList.add('show');
    }

    function studyDeleteMaterial(matId) {
        showConfirm('确认删除', '确定删除这份资料吗？', () => {
            store.study.materials = store.study.materials.filter(m => m.id !== matId);
            // 同时删除关联的计划
            store.study.plans = store.study.plans.filter(p => p.materialId !== matId);
            // [FIX-词书同步] 删除资料后同步清理对应的背单词词书
            if (store.study.vocabGame && store.study.vocabGame.wordBooks) {
                store.study.vocabGame.wordBooks = store.study.vocabGame.wordBooks.filter(function(b) {
                    return b.sourceMatId !== matId;
                });
            }
            save();
            renderMaterials();
            showToast('已删除', 'success');
        });
    }

    // ==================== 复习计划 ====================
    function renderPlans() {
        initStudyData();
        const container = document.getElementById('study-plan-content');
        if (!container) return;
        const plans = store.study.plans;
        if (plans.length === 0) {
            container.innerHTML = '<div class="study-empty-hint">' +
                '<div>还没有复习计划</div>' +
                '<button onclick="openCreatePlanModal()" class="study-btn-primary" style="margin-top:14px;">去创建计划</button>' +
            '</div>';
            return;
        }
        container.innerHTML = plans.map(plan => {
            const mat = store.study.materials.find(m => m.id === plan.materialId);
            const totalItems = mat ? (mat.content || '').split('\n').filter(l => l.trim()).length : 0;
            const learned = plan.learnedCount || 0;
            const progress = totalItems > 0 ? Math.round(learned / totalItems * 100) : 0;
            const statusLabel = plan.status === 'active' ? '进行中' : (plan.status === 'completed' ? '已完成' : '已暂停');
            const statusColor = plan.status === 'active' ? '#111' : (plan.status === 'completed' ? '#999' : '#666');

            const contact = plan.contactId ? store.contacts.find(c => c.id === plan.contactId) : null;
            return `<div class="study-plan-detail">
                <div class="plan-detail-header">
                    <div class="plan-detail-name">${escapeHtml(plan.name)}</div>
                    <div class="plan-detail-status ${plan.status}">${statusLabel}</div>
                </div>
                <div class="plan-detail-progress">
                    <div class="plan-progress-bar"><div class="plan-progress-fill" style="width:${progress}%"></div></div>
                    <span class="plan-progress-text">${learned}/${totalItems}</span>
                </div>
                <div class="plan-detail-meta">
                    <span>${mat ? mat.name : '未知资料'}</span>
                    <span>每日${plan.dailyAmount}个</span>
                    ${contact ? `<span>${contact.name}</span>` : ''}
                </div>
                <div class="plan-detail-actions">
                    ${plan.status === 'active' ? `
                        <button onclick="studyStartReview('${plan.id}')" class="primary">开始学习</button>
                        <button onclick="studyPausePlan('${plan.id}')" class="secondary">暂停</button>
                    ` : plan.status === 'paused' ? `
                        <button onclick="studyResumePlan('${plan.id}')" class="primary">继续</button>
                    ` : ''}
                    <button onclick="studyDeletePlan('${plan.id}')" class="danger">删除</button>
                </div>
            </div>`;
        }).join('');
    }

    function openCreatePlanModal() {
        initStudyData();
        document.getElementById('modal-study-plan').style.display = 'flex';
        document.getElementById('study-plan-name').value = '';
        document.getElementById('study-plan-daily').value = '10';

        // 填充资料选项
        const matSelect = document.getElementById('study-plan-material');
        matSelect.innerHTML = '<option value="">选择学习资料</option>' +
            store.study.materials.map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('');

        // 填充联系人选项
        const contactSelect = document.getElementById('study-plan-contact');
        contactSelect.innerHTML = '<option value="">选择联系人（完成时提问）</option>' +
            store.contacts.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');

        // 默认日期
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('study-plan-start').value = today;
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);
        document.getElementById('study-plan-end').value = endDate.toISOString().split('T')[0];
    }

    function saveStudyPlan() {
        const name = document.getElementById('study-plan-name').value.trim();
        const materialId = document.getElementById('study-plan-material').value;
        const dailyAmount = parseInt(document.getElementById('study-plan-daily').value) || 10;
        const contactId = document.getElementById('study-plan-contact').value;
        const startDate = document.getElementById('study-plan-start').value;
        const endDate = document.getElementById('study-plan-end').value;

        if (!name) { showToast('请输入计划名称', 'error'); return; }
        if (!materialId) { showToast('请选择学习资料', 'error'); return; }

        initStudyData();
        store.study.plans.push({
            id: 'plan_' + Date.now(),
            name: name,
            materialId: materialId,
            dailyAmount: dailyAmount,
            contactId: contactId,
            startDate: startDate,
            endDate: endDate,
            status: 'active',
            learnedCount: 0,
            todayCompleted: false,
            createdAt: Date.now()
        });
        save();
        document.getElementById('modal-study-plan').style.display = 'none';
        showToast('计划创建成功！', 'success');
        renderPlans();
        renderStudyHome();
    }

    function studyPausePlan(planId) {
        const plan = store.study.plans.find(p => p.id === planId);
        if (plan) { plan.status = 'paused'; save(); renderPlans(); }
    }

    function studyResumePlan(planId) {
        const plan = store.study.plans.find(p => p.id === planId);
        if (plan) { plan.status = 'active'; save(); renderPlans(); }
    }

    function studyDeletePlan(planId) {
        showConfirm('确认删除', '确定删除这个计划吗？', () => {
            store.study.plans = store.study.plans.filter(p => p.id !== planId);
            save();
            renderPlans();
            renderStudyHome();
            showToast('已删除', 'success');
        });
    }

    // ==================== 完成计划 & 联系人提问 ====================
    function studyTogglePlanComplete(planId) {
        const plan = store.study.plans.find(p => p.id === planId);
        if (!plan) return;
        plan.todayCompleted = !plan.todayCompleted;
        if (plan.todayCompleted) {
            store.study.stats.todayCompleted++;
            plan.learnedCount = (plan.learnedCount || 0) + plan.dailyAmount;
            // 检查是否完成全部
            const mat = store.study.materials.find(m => m.id === plan.materialId);
            if (mat) {
                const total = (mat.content || '').split('\n').filter(l => l.trim()).length;
                if (plan.learnedCount >= total) {
                    plan.status = 'completed';
                    showToast('🎉 恭喜！计划已全部完成！', 'success');
                }
            }
            // 联系人提问
            if (plan.contactId) {
                setTimeout(() => triggerContactQuiz(plan), 500);
            }
        } else {
            store.study.stats.todayCompleted = Math.max(0, store.study.stats.todayCompleted - 1);
        }
        save();
        updateStudyProgress();
        renderTodayPlans();
    }

    async function triggerContactQuiz(plan) {
        const mat = store.study.materials.find(m => m.id === plan.materialId);
        if (!mat) return;
        const contact = store.contacts.find(c => c.id === plan.contactId);
        if (!contact) return;

        // 从学习资料中随机选取内容生成题目
        const lines = (mat.content || '').split('\n').filter(l => l.trim());
        const randomLines = [];
        for (let i = 0; i < Math.min(5, lines.length); i++) {
            const idx = Math.floor(Math.random() * lines.length);
            randomLines.push(lines[idx]);
        }

        try {
            const persona = store.study.settings.usePersona ? contact.persona : '';
            const sysPrompt = `你是${contact.name}。${persona ? '你的人设是：' + persona + '。' : ''}
现在你要根据以下学习内容对用户进行随机提问。请用你自己的语气和风格提出1个问题。

学习内容摘录：
${randomLines.join('\n')}

要求：
1. 根据学习内容提出一个选择题或填空题
2. 如果是选择题，提供4个选项，用A/B/C/D标记
3. 在末尾用 [答案:X] 标记正确答案（X是A/B/C/D或正确答案文本）
4. 用你的角色语气来提问，可以加入鼓励或调侃
5. 保持问题简洁明了`;

            _currentApiScene = 'study';
            const data = await API.chatCompletion([
                { role: 'system', content: sysPrompt },
                { role: 'user', content: '我已经完成了今天的学习计划，请考考我吧！' }
            ], 0.8, true);

            if (data && data.choices && data.choices[0]) {
                const reply = data.choices[0].message.content;
                showStudyQuizPopup(reply, contact);
            }
        } catch (e) {
            console.warn('[Study] 联系人提问失败:', e);
            // 如果API调用失败，用本地题目
            showLocalQuiz(mat);
        }
    }

    // ==================== 随堂测试 ====================
    function studyStartQuiz() {
        initStudyData();
        const activePlans = store.study.plans.filter(p => p.status === 'active');
        if (activePlans.length === 0 && store.study.materials.length === 0) {
            showToast('请先添加学习资料或创建计划', 'error');
            return;
        }
        // 从当前学习计划中选择资料
        let materialPool = [];
        if (activePlans.length > 0) {
            activePlans.forEach(p => {
                const mat = store.study.materials.find(m => m.id === p.materialId);
                if (mat) materialPool.push(mat);
            });
        }
        if (materialPool.length === 0) {
            materialPool = store.study.materials;
        }
        startQuizSession(materialPool);
    }

    let currentQuizSession = null;

    async function startQuizSession(materials) {
        const container = document.getElementById('study-quiz-content');
        if (!container) return;

        // 收集学习内容
        let allContent = materials.map(m => m.content).join('\n');
        const lines = allContent.split('\n').filter(l => l.trim());
        if (lines.length < 3) {
            showToast('学习资料太少，至少需要3条知识点', 'error');
            return;
        }

        // 随机选取内容
        const sampleLines = [];
        const sampleSize = Math.min(10, lines.length);
        const usedIdx = new Set();
        while (sampleLines.length < sampleSize) {
            const idx = Math.floor(Math.random() * lines.length);
            if (!usedIdx.has(idx)) {
                usedIdx.add(idx);
                sampleLines.push(lines[idx]);
            }
        }

        container.innerHTML = `<div class="study-quiz-area">
            <div class="study-quiz-counter">正在生成题目...</div>
            <div style="text-align:center; padding:40px;"><i class="fas fa-spinner fa-spin" style="font-size:24px; color:#333;"></i></div>
        </div>`;

        try {
            const sysPrompt = `你是一个出题专家。请根据以下学习内容出5道选择题。

学习内容：
${sampleLines.join('\n')}

要求：
1. 每道题用 [题目X] 开头（X为1-5）
2. 提供4个选项 A/B/C/D
3. 在每道题最后标注 [答案:X]（X为正确选项字母）
4. 题目难度适中，覆盖不同知识点
5. 选项之间用换行分隔`;

            const data = await API.chatCompletion([
                { role: 'system', content: sysPrompt },
                { role: 'user', content: '请出题' }
            ], 0.7, true);

            if (data && data.choices && data.choices[0]) {
                const quizText = data.choices[0].message.content;
                parseAndShowQuiz(quizText, container);
            }
        } catch (e) {
            console.warn('[Study] 生成测试题失败:', e);
            // 使用本地题目
            generateLocalQuiz(materials, container);
        }
    }

    function parseAndShowQuiz(quizText, container) {
        // 解析AI生成的题目
        const questions = [];
        const parts = quizText.split(/\[题目\d+\]/);
        parts.forEach(part => {
            if (!part.trim()) return;
            const answerMatch = part.match(/\[答案[:：]\s*([A-Da-d])\]/);
            if (!answerMatch) return;
            const correctAnswer = answerMatch[1].toUpperCase();
            const questionText = part.replace(/\[答案[:：]\s*[A-Da-d]\]/, '').trim();

            // 提取选项
            const optionMatches = questionText.match(/[A-D][.、:：]\s*.+/g);
            const options = [];
            if (optionMatches) {
                optionMatches.forEach(opt => {
                    const letter = opt.charAt(0);
                    const text = opt.substring(1).replace(/^[.、:：]\s*/, '').trim();
                    options.push({ letter, text });
                });
            }

            // 提取题干（去掉选项部分）
            let stem = questionText;
            if (optionMatches && optionMatches.length > 0) {
                stem = questionText.substring(0, questionText.indexOf(optionMatches[0])).trim();
            }

            if (stem && options.length >= 2) {
                questions.push({ stem, options, answer: correctAnswer });
            }
        });

        if (questions.length === 0) {
            // 直接显示原文让用户回答
            container.innerHTML = `<div class="study-quiz-area">
                <div class="study-quiz-question-text">${escapeHtml(quizText)}</div>
            </div>`;
            return;
        }

        currentQuizSession = { questions, currentIndex: 0, correct: 0, total: questions.length };
        showQuizQuestion(container);
    }

    function showQuizQuestion(container) {
        if (!currentQuizSession || currentQuizSession.currentIndex >= currentQuizSession.total) {
            showQuizResult(container);
            return;
        }
        const q = currentQuizSession.questions[currentQuizSession.currentIndex];
        const idx = currentQuizSession.currentIndex;
        container.innerHTML = `<div class="study-quiz-area">
            <div class="study-quiz-counter">第 ${idx + 1} / ${currentQuizSession.total} 题</div>
            <div class="study-quiz-question-text">${escapeHtml(q.stem)}</div>
            <div id="quiz-options-area">
                ${q.options.map(opt => `
                    <div class="study-quiz-option" onclick="studyAnswerQuiz('${opt.letter}')" data-letter="${opt.letter}">
                        <div class="study-quiz-option-label">${opt.letter}</div>
                        <span>${escapeHtml(opt.text)}</span>
                    </div>
                `).join('')}
            </div>
        </div>`;
    }

    function studyAnswerQuiz(letter) {
        if (!currentQuizSession) return;
        const q = currentQuizSession.questions[currentQuizSession.currentIndex];
        const correct = letter === q.answer;
        if (correct) currentQuizSession.correct++;

        store.study.stats.todayQuizzes++;
        store.study.stats.totalQuizzes++;
        if (correct) {
            store.study.stats.todayCorrect++;
            store.study.stats.totalCorrect++;
        }
        save();
        updateStudyProgress();

        // 记录用户答案供收藏用
        q._userAnswer = letter;
        q._isCorrect = correct;

        // 显示答案
        const optionsArea = document.getElementById('quiz-options-area');
        if (optionsArea) {
            optionsArea.querySelectorAll('.study-quiz-option').forEach(el => {
                const l = el.dataset.letter;
                if (l === q.answer) el.classList.add('correct');
                else if (l === letter && !correct) el.classList.add('wrong');
                el.onclick = null;
            });
        }

        // 显示底部操作栏（收藏 + 下一题）
        let actionsBar = document.getElementById('quiz-actions-bar');
        if (!actionsBar) {
            actionsBar = document.createElement('div');
            actionsBar.id = 'quiz-actions-bar';
            actionsBar.className = 'study-quiz-actions-bar';
            const quizArea = optionsArea ? optionsArea.parentElement : null;
            if (quizArea) quizArea.appendChild(actionsBar);
        }
        const alreadyFav = _isQuizAlreadyFav(q.stem);
        actionsBar.innerHTML = `<button class="study-collect-btn${alreadyFav ? ' collected' : ''}" id="quiz-collect-btn" onclick="studyCollectQuizQuestion()"><i class="fas fa-bookmark"></i> ${alreadyFav ? '已收藏' : '收藏'}</button>`
            + `<button class="study-next-btn" onclick="studyQuizNext()">下一题 <i class="fas fa-chevron-right"></i></button>`;
        actionsBar.style.display = 'flex';
    }

    // 手动进入下一题
    function studyQuizNext() {
        if (!currentQuizSession) return;
        currentQuizSession.currentIndex++;
        const container = document.getElementById('study-quiz-content');
        showQuizQuestion(container);
    }

    // 收藏当前随堂测试题目
    function studyCollectQuizQuestion() {
        if (!currentQuizSession) return;
        const q = currentQuizSession.questions[currentQuizSession.currentIndex];
        if (!q) return;
        initStudyData();
        if (_isQuizAlreadyFav(q.stem)) {
            if (typeof showToast === 'function') showToast('已在收藏中');
            return;
        }
        store.study.favorites.push({
            id: 'fav_' + Date.now(),
            stem: q.stem,
            options: q.options || [],
            answer: q.answer,
            userAnswer: q._userAnswer || '',
            isCorrect: !!q._isCorrect,
            source: 'quiz',
            materialName: '',
            collectTime: Date.now(),
            note: '',
            reviewCount: 0
        });
        save();
        const btn = document.getElementById('quiz-collect-btn');
        if (btn) { btn.innerHTML = '<i class="fas fa-bookmark"></i> 已收藏'; btn.classList.add('collected'); }
        if (typeof showToast === 'function') showToast('已收藏');
    }

    // 检查题目是否已收藏
    function _isQuizAlreadyFav(stem) {
        if (!store.study || !store.study.favorites) return false;
        return store.study.favorites.some(f => f.stem === stem);
    }

    function showQuizResult(container) {
        if (!currentQuizSession) return;
        const { correct, total } = currentQuizSession;
        const score = Math.round(correct / total * 100);
        container.innerHTML = `<div class="study-quiz-area">
            <div class="study-quiz-score">
                <div class="score-num">${score}</div>
                <div class="score-label">得分</div>
            </div>
            <div class="sq-result-detail">
                <div class="sq-result-text">答对 ${correct} / ${total} 题</div>
                <button onclick="studyStartQuiz()" class="study-btn-primary" style="margin-top:16px;"><i class="fas fa-redo"></i> 再来一次</button>
            </div>
        </div>`;
        currentQuizSession = null;

        // 保存测试记录
        store.study.quizHistory.push({
            date: Date.now(),
            correct: correct,
            total: total,
            score: score
        });
        save();
    }

    function generateLocalQuiz(materials, container) {
        // 本地生成简单的题目（当API不可用时）
        const lines = materials.flatMap(m => (m.content || '').split('\n').filter(l => l.trim()));
        const qaPairs = [];
        lines.forEach(line => {
            const match = line.match(/^Q[:：]\s*(.+)/);
            if (match) {
                const nextIdx = lines.indexOf(line) + 1;
                if (nextIdx < lines.length) {
                    const aMatch = lines[nextIdx].match(/^A[:：]\s*(.+)/);
                    if (aMatch) {
                        qaPairs.push({ q: match[1], a: aMatch[1] });
                    }
                }
            }
            // 英文词汇格式: word v./n./adj. 释义
            const vocabMatch = line.match(/^(\w+)\s+(v\.|n\.|adj\.|adv\.|prep\.)\s+(.+)/);
            if (vocabMatch) {
                qaPairs.push({ q: `"${vocabMatch[1]}"的中文含义是什么？`, a: vocabMatch[3] });
            }
        });

        if (qaPairs.length === 0) {
            container.innerHTML = '<div class="study-empty-hint">无法解析资料内容生成题目，请确保资料格式正确</div>';
            return;
        }

        // 随机选5题
        const selected = [];
        const usedIdx = new Set();
        const count = Math.min(5, qaPairs.length);
        while (selected.length < count) {
            const idx = Math.floor(Math.random() * qaPairs.length);
            if (!usedIdx.has(idx)) {
                usedIdx.add(idx);
                selected.push(qaPairs[idx]);
            }
        }

        // 转为选择题
        const questions = selected.map(qa => {
            const correctAnswer = qa.a;
            // 生成3个干扰项
            const distractors = [];
            const otherAnswers = qaPairs.filter(p => p.a !== correctAnswer).map(p => p.a);
            while (distractors.length < 3 && otherAnswers.length > 0) {
                const idx = Math.floor(Math.random() * otherAnswers.length);
                distractors.push(otherAnswers.splice(idx, 1)[0]);
            }
            while (distractors.length < 3) {
                distractors.push('以上都不对');
            }

            const options = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);
            const correctLetter = ['A', 'B', 'C', 'D'][options.indexOf(correctAnswer)];

            return {
                stem: qa.q,
                options: options.map((o, i) => ({ letter: ['A', 'B', 'C', 'D'][i], text: o })),
                answer: correctLetter
            };
        });

        currentQuizSession = { questions, currentIndex: 0, correct: 0, total: questions.length };
        showQuizQuestion(container);
    }

    // ==================== 学习弹窗提问（聊天界面） ====================
    let studyPopupTimer = null;
    let currentStudyPopupQuiz = null;

    function startStudyPopupTimer() {
        stopStudyPopupTimer();
        if (!store.study || !store.study.settings.masterSwitch) return;
        const interval = (store.study.settings.popupInterval || 15) * 60 * 1000;
        studyPopupTimer = setInterval(() => {
            if (store.study.settings.masterSwitch) {
                triggerStudyPopup();
            }
        }, interval);
        console.log('[Study] 弹窗提问计时器已启动，间隔', store.study.settings.popupInterval, '分钟');
    }

    function stopStudyPopupTimer() {
        if (studyPopupTimer) {
            clearInterval(studyPopupTimer);
            studyPopupTimer = null;
        }
    }

    async function triggerStudyPopup() {
        if (!store.study || !store.study.settings.masterSwitch) return;
        const activePlans = store.study.plans.filter(p => p.status === 'active');
        if (activePlans.length === 0) return;

        // 随机选一个计划的资料
        const plan = activePlans[Math.floor(Math.random() * activePlans.length)];
        const mat = store.study.materials.find(m => m.id === plan.materialId);
        if (!mat) return;

        const lines = (mat.content || '').split('\n').filter(l => l.trim());
        if (lines.length < 2) return;

        // 随机选内容
        const randomLines = [];
        for (let i = 0; i < Math.min(3, lines.length); i++) {
            randomLines.push(lines[Math.floor(Math.random() * lines.length)]);
        }

        // 决定用哪个联系人
        let contact = null;
        if (plan.contactId) {
            contact = store.contacts.find(c => c.id === plan.contactId);
        }
        if (!contact && store.contacts.length > 0) {
            contact = store.contacts[Math.floor(Math.random() * store.contacts.length)];
        }

        try {
            const persona = (contact && store.study.settings.usePersona) ? contact.persona : '';
            const name = contact ? contact.name : '学习助手';
            const sysPrompt = `你是${name}。${persona ? '你的人设是：' + persona + '。' : ''}
用户正在学习中，请根据以下内容出一道随机题目来考考用户。

学习内容：
${randomLines.join('\n')}

要求：
1. 出一道选择题（4个选项A/B/C/D）
2. 在末尾标注 [答案:X]
3. 用你的风格和语气提问
4. 简洁明了，不要太长`;

            const data = await API.chatCompletion([
                { role: 'system', content: sysPrompt },
                { role: 'user', content: '随机考我一题！' }
            ], 0.8, true);

            if (data && data.choices && data.choices[0]) {
                showStudyQuizPopup(data.choices[0].message.content, contact);
            }
        } catch (e) {
            console.warn('[Study] 弹窗提问生成失败:', e);
            showLocalQuiz(mat);
        }
    }

    function showStudyQuizPopup(quizText, contact) {
        const popup = document.getElementById('study-quiz-popup');
        if (!popup) return;

        // 解析题目
        const answerMatch = quizText.match(/\[答案[:：]\s*([A-Da-d])\]/);
        const correctAnswer = answerMatch ? answerMatch[1].toUpperCase() : null;
        const cleanText = quizText.replace(/\[答案[:：]\s*[A-Da-d]\]/, '').trim();

        // 提取选项
        const optionMatches = cleanText.match(/[A-D][.、:：]\s*.+/g);
        let questionText = cleanText;
        let options = [];

        if (optionMatches && optionMatches.length >= 2) {
            options = optionMatches.map(opt => {
                const letter = opt.charAt(0);
                const text = opt.substring(1).replace(/^[.、:：]\s*/, '').trim();
                return { letter, text };
            });
            questionText = cleanText.substring(0, cleanText.indexOf(optionMatches[0])).trim();
        }

        currentStudyPopupQuiz = { correctAnswer, answered: false, questionText: questionText, options: options };

        const questionEl = document.getElementById('study-quiz-popup-question');
        const optionsEl = document.getElementById('study-quiz-popup-options');
        const inputArea = document.getElementById('study-quiz-popup-input-area');
        const resultEl = document.getElementById('study-quiz-popup-result');

        const contactLabel = contact ? `${contact.name} 问你：` : '';
        questionEl.innerHTML = `${contactLabel ? `<div style="font-size:12px; color:#666; margin-bottom:8px;">${escapeHtml(contactLabel)}</div>` : ''}${escapeHtml(questionText)}`;

        if (options.length >= 2 && correctAnswer) {
            optionsEl.innerHTML = options.map(opt => `
                <div class="study-quiz-option" onclick="window._studyPopupAnswer('${opt.letter}')">
                    <div class="study-quiz-option-label">${opt.letter}</div>
                    <span>${escapeHtml(opt.text)}</span>
                </div>
            `).join('');
            optionsEl.style.display = 'block';
            inputArea.style.display = 'none';
        } else {
            optionsEl.style.display = 'none';
            inputArea.style.display = 'flex';
            document.getElementById('study-quiz-popup-answer').value = '';
        }
        resultEl.style.display = 'none';
        resultEl.className = 'study-quiz-popup-result';

        popup.style.display = 'flex';
    }

    window._studyPopupAnswer = function(letter) {
        if (!currentStudyPopupQuiz || currentStudyPopupQuiz.answered) return;
        currentStudyPopupQuiz.answered = true;
        currentStudyPopupQuiz.userAnswer = letter;

        const correct = letter === currentStudyPopupQuiz.correctAnswer;
        currentStudyPopupQuiz.isCorrect = correct;
        store.study.stats.todayQuizzes++;
        store.study.stats.totalQuizzes++;
        if (correct) {
            store.study.stats.todayCorrect++;
            store.study.stats.totalCorrect++;
        }
        save();

        // 高亮选项
        const optionsEl = document.getElementById('study-quiz-popup-options');
        optionsEl.querySelectorAll('.study-quiz-option').forEach(el => {
            const l = el.querySelector('.study-quiz-option-label').innerText;
            if (l === currentStudyPopupQuiz.correctAnswer) el.classList.add('correct');
            else if (l === letter && !correct) el.classList.add('wrong');
        });

        const resultEl = document.getElementById('study-quiz-popup-result');
        resultEl.className = 'study-quiz-popup-result ' + (correct ? 'correct' : 'wrong');
        resultEl.innerHTML = correct ? '回答正确' : '回答错误，正确答案是 ' + currentStudyPopupQuiz.correctAnswer;
        resultEl.style.display = 'block';

        // 显示底部操作栏（收藏 + 关闭）
        _showPopupActions();
    };

    function submitStudyQuizPopup() {
        const input = document.getElementById('study-quiz-popup-answer');
        if (!input) return;
        const answer = input.value.trim();
        if (!answer) return;

        if (currentStudyPopupQuiz) {
            currentStudyPopupQuiz.answered = true;
            currentStudyPopupQuiz.userAnswer = answer;
            currentStudyPopupQuiz.isCorrect = true;
        }

        store.study.stats.todayQuizzes++;
        store.study.stats.totalQuizzes++;
        store.study.stats.todayCorrect++;
        store.study.stats.totalCorrect++;
        save();

        const resultEl = document.getElementById('study-quiz-popup-result');
        resultEl.className = 'study-quiz-popup-result correct';
        resultEl.innerHTML = '已记录你的回答';
        resultEl.style.display = 'block';

        _showPopupActions();
    }

    function _showPopupActions() {
        const actionsEl = document.getElementById('study-quiz-popup-actions');
        if (actionsEl) {
            actionsEl.style.display = 'flex';
            const collectBtn = document.getElementById('study-quiz-popup-collect-btn');
            if (collectBtn && currentStudyPopupQuiz) {
                const alreadyFav = _isQuizAlreadyFav(currentStudyPopupQuiz.questionText || '');
                if (alreadyFav) { collectBtn.innerHTML = '<i class="fas fa-bookmark"></i> 已收藏'; collectBtn.classList.add('collected'); }
                else { collectBtn.innerHTML = '<i class="fas fa-bookmark"></i> 收藏'; collectBtn.classList.remove('collected'); }
            }
        }
    }

    // 收藏弹窗提问的题目
    function studyCollectPopupQuiz() {
        if (!currentStudyPopupQuiz) return;
        initStudyData();
        const q = currentStudyPopupQuiz;
        if (_isQuizAlreadyFav(q.questionText || '')) {
            if (typeof showToast === 'function') showToast('已在收藏中');
            return;
        }
        store.study.favorites.push({
            id: 'fav_' + Date.now(),
            stem: q.questionText || '',
            options: q.options || [],
            answer: q.correctAnswer || '',
            userAnswer: q.userAnswer || '',
            isCorrect: !!q.isCorrect,
            source: 'popup',
            materialName: '',
            collectTime: Date.now(),
            note: '',
            reviewCount: 0
        });
        save();
        const btn = document.getElementById('study-quiz-popup-collect-btn');
        if (btn) { btn.innerHTML = '<i class="fas fa-bookmark"></i> 已收藏'; btn.classList.add('collected'); }
        if (typeof showToast === 'function') showToast('已收藏');
    }

    function closeStudyQuizPopup() {
        const popup = document.getElementById('study-quiz-popup');
        if (popup) popup.style.display = 'none';
        // 隐藏操作栏
        const actionsEl = document.getElementById('study-quiz-popup-actions');
        if (actionsEl) actionsEl.style.display = 'none';
        currentStudyPopupQuiz = null;
    }

    function showLocalQuiz(mat) {
        const lines = (mat.content || '').split('\n').filter(l => l.trim());
        if (lines.length < 2) return;

        // 尝试解析Q/A格式
        for (let i = 0; i < lines.length - 1; i++) {
            const qMatch = lines[i].match(/^Q[:：]\s*(.+)/);
            if (qMatch) {
                const aMatch = lines[i + 1].match(/^A[:：]\s*(.+)/);
                if (aMatch) {
                    const quiz = `${qMatch[1]}\n\n请直接输入答案`;
                    showStudyQuizPopup(quiz, null);
                    return;
                }
            }
        }

        // 如果是词汇格式
        const vocabLine = lines[Math.floor(Math.random() * lines.length)];
        const vocabMatch = vocabLine.match(/^(\w+)\s+(v\.|n\.|adj\.|adv\.|prep\.)\s+(.+)/);
        if (vocabMatch) {
            const quiz = `"${vocabMatch[1]}"的意思是什么？\n\n请直接输入答案`;
            showStudyQuizPopup(quiz, null);
        }
    }

    // ==================== 收藏题库 ====================
    let studyFavFilterMode = 'all';

    function renderStudyFavorites() {
        initStudyData();
        const favs = store.study.favorites || [];
        const list = document.getElementById('study-fav-list');
        const practiceBar = document.getElementById('study-fav-practice-bar');
        if (!list) return;

        let filtered = favs;
        if (studyFavFilterMode === 'wrong') filtered = favs.filter(f => !f.isCorrect);
        else if (studyFavFilterMode === 'correct') filtered = favs.filter(f => f.isCorrect);

        if (practiceBar) practiceBar.style.display = filtered.length > 0 ? 'block' : 'none';

        if (filtered.length === 0) {
            list.innerHTML = '<div style="text-align:center; padding:60px 20px; color:#bbb; font-size:14px; line-height:2;">还没有收藏的题目<br>答题时点击收藏按钮即可保存到这里</div>';
            return;
        }

        list.innerHTML = filtered.slice().reverse().map(f => {
            const timeStr = _favTimeAgo(f.collectTime);
            const srcLabel = f.source === 'quiz' ? '随堂测试' : (f.source === 'popup' ? '弹窗提问' : '收藏练习');
            const correctLabel = f.isCorrect
                ? '<span class="sf-correct">答对</span>'
                : '<span class="sf-wrong">答错</span>';
            const answerInfo = f.options && f.options.length > 0
                ? `<div class="sf-answer-info">你答：${escapeHtml(f.userAnswer)} &nbsp; 正确：${escapeHtml(f.answer)}</div>`
                : (f.userAnswer ? `<div class="sf-answer-info">你的回答：${escapeHtml(f.userAnswer)}</div>` : '');
            const noteHtml = f.note ? `<div class="sf-note">${escapeHtml(f.note)}</div>` : '';
            return `<div class="study-fav-card">
                <div class="study-fav-stem">${escapeHtml(f.stem)}</div>
                ${answerInfo}
                ${noteHtml}
                <div class="study-fav-meta">
                    <span>${correctLabel} · ${escapeHtml(srcLabel)} · ${timeStr}</span>
                </div>
                <div class="study-fav-actions">
                    <button onclick="studyFavRedo('${f.id}')"><i class="fas fa-redo"></i> 重做</button>
                    <button onclick="studyFavNote('${f.id}')"><i class="fas fa-pen"></i> 备注</button>
                    <button onclick="studyFavDelete('${f.id}')" class="sf-delete-btn"><i class="fas fa-trash"></i> 删除</button>
                </div>
            </div>`;
        }).join('');
    }

    function _favTimeAgo(ts) {
        if (!ts) return '';
        const diff = Date.now() - ts;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return '刚刚';
        if (mins < 60) return mins + '分钟前';
        const hours = Math.floor(mins / 60);
        if (hours < 24) return hours + '小时前';
        const days = Math.floor(hours / 24);
        return days + '天前';
    }

    function studyFavFilter(mode, el) {
        studyFavFilterMode = mode;
        document.querySelectorAll('.study-fav-filter').forEach(b => b.classList.remove('active'));
        if (el) el.classList.add('active');
        renderStudyFavorites();
    }

    function studyFavDelete(id) {
        if (!confirm('删除这道收藏题？')) return;
        initStudyData();
        store.study.favorites = (store.study.favorites || []).filter(f => f.id !== id);
        save();
        renderStudyFavorites();
        if (typeof showToast === 'function') showToast('已删除');
    }

    function studyFavNote(id) {
        initStudyData();
        const fav = (store.study.favorites || []).find(f => f.id === id);
        if (!fav) return;
        const note = prompt('添加备注', fav.note || '');
        if (note === null) return;
        fav.note = note.trim();
        save();
        renderStudyFavorites();
    }

    function studyFavRedo(id) {
        initStudyData();
        const fav = (store.study.favorites || []).find(f => f.id === id);
        if (!fav) return;
        if (fav.options && fav.options.length >= 2 && fav.answer) {
            // 选择题 - 用弹窗显示
            const quizText = fav.stem + '\n' + fav.options.map(o => o.letter + '. ' + o.text).join('\n') + '\n[答案:' + fav.answer + ']';
            showStudyQuizPopup(quizText, null);
        } else {
            // 开放式 - 用弹窗显示
            showStudyQuizPopup(fav.stem + '\n\n请直接输入答案', null);
        }
        fav.reviewCount = (fav.reviewCount || 0) + 1;
        save();
    }

    // 收藏题专项练习 - 从收藏中随机抽题组卷
    function studyFavPractice() {
        initStudyData();
        const favs = store.study.favorites || [];
        if (favs.length === 0) { if (typeof showToast === 'function') showToast('没有收藏题'); return; }

        // 优先抽答错的题
        const wrongFavs = favs.filter(f => !f.isCorrect && f.options && f.options.length >= 2);
        const correctFavs = favs.filter(f => f.isCorrect && f.options && f.options.length >= 2);
        let pool = wrongFavs.length > 0 ? [...wrongFavs, ...correctFavs] : correctFavs;
        if (pool.length === 0) {
            // 没有选择题，用弹窗方式随机出一题
            const randomFav = favs[Math.floor(Math.random() * favs.length)];
            studyFavRedo(randomFav.id);
            return;
        }

        // 随机抽最多5题
        const shuffled = pool.sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(5, shuffled.length));
        const questions = selected.map(f => ({
            stem: f.stem,
            options: f.options,
            answer: f.answer
        }));

        // 切换到测试Tab并开始
        studySwitchTab('quiz');
        currentQuizSession = { questions, currentIndex: 0, correct: 0, total: questions.length };
        const container = document.getElementById('study-quiz-content');
        showQuizQuestion(container);
    }

    // ==================== 网课功能 ====================
    let lectureState = {
        active: false,
        sessionId: null,
        teacherId: null,
        materialId: null,
        messages: [],
        currentSection: 0,
        isPaused: false
    };

    // ==================== 会话列表（多窗口） ====================
    function studyShowLectureSessions() {
        document.getElementById('study-lecture-sessions').style.display = 'block';
        document.getElementById('study-lecture-setup').style.display = 'none';
        document.getElementById('study-lecture-active').style.display = 'none';
        const inputWrapper = document.getElementById('study-lecture-input-wrapper');
        if (inputWrapper) inputWrapper.style.display = 'none';
        const endBtn = document.getElementById('study-end-lecture-btn');
        if (endBtn) endBtn.style.display = 'none';
        document.getElementById('study-lecture-title').innerText = '网课学习';
        renderLectureSessions();
    }
    window.studyShowLectureSessions = studyShowLectureSessions;

    function renderLectureSessions() {
        initStudyData();
        const container = document.getElementById('study-lecture-sessions-list');
        if (!container) return;
        const sessions = (store.study.lectureSessions || []).slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

        let html = `<div class="sl-sessions-header">
            <div class="sl-sessions-title">课程会话</div>
            <button onclick="studyShowNewLecture()" class="study-btn-primary sl-new-btn"><i class="fas fa-plus"></i> 新建课程</button>
        </div>`;

        if (sessions.length === 0) {
            html += `<div class="study-empty-hint">
                <i class="fas fa-chalkboard-teacher" style="font-size:48px; margin-bottom:12px; display:block; opacity:0.1;"></i>
                还没有课程会话，点击上方"新建课程"开始学习吧
            </div>`;
        } else {
            html += sessions.map(s => {
                const isActive = s.status === 'active';
                const dateStr = new Date(s.updatedAt || s.createdAt).toLocaleString('zh-CN', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' });
                const msgCount = (s.messages || []).length;
                const lastMsg = s.messages && s.messages.length > 0 ? s.messages[s.messages.length - 1] : null;
                const preview = lastMsg ? (lastMsg.content || '').substring(0, 30) : '暂无消息';
                return `<div onclick="studyOpenSession('${s.id}')" class="sl-session-card ${isActive ? 'active' : ''}">
                    <img src="${s.teacherAvatar || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22><rect width=%2240%22 height=%2240%22 fill=%22%23333%22/><text x=%2220%22 y=%2226%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2214%22>T</text></svg>'}" class="sl-session-avatar">
                    <div class="sl-session-info">
                        <div class="sl-session-title-row">
                            <span class="sl-session-name">${escapeHtml(s.title || (s.teacherName + '的课堂'))}</span>
                            ${isActive ? '<span class="sl-session-badge">进行中</span>' : ''}
                        </div>
                        <div class="sl-session-preview">${escapeHtml(preview)}</div>
                        <div class="sl-session-meta">${dateStr} · ${msgCount}条消息</div>
                    </div>
                    <div class="sl-session-actions">
                        <i class="fas fa-chevron-right sl-session-arrow"></i>
                        <span onclick="event.stopPropagation(); studyDeleteSession('${s.id}')" class="sl-session-delete"><i class="far fa-trash-alt"></i></span>
                    </div>
                </div>`;
            }).join('');
        }
        container.innerHTML = html;
    }

    function studyShowNewLecture() {
        document.getElementById('study-lecture-sessions').style.display = 'none';
        document.getElementById('study-lecture-setup').style.display = 'block';
        document.getElementById('study-lecture-active').style.display = 'none';
        lectureState.sessionId = null;
        lectureState.teacherId = null;
        lectureState.materialId = null;
        renderLectureSetup();
    }
    window.studyShowNewLecture = studyShowNewLecture;

    function studyOpenSession(sessionId) {
        initStudyData();
        const session = (store.study.lectureSessions || []).find(s => s.id === sessionId);
        if (!session) { showToast('会话不存在', 'error'); return; }

        // 恢复 lectureState
        lectureState.sessionId = session.id;
        lectureState.teacherId = session.teacherId;
        lectureState.materialId = session.materialId;
        lectureState.messages = session.messages || [];
        lectureState.currentSection = session.currentSection || 0;
        lectureState.active = true;
        lectureState.isPaused = false;
        session.status = 'active';
        session.updatedAt = Date.now();
        save();

        // 切换到对话界面
        document.getElementById('study-lecture-sessions').style.display = 'none';
        document.getElementById('study-lecture-setup').style.display = 'none';
        document.getElementById('study-lecture-active').style.display = 'block';
        document.getElementById('study-lecture-title').innerText = session.title || (session.teacherName + '的课堂');
        const inputWrapper = document.getElementById('study-lecture-input-wrapper');
        if (inputWrapper) inputWrapper.style.display = 'flex';
        const endBtn = document.getElementById('study-end-lecture-btn');
        if (endBtn) endBtn.style.display = '';
        renderLectureMessages();
    }
    window.studyOpenSession = studyOpenSession;

    function studyDeleteSession(sessionId) {
        if (!confirm('确定删除这个课程会话？')) return;
        initStudyData();
        store.study.lectureSessions = (store.study.lectureSessions || []).filter(s => s.id !== sessionId);
        // 如果删除的是当前活跃会话，重置状态
        if (lectureState.sessionId === sessionId) {
            lectureState.active = false;
            lectureState.sessionId = null;
        }
        save();
        renderLectureSessions();
        showToast('会话已删除', 'info');
    }
    window.studyDeleteSession = studyDeleteSession;

    function renderLectureSetup() {
        initStudyData();
        const teacherList = document.getElementById('study-lecture-teacher-list');
        const materialList = document.getElementById('study-lecture-material-list');
        if (!teacherList || !materialList) return;

        // 显示setup，隐藏active、会话列表和输入框
        document.getElementById('study-lecture-sessions').style.display = 'none';
        document.getElementById('study-lecture-setup').style.display = 'block';
        document.getElementById('study-lecture-active').style.display = 'none';
        const inputWrapper = document.getElementById('study-lecture-input-wrapper');
        if (inputWrapper) inputWrapper.style.display = 'none';

        // 渲染联系人列表
        teacherList.innerHTML = store.contacts.map(c => `
            <div class="study-teacher-item ${lectureState.teacherId === c.id ? 'selected' : ''}" onclick="studySelectTeacher('${c.id}')">
                <img src="${c.avatar || _ph(40)}" alt="">
                <div>
                    <div class="teacher-name">${escapeHtml(c.name)}</div>
                    <div class="teacher-persona">${escapeHtml((c.persona || '').substring(0, 30))}</div>
                </div>
            </div>
        `).join('');

        // 渲染资料列表
        materialList.innerHTML = store.study.materials.map(m => `
        <div class="study-material-select ${lectureState.materialId === m.id ? 'selected' : ''}" onclick="studySelectLectureMaterial('${m.id}')">
            <i class="fas fa-book"></i>
            <div class="sms-info">
                <div class="sms-name">${escapeHtml(m.name)}</div>
                <div class="sms-type">${m.isEnglish ? '英文资料' : '中文资料'}</div>
            </div>
        </div>
    `).join('');
    }

    function studySelectTeacher(contactId) {
        lectureState.teacherId = contactId;
        renderLectureSetup();
    }

    function studySelectLectureMaterial(matId) {
        lectureState.materialId = matId;
        renderLectureSetup();
    }

    async function studyStartLecture() {
        if (!lectureState.teacherId) { showToast('请选择讲师', 'error'); return; }
        if (!lectureState.materialId) { showToast('请选择学习内容', 'error'); return; }

        const teacher = store.contacts.find(c => c.id === lectureState.teacherId);
        const mat = store.study.materials.find(m => m.id === lectureState.materialId);
        if (!teacher || !mat) return;

        // 创建新 session
        initStudyData();
        const newSession = {
            id: 'ls_' + Date.now(),
            title: teacher.name + '的课堂',
            teacherId: teacher.id,
            teacherName: teacher.name,
            teacherAvatar: teacher.avatar || '',
            materialId: mat.id,
            materialName: mat.name,
            messages: [],
            currentSection: 0,
            status: 'active',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        store.study.lectureSessions.push(newSession);
        // 限制会话数量
        if (store.study.lectureSessions.length > 40) {
            store.study.lectureSessions = store.study.lectureSessions.slice(-40);
        }
        save();

        lectureState.active = true;
        lectureState.sessionId = newSession.id;
        lectureState.messages = newSession.messages;
        lectureState.currentSection = 0;
        lectureState.isPaused = false;

        document.getElementById('study-lecture-sessions').style.display = 'none';
        document.getElementById('study-lecture-setup').style.display = 'none';
        document.getElementById('study-lecture-active').style.display = 'block';
        document.getElementById('study-lecture-title').innerText = `${teacher.name}的课堂`;
        // 显示底部输入框
        const inputWrapper = document.getElementById('study-lecture-input-wrapper');
        if (inputWrapper) inputWrapper.style.display = 'flex';
        // 显示结束课程按钮
        const endBtn = document.getElementById('study-end-lecture-btn');
        if (endBtn) endBtn.style.display = '';
        // [FIX-大退保存] 保存当前课程状态到localStorage，防止大退丢失
        _saveLectureStateToStorage();

        // 添加系统消息
        addLectureMessage('system', `${teacher.name}开始为你讲解「${mat.name}」`);

        // 开始讲课
        await lectureTalk(teacher, mat, '开始讲课');
    }

    async function lectureTalk(teacher, mat, action) {
        if (!lectureState.active) return;

        const content = mat.content || '';
        const lines = content.split('\n').filter(l => l.trim());
        const sectionSize = Math.min(5, lines.length);
        const startIdx = lectureState.currentSection * sectionSize;
        const section = lines.slice(startIdx, startIdx + sectionSize).join('\n');

        if (!section) {
            addLectureMessage('system', '📖 课程内容已全部讲完！你可以继续提问。');
            // 更新 session 状态但不关闭（用户可以继续提问）
            if (lectureState.sessionId) {
                const _s = (store.study.lectureSessions || []).find(s => s.id === lectureState.sessionId);
                if (_s) { _s.updatedAt = Date.now(); }
            }
            saveLectureHistory(teacher, mat);
            _clearLectureStorage();
            return;
        }

        const persona = teacher.persona || '';
        const isEnglish = mat.isEnglish;
        const hasMinimax = store.system.minimax && store.system.minimax.apiKey;

        let sysPrompt = `你是${teacher.name}，一位老师。${persona ? '你的人设：' + persona + '。' : ''}
你正在给学生上课，讲解以下学习内容。请用你自己的语气和风格来讲课。

当前要讲解的内容：
${section}

要求：
1. 用通俗易懂的方式讲解这些知识点
2. 保持你的角色特色和语气
3. 讲解要有条理，可以举例说明
4. 适当加入互动（可以问学生是否理解）`;

        if (isEnglish && hasMinimax) {
            sysPrompt += `\n5. 这是英文资料，请在讲解时教学生正确的英文发音（用中文注音标注）
6. 可以带读单词或句子`;
        }

        if (action === '随机提问') {
            sysPrompt += `\n\n注意：现在你要暂停讲课，对学生进行随机提问！
请根据已讲过的内容出一个问题考考学生。可以是选择题（提供A/B/C/D选项，末尾标注[答案:X]）或开放式问题。`;
        }

        addLectureMessage('system', `${teacher.name}正在思考...`);

        try {
            // 构建对话历史
            const historyMsgs = lectureState.messages
                .filter(m => m.type !== 'system')
                .slice(-10)
                .map(m => ({
                    role: m.type === 'teacher' ? 'assistant' : 'user',
                    content: m.content
                }));

            const msgs = [
                { role: 'system', content: sysPrompt },
                ...historyMsgs,
                { role: 'user', content: action === '开始讲课' ? '老师好，请开始上课！' : action }
            ];

            const data = await API.chatCompletion(msgs, 0.7, true);

            // 移除"正在思考"
            lectureState.messages = lectureState.messages.filter(m => m.content !== `${teacher.name}正在思考...`);

            if (data && data.choices && data.choices[0]) {
                const reply = data.choices[0].message.content;
                addLectureMessage('teacher', reply);

                // 英文发音教学（如果有MiniMax）
                if (isEnglish && hasMinimax && store.study.settings.pronunciation) {
                    // 提取英文单词/句子进行TTS
                    const englishWords = reply.match(/[a-zA-Z]{3,}/g);
                    if (englishWords && englishWords.length > 0) {
                        try {
                            const wordToSpeak = englishWords.slice(0, 3).join(', ');
                            const voiceId = teacher.settings?.voiceId || 'male-qn-qingse';
                            await API.textToSpeech(wordToSpeak, voiceId, 'en');
                        } catch (e) {
                            console.warn('[Study] TTS发音教学失败:', e);
                        }
                    }
                }

                // 随机触发小测（10%概率）
                if (Math.random() < 0.1 && action !== '随机提问') {
                    setTimeout(() => {
                        if (lectureState.active && !lectureState.isPaused) {
                            addLectureMessage('system', '⏸️ 老师暂停讲课，开始随堂小测...');
                            lectureTalk(teacher, mat, '随机提问');
                        }
                    }, 3000);
                }
            }
        } catch (e) {
            lectureState.messages = lectureState.messages.filter(m => m.content !== `${teacher.name}正在思考...`);
            addLectureMessage('system', '生成失败，请重试');
            console.warn('[Study] 网课讲课失败:', e);
        }
    }

    function addLectureMessage(type, content) {
        lectureState.messages.push({ type, content, time: Date.now() });
        // 同步到 session
        _syncLectureToSession();
        renderLectureMessages();
    }

    // 将当前 lectureState 同步到对应的 session
    function _syncLectureToSession() {
        if (!lectureState.sessionId) return;
        initStudyData();
        const session = (store.study.lectureSessions || []).find(s => s.id === lectureState.sessionId);
        if (session) {
            session.messages = lectureState.messages;
            session.currentSection = lectureState.currentSection;
            session.updatedAt = Date.now();
            // 限制每个会话消息数量
            if (session.messages.length > 100) {
                session.messages = session.messages.slice(-100);
                lectureState.messages = session.messages;
            }
        }
    }

    function renderLectureMessages() {
        const container = document.getElementById('study-lecture-messages');
        if (!container) return;
        container.innerHTML = lectureState.messages.map(m => {
            // 检测是否包含答题选项
            const hasOptions = m.content.match(/[A-D][.、:：]\s*.+/g);
            const hasAnswer = m.content.match(/\[答案[:：]\s*[A-Da-d]\]/);
            let extraClass = '';
            if (m.type === 'teacher' && hasOptions && hasAnswer) {
                extraClass = ' quiz-inline';
            }
            return `<div class="study-lecture-msg ${m.type}${extraClass}">${formatLectureContent(m.content)}</div>`;
        }).join('');
        container.scrollTop = container.scrollHeight;
    }

    function formatLectureContent(text) {
        // 简单的格式化
        return escapeHtml(text)
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\[答案[:：]\s*([A-Da-d])\]/g, '<span style="background:#e6f7ff; padding:2px 8px; border-radius:4px; font-size:12px;">答案: $1</span>');
    }

    function studyLectureSend() {
        const input = document.getElementById('study-lecture-input');
        if (!input) return;
        const text = input.value.trim();
        if (!text) return;
        input.value = '';

        if (!lectureState.active) {
            showToast('课程未开始', 'error');
            return;
        }

        addLectureMessage('student', text);

        const teacher = store.contacts.find(c => c.id === lectureState.teacherId);
        const mat = store.study.materials.find(m => m.id === lectureState.materialId);
        if (teacher && mat) {
            lectureTalk(teacher, mat, text);
        }
    }

    function studyLectureInterrupt() {
        if (!lectureState.active) {
            showToast('课程未开始', 'error');
            return;
        }
        const teacher = store.contacts.find(c => c.id === lectureState.teacherId);
        const mat = store.study.materials.find(m => m.id === lectureState.materialId);
        if (!teacher || !mat) return;

        addLectureMessage('student', '老师，我有问题！');
        addLectureMessage('system', '🙋 你举手了，老师暂停讲课');
    }

    function studyNextSection() {
        lectureState.currentSection++;
        _syncLectureToSession();
        const teacher = store.contacts.find(c => c.id === lectureState.teacherId);
        const mat = store.study.materials.find(m => m.id === lectureState.materialId);
        if (teacher && mat) {
            addLectureMessage('system', '📖 进入下一节...');
            lectureTalk(teacher, mat, '请继续讲下一部分的内容');
        }
    }

    // ==================== 网课历史存档 ====================
    function saveLectureHistory(teacher, mat) {
        // 同步到 session（新模式）
        _syncLectureToSession();
        // 同时保留旧的 lectureHistory 兼容
        initStudyData();
        const record = {
            id: 'lh_' + Date.now(),
            date: Date.now(),
            teacherId: teacher.id,
            teacherName: teacher.name,
            teacherAvatar: teacher.avatar || '',
            materialId: mat.id,
            materialName: mat.name,
            messages: lectureState.messages.map(m => ({
                type: m.type,
                content: m.content,
                time: m.time
            })),
            sectionsCompleted: lectureState.currentSection + 1
        };
        store.study.lectureHistory.push(record);
        if (store.study.lectureHistory.length > 50) {
            store.study.lectureHistory = store.study.lectureHistory.slice(-50);
        }
        save();
        showToast('课程记录已保存 📝', 'success');
    }

    // [FIX-大退保存] 保存当前课程状态到localStorage
    function _saveLectureStateToStorage() {
        try {
            if (!lectureState.active) return;
            localStorage.setItem('_activeLecture', JSON.stringify({
                sessionId: lectureState.sessionId,
                teacherId: lectureState.teacherId,
                materialId: lectureState.materialId,
                messages: lectureState.messages.slice(-30), // 只保留最近30条
                currentSection: lectureState.currentSection,
                time: Date.now()
            }));
        } catch(e) { console.warn('[study] 保存课程状态失败:', e); }
    }

    // [FIX-大退保存] 清除localStorage中的课程状态
    function _clearLectureStorage() {
        try { localStorage.removeItem('_activeLecture'); } catch(e) {}
    }

    // [FIX-大退保存] 页面加载时检测未结束的课程，自动保存到 session
    function _recoverUnfinishedLecture() {
        try {
            const saved = JSON.parse(localStorage.getItem('_activeLecture') || 'null');
            if (!saved || !saved.teacherId || !saved.materialId) return;
            initStudyData();
            const teacher = store.contacts.find(c => c.id === saved.teacherId);
            const mat = store.study.materials.find(m => m.id === saved.materialId);
            if (teacher && mat && saved.messages && saved.messages.length > 0) {
                // 如果有 sessionId，更新对应 session
                if (saved.sessionId) {
                    const session = (store.study.lectureSessions || []).find(s => s.id === saved.sessionId);
                    if (session) {
                        session.messages = saved.messages;
                        session.currentSection = saved.currentSection || 0;
                        session.status = 'ended';
                        session.updatedAt = Date.now();
                    }
                } else {
                    // 旧数据没有 sessionId，创建新 session
                    store.study.lectureSessions.push({
                        id: 'ls_' + Date.now(),
                        title: teacher.name + '的课堂（自动恢复）',
                        teacherId: teacher.id,
                        teacherName: teacher.name,
                        teacherAvatar: teacher.avatar || '',
                        materialId: mat.id,
                        materialName: mat.name,
                        messages: saved.messages,
                        currentSection: (saved.currentSection || 0),
                        status: 'ended',
                        createdAt: saved.time || Date.now(),
                        updatedAt: Date.now()
                    });
                }
                // 同时保留旧的 lectureHistory 兼容
                const record = {
                    id: 'lh_' + Date.now(),
                    date: saved.time || Date.now(),
                    teacherId: teacher.id,
                    teacherName: teacher.name,
                    teacherAvatar: teacher.avatar || '',
                    materialId: mat.id,
                    materialName: mat.name,
                    messages: saved.messages,
                    sectionsCompleted: (saved.currentSection || 0) + 1,
                    autoSaved: true
                };
                store.study.lectureHistory.push(record);
                if (store.study.lectureHistory.length > 50) {
                    store.study.lectureHistory = store.study.lectureHistory.slice(-50);
                }
                save();
                console.log('[study] 已自动保存未结束的课程到会话列表');
            }
            _clearLectureStorage();
        } catch(e) { console.warn('[study] 恢复课程失败:', e); _clearLectureStorage(); }
    }

    function studyEndLecture() {
        if (!lectureState.active) return;
        if (!confirm('确定结束当前课程？你可以稍后从会话列表继续。')) return;
        const teacher = store.contacts.find(c => c.id === lectureState.teacherId);
        const mat = store.study.materials.find(m => m.id === lectureState.materialId);
        if (teacher && mat) {
            addLectureMessage('system', '📖 课程已暂停');
            saveLectureHistory(teacher, mat);
        }
        // 更新 session 状态为 ended
        if (lectureState.sessionId) {
            initStudyData();
            const session = (store.study.lectureSessions || []).find(s => s.id === lectureState.sessionId);
            if (session) {
                session.status = 'ended';
                session.updatedAt = Date.now();
                save();
            }
        }
        lectureState.active = false;
        lectureState.isPaused = false;
        lectureState.sessionId = null;
        // 隐藏输入框和结束按钮
        const inputWrapper = document.getElementById('study-lecture-input-wrapper');
        if (inputWrapper) inputWrapper.style.display = 'none';
        const endBtn = document.getElementById('study-end-lecture-btn');
        if (endBtn) endBtn.style.display = 'none';
        _clearLectureStorage();
        // 返回会话列表
        studyShowLectureSessions();
    }

    function studyOpenLectureHistory() {
        initStudyData();
        const history = store.study.lectureHistory || [];
        let modal = document.getElementById('modal-lecture-history');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-lecture-history';
            modal.className = 'modal-mask';
            document.body.appendChild(modal);
        }

        if (history.length === 0) {
            modal.innerHTML = `
                <div class="modal-box" style="max-width:420px; max-height:80vh; display:flex; flex-direction:column;">
                    <div class="modal-title">📚 网课历史记录</div>
                    <div style="padding:40px 20px; text-align:center; color:#999;">
                        <i class="fas fa-inbox" style="font-size:48px; margin-bottom:12px; display:block; opacity:0.3;"></i>
                        还没有上过网课哦~
                    </div>
                    <div class="modal-actions">
                        <button class="btn-b" onclick="document.getElementById('modal-lecture-history').style.display='none'">关闭</button>
                    </div>
                </div>`;
            modal.style.display = 'flex';
            return;
        }

        const sortedHistory = [...history].sort((a, b) => b.date - a.date);
        const listHtml = sortedHistory.map(h => {
            const dateStr = new Date(h.date).toLocaleString('zh-CN', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' });
            const msgCount = h.messages ? h.messages.length : 0;
            return `<div class="study-history-item" onclick="studyViewLectureDetail('${h.id}')" style="display:flex; align-items:center; padding:12px; margin-bottom:8px; background:#fff; border-radius:12px; cursor:pointer; box-shadow:0 1px 4px rgba(0,0,0,0.06); transition:transform 0.15s;">
                <img src="${h.teacherAvatar || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22><rect width=%2240%22 height=%2240%22 fill=%22%23667eea%22/><text x=%2220%22 y=%2226%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2218%22>👨‍🏫</text></svg>'}" style="width:42px; height:42px; border-radius:50%; object-fit:cover; margin-right:12px; flex-shrink:0;">
                <div style="flex:1; overflow:hidden;">
                    <div style="font-weight:600; font-size:14px; color:#333; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(h.teacherName)}的课堂</div>
                    <div style="font-size:12px; color:#999; margin-top:2px;">${escapeHtml(h.materialName)}</div>
                    <div style="font-size:11px; color:#bbb; margin-top:2px;">${dateStr} · ${msgCount}条消息 · ${h.sectionsCompleted || 0}节</div>
                </div>
                <i class="fas fa-chevron-right" style="color:#ccc; font-size:12px; margin-left:8px;"></i>
            </div>`;
        }).join('');

        modal.innerHTML = `
            <div class="modal-box" style="max-width:420px; max-height:80vh; display:flex; flex-direction:column;">
                <div class="modal-title">📚 网课历史记录 <span style="font-size:12px; color:#999; font-weight:normal;">(${history.length}条)</span></div>
                <div class="scroll-y" style="flex:1; padding:12px; overflow-y:auto;">
                    ${listHtml}
                </div>
                <div class="modal-actions" style="display:flex; gap:8px;">
                    <button class="btn-b" onclick="studyClearLectureHistory()" style="color:#999;">清空全部</button>
                    <button class="btn-b" onclick="document.getElementById('modal-lecture-history').style.display='none'">关闭</button>
                </div>
            </div>`;
        modal.style.display = 'flex';
    }

    function studyViewLectureDetail(historyId) {
        initStudyData();
        const record = (store.study.lectureHistory || []).find(h => h.id === historyId);
        if (!record) { showToast('记录不存在', 'error'); return; }

        let modal = document.getElementById('modal-lecture-detail');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-lecture-detail';
            modal.className = 'modal-mask';
            document.body.appendChild(modal);
        }

        const dateStr = new Date(record.date).toLocaleString('zh-CN');
        const messagesHtml = (record.messages || []).map(m => {
            let className = 'study-lecture-msg ' + m.type;
            return `<div class="${className}" style="margin-bottom:8px; padding:8px 12px; border-radius:10px; font-size:13px; line-height:1.6; ${
                m.type === 'teacher' ? 'background:#e8f0fe; color:#1a237e; text-align:left;' :
                m.type === 'student' ? 'background:#111; color:#fff; text-align:right; margin-left:auto; max-width:80%;' :
                'background:#f0f0f0; color:#888; text-align:center; font-size:12px;'
            }">${formatLectureContent(m.content)}</div>`;
        }).join('');

        modal.innerHTML = `
            <div class="modal-box" style="max-width:440px; max-height:85vh; display:flex; flex-direction:column;">
                <div class="modal-title" style="display:flex; align-items:center; gap:8px;">
                    <img src="${record.teacherAvatar || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2232%22 height=%2232%22><rect width=%2232%22 height=%2232%22 fill=%22%23667eea%22/><text x=%2216%22 y=%2222%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2214%22>👨‍🏫</text></svg>'}" style="width:32px; height:32px; border-radius:50%; object-fit:cover;">
                    <div>
                        <div style="font-size:15px;">${escapeHtml(record.teacherName)}的课堂</div>
                        <div style="font-size:11px; color:#999; font-weight:normal;">${dateStr} · ${escapeHtml(record.materialName)}</div>
                    </div>
                </div>
                <div class="scroll-y" style="flex:1; padding:12px; overflow-y:auto; background:#f9f9f9; border-radius:8px; margin:0 12px;">
                    ${messagesHtml || '<div style="text-align:center; color:#ccc; padding:20px;">暂无消息记录</div>'}
                </div>
                <div class="modal-actions" style="display:flex; gap:8px;">
                    <button class="btn-b" onclick="studyDeleteLectureRecord('${record.id}')" style="color:#999;"><i class="fas fa-trash"></i> 删除</button>
                    <button class="btn-b" onclick="document.getElementById('modal-lecture-detail').style.display='none'; studyOpenLectureHistory();">返回列表</button>
                    <button class="btn-b" onclick="document.getElementById('modal-lecture-detail').style.display='none'">关闭</button>
                </div>
            </div>`;
        modal.style.display = 'flex';
    }

    function studyDeleteLectureRecord(historyId) {
        if (!confirm('确定删除这条课程记录？')) return;
        initStudyData();
        store.study.lectureHistory = (store.study.lectureHistory || []).filter(h => h.id !== historyId);
        save();
        showToast('记录已删除', 'info');
        document.getElementById('modal-lecture-detail').style.display = 'none';
        studyOpenLectureHistory();
    }

    function studyClearLectureHistory() {
        if (!confirm('确定清空所有网课历史记录？此操作不可撤销！')) return;
        initStudyData();
        store.study.lectureHistory = [];
        save();
        showToast('历史记录已清空', 'info');
        studyOpenLectureHistory();
    }

    // ==================== 开始复习 ====================
    async function studyStartReview(planId) {
        const plan = store.study.plans.find(p => p.id === planId);
        if (!plan) return;
        const mat = store.study.materials.find(m => m.id === plan.materialId);
        if (!mat) { showToast('找不到关联资料', 'error'); return; }

        // 切换到测试标签页
        studySwitchTab('quiz');
        
        // 从计划资料中生成题目
        startQuizSession([mat]);
    }

    // ==================== 设置 ====================
    function openStudySettings() {
        initStudyData();
        const s = store.study.settings;
        document.getElementById('study-setting-master').checked = s.masterSwitch;
        document.getElementById('study-setting-interval').value = s.popupInterval || 15;
        document.getElementById('study-setting-quiz-freq').value = s.quizFrequency || 10;
        document.getElementById('study-setting-persona').checked = s.usePersona !== false;
        document.getElementById('study-setting-pronunciation').checked = s.pronunciation || false;
        document.getElementById('modal-study-settings').style.display = 'flex';
    }

    function saveStudySettings() {
        initStudyData();
        store.study.settings.masterSwitch = document.getElementById('study-setting-master').checked;
        store.study.settings.popupInterval = parseInt(document.getElementById('study-setting-interval').value) || 15;
        store.study.settings.quizFrequency = parseInt(document.getElementById('study-setting-quiz-freq').value) || 10;
        store.study.settings.usePersona = document.getElementById('study-setting-persona').checked;
        store.study.settings.pronunciation = document.getElementById('study-setting-pronunciation').checked;
        save();
        updateMasterBanner();

        // 管理弹窗计时器
        if (store.study.settings.masterSwitch) {
            startStudyPopupTimer();
        } else {
            stopStudyPopupTimer();
        }
    }

    function toggleStudyMasterSwitch() {
        initStudyData();
        store.study.settings.masterSwitch = !store.study.settings.masterSwitch;
        save();
        updateMasterBanner();

        if (store.study.settings.masterSwitch) {
            startStudyPopupTimer();
            showToast('学习模式已开启，聊天时会弹出提问', 'success');
        } else {
            stopStudyPopupTimer();
            showToast('学习模式已关闭', 'info');
        }
    }

    // ==================== 清空学习数据 ====================
    function clearAllStudyData() {
        if (!confirm('确定要清空所有学习数据吗？\n\n将清除以下内容：\n• 所有学习资料（含自定义上传）\n• 所有复习计划\n• 所有测试记录和统计\n• 所有网课历史\n\n内置资料会在下次进入时自动重新加载。\n此操作不可撤销！')) return;

        // 停止所有计时器
        stopStudyPopupTimer();
        stopStudyReviewTimer();

        // 清空数据
        store.study = {
            materials: [],
            plans: [],
            quizHistory: [],
            lectureHistory: [],
            lectureSessions: [],
            favorites: [],
            settings: {
                masterSwitch: false,
                popupInterval: 15,
                quizFrequency: 10,
                usePersona: true,
                pronunciation: false
            },
            stats: {
                totalQuizzes: 0,
                totalCorrect: 0,
                todayCompleted: 0,
                todayTotal: 0,
                todayQuizzes: 0,
                todayCorrect: 0,
                lastDate: ''
            }
        };
        save();
        updateMasterBanner();

        // 更新设置界面
        document.getElementById('study-setting-master').checked = false;
        document.getElementById('study-setting-interval').value = 15;
        document.getElementById('study-setting-quiz-freq').value = 10;
        document.getElementById('study-setting-persona').checked = true;
        document.getElementById('study-setting-pronunciation').checked = false;

        // 关闭设置弹窗并刷新首页
        document.getElementById('modal-study-settings').style.display = 'none';
        if (typeof renderStudyHome === 'function') renderStudyHome();
        showToast('学习数据已全部清空', 'success');
    }

    // ==================== 随堂小测（复习过程中随机出现） ====================
    let studyReviewTimer = null;

    function startStudyReviewTimer() {
        stopStudyReviewTimer();
        if (!store.study || !store.study.settings.masterSwitch) return;
        const freq = (store.study.settings.quizFrequency || 10) * 60 * 1000;
        studyReviewTimer = setInterval(() => {
            // 检查是否正在学习App内
            const studyLayer = document.getElementById('layer-study');
            if (studyLayer && (studyLayer.classList.contains('show') || studyLayer.classList.contains('active'))) {
                triggerStudyPopup();
            }
        }, freq);
    }

    function stopStudyReviewTimer() {
        if (studyReviewTimer) {
            clearInterval(studyReviewTimer);
            studyReviewTimer = null;
        }
    }

    // ==================== 工具函数 ====================
    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ==================== 顶层切换（学习/监督）====================
    // 记录当前顶层视图：'study' 或 'supervise'
    let currentTopView = 'study';

    function studyTopSwitch(view, btnEl) {
        currentTopView = view;

        // 更新底部导航栏高亮
        document.querySelectorAll('.study-bottom-nav .study-bottom-item').forEach(b => b.classList.remove('active'));
        if (btnEl) {
            btnEl.classList.add('active');
        } else {
            // 通过 view 名找到对应按钮
            const bottomItems = document.querySelectorAll('.study-bottom-nav .study-bottom-item');
            if (view === 'study' && bottomItems[0]) bottomItems[0].classList.add('active');
            if (view === 'supervise' && bottomItems[1]) bottomItems[1].classList.add('active');
        }

        if (view === 'study') {
            // 显示学习页面，隐藏监督页面
            document.querySelectorAll('.study-tab').forEach(t => t.classList.remove('active'));
            const homeTab = document.getElementById('study-tab-home');
            if (homeTab) homeTab.classList.add('active');
            renderStudyHome();
        } else if (view === 'supervise') {
            // 显示监督页面，隐藏学习页面的所有tab
            document.querySelectorAll('.study-tab').forEach(t => t.classList.remove('active'));
            const svTab = document.getElementById('study-tab-supervise');
            if (svTab) svTab.classList.add('active');
            // 渲染监督内容
            if (typeof renderSupervise === 'function') {
                renderSupervise();
            }
        }
    }

    // ==================== 全局暴露 ====================
    window.studyTopSwitch = studyTopSwitch;
    window.renderStudyHome = renderStudyHome;
    window.studySwitchTab = studySwitchTab;
    window.studyFilterCategory = studyFilterCategory;
    window.studyUploadMaterial = studyUploadMaterial;
    window.saveStudyMaterial = saveStudyMaterial;
    window.handleStudyFileUpload = handleStudyFileUpload;
    window.studyViewMaterial = studyViewMaterial;
    window.studyDeleteMaterial = studyDeleteMaterial;
    window.openCreatePlanModal = openCreatePlanModal;
    window.saveStudyPlan = saveStudyPlan;
    window.studyPausePlan = studyPausePlan;
    window.studyResumePlan = studyResumePlan;
    window.studyDeletePlan = studyDeletePlan;
    window.studyTogglePlanComplete = studyTogglePlanComplete;
    window.studyStartQuiz = studyStartQuiz;
    window.studyAnswerQuiz = studyAnswerQuiz;
    window.studyStartReview = studyStartReview;
    window.studyStartLecture = studyStartLecture;
    window.studyLectureSend = studyLectureSend;
    window.studyLectureInterrupt = studyLectureInterrupt;
    window.studyNextSection = studyNextSection;
    window.studyEndLecture = studyEndLecture;
    window.studyOpenLectureHistory = studyOpenLectureHistory;
    window.studyViewLectureDetail = studyViewLectureDetail;
    window.studyDeleteLectureRecord = studyDeleteLectureRecord;
    window.studyClearLectureHistory = studyClearLectureHistory;
    window.studySelectTeacher = studySelectTeacher;
    window.studySelectLectureMaterial = studySelectLectureMaterial;
    window.openStudySettings = openStudySettings;
    window.saveStudySettings = saveStudySettings;
    window.toggleStudyMasterSwitch = toggleStudyMasterSwitch;
    window.clearAllStudyData = clearAllStudyData;
    window.closeStudyQuizPopup = closeStudyQuizPopup;
    window.submitStudyQuizPopup = submitStudyQuizPopup;
    window.triggerStudyPopup = triggerStudyPopup;
    window.startStudyPopupTimer = startStudyPopupTimer;
    window.stopStudyPopupTimer = stopStudyPopupTimer;
    window.studyCollectQuizQuestion = studyCollectQuizQuestion;
    window.studyCollectPopupQuiz = studyCollectPopupQuiz;
    window.studyQuizNext = studyQuizNext;
    window.renderStudyFavorites = renderStudyFavorites;
    window.studyFavFilter = studyFavFilter;
    window.studyFavDelete = studyFavDelete;
    window.studyFavNote = studyFavNote;
    window.studyFavRedo = studyFavRedo;
    window.studyFavPractice = studyFavPractice;

    // ==================== 陪伴时间统计系统 ====================
    var companionTimer = null;

    function initCompanionData() {
        if (!store.study) store.study = {};
        if (!store.study.companion) {
            store.study.companion = {
                totalSeconds: 0,
                todaySeconds: 0,
                lastDate: '',
                sessionStart: null,
                isActive: false,
                history: [],
                milestones: [],
                streak: 0,
                longestStreak: 0
            };
        }
        // 重置今日数据
        var today = new Date().toLocaleDateString();
        if (store.study.companion.lastDate !== today) {
            // 检查连续天数
            var yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            var yesterdayStr = yesterday.toLocaleDateString();
            if (store.study.companion.lastDate === yesterdayStr && store.study.companion.todaySeconds >= 600) {
                // 昨天学习超过10分钟，连续天数+1
            } else if (store.study.companion.lastDate && store.study.companion.lastDate !== yesterdayStr) {
                // 断了连续
                store.study.companion.streak = 0;
            }
            // 保存昨日记录
            if (store.study.companion.lastDate && store.study.companion.todaySeconds > 0) {
                store.study.companion.history.push({
                    date: store.study.companion.lastDate,
                    seconds: store.study.companion.todaySeconds
                });
                // 只保留最近30天
                if (store.study.companion.history.length > 30) {
                    store.study.companion.history = store.study.companion.history.slice(-30);
                }
            }
            store.study.companion.todaySeconds = 0;
            store.study.companion.lastDate = today;
        }
    }

    function startCompanionTimer() {
        initCompanionData();
        // [FIX-时长误记] 只有学习模式开启时才记录时长，防止未开学习模式也计时
        if (!store.study || !store.study.settings || !store.study.settings.masterSwitch) {
            console.log('[Study] 学习模式未开启，不启动陪伴计时器');
            return;
        }
        var c = store.study.companion;
        if (companionTimer) return; // 已在计时
        c.sessionStart = Date.now();
        c.isActive = true;
        companionTimer = setInterval(function() {
            if (!store.study || !store.study.companion) return;
            var cc = store.study.companion;
            cc.totalSeconds = (cc.totalSeconds || 0) + 30;
            cc.todaySeconds = (cc.todaySeconds || 0) + 30;
            // 检查今日是否达到10分钟（算一天学习）
            if (cc.todaySeconds >= 600 && cc.streak === 0) {
                cc.streak = 1;
            } else if (cc.todaySeconds === 600) {
                cc.streak = (cc.streak || 0) + 1;
                if (cc.streak > (cc.longestStreak || 0)) cc.longestStreak = cc.streak;
            }
            // 检查里程碑
            checkCompanionMilestones(cc);
            updateCompanionDisplay();
            if (typeof save === 'function') save();
        }, 30000); // 每30秒累加
        updateCompanionDisplay();
    }

    function stopCompanionTimer() {
        if (companionTimer) {
            clearInterval(companionTimer);
            companionTimer = null;
        }
        if (store.study && store.study.companion) {
            store.study.companion.isActive = false;
            store.study.companion.sessionStart = null;
            if (typeof save === 'function') save();
        }
    }

    var COMPANION_MILESTONES = [
        { seconds: 3600, name: '初次相伴', msg: '第一个小时，一起加油' },
        { seconds: 36000, name: '学习伙伴', msg: '已经陪你10小时了呢' },
        { seconds: 180000, name: '默契搭档', msg: '50小时的默契，继续保持' },
        { seconds: 360000, name: '百小时学霸', msg: '100小时！你真的很棒' },
        { seconds: 1800000, name: '学海同舟', msg: '500小时，我们是最佳拍档' },
        { seconds: 3600000, name: '千小时传说', msg: '1000小时的坚持，传说级别' }
    ];

    function checkCompanionMilestones(cc) {
        if (!cc.milestones) cc.milestones = [];
        COMPANION_MILESTONES.forEach(function(m) {
            if (cc.totalSeconds >= m.seconds && cc.milestones.indexOf(m.name) === -1) {
                cc.milestones.push(m.name);
                if (typeof showToast === 'function') {
                    showToast('里程碑解锁：' + m.name, 'success');
                }
            }
        });
    }

    function formatCompanionTime(seconds) {
        if (!seconds || seconds < 60) return '0分钟';
        var h = Math.floor(seconds / 3600);
        var m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return h + '小时' + (m > 0 ? m + '分钟' : '');
        return m + '分钟';
    }

    function updateCompanionDisplay() {
        initCompanionData();
        var cc = store.study.companion;
        var totalEl = document.getElementById('study-companion-total');
        var todayEl = document.getElementById('study-companion-today');
        var streakEl = document.getElementById('study-companion-streak');
        var milestoneEl = document.getElementById('study-companion-milestone');
        var bigTimeEl = document.getElementById('study-companion-big-time');

        if (totalEl) totalEl.textContent = formatCompanionTime(cc.totalSeconds);
        if (todayEl) todayEl.textContent = formatCompanionTime(cc.todaySeconds);
        if (streakEl) streakEl.textContent = cc.streak || 0;
        // 大字累计时长
        if (bigTimeEl) bigTimeEl.textContent = formatCompanionTime(cc.totalSeconds);

        // 显示最新里程碑
        if (milestoneEl && cc.milestones && cc.milestones.length > 0) {
            var latestName = cc.milestones[cc.milestones.length - 1];
            var milestone = COMPANION_MILESTONES.find(function(m) { return m.name === latestName; });
            if (milestone) {
                milestoneEl.textContent = milestone.name;
                milestoneEl.style.display = '';
            }
        } else if (milestoneEl) {
            milestoneEl.style.display = 'none';
        }
    }

    // 页面可见性变化时暂停/恢复计时
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            stopCompanionTimer();
        } else {
            // 检查学习页面是否打开
            // [FIX-时长误记] 恢复计时也需要检查学习模式是否开启
            var studyTab = document.getElementById('study-tab-home');
            if (studyTab && studyTab.classList.contains('active') && store.study?.settings?.masterSwitch) {
                startCompanionTimer();
            }
        }
    });

    // 暴露给外部
    window.startCompanionTimer = startCompanionTimer;
    window.stopCompanionTimer = stopCompanionTimer;
    window.updateCompanionDisplay = updateCompanionDisplay;

    // ==================== 陪伴详情面板 ====================
    function openCompanionDetail() {
        initCompanionData();
        var modal = document.getElementById('modal-companion-detail');
        var body = document.getElementById('companion-detail-body');
        if (!modal || !body) return;
        var cc = store.study.companion;

        // 总览卡片
        var html = '<div class="cd-summary">';
        html += '<div class="cd-summary-title">累计学习陪伴</div>';
        html += '<div class="cd-summary-time">' + formatCompanionTime(cc.totalSeconds) + '</div>';
        html += '<div class="cd-summary-row">';
        html += '<div class="cd-summary-item"><div class="val">' + formatCompanionTime(cc.todaySeconds) + '</div><div class="lbl">今日学习</div></div>';
        html += '<div class="cd-summary-item"><div class="val">' + (cc.streak || 0) + '天</div><div class="lbl">连续学习</div></div>';
        html += '<div class="cd-summary-item"><div class="val">' + (cc.longestStreak || 0) + '天</div><div class="lbl">最长连续</div></div>';
        html += '</div></div>';

        // 里程碑
        html += '<div class="cd-section-title">里程碑</div>';
        html += '<div class="cd-milestones">';
        COMPANION_MILESTONES.forEach(function(m) {
            var unlocked = cc.milestones && cc.milestones.indexOf(m.name) !== -1;
            var checkSvg = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="' + (unlocked ? '#111' : '#ccc') + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="20 6 9 17 4 12"/></svg>';
            html += '<div class="cd-milestone-tag ' + (unlocked ? '' : 'locked') + '">';
            html += checkSvg;
            html += '<span style="flex:1;font-weight:' + (unlocked ? '600' : '400') + ';">' + m.name + '</span>';
            html += '<span style="font-size:11px;color:' + (unlocked ? '#666' : '#ddd') + ';">' + m.msg + '</span>';
            html += '</div>';
        });
        html += '</div>';

        // 近7天图表
        var hist = (cc.history || []).slice(-6);
        var todayEntry = { date: new Date().toLocaleDateString(), seconds: cc.todaySeconds || 0 };
        var chartData = hist.concat([todayEntry]);
        while (chartData.length < 7) chartData.unshift({ date: '', seconds: 0 });
        chartData = chartData.slice(-7);
        var maxSec = Math.max.apply(null, chartData.map(function(d) { return d.seconds; })) || 1;

        html += '<div class="cd-chart">';
        html += '<div class="cd-section-title">近7天学习时长</div>';
        html += '<div class="cd-chart-bars">';
        var dayNames = ['日','一','二','三','四','五','六'];
        chartData.forEach(function(d, i) {
            var h = Math.max(2, Math.round(d.seconds / maxSec * 70));
            var dayLabel = '';
            if (d.date) {
                try { var dd = new Date(d.date); dayLabel = dayNames[dd.getDay()] || ''; } catch(e) { dayLabel = ''; }
            }
            if (i === chartData.length - 1) dayLabel = '今';
            html += '<div class="cd-chart-bar-wrap"><div class="cd-chart-bar" style="height:' + h + 'px;"></div>';
            html += '<div class="cd-chart-label">' + dayLabel + '</div></div>';
        });
        html += '</div></div>';

        // 联系人陪伴数据
        var contactMap = {};
        (store.study.lectureSessions || []).forEach(function(s) {
            if (!s.teacherId) return;
            if (!contactMap[s.teacherId]) {
                contactMap[s.teacherId] = { name: s.teacherName || '未知', avatar: s.teacherAvatar || '', sessions: 0, messages: 0 };
            }
            contactMap[s.teacherId].sessions++;
            contactMap[s.teacherId].messages += (s.messages || []).length;
        });
        var contacts = store.contacts || [];
        var contactList = [];
        contacts.forEach(function(c) {
            var entry = contactMap[c.id] || { name: c.name, avatar: c.avatar || '', sessions: 0, messages: 0 };
            entry.name = c.name;
            entry.avatar = c.avatar || entry.avatar || '';
            entry.id = c.id;
            var chatMsgs = (store.chats && store.chats[c.id]) || [];
            var studyMsgs = chatMsgs.filter(function(m) { return m.studyPopup || m.isStudyQuiz; }).length;
            entry.studyInteractions = studyMsgs;
            entry.totalScore = entry.sessions * 10 + entry.messages + entry.studyInteractions;
            if (entry.totalScore > 0) contactList.push(entry);
        });
        contactList.sort(function(a, b) { return b.totalScore - a.totalScore; });

        if (contactList.length > 0) {
            var topScore = contactList[0].totalScore;
            html += '<div class="cd-section-title" style="margin-top:20px;">联系人学习陪伴</div>';
            html += '<div class="cd-contact-list">';
            contactList.forEach(function(ct) {
                html += '<div class="cd-contact-card">';
                if (ct.avatar) {
                    html += '<img class="cd-contact-avatar" src="' + ct.avatar + '" onerror="this.style.display=\'none\'">';
                } else {
                    html += '<div class="cd-contact-avatar-placeholder">' + (ct.name || '?').charAt(0) + '</div>';
                }
                html += '<div class="cd-contact-info">';
                html += '<div class="cd-contact-name">' + (typeof escapeHtml === 'function' ? escapeHtml(ct.name) : ct.name) + '</div>';
                html += '<div class="cd-contact-stats">';
                if (ct.sessions > 0) html += '<span>' + ct.sessions + '节课</span>';
                if (ct.messages > 0) html += '<span>' + ct.messages + '条消息</span>';
                if (ct.studyInteractions > 0) html += '<span>' + ct.studyInteractions + '次提问</span>';
                html += '</div>';
                var pct = topScore > 0 ? Math.round(ct.totalScore / topScore * 100) : 0;
                html += '<div class="cd-contact-bar-outer"><div class="cd-contact-bar-inner" style="width:' + pct + '%;"></div></div>';
                html += '</div></div>';
            });
            html += '</div>';
        } else {
            html += '<div style="text-align:center;color:#aaa;padding:20px 0;font-size:13px;">暂无联系人学习数据</div>';
        }

        body.innerHTML = html;
        modal.style.display = 'flex';
    }

    function closeCompanionDetail() {
        var modal = document.getElementById('modal-companion-detail');
        if (modal) modal.style.display = 'none';
    }

    window.openCompanionDetail = openCompanionDetail;
    window.closeCompanionDetail = closeCompanionDetail;

    // 在renderStudyHome中启动计时
    var _origRenderStudyHome = renderStudyHome;
    renderStudyHome = function() {
        _origRenderStudyHome();
        // [FIX-时长误记] startCompanionTimer内部已有masterSwitch检查，
        // 未开启学习模式时不会启动计时器
        startCompanionTimer();
        updateCompanionDisplay();
    };
    window.renderStudyHome = renderStudyHome;

    // ==================== 初始化 ====================
    // 页面加载后检查是否需要启动弹窗计时器
    setTimeout(() => {
        initStudyData();
        initCompanionData();
        // [FIX-大退保存] 检测并恢复未结束的课程
        _recoverUnfinishedLecture();
        if (store.study && store.study.settings && store.study.settings.masterSwitch) {
            startStudyPopupTimer();
            startStudyReviewTimer();
        }
    }, 3000);

    // [FIX-大退保存] 页面关闭/刷新前保存课程状态
    window.addEventListener('beforeunload', function() {
        if (lectureState.active) {
            _saveLectureStateToStorage();
        }
        stopCompanionTimer();
    });

})();
