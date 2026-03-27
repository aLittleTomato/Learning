/**
 * 连线游戏2逻辑 - 数字字母交替连接
 * 使用 ES5 语法
 */

var ConnectGame2 = (function () {
    "use strict";

    // 游戏状态
    var state = {
        mode: "tutorial", // 'tutorial' 或 'game'
        currentTarget: "1", // 当前应该点击的目标（数字或字母）
        sequence: [], // 完整的连接序列
        numbers: [], // 数字节点数据
        connectedTargets: [], // 已连接的目标
        startTime: 0, // 游戏开始时间
        lastClickTime: 0, // 上一次点击时间
        history: [], // 作答历史
        totalAttempts: 0, // 总尝试次数
        correctAttempts: 0, // 正确尝试次数
        timerInterval: null, // 计时器
        canvas: null, // Canvas 元素
        ctx: null, // Canvas 上下文
        container: null, // 数字容器
    };

    // 配置
    var config = {
        tutorialSequence: ["1", "A", "2", "B"], // 教程序列
        gameNumbers: 13, // 游戏数字数量 (1-13)
        gameLetters: 12, // 游戏字母数量 (A-L)
        nodeSize: 114, // 数字节点大小
        minSpacing: 6, // 最小间距（px）
        lineColor: "#FFD4BD", // 连线颜色
        lineWidth: 6, // 连线宽度
        errorToastDuration: 1500, // 错误提示持续时间（毫秒）
    };
    var isDemoMode = window.location.href.indexOf("demoPages") !== -1;
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
                if (isDemoMode) {
                    config.gameNumbers = 7;
                }
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
     * 生成游戏序列
     */
    function generateGameSequence() {
        var sequence = [];
        for (var i = 1; i <= config.gameNumbers; i++) {
            sequence.push(String(i));
            if (i <= config.gameLetters) {
                // A=65, B=66, ... L=76
                sequence.push(String.fromCharCode(64 + i));
            }
        }
        return sequence;
    }

    /**
     * 判断目标是否为数字
     */
    function isNumber(target) {
        return /^\d+$/.test(target);
    }

    /**
     * 判断目标是否为字母
     */
    function isLetter(target) {
        return /^[A-Z]$/.test(target);
    }

    /**
     * 获取下一个目标
     */
    function getNextTarget(current) {
        var currentIndex = -1;
        for (var i = 0; i < state.sequence.length; i++) {
            if (state.sequence[i] === current) {
                currentIndex = i;
                break;
            }
        }

        if (currentIndex >= 0 && currentIndex < state.sequence.length - 1) {
            return state.sequence[currentIndex + 1];
        }

        return null;
    }

    /**
     * 显示新手引导
     */
    function showTutorial() {
        console.log("Starting tutorial");
        Utils.playSound("click");

        // 切换页面
        var welcomePage = Utils.getCurrentPage();
        var tutorialPage = document.getElementById("page-tutorial");

        if (!welcomePage || !tutorialPage) return;

        welcomePage.classList.remove("active");
        tutorialPage.classList.add("active");

        // 初始化教程
        initTutorial();
    }

    /**
     * 初始化教程
     */
    function initTutorial() {
        state.mode = "tutorial";
        state.sequence = config.tutorialSequence;
        state.currentTarget = state.sequence[0];
        state.connectedTargets = [];
        state.totalAttempts = 0;
        state.correctAttempts = 0;

        // 获取 Canvas 和容器
        state.canvas = document.getElementById("tutorial-canvas");
        state.container = document.getElementById("tutorial-numbers");

        if (!state.canvas || !state.container) return;

        // 初始化 Canvas
        initCanvas();

        // 生成数字节点
        generateNodes();

        // 渲染数字节点
        renderNodes();
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
        state.sequence = generateGameSequence();
        state.currentTarget = state.sequence[0];
        state.connectedTargets = [];
        state.history = [];
        state.totalAttempts = 0;
        state.correctAttempts = 0;
        state.startTime = Date.now();
        state.lastClickTime = Date.now();

        // 获取 Canvas 和容器
        state.canvas = document.getElementById("game-canvas");
        state.container = document.getElementById("game-numbers");

        if (!state.canvas || !state.container) return;

        // 初始化 Canvas
        initCanvas();

        // 生成数字节点
        generateNodes();

        // 渲染数字节点
        renderNodes();

        // 更新目标提示
        updateTargetHint();

        // 开始计时
        startTimer();
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
    function generateNodes() {
        state.numbers = [];

        if (!state.container) return;

        var containerWidth = state.container.clientWidth;
        var containerHeight = state.container.clientHeight;
        var nodeSize = config.nodeSize;
        var minSpacing = config.minSpacing;
        var radius = nodeSize / 2;
        var minDist = nodeSize + minSpacing;

        // 计算有效区域（减去边距）
        var effectiveWidth = containerWidth - nodeSize - minSpacing * 2;
        var effectiveHeight = containerHeight - nodeSize - minSpacing * 2;

        for (var i = 0; i < state.sequence.length; i++) {
            var target = state.sequence[i];

            // 使用优化后的 generateRandomPosition
            var position = generateRandomPosition(
                effectiveWidth,
                effectiveHeight,
                radius,
                minDist
            );

            state.numbers.push({
                target: target,
                isLetter: isLetter(target),
                x: position.x + minSpacing,
                y: position.y + minSpacing,
                connected: false,
            });
        }
    }

    /**
     * 生成随机位置（避免重叠）
     * radius: 圆半径
     * minDist: 最小圆心距
     */
    function generateRandomPosition(width, height, radius, minDist) {
        var maxAttempts = 1000;
        var attempts = 0;

        // 1️⃣ 随机尝试
        while (attempts < maxAttempts) {
            var x = Math.random() * width;
            var y = Math.random() * height;

            var overlapping = state.numbers.some((node) => {
                var dx = x - node.x;
                var dy = y - node.y;
                return Math.sqrt(dx * dx + dy * dy) < minDist;
            });

            if (!overlapping) return { x, y };
            attempts++;
        }

        // 2️⃣ fallback：随机遍历整个画布候选点，步长 2px
        var step = 2;
        var candidates = [];
        for (var y = radius; y <= height - radius; y += step) {
            for (var x = radius; x <= width - radius; x += step) {
                candidates.push({ x, y });
            }
        }

        // 洗牌，随机遍历
        shuffle(candidates);

        for (var i = 0; i < candidates.length; i++) {
            var x = candidates[i].x;
            var y = candidates[i].y;

            var overlapping = state.numbers.some((node) => {
                var dx = x - node.x;
                var dy = y - node.y;
                return Math.sqrt(dx * dx + dy * dy) < config.nodeSize + 2;
            });

            if (!overlapping) return { x, y };
        }

        // 3️⃣ 如果真的没有空位
        console.warn("画布满了，无法放置更多圆");
        return { x: width / 2, y: height / 2 };
    }

    // Fisher–Yates 洗牌
    function shuffle(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
    /**
     * 渲染数字节点
     */
    function renderNodes() {
        if (!state.container) return;

        // 清空容器
        state.container.innerHTML = "";

        // 渲染每个数字节点
        for (var i = 0; i < state.numbers.length; i++) {
            var node = state.numbers[i];
            var nodeElement = document.createElement("div");

            nodeElement.className = "number-node";
            if (node.isLetter) {
                nodeElement.className += " letter";
            }
            if (node.connected) {
                nodeElement.className += " connected";
            }

            nodeElement.textContent = node.target;
            nodeElement.style.left = node.x + "px";
            nodeElement.style.top = node.y + "px";

            // 绑定点击事件
            nodeElement.onclick = (function (target) {
                return function () {
                    onNodeClick(target);
                };
            })(node.target);

            state.container.appendChild(nodeElement);
        }
    }

    /**
     * 节点点击事件
     */
    function onNodeClick(target) {
        console.log("Clicked target:", target);

        // 增加总尝试次数
        state.totalAttempts++;

        // 检查是否是正确的目标
        if (target === state.currentTarget) {
            // 正确
            handleCorrectClick(target);
        } else {
            // 错误
            handleWrongClick(target);
        }
    }

    /**
     * 处理正确点击
     */
    function handleCorrectClick(target) {
        console.log("Correct click:", target);

        // 增加正确尝试次数
        state.correctAttempts++;

        // 记录当前点击时间
        var currentTime = Date.now();
        var timeCost = ((currentTime - state.lastClickTime) / 1000).toFixed(1);

        // 记录历史（游戏模式）
        if (state.mode === "game") {
            // 查找该目标的历史记录
            var record = null;
            for (var i = 0; i < state.history.length; i++) {
                if (state.history[i].target === target) {
                    record = state.history[i];
                    break;
                }
            }

            // 如果没有记录，创建新记录
            if (!record) {
                record = {
                    target: target,
                    timeCost: timeCost,
                    errorCount: 0,
                };
                state.history.push(record);
            }
            record.timeCost = timeCost;
        }

        // 更新节点状态
        for (var j = 0; j < state.numbers.length; j++) {
            if (state.numbers[j].target === target) {
                state.numbers[j].connected = true;
                break;
            }
        }

        // 添加到已连接列表
        state.connectedTargets.push(target);

        // 绘制连线
        if (state.connectedTargets.length > 1) {
            drawLine(
                state.connectedTargets[state.connectedTargets.length - 2],
                target
            );
        }

        // 重新渲染节点
        renderNodes();

        // 更新当前目标
        state.currentTarget = getNextTarget(target);
        state.lastClickTime = currentTime;

        // 更新目标提示
        if (state.mode === "game") {
            updateTargetHint();
        }

        // 检查是否完成
        if (!state.currentTarget) {
            handleComplete();
        }
    }

    /**
     * 处理错误点击
     */
    function handleWrongClick(target) {
        console.log("Wrong click:", target);

        // 记录错误次数（游戏模式）
        if (state.mode === "game") {
            // 查找当前目标的历史记录
            var record = null;
            for (var i = 0; i < state.history.length; i++) {
                if (state.history[i].target === state.currentTarget) {
                    record = state.history[i];
                    break;
                }
            }

            // 如果没有记录，创建新记录
            if (!record) {
                record = {
                    target: state.currentTarget,
                    timeCost: 0,
                    errorCount: 0,
                };
                state.history.push(record);
            }

            // 增加错误次数
            record.errorCount++;
        }

        // 显示错误动画
        showErrorAnimation(target);

        // 显示错误提示
        showErrorToast("请按顺序点击 " + state.currentTarget + " 😉");
    }

    /**
     * 绘制连线
     */
    function drawLine(fromTarget, toTarget) {
        if (!state.ctx) return;

        // 查找两个节点的位置
        var fromNode = null;
        var toNode = null;

        for (var i = 0; i < state.numbers.length; i++) {
            if (state.numbers[i].target === fromTarget) {
                fromNode = state.numbers[i];
            }
            if (state.numbers[i].target === toTarget) {
                toNode = state.numbers[i];
            }
        }

        if (!fromNode || !toNode) return;

        // 计算节点中心点
        var nodeSize = config.nodeSize;
        var fromX = fromNode.x + nodeSize / 2;
        var fromY = fromNode.y + nodeSize / 2;
        var toX = toNode.x + nodeSize / 2;
        var toY = toNode.y + nodeSize / 2;

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
    function showErrorAnimation(target) {
        // 查找节点元素
        var nodes = state.container.getElementsByClassName("number-node");
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].textContent === target) {
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
            targetElement.textContent = state.currentTarget;
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
            // 游戏完成，显示结算页面
            setTimeout(function () {
                showResult();
            }, 500);
        }
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

    function calculateMinPause() {
        var minPause = 999999;

        for (var i = 0; i < state.history.length; i++) {
            var record = state.history[i];
            var timeCost = parseFloat(record.timeCost);
            if (timeCost < minPause) {
                minPause = timeCost;
            }
        }

        return minPause.toFixed(1);
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

        // 计算统计数据
        var totalTime = ((Date.now() - state.startTime) / 1000).toFixed(1);
        var accuracy = (
            (state.correctAttempts / state.totalAttempts) *
            100
        ).toFixed(0);
        var maxPause = calculateMaxPause();
        var minPause = calculateMinPause();
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

        // 上报数据
        submitGameData({
            totalTime: totalTime,
            accuracy: accuracy,
            maxPause: maxPause,
            history: state.history,
        });
    }

    /**
     * 计算最大停顿时间
     */
    function calculateMaxPause() {
        var maxPause = 0;

        for (var i = 0; i < state.history.length; i++) {
            var record = state.history[i];
            var timeCost = parseFloat(record.timeCost);
            if (timeCost > maxPause) {
                maxPause = timeCost;
            }
        }

        return maxPause.toFixed(1);
    }

    /**
     * 上报游戏数据
     */
    function submitGameData(data) {
        console.log("Submitting game data:", data);

        var gameData = {
            gameType: "connect2",
            timestamp: Date.now(),
            token: Config.get("user.token") || "",
            results: {
                totalTime: data.totalTime,
                accuracy: data.accuracy,
                maxPause: data.maxPause,
                totalAttempts: state.totalAttempts,
                correctAttempts: state.correctAttempts,
            },
            history: data.history,
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
        renderDetailsTable();

        // 添加鼠标拖动滑动功能
        initDragScroll();
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
    function renderDetailsTable() {
        var tbody = document.getElementById("details-tbody");
        if (!tbody) return;

        tbody.innerHTML = "";

        // 渲染每条记录
        for (var i = 0; i < state.history.length; i++) {
            var record = state.history[i];
            var tr = document.createElement("tr");

            // 节点
            var tdTarget = document.createElement("td");
            tdTarget.textContent = record.target;
            tr.appendChild(tdTarget);
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

    function nextPage() {
        var currentPage = Utils.getCurrentPage();
        var nextPageId = getNextPageId();

        if (!nextPageId) {
            console.error("No next page found");
            return;
        }
        Utils.playSound("click");
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
    document.addEventListener("DOMContentLoaded", ConnectGame2.init);
} else {
    ConnectGame2.init();
}
