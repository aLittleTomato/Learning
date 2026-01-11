/**
 * 图片记忆游戏
 * 使用ES5语法
 */

var PictureMemoryGame = (function () {
    "use strict";

    // 游戏状态
    var state = {
        phase: "welcome", // welcome, rules, prepare, warmup, test, result, details
        currentRound: 0,
        totalRounds: 0,
        startTime: 0,
        pictures: [], // 图片序列
        history: [], // 答题历史
        appearedPictures: {}, // 已出现的图片ID及其出现轮次
        currentPictureId: null,
        isWarmup: true,
        currentDetailsIndex: 0,
        pictureTimer: null,
    };

    // 游戏配置
    var config = {
        warmup: {
            totalPictures: 4,
            totalRounds: 2,
            distribution: {
                once: 1,
                twice: 2,
                thrice: 1,
            },
        },
        test: {
            totalPictures: 25,
            totalRounds: 5,
            distribution: {
                once: 5,
                twice: 15,
                thrice: 5,
            },
        },
        pictureDisplayTime: 3000, // 每张图片显示3秒
        countdownTime: 3, // 准备倒计时3秒
    };

    // 图片资源（使用占位图）
    var picturePool = [
        "../images/game-picture/cat.webp",
        "../images/game-picture/rabbit.webp",
        "https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=1",
        "https://via.placeholder.com/400x400/4ECDC4/FFFFFF?text=2",
        "https://via.placeholder.com/400x400/45B7D1/FFFFFF?text=3",
        "https://via.placeholder.com/400x400/FFA07A/FFFFFF?text=4",
        "https://via.placeholder.com/400x400/98D8C8/FFFFFF?text=5",
        "https://via.placeholder.com/400x400/F7DC6F/FFFFFF?text=6",
        "https://via.placeholder.com/400x400/BB8FCE/FFFFFF?text=7",
        "https://via.placeholder.com/400x400/85C1E2/FFFFFF?text=8",
        "https://via.placeholder.com/400x400/F8B88B/FFFFFF?text=9",
        "https://via.placeholder.com/400x400/FAD7A0/FFFFFF?text=10",
        "https://via.placeholder.com/400x400/D5DBDB/FFFFFF?text=11",
        "https://via.placeholder.com/400x400/AED6F1/FFFFFF?text=12",
        "https://via.placeholder.com/400x400/A9DFBF/FFFFFF?text=13",
        "https://via.placeholder.com/400x400/F9E79F/FFFFFF?text=14",
        "https://via.placeholder.com/400x400/FADBD8/FFFFFF?text=15",
        "https://via.placeholder.com/400x400/E8DAEF/FFFFFF?text=16",
        "https://via.placeholder.com/400x400/D6EAF8/FFFFFF?text=17",
        "https://via.placeholder.com/400x400/D1F2EB/FFFFFF?text=18",
        "https://via.placeholder.com/400x400/FCF3CF/FFFFFF?text=19",
        "https://via.placeholder.com/400x400/EBDEF0/FFFFFF?text=20",
        "https://via.placeholder.com/400x400/D4E6F1/FFFFFF?text=21",
        "https://via.placeholder.com/400x400/A3E4D7/FFFFFF?text=22",
        "https://via.placeholder.com/400x400/F8C471/FFFFFF?text=23",
        "https://via.placeholder.com/400x400/EC7063/FFFFFF?text=24",
        "https://via.placeholder.com/400x400/AF7AC5/FFFFFF?text=25",
    ];

    /**
     * 初始化游戏
     */
    function init() {
        console.log("图片记忆游戏初始化");
        state.phase = "welcome";
        showPage("page-welcome");
    }

    /**
     * 显示页面
     */
    function showPage(pageId) {
        var pages = document.querySelectorAll(".page");
        for (var i = 0; i < pages.length; i++) {
            pages[i].classList.remove("active");
        }
        var targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add("active");
        }
    }

    /**
     * 显示规则页
     */
    function showRules() {
        state.phase = "rules";
        showPage("page-rules");
    }

    /**
     * 开始热身阶段
     */
    function startWarmup() {
        state.isWarmup = true;
        state.phase = "prepare";
        prepareGame(config.warmup);
    }

    /**
     * 开始正式测试
     */
    function startTest() {
        state.isWarmup = false;
        state.phase = "prepare";
        prepareGame(config.test);
    }

    /**
     * 准备游戏
     */
    function prepareGame(gameConfig) {
        // 生成图片序列
        state.pictures = generatePictureSequence(gameConfig);
        state.totalRounds = gameConfig.totalRounds;
        state.currentRound = 0;
        state.history = [];
        state.appearedPictures = {};
        state.startTime = Date.now();

        // 显示准备页面并倒计时
        showPage("page-prepare");
        startCountdown();
    }

    /**
     * 生成图片序列
     */
    function generatePictureSequence(gameConfig) {
        var sequence = [];
        var pictureIds = [];
        var totalPictures = gameConfig.totalPictures;

        // 选择图片ID
        for (var i = 0; i < totalPictures; i++) {
            pictureIds.push(i);
        }

        // 根据分布生成序列
        var dist = gameConfig.distribution;
        var index = 0;

        // 出现1次的图片
        for (var j = 0; j < dist.once; j++) {
            sequence.push(pictureIds[index]);
            index++;
        }

        // 出现2次的图片
        for (var k = 0; k < dist.twice; k++) {
            sequence.push(pictureIds[index]);
            sequence.push(pictureIds[index]);
            index++;
        }

        // 出现3次的图片
        for (var m = 0; m < dist.thrice; m++) {
            sequence.push(pictureIds[index]);
            sequence.push(pictureIds[index]);
            sequence.push(pictureIds[index]);
            index++;
        }

        // 打乱序列
        return shuffleArray(sequence);
    }

    /**
     * 打乱数组
     */
    function shuffleArray(array) {
        var result = array.slice();
        for (var i = result.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = result[i];
            result[i] = result[j];
            result[j] = temp;
        }
        return result;
    }

    /**
     * 开始倒计时
     */
    function startCountdown() {
        var countdownEl = document.getElementById("number-display");
        var count = config.countdownTime;

        countdownEl.textContent = count;

        var timer = setInterval(function () {
            count--;
            if (count > 0) {
                countdownEl.textContent = count;
                // 添加缩放动画
                countdownEl.style.transform = "scale(0.5)";
                countdownEl.style.opacity = "0";
                setTimeout(function () {
                    countdownEl.style.transform = "scale(1)";
                    countdownEl.style.opacity = "1";
                }, 100);
            } else {
                clearInterval(timer);
                startGame();
            }
        }, 1000);
    }

    /**
     * 开始游戏
     */
    function startGame() {
        if (state.isWarmup) {
            state.phase = "warmup";
            showPage("page-test");
        } else {
            state.phase = "test";
            showPage("page-test");
        }
        showNextPicture();
    }

    /**
     * 显示下一张图片
     */
    function showNextPicture() {
        if (state.currentRound >= state.totalRounds) {
            // 游戏结束
            if (state.isWarmup) {
                // 热身结束，开始正式测试
                showReady();
            } else {
                // 正式测试结束，显示结算
                showResult();
            }
            return;
        }

        var pictureId = state.pictures[state.currentRound];
        state.currentPictureId = pictureId;
        var pictureUrl = picturePool[pictureId];

        // 更新进度
        state.currentRound++;
        updateProgress();

        // 显示图片
        var imgEl = document.getElementById("test-picture");
        imgEl.src = pictureUrl;

        // 记录图片出现
        if (!state.appearedPictures[pictureId]) {
            state.appearedPictures[pictureId] = [];
        }
        state.appearedPictures[pictureId].push(state.currentRound);

        // 启用按钮
        var btnEl = document.getElementById("test-btn");
        btnEl.disabled = false;

        // 设置自动跳过计时器
        clearTimeout(state.pictureTimer);
        state.pictureTimer = setTimeout(function () {
            // 未点击，记录为未点击
            recordAnswer(false);
        }, config.pictureDisplayTime);
    }

    /**
     * 显示倒序规则页面
     */
    function showReady() {
        // 切换页面
        var currentPage = Utils.getCurrentPage();
        var rulesPage = document.getElementById("page-task");

        if (currentPage) {
            Animation.pageTransition(currentPage, rulesPage, function () {
                // currentPage.classList.remove("active");
                // rulesPage.classList.add("active");
            });
        } else {
            rulesPage.classList.add("active");
        }
    }

    /**
     * 更新进度
     */
    function updateProgress() {
        var progressText = state.currentRound + " / " + state.totalRounds;
        var progressPercent = (state.currentRound / state.totalRounds) * 100;

        document.getElementById("test-progress").textContent = progressText;
        document.getElementById("test-progress-fill").style.width =
            progressPercent + "%";
    }

    /**
     * 点击答案按钮
     */
    function clickAnswer() {
        // 清除自动跳过计时器
        clearTimeout(state.pictureTimer);

        // 禁用按钮
        var btnEl = document.getElementById("test-btn");
        btnEl.disabled = true;

        // 记录答案
        recordAnswer(true);
    }

    /**
     * 记录答案
     */
    function recordAnswer(clicked) {
        var pictureId = state.currentPictureId;
        var appearCount = state.appearedPictures[pictureId].length;
        var shouldClick = appearCount > 1; // 第2次及以后出现应该点击
        var isCorrect = clicked === shouldClick;

        // 记录到历史
        var record = {
            round: state.currentRound,
            pictureId: pictureId,
            clicked: clicked,
            shouldClick: shouldClick,
            correct: isCorrect,
            appearCount: appearCount,
            timestamp: Date.now(),
        };
        state.history.push(record);

        // 如果错误且在热身阶段，显示错误提示
        if (!isCorrect && state.isWarmup) {
            showError(clicked, shouldClick);
        } else {
            // 直接下一题
            setTimeout(function () {
                showNextPicture();
            }, 300);
        }
    }

    /**
     * 显示结算页面
     */
    function showResult() {
        state.phase = "result";
        showPage("page-result");

        // 计算统计数据
        var stats = calculateStats();

        // 显示统计数据
        var totalTime = Math.floor((Date.now() - state.startTime) / 1000);
        document.getElementById("stat-blue").textContent = totalTime + "秒";
        document.getElementById("stat-green").textContent =
            stats.accuracy.toFixed(0) + "%";
        document.getElementById("stat-purple").textContent =
            stats.missRate.toFixed(0) + "%";
        document.getElementById("stat-orange").textContent =
            stats.falseRate.toFixed(0) + "%";

        let green1Text =
            stats.falseRate.toFixed(0) != 0
                ? (stats.missRate / stats.falseRate).toFixed(0)
                : 0;
        document.getElementById("stat-green1").textContent = green1Text + "%";

        // 根据正确率显示称号
        var title = "记忆新手";
        if (stats.accuracy >= 90) {
            title = "记忆大师";
        } else if (stats.accuracy >= 80) {
            title = "数字专家";
        } else if (stats.accuracy >= 70) {
            title = "记忆达人";
        }
        // 上报数据
        reportGameData(stats);
    }

    /**
     * 计算统计数据
     */
    function calculateStats() {
        var total = state.history.length;
        var correct = 0;
        var shouldClickTotal = 0;
        var shouldClickCorrect = 0;
        var shouldNotClickTotal = 0;
        var shouldNotClickCorrect = 0;

        for (var i = 0; i < state.history.length; i++) {
            var record = state.history[i];
            if (record.correct) {
                correct++;
            }

            if (record.shouldClick) {
                shouldClickTotal++;
                if (record.clicked) {
                    shouldClickCorrect++;
                }
            } else {
                shouldNotClickTotal++;
                if (!record.clicked) {
                    shouldNotClickCorrect++;
                }
            }
        }

        var accuracy = total > 0 ? (correct / total) * 100 : 0;
        var missRate =
            shouldClickTotal > 0
                ? ((shouldClickTotal - shouldClickCorrect) / shouldClickTotal) *
                  100
                : 0;
        var falseRate =
            shouldNotClickTotal > 0
                ? ((shouldNotClickTotal - shouldNotClickCorrect) /
                      shouldNotClickTotal) *
                  100
                : 0;

        return {
            total: total,
            correct: correct,
            accuracy: accuracy,
            missRate: missRate,
            falseRate: falseRate,
        };
    }

    /**
     * 上报游戏数据
     */
    function reportGameData(stats) {
        var data = {
            gameType: "picture-memory",
            totalTime: Math.floor((Date.now() - state.startTime) / 1000),
            accuracy: stats.accuracy,
            missRate: stats.missRate,
            falseRate: stats.falseRate,
            history: state.history,
            timestamp: Date.now(),
        };

        // 调用API上报
        if (typeof API !== "undefined" && API.submitTestResult) {
            API.submitTestResult(data)
                .then(function (response) {
                    console.log("数据上报成功", response);
                })
                .catch(function (error) {
                    console.error("数据上报失败", error);
                });
        }
    }

    /**
     * 查看作答详情
     */
    function viewDetails() {
        state.phase = "details";
        state.currentDetailsIndex = 0;
        showPage("page-details");
        renderDetails();
    }

    /**
     * 渲染详情页面
     */
    function renderDetails() {
        var index = state.currentDetailsIndex;
        var record = state.history[index];

        // 更新进度
        document.getElementById("details-progress").textContent =
            index + 1 + "/" + state.history.length;

        // 显示图片
        var pictureUrl = picturePool[record.pictureId];
        document.getElementById("details-picture").src = pictureUrl;

        // 显示出现记录
        var historyText = "";
        var appearRounds = state.appearedPictures[record.pictureId];
        var item = document.getElementById("picture-history");
        if (appearRounds.length === 1) {
            historyText = "这张图片在之前没有重复出现";
            item.classList.add("hide");
        } else {
            historyText =
                "这张图片在第 " + appearRounds.join("、") + " 题出现过";
            item.classList.remove("hide");
        }
        document.getElementById("picture-history").textContent = historyText;

        // 更新导航按钮状态
        document.getElementById("btn-prev").disabled = index === 0;
        document.getElementById("btn-next").disabled =
            index === state.history.length - 1;
    }

    /**
     * 上一题
     */
    function prevQuestion() {
        if (state.currentDetailsIndex > 0) {
            state.currentDetailsIndex--;
            renderDetails();
        }
    }

    /**
     * 下一题
     */
    function nextQuestion() {
        if (state.currentDetailsIndex < state.history.length - 1) {
            state.currentDetailsIndex++;
            renderDetails();
        }
    }

    /**
     * 显示题目列表
     */
    function showList() {
        var popup = document.getElementById("list-popup");
        popup.classList.add("active");

        // 计算正确率
        var stats = calculateStats();
        document.getElementById("popup-accuracy").textContent =
            "" + stats.accuracy.toFixed(0) + "%";

        // 生成题目网格
        var grid = document.getElementById("question-grid");
        grid.innerHTML = "";

        for (var i = 0; i < state.history.length; i++) {
            var record = state.history[i];
            var btn = document.createElement("button");
            btn.className = "question-item";
            btn.textContent = i + 1;
            btn.setAttribute("data-index", i);

            if (record.correct) {
                btn.classList.add("correct");
            } else {
                btn.classList.add("wrong");
            }

            // 添加点击事件
            (function (index) {
                btn.onclick = function () {
                    state.currentDetailsIndex = index;
                    hideList();
                    renderDetails();
                };
            })(i);

            grid.appendChild(btn);
        }
    }

    /**
     * 隐藏题目列表
     */
    function hideList() {
        var popup = document.getElementById("list-popup");
        popup.classList.remove("active");
    }

    /**
     * 返回结算页
     */
    function backToResult() {
        state.phase = "result";
        showPage("page-result");
    }

    /**
     * 重新开始
     */
    function restart() {
        state.phase = "welcome";
        state.currentRound = 0;
        state.history = [];
        state.appearedPictures = {};
        showPage("page-welcome");
    }

    /**
     * 返回主页
     */
    function backToHome() {
        window.location.href = "../index.html";
    }

    /**
     * 显示错误提示
     */
    function showError(clicked, shouldClick) {
        var errorEl = document.getElementById("warmup-error");
        var errorText = document.getElementById("warmup-error-text");

        if (clicked && !shouldClick) {
            errorText.textContent = "这张图片没有重复出现哦";
        } else if (!clicked && shouldClick) {
            errorText.textContent = "这张图片出现过，需要点击哦";
        }

        errorEl.classList.add("show");

        // 1.5秒后隐藏并继续
        setTimeout(function () {
            errorEl.classList.remove("show");
            setTimeout(function () {
                showNextPicture();
            }, 300);
        }, 1500);
    }

    function getNextPageId() {
        var pageSequence = [
            "page-welcome",
            "page-rule-1",
            "page-rule-2",
            "page-prepare",
            "page-tutorial",
            "page-task",
            "page-game",
            "page-result",
        ];

        var currentPage = Utils.getCurrentPage();
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
     * 切换到下一页
     */
    function nextPage() {
        var currentPage = Utils.getCurrentPage();
        var nextPageId = getNextPageId();

        if (!nextPageId) {
            console.error("No next page found");
            return;
        }

        var nextPage = document.getElementById(nextPageId);
        if (!nextPage) {
            console.error("Next page element not found:", nextPageId);
            return;
        }

        // 页面切换动画
        Animation.pageTransition(currentPage, nextPage);
    }

    // 导出公共方法
    return {
        init: init,
        showRules: showRules,
        startWarmup: startWarmup,
        startTest: startTest,
        clickAnswer: clickAnswer,
        state: state,
        showResult: showResult,
        viewDetails: viewDetails,
        prevQuestion: prevQuestion,
        nextQuestion: nextQuestion,
        showList: showList,
        hideList: hideList,
        backToResult: backToResult,
        restart: restart,
        backToHome: backToHome,
        nextPage: nextPage,
    };
})();

// 页面加载完成后初始化
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", PictureMemoryGame.init);
} else {
    PictureMemoryGame.init();
}
