/**
 * 注意力测试游戏逻辑 - 使用 ES5 语法
 */

var AttentionGame = (function () {
    'use strict';

    // 游戏状态
    var state = {
        currentPageIndex: 0,
        gamePhase: 'welcome', // welcome, mindset, task, rules-1, rules-2, tutorial, game, result
        tutorialData: {
            items: [],
            selected: [],
            correctCount: 0,
            errors: 0
        },
        gameData: {
            pages: [],
            currentPage: 0,
            totalPages: 3,
            timePerPage: 70,
            startTime: null,
            pageTimes: [],
            pageResults: []
        },
        results: {
            totalTime: 0,
            correctCount: 0,
            errorCount: 0,
            omissionCount: 0,
            accuracy: 0,
            speed: 0,
            focus: 0
        }
    };

    var timers = {
        gameTimer: null,
        mascotIdle: null
    };

    /**
     * 初始化游戏
     */
    function init() {
        console.log('Initializing Attention Game...');

        // 初始化配置
        Config.init();

        // 绑定欢迎页点击事件
        var welcomePage = document.getElementById('page-welcome');
        if (welcomePage) {
            welcomePage.addEventListener('click', function () {
                nextPage();
            });
        }

        // 启动吉祥物闲置动画
        startMascotIdleAnimation();

        console.log('Attention Game initialized');
    }

    /**
     * 启动吉祥物闲置动画
     */
    function startMascotIdleAnimation() {
        var mascots = document.querySelectorAll('.mascot');
        for (var i = 0; i < mascots.length; i++) {
            timers.mascotIdle = Animation.startMascotIdle(mascots[i]);
        }
    }

    /**
     * 切换到下一页
     */
    function nextPage() {
        var currentPage = getCurrentPage();
        var nextPageId = getNextPageId();

        if (!nextPageId) {
            console.error('No next page found');
            return;
        }

        var nextPage = document.getElementById(nextPageId);
        if (!nextPage) {
            console.error('Next page element not found:', nextPageId);
            return;
        }

        // 页面切换动画
        Animation.pageTransition(currentPage, nextPage, function () {
            // 更新当前页面
            if (currentPage) {
                currentPage.classList.remove('active');
            }
            
            nextPage.classList.add('active');
            // 更新游戏阶段
            updateGamePhase(nextPageId);

            // 猴子探头动画
            var mascot = nextPage.querySelector('.mascot');
            if (mascot) {
                Animation.mascotPeek(mascot);
            }
        });
    }

    /**
     * 获取当前页面元素
     */
    function getCurrentPage() {
        return document.querySelector('.page.active');
    }

    /**
     * 获取下一页ID
     */
    function getNextPageId() {
        var pageSequence = [
            'page-welcome',
            'page-mindset',
            'page-task',
            'page-rules-1',
            'page-rules-2',
            'page-tutorial',
            'page-game',
            'page-result'
        ];

        var currentPage = getCurrentPage();
        if (!currentPage) {
            return pageSequence[0];
        }

        var currentIndex = pageSequence.indexOf(currentPage.id);
        if (currentIndex === -1 || currentIndex === pageSequence.length - 1) {
            return null;
        }

        return pageSequence[currentIndex + 1];
    }

    /**
     * 更新游戏阶段
     */
    function updateGamePhase(pageId) {
        var phaseMap = {
            'page-welcome': 'welcome',
            'page-mindset': 'mindset',
            'page-task': 'task',
            'page-rules-1': 'rules-1',
            'page-rules-2': 'rules-2',
            'page-tutorial': 'tutorial',
            'page-game': 'game',
            'page-result': 'result'
        };

        state.gamePhase = phaseMap[pageId] || state.gamePhase;
        console.log('Game phase:', state.gamePhase);
    }

    /**
     * 显示规则页面
     */
    function showRules() {
        var currentPage = getCurrentPage();
        var rulesPage = document.getElementById('page-rules-1');

        Animation.pageTransition(currentPage, rulesPage, function () {
            currentPage.classList.remove('active');
            rulesPage.classList.add('active');
            updateGamePhase('page-rules-1');

            var mascot = rulesPage.querySelector('.mascot');
            if (mascot) {
                Animation.mascotPeek(mascot);
            }
        });
    }

    /**
     * 开始练习模式
     */
    function startTutorial() {
        console.log('Starting tutorial...');

        var currentPage = getCurrentPage();
        var tutorialPage = document.getElementById('page-tutorial');

        // 生成练习题目
        generateTutorialItems();
        // 渲染练习网格
        renderTutorialGrid();

        Animation.pageTransition(currentPage, tutorialPage, function () {
            currentPage.classList.remove('active');
            tutorialPage.classList.add('active');
            updateGamePhase('page-tutorial');

        });
    }

    /**
     * 生成练习题目
     */
    function generateTutorialItems() {
        var config = Config.get('games.attention');
        var totalItems = config.practiceItems || 6;
        var correctItems = config.practiceCorrectItems || 2;

        var items = [];

        // 生成正确的 q
        for (var i = 0; i < correctItems; i++) {
            items.push(generateCorrectQ());
        }

        // 生成错误的字母
        for (var j = correctItems; j < totalItems; j++) {
            items.push(generateIncorrectLetter());
        }

        // 打乱顺序
        items = Utils.shuffleArray(items);

        state.tutorialData.items = items;
        state.tutorialData.selected = [];
        state.tutorialData.correctCount = correctItems;
        state.tutorialData.errors = 0;

        console.log('Tutorial items generated:', items);
    }

    /**
     * 生成正确的 q（带两条竖线）
     */
    function generateCorrectQ() {
        var types = [
            // 上下有两条
            { top: '||',letter: 'q', bottom: ''},
            { top: '',letter: 'q', bottom: '||'},
            // 上下各一条
            { top: '| ',letter: 'q', bottom: '| '},
            { top: '| ',letter: 'q', bottom: ' |'},
            { top: ' |',letter: 'q', bottom: '| '},
            { top: ' |',letter: 'q', bottom: ' |'},

        ];

        var type = types[Utils.randomInt(0, types.length - 1)];

        return {
            letter: type.letter,
            top: type.top,
            bottom: type.bottom,
            display: type.display,
            isCorrect: true
        };
    }

    /**
     * 生成错误的字母
     */
    function generateIncorrectLetter() {
        var types = [
            // 不是 q 的字母
            // 上下有两条
            { top: '||',letter: 'b', bottom: ''},
            { top: '',letter: 'b', bottom: '||'},
            // 上下各一条b
            { top: '| ',letter: 'b', bottom: '| '},
            { top: '| ',letter: 'b', bottom: ' |'},
            { top: ' |',letter: 'b', bottom: '| '},
            { top: ' |',letter: 'b', bottom: ' |'},
            // 上下只有一条
            { top: ' |',letter: 'b', bottom: '  '},
            { top: '| ',letter: 'b', bottom: '  '},
            { top: '  ',letter: 'b', bottom: '| '},
            { top: '  ',letter: 'b', bottom: ' |'},
            // 上下都没有
            { top: '  ',letter: 'b', bottom: '  '},

            // 上下有两条
            { top: '||',letter: 'p', bottom: ''},
            { top: '',letter: 'p', bottom: '||'},
            // 上下各一条b
            { top: '| ',letter: 'p', bottom: '| '},
            { top: '| ',letter: 'p', bottom: ' |'},
            { top: ' |',letter: 'p', bottom: '| '},
            { top: ' |',letter: 'p', bottom: ' |'},
            // 上下只有一条
            { top: ' |',letter: 'p', bottom: '  '},
            { top: '| ',letter: 'p', bottom: '  '},
            { top: '  ',letter: 'p', bottom: '| '},
            { top: '  ',letter: 'p', bottom: ' |'},
            // 上下都没有
            { top: '  ',letter: 'p', bottom: '  '},

            // 上下有两条
            { top: '||',letter: 'd', bottom: ''},
            { top: '',letter: 'd', bottom: '||'},
            // 上下各一条b
            { top: '| ',letter: 'd', bottom: '| '},
            { top: '| ',letter: 'd', bottom: ' |'},
            { top: ' |',letter: 'd', bottom: '| '},
            { top: ' |',letter: 'd', bottom: ' |'},
            // 上下只有一条
            { top: ' |',letter: 'd', bottom: '  '},
            { top: '| ',letter: 'd', bottom: '  '},
            { top: '  ',letter: 'd', bottom: '| '},
            { top: '  ',letter: 'd', bottom: ' |'},
            // 上下都没有
            { top: '  ',letter: 'd', bottom: '  '},

            // 上下只有一条
            { top: ' |',letter: 'q', bottom: '  '},
            { top: '| ',letter: 'q', bottom: '  '},
            { top: '  ',letter: 'q', bottom: '| '},
            { top: '  ',letter: 'q', bottom: ' |'},
            // 上下都没有
            { top: '  ',letter: 'q', bottom: '  '},
        ];

        var type = types[Utils.randomInt(0, types.length - 1)];

        return {
            letter: type.letter,
            top: type.top,
            bottom: type.bottom,
            isCorrect: false
        };
    }

    /**
     * 渲染练习网格
     */
    function renderTutorialGrid() {
        var grid = document.getElementById('tutorial-grid');
        if (!grid) return;

        grid.innerHTML = '';

        for (var i = 0; i < state.tutorialData.items.length; i++) {
            var item = state.tutorialData.items[i];
            var gridItem = document.createElement('div');
            gridItem.className = 'grid-item';

            var top = document.createElement('div');
            top.className = 'mark';
            top.innerHTML = item.top;

            var mid = document.createElement('div');
            mid.className = 'letter';
            mid.innerHTML = item.letter;

            var bottom = document.createElement('div');
            bottom.className = 'mark';
            bottom.innerHTML = item.bottom;

            gridItem.appendChild(top);
            gridItem.appendChild(mid);
            gridItem.appendChild(bottom);


            gridItem.setAttribute('data-index', i);

            gridItem.addEventListener('click', function () {
                handleTutorialItemClick(this);
            });

            grid.appendChild(gridItem);
        }
    }

    /**
     * 处理练习模式的点击事件
     */
    function handleTutorialItemClick(element) {
        var index = parseInt(element.getAttribute('data-index'));
        var item = state.tutorialData.items[index];

        var isSelected = state.tutorialData.selected.indexOf(index) !== -1;

        if (isSelected) {
            // 取消选中
            state.tutorialData.selected = state.tutorialData.selected.filter(function (i) {
                return i !== index;
            });
            element.classList.remove('selected', 'correct', 'error');
            Animation.deselectFeedback(element);
        } else {
            // 选中
            state.tutorialData.selected.push(index);
            element.classList.add('selected');
            Animation.selectFeedback(element);

            // 检查是否正确
            if (item.isCorrect) {
                element.classList.add('correct');
                element.classList.remove('error');

                // 检查是否完成
                checkTutorialComplete();
            } else {
                element.classList.add('error');
                element.classList.remove('correct');
                state.tutorialData.errors++;

                // 错误提示
                Animation.errorShake(element);
                Utils.showToast('这个不是正确的 q 哦', 'error', 1000);

                // 1秒后恢复默认色
                setTimeout(function () {
                    element.classList.remove('selected', 'error');
                    state.tutorialData.selected = state.tutorialData.selected.filter(function (i) {
                        return i !== index;
                    });
                }, 1000);
            }
        }
    }

    /**
     * 检查练习是否完成
     */
    function checkTutorialComplete() {
        var correctSelected = 0;

        for (var i = 0; i < state.tutorialData.selected.length; i++) {
            var index = state.tutorialData.selected[i];
            var item = state.tutorialData.items[index];
            if (item.isCorrect) {
                correctSelected++;
            }
        }

        if (correctSelected === state.tutorialData.correctCount) {
            // 完成练习
            var completeDiv = document.getElementById('tutorial-complete');
            if (completeDiv) {
                completeDiv.style.display = 'block';
            }

            // 禁用所有选项
            var gridItems = document.querySelectorAll('#tutorial-grid .grid-item');
            for (var j = 0; j < gridItems.length; j++) {
                gridItems[j].classList.add('disabled');
            }
        }
    }

    // 导出公共方法
    return {
        init: init,
        nextPage: nextPage,
        showRules: showRules,
        startTutorial: startTutorial,
        generateCorrectQ: generateCorrectQ,
        generateIncorrectLetter: generateIncorrectLetter,
        startMainGame: null, // 将在第2部分定义
        nextGamePage: null, // 将在第2部分定义
        viewDetails: null, // 将在第2部分定义
        restart: null // 将在第2部分定义
    };
})();

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', AttentionGame.init);
} else {
    AttentionGame.init();
}

/**
 * 开始正式游戏
 */
AttentionGame.startMainGame = function () {
    console.log('Starting main game...');

    var currentPage = AttentionGame.getCurrentPage ? AttentionGame.getCurrentPage() : document.querySelector('.page.active');
    var gamePage = document.getElementById('page-game');

    // 生成游戏数据
    generateGameData();
    startGamePage(0);

    Animation.tutorialToGameTransition(currentPage, gamePage, function () {
        currentPage.classList.remove('active');
        gamePage.classList.add('active');

        // 开始第一页游戏
    });
};

/**
 * 生成游戏数据
 */
function generateGameData() {
    var config = Config.get('games.attention');
    var totalPages = config.pages || 3;
    var itemsPerPage = config.itemsPerPage || 56;
    var correctItemsPerPage = config.correctItemsPerPage || 25;

    AttentionGame.state.gameData = {};
    AttentionGame.state.gameData.pages = [];
    AttentionGame.state.gameData.totalPages = totalPages;
    AttentionGame.state.gameData.timePerPage = config.timePerPage || 20;

    for (var i = 0; i < totalPages; i++) {
        var items = [];

        // 生成正确的 q
        for (var j = 0; j < correctItemsPerPage; j++) {
            items.push(AttentionGame.generateCorrectQ());
        }

        // 生成错误的字母
        for (var k = correctItemsPerPage; k < itemsPerPage; k++) {
            items.push(AttentionGame.generateIncorrectLetter());
        }

        // 打乱顺序
        items = Utils.shuffleArray(items);

        AttentionGame.state.gameData.pages.push({
            items: items,
            selected: [],
            startTime: null,
            endTime: null,
            timeSpent: 0
        });
    }

    console.log('Game data generated:', AttentionGame.state.gameData.pages.length, 'pages');
}

/**
 * 开始某一页游戏
 */
function startGamePage(pageIndex) {
    AttentionGame.state.gameData.currentPage = pageIndex;
    var pageData = AttentionGame.state.gameData.pages[pageIndex];

    // 更新页面信息
    var currentPageSpan = document.getElementById('current-page');
    var totalPagesSpan = document.getElementById('total-pages');
    if (currentPageSpan) currentPageSpan.textContent = pageIndex + 1;
    if (totalPagesSpan) totalPagesSpan.textContent = AttentionGame.state.gameData.totalPages;

    // 更新按钮文本
    var btnNext = document.getElementById('btn-next');
    if (btnNext) {
        if (pageIndex === AttentionGame.state.gameData.totalPages - 1) {
            btnNext.textContent = '完成测试';
        } else {
            btnNext.textContent = '下一部分';
        }
    }

    // 渲染游戏网格
    renderGameGrid(pageData.items);

    // 开始计时
    pageData.startTime = Date.now();
    startGameTimer();
}

/**
 * 渲染游戏网格
 */
function renderGameGrid(items) {
    var grid = document.getElementById('main-grid');
    if (!grid) return;

    grid.innerHTML = '';

    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var gridItem = document.createElement('div');
        gridItem.className = 'grid-item';
        // gridItem.textContent = item.display;
        gridItem.setAttribute('data-index', i);

        var top = document.createElement('div');
            top.className = 'mark--small';
            top.innerHTML = item.top;

            var mid = document.createElement('div');
            mid.className = 'letter--small';
            mid.innerHTML = item.letter;

            var bottom = document.createElement('div');
            bottom.className = 'mark--small';
            bottom.innerHTML = item.bottom;

            gridItem.appendChild(top);
            gridItem.appendChild(mid);
            gridItem.appendChild(bottom);


        gridItem.addEventListener('click', function () {
            handleGameItemClick(this);
        });

        grid.appendChild(gridItem);
    }
}

/**
 * 处理游戏模式的点击事件
 */
function handleGameItemClick(element) {
    var pageIndex = AttentionGame.state.gameData.currentPage;
    var pageData = AttentionGame.state.gameData.pages[pageIndex];
    var index = parseInt(element.getAttribute('data-index'));

    var isSelected = pageData.selected.indexOf(index) !== -1;

    if (isSelected) {
        // 取消选中
        pageData.selected = pageData.selected.filter(function (i) {
            return i !== index;
        });
        element.classList.remove('selected');
        Animation.deselectFeedback(element);
    } else {
        // 选中
        pageData.selected.push(index);
        element.classList.add('selected');
        Animation.selectFeedback(element);
    }
}

/**
 * 开始游戏计时器
 */
function startGameTimer() {
    var timeLeft = AttentionGame.state.gameData.timePerPage;
    updateTimerDisplay(timeLeft);

    // 清除之前的计时器
    if (AttentionGame.timers.gameTimer) {
        clearInterval(AttentionGame.timers.gameTimer);
    }

    AttentionGame.timers.gameTimer = setInterval(function () {
        timeLeft--;
        updateTimerDisplay(timeLeft);

        if (timeLeft <= 0) {
            clearInterval(AttentionGame.timers.gameTimer);
            // 时间到，自动进入下一页
            AttentionGame.nextGamePage();
        }
    }, 1000);
}

/**
 * 更新计时器显示
 */
function updateTimerDisplay(seconds) {
    var timerElement = document.getElementById('game-timer');
    if (!timerElement) return;

    timerElement.textContent = Utils.formatTime(seconds);

    // 根据剩余时间改变样式
    timerElement.classList.remove('warning', 'danger');
    if (seconds <= 5) {
        timerElement.classList.add('danger');
    } else if (seconds <= 10) {
        timerElement.classList.add('warning');
    }
}

/**
 * 下一页游戏
 */
AttentionGame.nextGamePage = function () {
    // 停止计时器
    if (AttentionGame.timers.gameTimer) {
        clearInterval(AttentionGame.timers.gameTimer);
    }

    var pageIndex = AttentionGame.state.gameData.currentPage;
    var pageData = AttentionGame.state.gameData.pages[pageIndex];

    // 记录结束时间
    pageData.endTime = Date.now();
    pageData.timeSpent = Math.floor((pageData.endTime - pageData.startTime) / 1000);

    // 计算本页结果
    calculatePageResult(pageIndex);

    // 检查是否还有下一页
    if (pageIndex < AttentionGame.state.gameData.totalPages - 1) {
        // 翻页动画
        var currentGrid = document.getElementById('main-grid');
        var nextPageIndex = pageIndex + 1;

        // 创建临时网格用于动画
        var tempGrid = currentGrid.cloneNode(true);
        tempGrid.id = 'temp-grid';
        currentGrid.parentNode.appendChild(tempGrid);

        startGamePage(nextPageIndex);
        requestAnimationFrame(() => {
        Animation.gamePageTransition(tempGrid, currentGrid, function () {
            currentGrid.parentNode.removeChild(tempGrid);
            // 开始下一页
        });

        });
       
    } else {
        // 游戏结束，显示结果
        showResult();
    }
};

/**
 * 计算某一页的结果
 */
function calculatePageResult(pageIndex) {
    var pageData = AttentionGame.state.gameData.pages[pageIndex];
    var items = pageData.items;
    var selected = pageData.selected;

    var correctCount = 0;
    var errorCount = 0;
    var omissionCount = 0;

    // 统计正确答案数量
    var totalCorrect = 0;
    for (var i = 0; i < items.length; i++) {
        if (items[i].isCorrect) {
            totalCorrect++;
        }
    }

    // 检查选中的项目
    for (var j = 0; j < selected.length; j++) {
        var index = selected[j];
        var item = items[index];

        if (item.isCorrect) {
            correctCount++;
        } else {
            errorCount++;
        }
    }

    // 计算遗漏数
    omissionCount = totalCorrect - correctCount;

    pageData.result = {
        correctCount: correctCount,
        errorCount: errorCount,
        omissionCount: omissionCount,
        totalCorrect: totalCorrect
    };

    console.log('Page', pageIndex + 1, 'result:', pageData.result);
}

/**
 * 显示结果页面
 */
function showResult() {
    console.log('Showing result...');

    // 计算总体结果
    calculateTotalResult();

    var gamePage = document.getElementById('page-game');
    var resultPage = document.getElementById('page-result');

    Animation.gameToResultTransition(gamePage, resultPage, function () {
        gamePage.classList.remove('active');
        resultPage.classList.add('active');

        // 渲染结果
        renderResult();

        // 徽章动画
        var badge = resultPage.querySelector('.result-badge');
        if (badge) {
            Animation.badgeStamp(badge, 200);
        }

        // 上报测试数据
        submitTestData();
    });
}

/**
 * 计算总体结果
 */
function calculateTotalResult() {
    var totalTime = 0;
    var totalCorrect = 0;
    var totalError = 0;
    var totalOmission = 0;
    var totalItems = 0;

    for (var i = 0; i < AttentionGame.state.gameData.pages.length; i++) {
        var pageData = AttentionGame.state.gameData.pages[i];
        var result = pageData.result;

        totalTime += pageData.timeSpent;
        totalCorrect += result.correctCount;
        totalError += result.errorCount;
        totalOmission += result.omissionCount;
        totalItems += result.totalCorrect;
    }

    // 计算指标
    var completedItems = totalCorrect + totalError + totalOmission;
    var accuracy = completedItems > 0 ? Math.round((totalCorrect / completedItems) * 100) : 0;
    var speed = totalCorrect + totalError + totalOmission;
    var focus = totalCorrect - (totalError + totalOmission);

    AttentionGame.state.results = {
        totalTime: totalTime,
        correctCount: totalCorrect,
        errorCount: totalError,
        omissionCount: totalOmission,
        totalItems: totalItems,
        accuracy: accuracy,
        speed: speed,
        focus: focus
    };

    console.log('Total result:', AttentionGame.state.results);
}

/**
 * 渲染结果
 */
function renderResult() {
    var results = AttentionGame.state.results;

    // 更新标题
    var title = document.getElementById('result-title');
    if (title) {
        if (results.accuracy >= 90) {
            title.textContent = '真正的字母侦探！';
        } else if (results.accuracy >= 70) {
            title.textContent = '表现不错！';
        } else {
            title.textContent = '继续加油！';
        }
    }

    // 更新统计数据
    var statTime = document.getElementById('stat-time');
    var statAccuracy = document.getElementById('stat-accuracy');
    var statSpeed = document.getElementById('stat-speed');
    var statFocus = document.getElementById('stat-focus');

    if (statTime) statTime.textContent = Utils.formatTime(results.totalTime);
    if (statAccuracy) statAccuracy.textContent = results.accuracy + '%';
    if (statSpeed) statSpeed.textContent = results.speed;
    if (statFocus) statFocus.textContent = results.focus;
}

/**
 * 上报测试数据
 */
function submitTestData() {
    var testData = {
        gameType: 'attention',
        timestamp: Date.now(),
        token: Config.get('user.token'),
        results: AttentionGame.state.results,
        details: {
            pages: AttentionGame.state.gameData.pages.map(function (page) {
                return {
                    timeSpent: page.timeSpent,
                    result: page.result
                };
            })
        }
    };

    API.submitTestData(testData).then(function (response) {
        console.log('Test data submitted:', response);
    }).catch(function (error) {
        console.error('Failed to submit test data:', error);
        Utils.showToast('数据上报失败，已保存到本地', 'error');
    });
}

/**
 * 查看答题详情
 */
AttentionGame.viewDetails = function () {
    Utils.showToast('答题详情功能开发中', 'info');
    // TODO: 实现答题详情页面
};

/**
 * 重新开始
 */
AttentionGame.restart = function () {
    console.log('Restarting game...');

    // 重置状态
    AttentionGame.state.gameData = {
        pages: [],
        currentPage: 0,
        totalPages: 3,
        timePerPage: 70,
        startTime: null,
        pageTimes: [],
        pageResults: []
    };

    AttentionGame.state.results = {
        totalTime: 0,
        correctCount: 0,
        errorCount: 0,
        omissionCount: 0,
        accuracy: 0,
        speed: 0,
        focus: 0
    };

    // 重新加载页面
    window.location.reload();
};

// 暴露内部函数供其他函数使用
AttentionGame.getCurrentPage = function () {
    return document.querySelector('.page.active');
};

AttentionGame.state = AttentionGame.state || {};
AttentionGame.timers = AttentionGame.timers || {};
