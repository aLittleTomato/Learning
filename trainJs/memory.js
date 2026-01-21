/**
 * 数字记忆游戏
 * 使用 ES5 语法
 */

Utils.pageConfig = {
    "page-welcome": { x: 50, colorTop: "#ff5c5f", colorBottom: "#306339" },
    "page-rule-1": { x: -30, colorTop: "#c4e7fc", colorBottom: "#ffffff" },
    "page-backward-rule1": {
        x: -30,
        colorTop: "#c4e7fc",
        colorBottom: "#ffffff",
    },
    "page-backward-rule2": {
        x: -30,
        colorTop: "#c4e7fc",
        colorBottom: "#ffffff",
    },
    "page-backward-rule3": {
        x: -30,
        colorTop: "#c4e7fc",
        colorBottom: "#ffffff",
    },
    "page-display": { x: -30, colorTop: "#ff5c5f", colorBottom: "#ffffff" },
    "popup-retry": { x: -30, colorTop: "#ff5c5f", colorBottom: "#ffffff" },
    "popup-goto-backward": {
        x: -30,
        colorTop: "#ff5c5f",
        colorBottom: "#ffffff",
    },
    "popup-correct": { x: -30, colorTop: "#ff5c5f", colorBottom: "#ffffff" },
    "page-result": { x: -30, colorTop: "#ff5c5f", colorBottom: "#ffffff" },
    "page-details": { x: -30, colorTop: "#ff5c5f", colorBottom: "#ffffff" },
    "page-content-rule1": {
        x: -30,
        colorTop: "rgba(255, 0, 0, 0)",
        colorBottom: "#ffffff",
    },
    "page-task": { x: 0, colorTop: "#ffffff", colorBottom: "#5ca1ff" },
    "page-input": { x: 0, colorTop: "#ffffff", colorBottom: "#ffffff" },
};

// setAppBackgroundByPage("page-welcome");

var MemoryGame = (function () {
    "use strict";

    // 游戏状态
    var state = {
        phase: "forward", // 'forward' 或 'backward'
        level: 1, // 当前关卡（对应数字位数 = level + 2）
        retryUsed: false, // 当前阶段是否已使用复活机会
        currentNumbers: [], // 当前关卡的数字序列
        userInput: "", // 用户输入
        history: [], // 游戏历史记录
        forwardMaxLevel: 0, // 正序最高关卡
        backwardMaxLevel: 0, // 倒序最高关卡
        bestForwardLevel: 0, // 历史最佳正序关卡
        bestBackwardLevel: 0, // 历史最佳倒序关卡
        currentDetailsTab: "forward", // 当前详情页签
        timeCost: 0,

        remainingTime: 300, // 剩余时间（秒）
        timerInterval: null, // 计时器

        showNextTimer: null, // 计时器
        showReadyTimer: null, // 计时器
        countdownInterval: null,
    };

    // 配置
    var config = {
        startLevel: 1, // 起始关卡（3位数）
        maxLevel: 15, // 最高关卡（15位数）
        displayDuration: 1000, // 数字显示时长（毫秒）
        displayInterval: 500, // 数字间隔时长（毫秒）
        readyCountdown: 3, // 准备倒计时（秒）
        trainingDuration: 300, // 训练时长（秒）5分钟
    };

    /**
     * 切换到下一页
     */
    function nextPage() {
        var currentPage = getCurrentPage();
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
        Animation.pageTransition(currentPage, nextPage, function () {
            // 更新当前页面
            // if (currentPage) {
            //     currentPage.classList.remove("active");
            // }
            // nextPage.classList.add("active");
        });
    }

    /**
     * 获取当前页面元素
     */
    function getCurrentPage() {
        return document.querySelector(".page.active");
    }

    /**
     * 获取下一页ID
     */
    function getNextPageId() {
        var pageSequence = [
            "page-welcome",
            "page-rule-1",
            "page-rule-2",
            "page-ready",
            "page-display",
            "page-input",
            "page-backward-rule1",
            "page-backward-rule2",
            "page-backward-rule3",
            "page-ready-backward",
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
     * 初始化游戏
     */
    function init() {
        console.log("Memory Game initialized");

        // 从本地存储读取最佳成绩
        var savedBest = Utils.storage.get("memory_best_scores");
        if (savedBest) {
            state.bestForwardLevel = savedBest.forward || 0;
            state.bestBackwardLevel = savedBest.backward || 0;
        }

        // 获取 token
        var token = Utils.getUrlParam("token");
        if (token) {
            Config.set("user.token", token);
        }
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

    function getImgUrls(imagesToPreload) {}
    function initGame() {
        // 绑定欢迎页点击事件
        var welcomePage = document.getElementById("page-welcome");
        if (welcomePage) {
            welcomePage.classList.add("active");
        }
    }

    /**
     * 显示正序规则页面
     */
    function showForwardRules() {
        var welcomePage = document.getElementById("page-welcome");
        var rulesPage = document.getElementById("page-forward-rules");

        Animation.pageTransition(welcomePage, rulesPage, function () {
            // welcomePage.classList.remove("active");
            // rulesPage.classList.add("active");
        });
    }

    /**
     * 开始正序阶段
     */
    function startForwardPhase() {
        console.log("Starting forward phase");
        Utils.playSound("click");

        // 重置状态
        state.phase = "forward";
        state.level = config.startLevel;
        state.retryUsed = false;
        state.history = [];
        state.forwardMaxLevel = 0;

        var currentPage = getCurrentPage();
        var nextPageId = getNextPageId();

        if (!nextPageId) {
            console.error("No next page found");
            return;
        }

        var numberDisplay = document.getElementById("number-display");
        if (!numberDisplay) return;

        numberDisplay.textContent = "3";

        var nextPage = document.getElementById(nextPageId);
        if (!nextPage) {
            console.error("Next page element not found:", nextPageId);
            return;
        }

        // 开始计时器
        if (!state.timerInterval) {
            startTimer();
        }

        Animation.pageTransition(currentPage, nextPage, function () {
            // if (currentPage) {
            //     currentPage.classList.remove("active");
            // }
            // nextPage.classList.add("active");
            // 开始第一关
            startLevel();
        });
    }

    /**
     * 开始计时器
     */
    function startTimer() {
        state.timerInterval = setInterval(function () {
            state.remainingTime--;
            console.log("计时器：" + state.remainingTime);
            if (state.remainingTime <= 0) {
                endTraining();
            }
        }, 1000);
    }

    /**
     * 停止计时器
     */
    function stopTimer() {
        if (state.timerInterval) {
            clearInterval(state.timerInterval);
            state.timerInterval = null;
        }
        if (state.countdownInterval) {
            clearInterval(state.countdownInterval);
            state.countdownInterval = null;
        }
        if (state.showReadyTimer) {
            clearInterval(state.showReadyTimer);
            state.showReadyTimer = null;
        }
        if (state.showNextTimer) {
            clearTimeout(state.showNextTimer);
            state.showNextTimer = null;
        }
    }

    function endTraining() {
        stopTimer();

        if (state.phase === "forward") {
            // 进入倒序阶段
            showBackwardRules();
        } else {
            // 游戏结束
            showResult();
        }
    }

    /**
     * 开始某一关
     */
    function startLevel() {
        console.log("Starting level:", state.level);

        // 生成随机数字序列
        var digitCount = state.level + 2; // level 1 = 3位数
        state.currentNumbers = generateRandomNumbers(digitCount);
        state.userInput = "";

        console.log("Generated numbers:", state.currentNumbers);

        // 更新界面信息
        updateGameInfo();

        // 显示准备倒计时
        showReadyCountdown();
    }

    /**
     * 生成随机数字序列
     */
    function generateRandomNumbers(count) {
        var numbers = [];
        for (var i = 0; i < count; i++) {
            numbers.push(Utils.randomInt(0, 9));
        }
        return numbers;
    }

    /**
     * 更新游戏信息显示
     */
    function updateGameInfo() {
        // var digitCount = state.level + 2;
        // var phaseLabel = state.phase === "forward" ? "正序记忆" : "倒序记忆";
        // var levelLabel = "第 " + state.level + " 关 · " + digitCount + " 位数";
        // // 更新展示页面的信息
        // var phaseLabelEl = document.getElementById("phase-label");
        // var levelLabelEl = document.getElementById("level-label");
        // if (phaseLabelEl) phaseLabelEl.textContent = phaseLabel;
        // if (levelLabelEl) levelLabelEl.textContent = levelLabel;
        // // 更新输入页面的信息
        // var phaseLabelInputEl = document.getElementById("phase-label-input");
        // var levelLabelInputEl = document.getElementById("level-label-input");
        // if (phaseLabelInputEl) phaseLabelInputEl.textContent = phaseLabel;
        // if (levelLabelInputEl) levelLabelInputEl.textContent = levelLabel;
        // // 更新输入提示
        // var inputPrompt = document.getElementById("input-prompt");
        // if (inputPrompt) {
        //     if (state.phase === "forward") {
        //         inputPrompt.textContent = "请输入刚才看到的数字";
        //     } else {
        //         inputPrompt.textContent = "请倒序输入刚才看到的数字";
        //     }
        // }
    }

    /**
     * 显示准备倒计时
     */
    function showReadyCountdown() {
        var numberDisplay = document.getElementById("number-display");
        if (!numberDisplay) return;

        numberDisplay.className = "number-display ready";
        numberDisplay.textContent = "3";

        var countdown = config.readyCountdown;

        state.countdownInterval = setInterval(function () {
            countdown--;
            Utils.playSound("countdown");

            numberDisplay.classList.remove("ready");
            void numberDisplay.offsetWidth;
            numberDisplay.classList.add("ready");

            if (countdown > 0) {
                numberDisplay.textContent = countdown;
            } else {
                if (state.countdownInterval)
                    clearInterval(state.countdownInterval);
                numberDisplay.textContent = "开始";

                state.showReadyTimer = setInterval(function () {
                    if (state.showReadyTimer)
                        clearInterval(state.showReadyTimer);
                    displayNumbers();
                }, 1300);
            }
        }, 1000);
    }

    /**
     * 显示数字序列
     */
    function displayNumbers() {
        var numberDisplay = document.getElementById("number-display");

        if (!numberDisplay) return;

        var currentIndex = 0;

        function showNextNumber() {
            if (currentIndex >= state.currentNumbers.length) {
                // 所有数字显示完毕，切换到输入页面
                switchToInputPage();
                return;
            }

            var number = state.currentNumbers[currentIndex];
            Utils.playSound("number");

            // 显示数字
            numberDisplay.className = "number-display number-appear";
            numberDisplay.textContent = number;

            // 数字显示时长后消失
            state.showNextTimer = setTimeout(function () {
                numberDisplay.className = "number-display number-disappear";

                if (state.showNextTimer) {
                    clearTimeout(state.showNextTimer);
                    state.showNextTimer = null;
                }

                // 间隔后显示下一个数字
                state.showNextTimer = setTimeout(function () {
                    if (state.showNextTimer) {
                        clearTimeout(state.showNextTimer);
                        state.showNextTimer = null;
                    }
                    currentIndex++;
                    showNextNumber();
                }, config.displayInterval);
            }, config.displayDuration);
        }

        showNextNumber();
    }

    /**
     * 切换到输入页面
     */
    function switchToInputPage() {
        var displayPage = document.getElementById("page-display");
        var inputPage = document.getElementById("page-input");

        if (!displayPage || !inputPage) return;

        // 清空输入
        state.userInput = "";
        var inputDisplay = document.getElementById("input-display");
        if (inputDisplay) {
            inputDisplay.textContent = "";
        }
        state.inputStartTime = Date.now();

        // 页面切换
        displayPage.classList.remove("active");
        inputPage.classList.add("active");
        // Animation.gameToResultTransition(displayPage, inputPage, function () {

        // });
    }

    /**
     * 输入数字
     */
    function inputNumber(num) {
        var digitCount = state.level + 2;
        Utils.playSound("click");

        // 限制输入长度
        if (state.userInput.length >= digitCount) {
            return;
        }

        state.userInput += num;

        // 更新显示
        var inputDisplay = document.getElementById("input-display");
        if (inputDisplay) {
            inputDisplay.textContent = state.userInput;
        }

        console.log("User input:", state.userInput);
    }

    /**
     * 清空输入
     */
    function clearInput() {
        let str = state.userInput || "";
        state.userInput = str.slice(0, -1);

        var inputDisplay = document.getElementById("input-display");
        if (inputDisplay) {
            inputDisplay.textContent = state.userInput;
        }
    }

    /**
     * 提交答案
     */
    function submitAnswer() {
        var digitCount = state.level + 2;
        Utils.playSound("click");

        // 检查输入长度
        if (state.userInput.length !== digitCount) {
            // alert("请输入 " + digitCount + " 位数字");
            return;
        }

        // 判断答案
        var isCorrect = checkAnswer();
        // 计算耗时（秒）
        var timeCost = 0;
        if (state.inputStartTime > 0) {
            timeCost = Math.round((Date.now() - state.inputStartTime) / 1000);
        }
        state.timeCost += timeCost;

        // 记录历史
        var record = {
            phase: state.phase,
            level: state.level,
            question: state.currentNumbers.join(""),
            answer: state.userInput,
            correct: isCorrect,
            timeCost: timeCost,
        };
        state.history.push(record);

        console.log("Answer submitted:", record);

        // 显示反馈
        if (isCorrect) {
            showCorrectFeedback();
        } else {
            showWrongFeedback();
        }
    }

    /**
     * 检查答案
     */
    function checkAnswer() {
        var correctAnswer;

        if (state.phase === "forward") {
            // 正序：直接比较
            correctAnswer = state.currentNumbers.join("");
        } else {
            // 倒序：反转后比较
            correctAnswer = state.currentNumbers.slice().reverse().join("");
        }

        return state.userInput === correctAnswer;
    }

    /**
     * 显示正确反馈
     */
    function showCorrectFeedback() {
        // 更新最高关卡
        if (state.phase === "forward") {
            state.forwardMaxLevel = Math.max(
                state.forwardMaxLevel,
                state.level
            );
        } else {
            state.backwardMaxLevel = Math.max(
                state.backwardMaxLevel,
                state.level
            );
        }

        // 检查是否刷新纪录
        var isNewRecord = false;
        if (state.phase === "forward" && state.level > state.bestForwardLevel) {
            isNewRecord = true;
            state.bestForwardLevel = state.level;
        } else if (
            state.phase === "backward" &&
            state.level > state.bestBackwardLevel
        ) {
            isNewRecord = true;
            state.bestBackwardLevel = state.level;
        }

        var exLastPart = document.getElementById("ex-Last-Text");
        // var lastPart = document.getElementById("Last-Text");

        exLastPart.style.display = "none";
        // lastPart.style.display = "none";

        // 已经是最后一关
        // if (state.level >= config.maxLevel) {
        //     var nextLevel = state.level + 1;
        //     var nextDigitCount = nextLevel + 2;
        //     var correctDesc = document.getElementById("max-num");
        //     if (correctDesc) {
        //         correctDesc.textContent = config.maxLevel + 2 + "个";
        //     }
        //     lastPart.style.display = "block";
        // } else {
        var nextLevel = state.level + 1;
        var nextDigitCount = nextLevel + 2;

        state.level = Math.min(state.level + 1, config.maxLevel);

        var correctDesc = document.getElementById("correct-desc");
        if (correctDesc) {
            correctDesc.textContent = nextDigitCount + "个";
        }
        exLastPart.style.display = "block";
        // }

        var inputPage = document.getElementById("page-input");
        var popup = document.getElementById("popup-correct");

        inputPage.classList.remove("active");
        popup.classList.add("active");
    }

    /**
     * 下一关
     */
    function nextLevel() {
        startLevel();
        Utils.playSound("click");

        var currentPage = getCurrentPage();

        var nextPage = document.getElementById("page-display");
        if (!nextPage) {
            console.error("Next page element not found:", nextPageId);
            return;
        }

        // 页面切换动画
        Animation.pageTransition(currentPage, nextPage, function () {
            // 更新当前页面
            // if (currentPage) {
            //     currentPage.classList.remove("active");
            // }
            // nextPage.classList.add("active");
        });
    }

    /**
     * 显示错误反馈
     */
    function showWrongFeedback() {
        // 检查是否还有复活机会
        if (!state.retryUsed) {
            // 有复活机会
            showRetryPopup();
        } else {
            // 无复活机会，结束当前阶段
            showFailed();
        }
    }

    /**
     * 失误一次
     */
    function showRetryPopup() {
        // 标记已使用复活机会
        state.retryUsed = true;
        // 更新弹窗内容
        var correctAnswer;
        correctAnswer = state.currentNumbers.join("");
        // } else {
        //     correctAnswer = state.currentNumbers.slice().reverse().join("");
        // }
        var input = state.userInput;
        if (state.phase != "forward") {
            input = input.split("").reverse().join("");
        }

        var retryCorrectAnswer = document.getElementById(
            "retry-correct-answer"
        );
        let resultHTML = "";
        for (let i = 0; i < correctAnswer.length; i++) {
            var char = input[i];

            if (char === correctAnswer[i]) {
                resultHTML += `<span class="rule-text-green">${correctAnswer[i]}</span>`;
            } else {
                resultHTML += `<span class="rule-text-red">${correctAnswer[i]}</span>`;
            }
        }

        if (retryCorrectAnswer) {
            retryCorrectAnswer.innerHTML = resultHTML;
        }

        // 显示弹窗
        var inputPage = document.getElementById("page-input");
        var popup = document.getElementById("popup-retry");

        inputPage.classList.remove("active");
        popup.classList.add("active");
    }

    /**
     * 重试当前关卡
     */
    function retryLevel() {
        Utils.playSound("click");

        // 关闭弹窗
        var popup = Utils.getCurrentPage();
        popup.classList.remove("active");

        // 切换到展示页面
        var displayPage = document.getElementById("page-display");
        displayPage.classList.add("active");

        // 重新开始当前关卡（生成新的数字序列）
        startLevel();
    }

    /**
     * 关闭正确反馈弹窗
     */
    function closeCorrectPopup() {
        var popup = document.getElementById("popup-correct");
        popup.classList.remove("active");
    }

    /**
     * 显示倒序规则页面
     */
    function showBackwardRules() {
        Utils.playSound("click");

        // 切换页面
        var currentPage = getCurrentPage();
        var rulesPage = document.getElementById("page-backward-rule1");

        if (currentPage) {
            Animation.pageTransition(currentPage, rulesPage, function () {
                // currentPage.classList.remove("active");
                // rulesPage.classList.add("active");
            });
        } else {
            rulesPage.classList.add("active");
        }
    }

    function showFailed() {
        // 更新正序成绩显示
        var forwardScore = document.getElementById("forward-score");
        if (forwardScore) {
            var digitCount = state.forwardMaxLevel + 2;
            forwardScore.textContent = digitCount;
        }

        // 更新弹窗内容
        var correctAnswer;
        correctAnswer = state.currentNumbers.join("");
        // } else {
        //     correctAnswer = state.currentNumbers.slice().reverse().join("");
        // }
        var input = state.userInput;
        if (state.phase != "forward") {
            input = input.split("").reverse().join("");
        }

        var retryCorrectAnswer = document.getElementById(
            "retry-correct-answer-goto-back"
        );
        let resultHTML = "";
        for (let i = 0; i < correctAnswer.length; i++) {
            var char = input[i];

            if (char === correctAnswer[i]) {
                resultHTML += `<span class="rule-text-green">${correctAnswer[i]}</span>`;
            } else {
                resultHTML += `<span class="rule-text-red">${correctAnswer[i]}</span>`;
            }
        }

        if (retryCorrectAnswer) {
            retryCorrectAnswer.innerHTML = resultHTML;
        }

        state.retryUsed = false;
        state.level = Math.max(state.level - 1, 1);

        var nextDigitCount = state.level + 2;
        var correctDesc = document.getElementById("failed-desc");
        if (correctDesc) {
            correctDesc.textContent = nextDigitCount + "个";
        }
        // if (retryCorrectAnswer) {
        //     retryCorrectAnswer.textContent = correctAnswer;
        // }
        // 切换页面
        var currentPage = getCurrentPage();
        var rulesPage = document.getElementById("popup-goto-backward");

        currentPage.classList.remove("active");
        rulesPage.classList.add("active");
        // if (currentPage) {
        //     Animation.pageTransition(currentPage, rulesPage, function () {});
        // } else {
        //     rulesPage.classList.add("active");
        // }
    }

    /**
     * 开始倒序阶段
     */
    function startBackwardPhase() {
        console.log("Starting backward phase");
        Utils.playSound("click");

        // 重置状态
        state.phase = "backward";
        state.level = config.startLevel;
        state.retryUsed = false;
        state.backwardMaxLevel = 0;

        var numberDisplay = document.getElementById("number-display");
        if (!numberDisplay) return;

        numberDisplay.className = "number-display ready";
        numberDisplay.textContent = "3";

        state.remainingTime = config.trainingDuration;
        // 开始计时器
        if (!state.timerInterval) {
            startTimer();
        }

        // 切换到游戏页面
        var rulesPage = getCurrentPage();
        var displayPage = document.getElementById("page-display");

        Animation.pageTransition(rulesPage, displayPage, function () {
            // rulesPage.classList.remove("active");
            // displayPage.classList.add("active");

            // 开始第一关
            startLevel();
        });
    }

    /**
     * 显示结算页面
     */
    function showResult() {
        console.log("Showing result");

        // 计算成绩
        var forwardDigits =
            state.forwardMaxLevel > 0 ? state.forwardMaxLevel + 2 : 0;
        var backwardDigits =
            state.backwardMaxLevel > 0 ? state.backwardMaxLevel + 2 : 0;
        var totalScore = forwardDigits + backwardDigits;

        // 更新显示
        var statTime = document.getElementById("stat-time");
        var statForward = document.getElementById("stat-forward");
        var statBackward = document.getElementById("stat-backward");
        var statTotal = document.getElementById("stat-total");

        if (statTime) statTime.textContent = Utils.formatTime(state.timeCost);
        if (statForward) statForward.textContent = forwardDigits + " 位";
        if (statBackward) statBackward.textContent = backwardDigits + " 位";
        if (statTotal) statTotal.textContent = totalScore + " 分";

        // 根据成绩设置称号
        var resultTitle = document.getElementById("result-title");
        if (resultTitle) {
            var title = "记忆新手";
            if (totalScore >= 20) {
                title = "记忆大师";
            } else if (totalScore >= 15) {
                title = "数字专家";
            } else if (totalScore >= 10) {
                title = "记忆达人";
            }
            resultTitle.textContent = title;
        }

        // 保存最佳成绩
        Utils.storage.set("memory_best_scores", {
            forward: state.bestForwardLevel,
            backward: state.bestBackwardLevel,
        });

        // 上报数据
        submitGameData();

        // 切换页面
        var currentPage = getCurrentPage();
        var resultPage = document.getElementById("page-result");
        Utils.playSound("success");

        if (currentPage) {
            Animation.pageTransition(currentPage, resultPage, function () {
                // currentPage.classList.remove("active");
                // resultPage.classList.add("active");
            });
        } else {
            resultPage.classList.add("active");
        }
    }

    /**
     * 上报游戏数据
     */
    function submitGameData() {
        var data = {
            gameType: "memory",
            timestamp: Date.now(),
            token: Config.get("user.token") || "",
            results: {
                forwardDigits: state.forwardMaxLevel + 2,
                backwardDigits: state.backwardMaxLevel + 2,
                totalScore:
                    state.forwardMaxLevel + 2 + (state.backwardMaxLevel + 2),
            },
            history: state.history,
        };

        console.log("Submitting game data:", data);

        API.submitTestData(data)
            .then(function (response) {
                console.log("Data submitted successfully:", response);
            })
            .catch(function (error) {
                console.error("Failed to submit data:", error);
                // 保存到本地缓存
                var cache = Utils.storage.get("test_data_cache") || [];
                cache.push(data);
                Utils.storage.set("test_data_cache", cache);
            });
    }

    /**
     * 查看作答详情
     */
    function viewDetails() {
        console.log("Viewing details");
        Utils.playSound("click");
        // 默认显示正序阶段
        state.currentDetailsTab = "forward";

        // 渲染详情表格
        renderDetailsTable("forward");

        // 切换页面
        var resultPage = document.getElementById("page-result");
        var detailsPage = document.getElementById("page-details");

        Animation.pageTransition(resultPage, detailsPage, function () {
            // resultPage.classList.remove("active");
            // detailsPage.classList.add("active");
            // 确保触摸滑动功能已初始化
            initTouchScroll();
        });
    }

    /**
     * 初始化触摸拖动滑动功能
     */
    function initTouchScroll() {
        // 优先使用训练版本的容器
        var container =
            document.querySelector(".details-container-train") ||
            document.querySelector(".details-container");
        if (!container) return;

        // 避免重复初始化
        if (container.hasAttribute("data-touch-scroll-init")) {
            return;
        }
        container.setAttribute("data-touch-scroll-init", "true");

        var isScrolling = false;
        var startY = 0;
        var scrollTop = 0;

        // 触摸开始处理函数
        var touchStartHandler = function (e) {
            if (e.touches.length === 1) {
                isScrolling = true;
                startY = e.touches[0].pageY;
                scrollTop = container.scrollTop;
                container.style.transition = "none";
            }
        };

        // 触摸移动处理函数
        var touchMoveHandler = function (e) {
            if (!isScrolling) return;
            if (e.touches.length !== 1) return;

            var currentY = e.touches[0].pageY;
            var deltaY = startY - currentY;
            var newScrollTop = scrollTop + deltaY;

            // 限制滚动范围
            var maxScroll = container.scrollHeight - container.clientHeight;
            if (newScrollTop < 0) {
                newScrollTop = 0;
            } else if (newScrollTop > maxScroll) {
                newScrollTop = maxScroll;
            }

            container.scrollTop = newScrollTop;
            e.preventDefault();
        };

        // 触摸结束处理函数
        var touchEndHandler = function (e) {
            isScrolling = false;
            container.style.transition = "";
        };

        // 触摸取消处理函数
        var touchCancelHandler = function (e) {
            isScrolling = false;
            container.style.transition = "";
        };

        // 绑定事件监听器
        container.addEventListener("touchstart", touchStartHandler, {
            passive: false,
        });
        container.addEventListener("touchmove", touchMoveHandler, {
            passive: false,
        });
        container.addEventListener("touchend", touchEndHandler, {
            passive: true,
        });
        container.addEventListener("touchcancel", touchCancelHandler, {
            passive: true,
        });
    }

    /**
     * 渲染详情表格
     * @param {string} phase - 阶段：'forward' 或 'backward'
     */
    function renderDetailsTable(phase) {
        var tbody = document.getElementById("details-tbody");
        if (!tbody) return;

        tbody.innerHTML = "";

        // 筛选当前阶段的记录
        var filteredHistory = [];
        for (var i = 0; i < state.history.length; i++) {
            if (state.history[i].phase === phase) {
                filteredHistory.push(state.history[i]);
            }
        }

        // 渲染表格
        for (var j = 0; j < filteredHistory.length; j++) {
            var record = filteredHistory[j % filteredHistory.length];
            var tr = document.createElement("tr");

            // 位数
            var tdIndex = document.createElement("td");
            tdIndex.textContent = record.level + 2;
            tdIndex.className = "detail-number";
            tr.appendChild(tdIndex);

            // 数字序列
            var tdQuestion = document.createElement("td");
            tdQuestion.textContent = record.question;
            tr.appendChild(tdQuestion);

            // 作答
            // var tdAnswer = document.createElement("td");
            // tdAnswer.textContent = record.answer;
            // tr.appendChild(tdAnswer);

            // 结果
            // var tdResult = document.createElement("td");

            // 耗时
            var tdTime = document.createElement("td");
            tdTime.textContent = record.timeCost;
            tdTime.className = "time-cost";
            tr.appendChild(tdTime);

            // tdResult.textContent = record.correct ? "正确" : "错误";
            // tdResult.className = record.correct
            //     ? "result-correct"
            //     : "result-wrong";
            // tr.appendChild(tdResult);

            tbody.appendChild(tr);

            // 添加交错动画
            tr.style.opacity = "0";
            tr.style.transform = "translateY(20px)";
            setTimeout(
                (function (row, index) {
                    return function () {
                        row.style.transition = "all 0.3s ease";
                        row.style.opacity = "1";
                        row.style.transform = "translateY(0)";
                    };
                })(tr, j),
                j * 50
            );
        }

        // 渲染表格后初始化触摸滑动并滚动到顶部
        setTimeout(function () {
            initTouchScroll();
            // 滚动到顶部
            var container =
                document.querySelector(".details-container-train") ||
                document.querySelector(".details-container");
            if (container) {
                container.scrollTop = 0;
            }
        }, 100);
    }

    /**
     * 返回结果页面
     */
    function backToResult() {
        Utils.playSound("click");
        var detailsPage = document.getElementById("page-details");
        var resultPage = document.getElementById("page-result");
        detailsPage.classList.remove("active");
        resultPage.classList.add("active");
        // Animation.pageTransition(detailsPage, resultPage, function () {});
    }

    /**
     * 重新开始游戏
     */
    function restart() {
        console.log("Restarting game");
        Utils.playSound("click");

        // 重置状态
        state.phase = "forward";
        state.level = config.startLevel;
        state.retryUsed = false;
        state.history = [];
        state.forwardMaxLevel = 0;
        state.backwardMaxLevel = 0;
        state.timeCost = 0;

        // 切换到正序规则页面
        var currentPage = getCurrentPage();
        var rulesPage = document.getElementById("page-ready");

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
     * 返回主页
     */
    function backToHome() {
        window.location.href =
            "../index.html?token=" + (Config.get("user.token") || "");
    }

    /**
     * 切换详情页签
     * @param {string} tab - 页签名称：'forward' 或 'backward'
     */
    function switchTab(tab) {
        console.log("Switching tab to:", tab);
        Utils.playSound("click");

        // 更新状态
        state.currentDetailsTab = tab;

        // 更新页签样式
        var tabs = document.querySelectorAll(".tab-btn");
        for (var i = 0; i < tabs.length; i++) {
            if (tabs[i].getAttribute("data-tab") === tab) {
                tabs[i].classList.add("active");
            } else {
                tabs[i].classList.remove("active");
            }
        }

        // 重新渲染表格
        renderDetailsTable(tab);
    }

    // 更新导出的公共方法
    return {
        init: init,
        showForwardRules: showForwardRules,
        startForwardPhase: startForwardPhase,
        inputNumber: inputNumber,
        clearInput: clearInput,
        submitAnswer: submitAnswer,
        nextLevel: nextLevel,
        closeCorrectPopup: closeCorrectPopup,
        retryLevel: retryLevel,
        startBackwardPhase: startBackwardPhase,
        viewDetails: viewDetails,
        switchTab: switchTab,
        backToResult: backToResult,
        restart: restart,
        backToHome: backToHome,
        state: state,
        nextPage: nextPage,
        showBackwardRules: showBackwardRules,
    };
})();

// 页面加载完成后初始化
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", MemoryGame.init);
} else {
    MemoryGame.init();
}
