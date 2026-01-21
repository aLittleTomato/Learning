/**
 * 连线游戏逻辑
 * 使用 ES5 语法
 */

Utils.pageConfig = {
    "page-welcome": { x: 50, colorTop: "#ffffff", colorBottom: "#ffffff" },
    "page-mindset": { x: -30, colorTop: "#ffffff", colorBottom: "#ffffff" },
    "page-rules-1": { x: -30, colorTop: "#ffffff", colorBottom: "#ffffff" },
    "page-rules-2": { x: -30, colorTop: "#ffffff", colorBottom: "#ffffff" },
    "page-tutorial": { x: -30, colorTop: "#ffffff", colorBottom: "#ffffff" },
    "page-task": { x: 0, colorTop: "#ffffff", colorBottom: "#FD9156" },
    "page-game": { x: 0, colorTop: "#ffffff", colorBottom: "#ffffff" },
    "page-result": { x: -30, colorTop: "#FD9156", colorBottom: "#ffffff" },
    "page-details": { x: -30, colorTop: "#FD9156", colorBottom: "#ffffff" },
};

// setAppBackgroundByPage("page-welcome");

var ConnectGame = (function () {
    "use strict";

    // 游戏状态
    var state = {
        mode: "tutorial", // 'tutorial' 或 'game'
        // 教程：仍按 1..N
        currentNumber: 1, // 当前应该点击的数字（tutorial 用）
        maxNumber: 4, // 最大数字（教程4，游戏25）
        numbers: [], // 数字节点数据
        connectedNumbers: [], // 已连接的数字
        startTime: 0, // 组开始时间（game 用）
        lastClickTime: 0, // 上一次点击时间（game 用）
        history: [], // 当前组作答历史（game 用）
        totalAttempts: 0, // 当前组总尝试次数（game 用）
        correctAttempts: 0, // 当前组正确尝试次数（game 用）
        timerInterval: null, // 计时器
        canvas: null, // Canvas 元素
        ctx: null, // Canvas 上下文
        container: null, // 数字容器

        // ===== 训练版：三组模块（仅 game 模式使用）=====
        groupIndex: 0, // 0/1/2
        groupSequence: null, // 当前组需要点击的序列（长度 25）
        groupCursor: 0, // 当前需要点击序列的下标
        groupResults: [], // 三组结果数组
    };

    // 配置
    var config = {
        tutorialNumbers: 4, // 教程数字数量
        gameNumbers: 25, // 游戏数字数量
        nodeSize: 114, // 数字节点大小
        minSpacing: 6, // 最小间距（px）
        lineColor: "#FFD4BD", // 连线颜色
        lineWidth: 6, // 连线宽度
        errorToastDuration: 1500, // 错误提示持续时间（毫秒）
    };

    // 三组训练定义：原始序列 → 奇数 → 偶数
    var TRAIN_GROUPS = [
        { key: "seq", title: "第一组", type: "seq" },
        { key: "odd", title: "第二组", type: "odd" },
        { key: "even", title: "第三组", type: "even" },
    ];

    function buildSequence(type, count) {
        var seq = [];
        var i;
        if (type === "seq") {
            for (i = 1; i <= count; i++) {
                seq.push(i);
            }
            return seq;
        }
        if (type === "odd") {
            for (i = 0; i < count; i++) {
                seq.push(1 + i * 2);
            }
            return seq;
        }
        if (type === "even") {
            for (i = 0; i < count; i++) {
                seq.push(2 + i * 2);
            }
            return seq;
        }
        // fallback
        for (i = 1; i <= count; i++) {
            seq.push(i);
        }
        return seq;
    }

    /**
     * 初始化游戏
     */
    function init() {
        // 预加载所有图片资源

        var imagesToPreload = [
            "../images/game3/number_normal.png",
            "../images/game3/number_error.png",
        ];

        getImgUrls(imagesToPreload);

        Preloader.preload({
            images: imagesToPreload,
            container: document.body,
            onComplete: function () {
                console.log("所有资源加载完成");
                initPage();
            },
        });
    }

    function getImgUrls(imagesToPreload) {}
    function initPage() {
        // 绑定欢迎页点击事件
        var welcomePage = document.getElementById("page-welcome");
        if (welcomePage) {
            welcomePage.classList.add("active");
        }
    }

    /**
     * 显示新手引导
     */
    function showTutorial() {
        console.log("Starting tutorial");
        Utils.playSound("click");

        // 切换页面
        var currentPage = Utils.getCurrentPage();
        var tutorialPage = document.getElementById("page-tutorial");

        if (!currentPage || !tutorialPage) return;

        currentPage.classList.remove("active");
        tutorialPage.classList.add("active");
        initTutorial();
        // Animation.pageTransition(currentPage, tutorialPage, function () {});
    }

    /**
     * 初始化教程
     */
    function initTutorial() {
        state.mode = "tutorial";
        state.currentNumber = 1;
        state.maxNumber = config.tutorialNumbers;
        state.connectedNumbers = [];
        state.totalAttempts = 0;
        state.correctAttempts = 0;

        // 获取 Canvas 和容器
        state.canvas = document.getElementById("tutorial-canvas");
        state.container = document.getElementById("tutorial-numbers");

        if (!state.canvas || !state.container) return;

        // 初始化 Canvas
        initCanvas();

        // 生成数字节点
        generateNumbers();

        // 渲染数字节点
        renderNumbers();
    }

    /**
     * 开始游戏
     */
    function startGame() {
        console.log("Starting game");
        Utils.playSound("click");

        // 切换页面
        var tutorialPage = Utils.getCurrentPage();
        var gamePage = document.getElementById("page-game");

        if (!tutorialPage || !gamePage) return;

        tutorialPage.classList.remove("active");
        gamePage.classList.add("active");

        // 初始化游戏
        initGame();
    }

    /**
     * 初始化游戏
     */
    function initGame() {
        state.mode = "game";
        state.maxNumber = config.gameNumbers;
        state.connectedNumbers = [];
        state.groupIndex = 0;
        state.groupResults = [];

        // 初始化第一组
        startGroup(state.groupIndex);

        // 获取 Canvas 和容器
        state.canvas = document.getElementById("game-canvas");
        state.container = document.getElementById("game-numbers");

        if (!state.canvas || !state.container) return;

        // 初始化 Canvas
        initCanvas();

        // 生成数字节点（按当前组序列）
        generateNumbers();

        // 渲染数字节点
        renderNumbers();

        // 更新目标提示（如果页面没有该元素也不会报错）
        updateTargetHint();

        // 开始计时
        startTimer();
    }

    function startGroup(groupIndex) {
        var group = TRAIN_GROUPS[groupIndex];
        state.groupIndex = groupIndex;
        state.groupSequence = buildSequence(group.type, config.gameNumbers);
        state.groupCursor = 0;

        // 重置当前组数据
        state.connectedNumbers = [];
        state.history = [];
        state.totalAttempts = 0;
        state.correctAttempts = 0;
        state.startTime = Date.now();
        state.lastClickTime = Date.now();
    }

    /**
     * 初始化 Canvas
     */
    function initCanvas() {
        if (!state.canvas) return;

        var container = state.canvas.parentElement;
        var width = container.clientWidth;
        var height = container.clientHeight;

        // 设置 Canvas 尺寸
        state.canvas.width = width;
        state.canvas.height = height;

        // 获取上下文
        state.ctx = state.canvas.getContext("2d");

        // 清空画布
        state.ctx.clearRect(0, 0, width, height);
    }

    /**
     * 生成数字节点
     */
    function generateNumbers() {
        state.numbers = [];
        if (!state.container) return;

        var containerWidth = state.container.clientWidth;
        var containerHeight = state.container.clientHeight;
        var nodeSize = config.nodeSize;
        var minSpacing = config.minSpacing;

        var radius = nodeSize / 2;
        var minDist = nodeSize + minSpacing;

        // 有效区域（保证圆不出界）
        var effectiveWidth = containerWidth - radius * 2;
        var effectiveHeight = containerHeight - radius * 2;

        // tutorial：1..maxNumber
        // game：使用当前组序列中的“显示数字”
        var displayList = null;
        if (state.mode === "game" && state.groupSequence) {
            displayList = state.groupSequence;
        }

        for (var i = 1; i <= state.maxNumber; i++) {
            var position = generateRandomPosition(
                effectiveWidth,
                effectiveHeight,
                radius,
                minDist
            );

            state.numbers.push({
                number: displayList ? displayList[i - 1] : i,
                x: position.x + radius,
                y: position.y + radius,
                connected: false,
            });
        }
    }

    /**
     * 生成随机位置（避免重叠）
     */
    function generateRandomPosition(width, height, radius, minDist) {
        var maxAttempts = 1000;
        var attempts = 0;

        while (attempts < maxAttempts) {
            var x = Math.random() * width;
            var y = Math.random() * height;

            var overlapping = false;

            for (var i = 0; i < state.numbers.length; i++) {
                var node = state.numbers[i];

                // ⭐ 坐标统一：node.x/y 是圆心
                var dx = x + radius - node.x;
                var dy = y + radius - node.y;
                var distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < minDist) {
                    overlapping = true;
                    break;
                }
            }

            if (!overlapping) {
                return { x: x, y: y };
            }

            attempts++;
        }

        // 2️⃣ fallback：随机遍历整个画布
        // 生成所有可能圆心候选点
        var step = 2; // 每次移动 2px
        var candidates = [];
        for (var y = radius; y <= height - radius; y += step) {
            for (var x = radius; x <= width - radius; x += step) {
                candidates.push({ x, y });
            }
        }

        // 打乱顺序，随机遍历
        shuffle(candidates);

        for (var i = 0; i < candidates.length; i++) {
            var x = candidates[i].x;
            var y = candidates[i].y;
            var overlapping = false;

            for (var j = 0; j < state.numbers.length; j++) {
                var node = state.numbers[j];
                var dx = x - node.x;
                var dy = y - node.y;
                var distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < minDist) {
                    overlapping = true;
                    break;
                }
            }

            if (!overlapping) {
                return { x: x, y: y };
            }
        }

        // 3️⃣ 如果真的没有空位
        console.warn("画布满了，无法放置更多圆");
        return { x: width / 2, y: height / 2 };
    }

    // Fisher–Yates 洗牌
    function shuffle(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            // ES5 交换写法
            var tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
        }
    }

    /**
     * 渲染数字节点
     */
    function renderNumbers() {
        if (!state.container) return;

        state.container.innerHTML = "";

        var radius = config.nodeSize / 2;

        for (var i = 0; i < state.numbers.length; i++) {
            var node = state.numbers[i];
            var nodeElement = document.createElement("div");

            nodeElement.className = "number-node";
            if (node.connected) {
                nodeElement.className += " connected";
            }

            nodeElement.textContent = node.number;

            // ⭐ 关键修正：圆心 → 左上角
            nodeElement.style.left = node.x - radius + "px";
            nodeElement.style.top = node.y - radius + "px";

            nodeElement.onclick = (function (number) {
                return function () {
                    onNumberClick(number);
                };
            })(node.number);

            state.container.appendChild(nodeElement);
        }
    }

    /**
     * 数字节点点击事件
     */
    function onNumberClick(number) {
        Utils.playSound("click");

        console.log("Clicked number:", number);

        // 增加总尝试次数
        state.totalAttempts++;

        // tutorial：按 currentNumber 判定
        if (state.mode === "tutorial") {
            if (number === state.currentNumber) {
                handleCorrectClick(number);
            } else {
                handleWrongClick(number);
            }
            return;
        }

        // game：按组序列判定
        var expected = getExpectedNumber();
        if (number === expected) {
            handleCorrectClick(number);
        } else {
            handleWrongClick(number);
        }
    }

    function getExpectedNumber() {
        if (state.mode !== "game") return state.currentNumber;
        if (!state.groupSequence) return 1;
        return state.groupSequence[state.groupCursor];
    }

    /**
     * 处理正确点击
     */
    function handleCorrectClick(number) {
        console.log("Correct click:", number);

        // 增加正确尝试次数
        state.correctAttempts++;

        // 记录当前点击时间
        var currentTime = Date.now();
        var timeCost = ((currentTime - state.lastClickTime) / 1000).toFixed(1);

        // 记录历史（game 模式）
        if (state.mode === "game") {
            // 当前点击的“目标数字”就是 number（序列里对应项）
            var record = null;
            for (var i = 0; i < state.history.length; i++) {
                if (state.history[i].number === number) {
                    record = state.history[i];
                    break;
                }
            }
            if (!record) {
                record = { number: number, timeCost: timeCost, errorCount: 0 };
                state.history.push(record);
            }
            record.timeCost = timeCost;
        }

        // 更新节点状态
        for (var j = 0; j < state.numbers.length; j++) {
            if (state.numbers[j].number === number) {
                state.numbers[j].connected = true;
                break;
            }
        }

        // 添加到已连接列表
        state.connectedNumbers.push(number);

        // 绘制连线
        if (state.connectedNumbers.length > 1) {
            drawLine(
                state.connectedNumbers[state.connectedNumbers.length - 2],
                number
            );
        }

        // 重新渲染数字节点
        renderNumbers();

        // 更新当前数字 / 组游标
        if (state.mode === "tutorial") {
            state.currentNumber++;
        } else {
            state.groupCursor++;
        }
        state.lastClickTime = currentTime;

        // 更新目标提示
        if (state.mode === "game") {
            updateTargetHint();
        }

        // 检查是否完成
        if (state.mode === "tutorial") {
            if (state.currentNumber > state.maxNumber) {
                handleComplete();
            }
        } else {
            if (state.groupCursor >= state.maxNumber) {
                handleComplete();
            }
        }
    }

    /**
     * 处理错误点击
     */
    function handleWrongClick(number) {
        console.log("Wrong click:", number);

        // 记录错误次数（game 模式）
        if (state.mode === "game") {
            var expected = getExpectedNumber();
            var record = null;
            for (var i = 0; i < state.history.length; i++) {
                if (state.history[i].number === expected) {
                    record = state.history[i];
                    break;
                }
            }
            if (!record) {
                record = { number: expected, timeCost: 0, errorCount: 0 };
                state.history.push(record);
            }
            record.errorCount++;
        }

        // 显示错误动画
        showErrorAnimation(number);

        // 显示错误提示
        if (state.mode === "tutorial") {
            showErrorToast("请按顺序点击 " + state.currentNumber + " 😉");
        } else {
            showErrorToast("请按顺序点击 " + getExpectedNumber() + " 😉");
        }
    }

    /**
     * 绘制连线
     */
    function drawLine(fromNumber, toNumber) {
        if (!state.ctx) return;

        // 查找两个节点的位置
        var fromNode = null;
        var toNode = null;

        for (var i = 0; i < state.numbers.length; i++) {
            if (state.numbers[i].number === fromNumber) {
                fromNode = state.numbers[i];
            }
            if (state.numbers[i].number === toNumber) {
                toNode = state.numbers[i];
            }
        }

        if (!fromNode || !toNode) return;

        // 计算节点中心点
        var nodeSize = config.nodeSize;
        var fromX = fromNode.x;
        var fromY = fromNode.y;
        var toX = toNode.x;
        var toY = toNode.y;

        // 绘制线条
        state.ctx.beginPath();
        state.ctx.moveTo(fromX, fromY);
        state.ctx.lineTo(toX, toY);
        state.ctx.strokeStyle = config.lineColor;
        state.ctx.lineWidth = config.lineWidth;
        state.ctx.lineCap = "round";
        state.ctx.stroke();
    }

    /**
     * 显示错误动画
     */
    function showErrorAnimation(number) {
        // 查找节点元素
        var nodes = state.container.getElementsByClassName("number-node");
        for (var i = 0; i < nodes.length; i++) {
            if (parseInt(nodes[i].textContent) === number) {
                nodes[i].classList.add("error");
                setTimeout(
                    (function (node) {
                        return function () {
                            node.classList.remove("error");
                        };
                    })(nodes[i]),
                    400
                );
                break;
            }
        }
    }

    /**
     * 显示错误提示
     */
    function showErrorToast(message) {
        var toast = document.getElementById("error-toast");
        var messageElement = document.getElementById("error-message");
        Utils.playSound("error");

        if (!toast || !messageElement) return;

        messageElement.textContent = message;
        toast.classList.add("show");

        setTimeout(function () {
            toast.classList.remove("show");
        }, config.errorToastDuration);
    }

    /**
     * 更新目标提示
     */
    function updateTargetHint() {
        var targetElement = document.getElementById("target-number");
        if (targetElement) {
            if (state.mode === "game") {
                targetElement.textContent = getExpectedNumber();
            } else {
                targetElement.textContent = state.currentNumber;
            }
        }
    }

    /**
     * 开始计时
     */
    function startTimer() {
        // 清除旧的计时器
        if (state.timerInterval) {
            clearInterval(state.timerInterval);
        }

        // 启动新的计时器
        state.timerInterval = setInterval(updateTimer, 100);
    }

    /**
     * 更新计时器显示
     */
    function updateTimer() {
        if (!state.startTime) return;

        var elapsed = (Date.now() - state.startTime) / 1000;
        var minutes = Math.floor(elapsed / 60);
        var seconds = Math.floor(elapsed % 60);
        var milliseconds = Math.floor((elapsed % 1) * 10);

        var timerText =
            (minutes < 10 ? "0" : "") +
            minutes +
            ":" +
            (seconds < 10 ? "0" : "") +
            seconds +
            "." +
            milliseconds;

        var timerElement = document.getElementById("timer-text");
        if (timerElement) {
            timerElement.textContent = timerText;
        }
    }

    /**
     * 停止计时
     */
    function stopTimer() {
        if (state.timerInterval) {
            clearInterval(state.timerInterval);
            state.timerInterval = null;
        }
    }

    /**
     * 处理完成
     */
    function handleComplete() {
        console.log("Game complete!");

        // 停止计时
        stopTimer();

        if (state.mode === "tutorial") {
            // 教程完成，进入游戏
            setTimeout(function () {
                showReady();
            }, 500);
        } else {
            // 保存当前组结果
            saveCurrentGroupResult();

            // 还有下一组：直接进入下一组（仍在 page-game）
            if (state.groupIndex < TRAIN_GROUPS.length - 1) {
                setTimeout(function () {
                    startNextGroup();
                }, 500);
            } else {
                // 第三组结束：显示结算页面
                setTimeout(function () {
                    showResult();
                }, 500);
            }
        }
    }

    function saveCurrentGroupResult() {
        var totalTime = ((Date.now() - state.startTime) / 1000).toFixed(1);
        var accuracy = "0";
        if (state.totalAttempts > 0) {
            accuracy = (
                (state.correctAttempts / state.totalAttempts) *
                100
            ).toFixed(0);
        }
        var maxPause = calculateMaxPause(state.history);
        var minPause = calculateMinPause(state.history);

        state.groupResults[state.groupIndex] = {
            groupIndex: state.groupIndex,
            groupKey: TRAIN_GROUPS[state.groupIndex].key,
            groupTitle: TRAIN_GROUPS[state.groupIndex].title,
            totalTime: totalTime,
            accuracy: accuracy,
            maxPause: maxPause,
            minPause: minPause,
            totalAttempts: state.totalAttempts,
            correctAttempts: state.correctAttempts,
            history: cloneHistory(state.history),
        };
    }

    function cloneHistory(history) {
        var out = [];
        var i;
        for (i = 0; i < history.length; i++) {
            out.push({
                number: history[i].number,
                timeCost: history[i].timeCost,
                errorCount: history[i].errorCount,
            });
        }
        return out;
    }

    function startNextGroup() {
        // 清空画布
        if (state.ctx && state.canvas) {
            state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
        }

        startGroup(state.groupIndex + 1);
        generateNumbers();
        renderNumbers();
        updateTargetHint();
        startTimer();
    }

    /**
     * 显示结算页面
     */
    function showResult() {
        console.log("Showing result");
        Utils.playSound("success");

        // 切换页面
        var gamePage = document.getElementById("page-game");
        var resultPage = document.getElementById("page-result");

        if (!gamePage || !resultPage) return;

        gamePage.classList.remove("active");
        resultPage.classList.add("active");

        // 计算统计数据：三组汇总
        var summary = calculateSummaryFromGroups();
        var totalTime = summary.totalTime;
        var accuracy = summary.accuracy;
        var maxPause = summary.maxPause;
        var minPause = summary.minPause;
        // 显示统计数据
        var timeElement = document.getElementById("stat-blue");
        var accuracyElement = document.getElementById("stat-green");
        var maxPauseElement = document.getElementById("stat-purple");
        var minPauseElement = document.getElementById("stat-orange");

        if (timeElement) {
            timeElement.textContent = totalTime + "s";
        }
        if (accuracyElement) {
            accuracyElement.textContent = accuracy + "%";
        }
        if (maxPauseElement) {
            maxPauseElement.textContent = maxPause + "秒";
        }
        if (minPauseElement) {
            minPauseElement.textContent = minPause + "秒";
        }

        // 上报数据（包含三组）
        submitGameData({
            totalTime: totalTime,
            accuracy: accuracy,
            maxPause: maxPause,
            minPause: minPause,
            groups: state.groupResults,
        });
    }

    /**
     * 计算最大停顿时间
     */
    function calculateMaxPause(history) {
        var maxPause = 0;

        history = history || [];
        for (var i = 0; i < history.length; i++) {
            var record = history[i];
            var timeCost = parseFloat(record.timeCost);
            if (timeCost > maxPause) {
                maxPause = timeCost;
            }
        }

        return maxPause.toFixed(1);
    }

    function calculateMinPause(history) {
        var minPause = 999999;

        history = history || [];
        for (var i = 0; i < history.length; i++) {
            var record = history[i];
            var timeCost = parseFloat(record.timeCost);
            if (timeCost < minPause) {
                minPause = timeCost;
            }
        }

        if (minPause === 999999) {
            minPause = 0;
        }
        return minPause.toFixed(1);
    }

    function calculateSummaryFromGroups() {
        var i;
        var totalTimeSum = 0;
        var totalAttemptsSum = 0;
        var correctAttemptsSum = 0;
        var maxPause = 0;
        var minPause = 999999;

        for (i = 0; i < state.groupResults.length; i++) {
            var g = state.groupResults[i];
            if (!g) continue;
            totalTimeSum += parseFloat(g.totalTime) || 0;
            totalAttemptsSum += g.totalAttempts || 0;
            correctAttemptsSum += g.correctAttempts || 0;
            var gMax = parseFloat(g.maxPause) || 0;
            var gMin = parseFloat(g.minPause) || 0;
            if (gMax > maxPause) maxPause = gMax;
            if (gMin < minPause) minPause = gMin;
        }

        if (minPause === 999999) minPause = 0;

        var accuracy = "0";
        if (totalAttemptsSum > 0) {
            accuracy = ((correctAttemptsSum / totalAttemptsSum) * 100).toFixed(
                0
            );
        }

        return {
            totalTime: totalTimeSum.toFixed(1),
            accuracy: accuracy,
            maxPause: maxPause.toFixed(1),
            minPause: minPause.toFixed(1),
        };
    }

    /**
     * 上报游戏数据
     */
    function submitGameData(data) {
        console.log("Submitting game data:", data);

        var gameData = {
            gameType: "connect",
            timestamp: Date.now(),
            token: Config.get("user.token") || "",
            results: {
                totalTime: data.totalTime,
                accuracy: data.accuracy,
                maxPause: data.maxPause,
                minPause: data.minPause,
                // 三组汇总：从 groups 里算
                groupsCount: data.groups ? data.groups.length : 0,
            },
            groups: data.groups || [],
        };

        // 调用 API 上报
        API.submitTestData(gameData, function (success, response) {
            if (success) {
                console.log("Data submitted successfully");
            } else {
                console.error("Failed to submit data:", response);
                // 保存到本地缓存
                var cache = Utils.storage.get("test_data_cache") || [];
                cache.push(gameData);
                Utils.storage.set("test_data_cache", cache);
            }
        });
    }

    /**
     * 查看作答详情
     */
    function viewDetails() {
        console.log("Viewing details");
        Utils.playSound("click");
        // 切换页面
        var resultPage = document.getElementById("page-result");
        var detailsPage = document.getElementById("page-details");

        if (!resultPage || !detailsPage) return;

        resultPage.classList.remove("active");
        detailsPage.classList.add("active");

        // 渲染详情表格
        initDetailsTabsOnce();
        setActiveDetailsGroup(0);

        // 添加鼠标拖动滑动功能
        initDragScroll();
    }

    var detailsTabsInited = false;
    function initDetailsTabsOnce() {
        if (detailsTabsInited) return;
        detailsTabsInited = true;

        var tabs = document.getElementById("details-tabs-train");
        if (!tabs) return;

        tabs.addEventListener("click", function (e) {
            var target = e.target;
            if (!target) return;
            if (
                target.className &&
                target.className.indexOf("details-tab-train") !== -1
            ) {
                var groupStr = target.getAttribute("data-group");
                var groupIndex = parseInt(groupStr, 10);
                if (isNaN(groupIndex)) groupIndex = 0;
                setActiveDetailsGroup(groupIndex);
            }
        });
    }

    function setActiveDetailsGroup(groupIndex) {
        // 切换 active 样式
        var tabs = document.getElementById("details-tabs-train");
        if (tabs) {
            var buttons = tabs.getElementsByTagName("button");
            for (var i = 0; i < buttons.length; i++) {
                var btn = buttons[i];
                var gi = parseInt(btn.getAttribute("data-group"), 10);
                if (gi === groupIndex) {
                    if (btn.className.indexOf("active") === -1) {
                        btn.className += " active";
                    }
                } else {
                    btn.className = btn.className.replace(" active", "");
                }
            }
        }

        renderDetailsTable(groupIndex);

        // 切换页签后：滚动回到列表顶部
        var container = document.querySelector(
            "#page-details .details-container"
        );
        if (container) {
            container.scrollTop = 0;
        }
    }

    /**
     * 初始化拖动滑动功能
     */
    function initDragScroll() {
        var container = document.querySelector(
            "#page-details .details-container"
        );
        if (!container) return;

        var isDown = false;
        var startY = 0;
        var scrollTop = 0;

        // 鼠标按下
        container.addEventListener("mousedown", function (e) {
            isDown = true;
            container.style.cursor = "grabbing";
            container.style.userSelect = "none";
            startY = e.pageY - container.offsetTop;
            scrollTop = container.scrollTop;
        });

        // 鼠标移动
        container.addEventListener("mousemove", function (e) {
            if (!isDown) return;
            e.preventDefault();
            var y = e.pageY - container.offsetTop;
            var walk = (y - startY) * 2; // 滑动速度
            container.scrollTop = scrollTop - walk;
        });

        // 鼠标释放
        container.addEventListener("mouseup", function () {
            isDown = false;
            container.style.cursor = "grab";
            container.style.userSelect = "auto";
        });

        // 鼠标离开
        container.addEventListener("mouseleave", function () {
            isDown = false;
            container.style.cursor = "grab";
            container.style.userSelect = "auto";
        });

        // 设置初始样式
        container.style.cursor = "grab";
    }

    /**
     * 渲染详情表格
     */
    function renderDetailsTable(groupIndex) {
        var tbody = document.getElementById("details-tbody");
        if (!tbody) return;

        tbody.innerHTML = "";

        var history = state.history;
        if (state.groupResults && state.groupResults[groupIndex]) {
            history = state.groupResults[groupIndex].history || [];
        } else if (state.groupResults && state.groupResults.length) {
            // 如果没有该组结果，尽量兜底用第一组
            history =
                (state.groupResults[0] && state.groupResults[0].history) || [];
        }

        // 渲染每条记录
        for (var i = 0; i < history.length; i++) {
            var index = i % history.length;
            var record = history[index];
            var tr = document.createElement("tr");

            // 数字
            var tdNumber = document.createElement("td");
            tdNumber.textContent = record.number;
            tr.appendChild(tdNumber);
            // 错误次数
            var tdError = document.createElement("td");
            tdError.textContent = record.errorCount;
            tr.appendChild(tdError);
            // 耗时
            var tdTime = document.createElement("td");
            tdTime.textContent = record.timeCost;
            tdTime.className = "time-cost";
            tr.appendChild(tdTime);

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
                })(tr, i),
                i * 50
            );
        }
    }

    /**
     * 返回结果页面
     */
    function backToResult() {
        var detailsPage = document.getElementById("page-details");
        var resultPage = document.getElementById("page-result");
        Utils.playSound("click");

        if (!detailsPage || !resultPage) return;

        detailsPage.classList.remove("active");
        resultPage.classList.add("active");
    }

    /**
     * 重新开始游戏
     */
    function restart() {
        console.log("Restarting game");
        Utils.playSound("click");

        // 切换到游戏页面
        var resultPage = document.getElementById("page-result");
        var gamePage = document.getElementById("page-game");

        if (!resultPage || !gamePage) return;

        resultPage.classList.remove("active");
        gamePage.classList.add("active");

        // 重新初始化游戏
        initGame();
    }

    /**
     * 返回欢迎页
     */
    function backToWelcome() {
        var tutorialPage = document.getElementById("page-tutorial");
        var welcomePage = document.getElementById("page-welcome");

        if (!tutorialPage || !welcomePage) return;

        tutorialPage.classList.remove("active");
        welcomePage.classList.add("active");
    }

    /**
     * 确认退出
     */
    function confirmExit() {
        if (confirm("确定要退出游戏吗？当前进度将不会保存。")) {
            backToHome();
        }
    }

    /**
     * 返回主页
     */
    function backToHome() {
        window.location.href =
            "../index.html?token=" + (Config.get("user.token") || "");
    }

    function getNextPageId() {
        var pageSequence = [
            "page-welcome",
            "page-rule-1",
            "page-rule-2",
            "page-rule-3",
            "page-rule-4",
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

    // 更新导出的公共方法
    return {
        init: init,
        showTutorial: showTutorial,
        startGame: startGame,
        viewDetails: viewDetails,
        backToResult: backToResult,
        restart: restart,
        backToWelcome: backToWelcome,
        confirmExit: confirmExit,
        backToHome: backToHome,
        state: state,
        nextPage: nextPage,
    };
})();

// 页面加载完成后初始化
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ConnectGame.init);
} else {
    ConnectGame.init();
}
