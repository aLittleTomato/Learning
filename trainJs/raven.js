/**
 * 瑞文推理游戏
 * 使用ES5语法，无ES6特性
 */

var RavenGame = (function () {
    "use strict";

    // 游戏状态
    var state = {
        phase: "welcome", // welcome, rules, game, result, details
        currentQuestion: 0, // 当前题目索引（0-59）
        answers: [], // 用户答案数组
        startTime: null, // 开始时间
        endTime: null, // 结束时间
        questions: [], // 题目数组
        totalQuestion: 60,
    };

    const answer = [
        [4, 5, 1, 2, 6, 3, 6, 2, 1, 3, 4, 5], // A
        [2, 6, 1, 2, 1, 3, 5, 6, 4, 3, 4, 5], // B
        [8, 2, 3, 8, 7, 4, 5, 1, 7, 6, 1, 2], // C
        [3, 4, 3, 7, 8, 6, 5, 4, 1, 2, 5, 6], // D
        [7, 6, 8, 2, 1, 5, 1, 6, 3, 2, 4, 5], // E
    ];

    // 页面元素
    var pages = {
        welcome: null,
        rules: null,
        game: null,
        result: null,
        details: null,
    };

    /**
     * 初始化游戏
     */
    function init() {
        // 预加载所有图片资源
        var imagesToPreload = [];

        getImgUrls(imagesToPreload);

        Preloader.preload({
            images: imagesToPreload,
            container: document.body,
            onComplete: function () {
                console.log("所有资源加载完成");
                initGame();
            },
        });
    }

    function getImgUrls(imagesToPreload) {
        var factors = ["A", "B", "C", "D", "E"];

        for (var i = 0; i < factors.length; i++) {
            var factor = factors[i];

            for (var j = 1; j <= 12; j++) {
                var questionId = factor + j;
                imagesToPreload.push(
                    "../images/game4/question/" + questionId + ".png"
                );
            }
        }
    }
    function initGame() {
        // 绑定欢迎页点击事件
        var welcomePage = document.getElementById("page-welcome");
        if (welcomePage) {
            welcomePage.classList.add("active");
        }
        // 获取页面元素
        pages.welcome = document.getElementById("page-welcome");
        pages.rules = document.getElementById("page-rules");
        pages.game = document.getElementById("page-game");
        pages.result = document.getElementById("page-result");
        pages.details = document.getElementById("page-details");

        // 生成题目
        state.questions = generateQuestions();

        // 初始化答案数组
        for (var i = 0; i < 60; i++) {
            state.answers.push(null);
        }

        // 显示欢迎页
        showPage("welcome");
    }

    /**
     * 生成题目数据
     */
    function generateQuestions() {
        var questions = [];
        var factors = ["A", "B", "C", "D", "E"];

        for (var i = 0; i < factors.length; i++) {
            var factor = factors[i];
            var optionCount = factor === "A" || factor === "B" ? 6 : 8;

            for (var j = 1; j <= 12; j++) {
                var questionId = factor + j;
                var correctAnswer = answer[i][j - 1];

                questions.push({
                    id: questionId,
                    factor: factor,
                    questionImage:
                        "../images/game4/question/" + questionId + ".png",
                    options: optionCount,
                    correctAnswer: correctAnswer,
                });
            }
        }

        return questions;
    }

    /**
     * 显示页面
     */
    function showPage(pageName) {
        // 隐藏所有页面
        for (var key in pages) {
            if (pages[key]) {
                pages[key].classList.remove("active");
            }
        }

        // 显示目标页面
        if (pages[pageName]) {
            pages[pageName].classList.add("active");
            state.phase = pageName;
        }
    }

    /**
     * 显示规则页
     */
    function showRules() {
        showPage("rules");
    }

    /**
     * 开始游戏
     */
    function startGame() {
        var currentPage = Utils.getCurrentPage();
        if (currentPage) currentPage.classList.remove("active");
        Utils.playSound("click");

        state.startTime = Date.now();
        state.currentQuestion = 0;
        showPage("game");
        renderQuestion();
    }

    /**
     * 渲染题目
     */
    function renderQuestion() {
        var question = state.questions[state.currentQuestion];
        if (!question) return;

        let index = state.currentQuestion + 1;
        var progressText = index + "/" + state.totalQuestion;
        var progressPercent = (index / state.totalQuestion) * 90;

        document.getElementById("test-progress").textContent = progressText;
        let outItem = document.getElementById("test-progress-fill");
        outItem.style.width = 10 + progressPercent + "%";

        // 更新进度
        // document.getElementById("current-progress").textContent =
        //     state.currentQuestion + 1 + "/60";

        // 更新题目标签
        document.getElementById("question-label").textContent = question.id;

        // 更新题目图片
        document.getElementById("question-image").src = question.questionImage;

        // 渲染选项
        renderOptions(question);

        // 更新导航按钮状态
        updateNavButtons();
    }

    /**
     * 渲染选项
     */
    function renderOptions(question) {
        var container = document.getElementById("options-container");
        container.innerHTML = "";

        for (var i = 1; i <= question.options; i++) {
            var option = document.createElement("div");
            option.className = "option-item";
            option.textContent = i;
            option.setAttribute("data-value", i);

            // 如果已经选择过，标记为选中
            if (state.answers[state.currentQuestion] === i) {
                option.classList.add("selected");
            }

            // 绑定点击事件
            (function (value) {
                option.onclick = function () {
                    Utils.playSound("click");
                    selectAnswer(value);
                };
            })(i);

            container.appendChild(option);
        }

        if (question.options == 8) {
            container.classList.add("eight");
        } else {
            container.classList.remove("eight");
        }

        /* 永远两行 */
        const cols = Math.ceil(question.options / 2);

        container.style.setProperty("--cols", cols);
    }

    /**
     * 选择答案
     */
    function selectAnswer(value) {
        // 记录答案
        state.answers[state.currentQuestion] = value;

        // 更新选项样式
        var options = document.querySelectorAll(".option-item");
        for (var i = 0; i < options.length; i++) {
            options[i].classList.remove("selected");
            if (parseInt(options[i].getAttribute("data-value")) === value) {
                options[i].classList.add("selected");
            }
        }
        updateNavButtons();
        // 自动进入下一题（延迟200ms，让用户看到选中效果）
        // setTimeout(function () {
        //     if (state.currentQuestion < 59) {
        //         nextQuestion();
        //     } else {
        //         finishGame();
        //     }
        // }, 200);
    }

    /**
     * 下一题
     */
    function nextQuestion() {
        Utils.playSound("click");
        if (state.currentQuestion < state.totalQuestion - 1) {
            state.currentQuestion++;
            renderQuestion();
        } else {
            showSubmitConfirm();
        }
    }

    /**
     * 上一题
     */
    function prevQuestion() {
        if (state.currentQuestion > 0) {
            Utils.playSound("click");
            state.currentQuestion--;
            renderQuestion();
        }
    }

    /**
     * 更新导航按钮状态
     */
    function updateNavButtons() {
        var btnPrev = document.getElementById("btn-prev");
        var btnNext = document.getElementById("btn-next");

        // 第一题禁用上一题按钮
        if (state.currentQuestion === 0) {
            btnPrev.disabled = true;
        } else {
            btnPrev.disabled = false;
        }

        btnNext.disabled = state.answers[state.currentQuestion] == null;

        // 最后一题显示"完成"
        if (state.currentQuestion === state.totalQuestion - 1) {
            btnNext.textContent = "完成";
        } else {
            btnNext.textContent = "下一题";
        }
    }

    /**
     * 完成游戏
     */
    function finishGame() {
        Utils.playSound("success");
        state.endTime = Date.now();
        calculateStats();
        showPage("result");
        renderResult();
    }

    /**
     * 计算统计数据
     */
    function calculateStats() {
        var total = 60;
        var correct = 0;
        var factorStats = {};

        for (var i = 0; i < state.questions.length; i++) {
            var question = state.questions[i];
            var userAnswer = state.answers[i];
            var isCorrect = userAnswer === question.correctAnswer;

            if (isCorrect) correct++;

            // 统计每个因子
            if (!factorStats[question.factor]) {
                factorStats[question.factor] = { total: 0, correct: 0 };
            }
            factorStats[question.factor].total++;
            if (isCorrect) factorStats[question.factor].correct++;
        }

        // 保存统计数据
        state.stats = {
            total: total,
            correct: correct,
            accuracy: (correct / total) * 100,
            factorStats: factorStats,
            totalTime: Math.floor((state.endTime - state.startTime) / 1000),
        };
    }

    /**
     * 渲染结算页
     */
    function renderResult() {
        var stats = state.stats;

        // 显示作答时间
        var minutes = Math.floor(stats.totalTime / 60);
        var seconds = stats.totalTime % 60;
        document.getElementById("stat-blue").textContent =
            minutes + "分" + seconds + "秒";

        // 显示总正确率
        document.getElementById("stat-green").textContent =
            stats.accuracy.toFixed(1) + "%";

        var factors = ["A", "B", "C", "D", "E"];
        for (var i = 0; i < factors.length; i++) {
            var factor = factors[i];
            var factorData = stats.factorStats[factor];

            var factorItem = document.getElementById("stat-purple-" + factor);
            var accuracy = (factorData.correct / factorData.total) * 100;

            factorItem.textContent = accuracy.toFixed(0) + "%";
        }

        // 上报数据
        submitGameData();
    }

    /**
     * 提交游戏数据
     */
    function submitGameData() {
        var data = {
            gameType: "raven",
            totalTime: state.stats.totalTime,
            accuracy: state.stats.accuracy,
            factorStats: state.stats.factorStats,
            answers: [],
            timestamp: Date.now(),
        };

        // 添加答题记录
        for (var i = 0; i < state.questions.length; i++) {
            var question = state.questions[i];
            var userAnswer = state.answers[i];
            data.answers.push({
                questionId: question.id,
                factor: question.factor,
                userAnswer: userAnswer,
                correctAnswer: question.correctAnswer,
                isCorrect: userAnswer === question.correctAnswer,
            });
        }

        // 调用API上报
        if (typeof API !== "undefined" && API.submitTestData) {
            API.submitTestData(data);
        }
    }

    /**
     * 查看作答详情
     */
    function viewDetails() {
        state.currentQuestion = 0;
        showPage("details");
        renderDetail();
        Utils.playSound("click");
    }

    /**
     * 渲染详情
     */
    function renderDetail() {
        var question = state.questions[state.currentQuestion];
        var userAnswer = state.answers[state.currentQuestion];

        // 更新进度
        document.getElementById("details-progress").textContent =
            state.currentQuestion + 1 + "/60";

        // 更新题目
        document.getElementById("details-label").textContent = question.id;
        document.getElementById("details-image").src = question.questionImage;

        // 更新导航按钮
        updateDetailNavButtons();
        renderDetailOptions(question, userAnswer);
    }

    function renderDetailOptions(question, userAnswer) {
        var container = document.getElementById("question-container");
        container.innerHTML = "";

        for (var i = 1; i <= question.options; i++) {
            var option = document.createElement("div");
            option.className = "option-item";
            option.textContent = i;
            option.setAttribute("data-value", i);

            if (i == userAnswer) {
                option.classList.add("error");
            }

            // 如果已经选择过，标记为选中
            if (question.correctAnswer === i) {
                option.classList.remove("error");
                option.classList.add("correct");
            }

            container.appendChild(option);
        }

        if (question.options == 8) {
            container.classList.add("eight");
        } else {
            container.classList.remove("eight");
        }

        /* 永远两行 */
        const cols = Math.ceil(question.options / 2);

        container.style.setProperty("--cols", cols);
    }

    /**
     * 更新详情页导航按钮
     */
    function updateDetailNavButtons() {
        var btnPrev = document.getElementById("btn-prev-deteil");
        var btnNext = document.getElementById("btn-next-deteil");

        btnPrev.disabled = state.currentQuestion === 0;
        btnNext.disabled = state.currentQuestion === state.totalQuestion - 1;
    }

    /**
     * 详情页上一题
     */
    function prevDetail() {
        if (state.currentQuestion > 0) {
            Utils.playSound("click");
            state.currentQuestion--;
            renderDetail();
        }
    }

    /**
     * 详情页下一题
     */
    function nextDetail() {
        if (state.currentQuestion < state.totalQuestion - 1) {
            Utils.playSound("click");
            state.currentQuestion++;
            renderDetail();
        }
    }

    /**
     * 显示题目列表
     */
    function showQuestionList() {
        Utils.playSound("click");
        var popup = document.getElementById("question-list-popup");
        popup.classList.add("active");
        initQuestionList();
        renderQuestionList();
    }

    function initQuestionList() {
        const scrollBox = document.querySelector(".popup-body");

        let isDown = false;
        let startY = 0;
        let startScrollTop = 0;

        scrollBox.addEventListener("mousedown", (e) => {
            isDown = true;
            startY = e.clientY;
            startScrollTop = scrollBox.scrollTop;
            scrollBox.classList.add("dragging");
        });

        document.addEventListener("mousemove", (e) => {
            if (!isDown) return;
            const deltaY = e.clientY - startY;
            scrollBox.scrollTop = startScrollTop - deltaY;
        });

        document.addEventListener("mouseup", () => {
            isDown = false;
            scrollBox.classList.remove("dragging");
        });
    }

    function endDrag(e) {
        isPointerDown = false;
        scrollBox.classList.remove("dragging");
    }

    /**
     * 隐藏题目列表
     */
    function hideQuestionList() {
        var popup = document.getElementById("question-list-popup");
        popup.classList.remove("active");
    }

    function numberToChinese(num) {
        const map = [
            "零",
            "一",
            "二",
            "三",
            "四",
            "五",
            "六",
            "七",
            "八",
            "九",
        ];
        if (num >= 0 && num <= 9) {
            return map[num];
        } else {
            throw new Error("只支持 0-9 的数字");
        }
    }

    function hideList() {
        var popup = document.getElementById("list-popup");
        popup.classList.remove("active");
    }

    /**
     * 显示提交确认弹窗
     */
    function showSubmitConfirm() {
        var popup = document.getElementById("submit-confirm-popup");
        if (popup) {
            popup.classList.add("active");
        }
    }

    /**
     * 隐藏提交确认弹窗
     */
    function hideSubmitConfirm() {
        var popup = document.getElementById("submit-confirm-popup");
        if (popup) {
            popup.classList.remove("active");
        }
    }

    /**
     * 取消提交
     */
    function cancelSubmit() {
        Utils.playSound("click");
        hideSubmitConfirm();
    }

    /**
     * 确认提交
     */
    function confirmSubmit() {
        Utils.playSound("click");
        hideSubmitConfirm();
        finishGame();
    }

    /**
     * A：知觉辨别
B：类同比较
C：比较推理
D：系列关系
E：抽象推理
     */
    var factorName = [
        "A：知觉辨别",
        "B：类同比较",
        "C：比较推理",
        "D：系列关系",
        "E：抽象推理",
    ];

    /**
     * 渲染题目列表
     */
    function renderQuestionList() {
        // 显示总正确率
        if (state.stats) {
            document.getElementById("list-accuracy").textContent =
                state.stats.accuracy.toFixed(0) + "%";
        }

        var container = document.getElementById("factor-list");
        container.innerHTML = "";

        var factors = ["A", "B", "C", "D", "E"];

        for (var i = 0; i < factors.length; i++) {
            var factor = factors[i];
            var factorData = state.stats.factorStats[factor];
            var accuracy = (factorData.correct / factorData.total) * 100;

            // 创建因子组
            var group = document.createElement("div");
            group.className = "factor-group";
            group.style.animationDelay = i * 50 + "ms";

            // 因子头部
            var header = document.createElement("div");
            header.className = "factor-header";
            header.innerHTML =
                '<span class="factor-title">' +
                "第" +
                numberToChinese(i + 1) +
                "部分(" +
                factorName[i] +
                ")" +
                "</span>" +
                '<span class="factor-acc">' +
                accuracy.toFixed(0) +
                "%</span>";
            group.appendChild(header);

            // 题目网格
            var grid = document.createElement("div");
            grid.className = "question-grid";

            // 找出该因子的所有题目
            for (var j = 0; j < state.questions.length; j++) {
                var question = state.questions[j];
                if (question.factor === factor) {
                    var cell = document.createElement("div");
                    cell.className = "question-cell";
                    cell.textContent = question.id;

                    var userAnswer = state.answers[j];
                    if (userAnswer === null) {
                        cell.classList.add("unanswered");
                    } else if (userAnswer === question.correctAnswer) {
                        cell.classList.add("correct");
                    } else {
                        cell.classList.add("wrong");
                    }

                    // 点击跳转到该题
                    (function (index) {
                        cell.onclick = function () {
                            Utils.playSound("click");
                            state.currentQuestion = index;
                            hideQuestionList();
                            if (state.phase === "game") {
                                renderQuestion();
                            } else if (state.phase === "details") {
                                renderDetail();
                            }
                        };
                    })(j);

                    grid.appendChild(cell);
                }
            }

            group.appendChild(grid);
            container.appendChild(group);
        }
    }

    /**
     * 返回结算页
     */
    function backToResult() {
        showPage("result");
        Utils.playSound("click");
    }

    /**
     * 重新开始
     */
    function restart() {
        Utils.playSound("click");
        // 重置答案
        for (var i = 0; i < 60; i++) {
            state.answers[i] = null;
        }

        // 重新生成题目
        state.questions = generateQuestions();

        // 开始游戏
        startGame();
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
        Utils.playSound("click");
        // 页面切换动画
        Animation.pageTransition(currentPage, nextPage);
    }

    /**
     * 返回主页
     */
    function backToHome() {
        window.location.href = "../index.html";
    }

    // 暴露公共方法
    return {
        init: init,
        showRules: showRules,
        startGame: startGame,
        selectAnswer: selectAnswer,
        nextQuestion: nextQuestion,
        prevQuestion: prevQuestion,
        viewDetails: viewDetails,
        prevDetail: prevDetail,
        nextDetail: nextDetail,
        showQuestionList: showQuestionList,
        hideQuestionList: hideQuestionList,
        backToResult: backToResult,
        restart: restart,
        backToHome: backToHome,
        nextPage: nextPage,
        cancelSubmit: cancelSubmit,
        confirmSubmit: confirmSubmit,
    };
})();

// 页面加载完成后初始化
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", RavenGame.init);
} else {
    RavenGame.init();
}
