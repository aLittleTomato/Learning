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
            totalPictures: 6,
            totalRounds: 8,
            distribution: {
                once: 4,
                twice: 2,
                thrice: 0,
            },
            startIndex: 0,
            endIndex: 7,
        },
        test: {
            totalPictures: 25,
            totalRounds: 100,
            distribution: {
                once: 15,
                twice: 35,
                thrice: 5,
            },
            startIndex: 7,
            endIndex: 65,
        },
        pictureDisplayTime: 3000, // 每张图片显示3秒
        countdownTime: 3, // 准备倒计时3秒
    };

    // 图片资源（使用占位图）
    var picturePool = [];

    /**
     * 初始化游戏
     */
    function init() {
        for (let i = 0; i < 65; i++) {
            picturePool.push("../images/game5/pool/" + (i + 1) + ".png");
        }
        console.log("图片记忆游戏初始化");
        // 预加载所有图片资源

        var imagesToPreload = [].concat(picturePool);
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

    function getImgUrls(imagesToPreload) { }
    function initGame() {
        // 绑定欢迎页点击事件
        // var welcomePage = document.getElementById("page-welcome");
        // if (welcomePage) {
        //     welcomePage.classList.add("active");
        // }
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
        Utils.playSound("click");
        state.isWarmup = true;
        state.phase = "prepare";
        prepareGame(config.warmup);
    }

    /**
     * 开始正式测试
     */
    function startTest() {
        Utils.playSound("click");
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

    function generatePictureSequence(gameConfig) {
        const { startIndex, endIndex, distribution } = gameConfig;

        // 1️⃣ 构建剩余次数表
        const remainMap = new Map();
        let idx =
            startIndex + Math.floor(Math.random() * (endIndex - startIndex));

        function add(id, count) {
            remainMap.set(id, (remainMap.get(id) || 0) + count);
        }

        for (let i = 0; i < distribution.twice; i++) {
            add(idx, 2);
            idx = idx + 1 >= endIndex ? startIndex : idx + 1;
        }

        for (let i = 0; i < distribution.once; i++) {
            add(idx, 1);
            idx = idx + 1 >= endIndex ? startIndex : idx + 1;
        }

        for (let i = 0; i < distribution.thrice; i++) {
            add(idx, 3);
            idx = idx + 1 >= endIndex ? startIndex : idx + 1;
        }

        const result = [];
        const appearCount = new Map();

        function getAvailableIds() {
            return [...remainMap.entries()]
                .filter(([, count]) => count > 0)
                .map(([id]) => id);
        }

        function isNew(id) {
            return (appearCount.get(id) || 0) < 2;
        }

        function isOld(id) {
            return (appearCount.get(id) || 0) >= 2;
        }
        function hasSeen(id) {
            return (appearCount.get(id) || 0) >= 1;
        }

        let consecutiveNewCount = 0;
        const newToOldBiasRate = 0.45; // 推荐 0.3 ~ 0.5
        while (true) {
            const available = getAvailableIds();
            if (available.length === 0) break;
            const last = result[result.length - 1];
            const last3 = result.slice(-3);

            // 1️⃣ 所有可用
            let candidates = available.slice();

            // 2️⃣ 禁止连续相同
            if (last !== undefined) {
                candidates = candidates.filter(id => id !== last);
            }

            // 3️⃣ 硬规则：不允许连续 4 个旧图
            const isThreeOld =
                last3.length === 3 &&
                last3.every(id => isOld(id));

            if (isThreeOld) {
                const notOld = candidates.filter(id => !isOld(id));
                if (notOld.length > 0) {
                    candidates = notOld;
                }
            }

            // 4️⃣ 🎯 软规则：连续 2 个新图 → 概率偏向旧图
            else if (
                consecutiveNewCount >= 1 &&
                Math.random() < newToOldBiasRate
            ) {
                const oldOnes = candidates.filter(id => hasSeen(id));
                if (oldOnes.length > 0) {
                    candidates = oldOnes;
                }
            }

            // 5️⃣ 合法兜底
            if (candidates.length === 0) {
                candidates = available.slice();
            }

            // 6️⃣ 完全随机 pick
            const pick =
                candidates[Math.floor(Math.random() * candidates.length)];

            // 6️⃣ 消耗次数
            remainMap.set(pick, remainMap.get(pick) - 1);

            result.push(pick);
            appearCount.set(pick, (appearCount.get(pick) || 0) + 1);

            if (isNew(pick)) {
                consecutiveNewCount++;
            } else {
                consecutiveNewCount = 0;
            }
        }




        // ===== 统计分析 =====
        // const stats = {
        //     total: result.length,

        //     appearCount: {},      // 每个 id 实际出现次数
        //     once: 0,
        //     twice: 0,
        //     thrice: 0,

        //     repeatImmediate: [],  // 连续重复位置
        //     tripleOld: [],        // 连续3个"已出现"
        //     quadrupleOld: []      // 连续4个"已出现"         // 连续3个“已出现”
        // };

        // // 统计每个图片出现次数
        // result.forEach((id, i) => {
        //     stats.appearCount[id] = (stats.appearCount[id] || 0) + 1;

        //     // 连续重复 A A
        //     if (i > 0 && result[i] === result[i - 1]) {
        //         stats.repeatImmediate.push({
        //             index: i,
        //             value: id
        //         });
        //     }

        //     // 连续3个已出现图片
        //     if (i >= 2) {
        //         const a = result[i - 2];
        //         const b = result[i - 1];
        //         const c = result[i];

        //         const seenBefore =
        //             new Set(result.slice(0, i - 2));

        //         if (
        //             seenBefore.has(a) &&
        //             seenBefore.has(b) &&
        //             seenBefore.has(c)
        //         ) {
        //             stats.tripleOld.push({
        //                 index: i,
        //                 values: [a, b, c]
        //             });
        //         }
        //     }

        //     // 连续4个已出现图片
        //     if (i >= 3) {
        //         const a = result[i - 3];
        //         const b = result[i - 2];
        //         const c = result[i - 1];
        //         const d = result[i];

        //         const seenBefore =
        //             new Set(result.slice(0, i - 3));

        //         if (
        //             seenBefore.has(a) &&
        //             seenBefore.has(b) &&
        //             seenBefore.has(c) &&
        //             seenBefore.has(d)
        //         ) {
        //             stats.quadrupleOld.push({
        //                 index: i,
        //                 values: [a, b, c, d]
        //             });
        //         }
        //     }
        // });

        // // 根据实际出现次数统计 once / twice / thrice
        // Object.values(stats.appearCount).forEach((count) => {
        //     if (count === 1) stats.once++;
        //     else if (count === 2) stats.twice++;
        //     else if (count === 3) stats.thrice++;
        // });

        // console.group("🧠 Picture Sequence Stats");

        // console.log("总长度:", stats.total);
        // console.log("once / twice / thrice:", {
        //     once: stats.once,
        //     twice: stats.twice,
        //     thrice: stats.thrice
        // });

        // // 打印 ID 列表，首次出现的标绿
        // console.log("%cID 列表（绿色=首次出现）:", "font-weight: bold; font-size: 14px;");
        // const firstAppear = new Set();
        // result.forEach((id, i) => {
        //     const isFirstAppear = !firstAppear.has(id);
        //     if (isFirstAppear) {
        //         firstAppear.add(id);
        //         console.log(`%c[${i}] ${id}`, "color: green; font-weight: bold;");
        //     } else {
        //         console.log(`[${i}] ${id}`);
        //     }
        // });

        // console.log("连续重复次数:", stats.repeatImmediate.length);
        // if (stats.repeatImmediate.length > 0) {
        //     console.table(stats.repeatImmediate);
        // }

        // console.log("连续3个已出现图片次数:", stats.tripleOld.length);
        // if (stats.tripleOld.length > 0) {
        //     console.table(stats.tripleOld);
        // }

        // console.log("连续4个已出现图片次数:", stats.quadrupleOld.length);
        // if (stats.quadrupleOld.length > 0) {
        //     console.table(stats.quadrupleOld);
        // }

        // console.groupEnd();

        // if (stats.repeatImmediate.length > 0) {
        //     console.warn("⚠️ 出现连续重复图片");
        // }

        // if (stats.tripleOld.length > 0) {
        //     console.warn("⚠️ 出现连续3次已出现图片");
        // }

        // if (stats.quadrupleOld.length > 0) {
        //     console.warn("⚠️ 出现连续4次已出现图片");
        // }
        return result;
    }
    /**
     * 开始倒计时
     */
    function startCountdown() {
        var countdownEl = document.getElementById("number-display");
        var count = config.countdownTime;

        countdownEl.textContent = count;
        Utils.playSound("countdown");

        var timer = setInterval(function () {
            count--;
            if (count > 0) {
                Utils.playSound("countdown");

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
        Utils.playSound("click");

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

        var btnError = document.getElementById("error-btn");
        btnError.classList.add("hide");

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
        var progressPercent = (state.currentRound / state.totalRounds) * 90;

        document.getElementById("test-progress").textContent = progressText;
        document.getElementById("test-progress-fill").style.width =
            10 + progressPercent + "%";
    }

    /**
     * 点击答案按钮
     */
    function clickAnswer() {
        // 清除自动跳过计时器
        clearTimeout(state.pictureTimer);
        Utils.playSound("click");

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
        Utils.playSound("success");

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
            stats.accuracy.toFixed(0) != 0
                ? (stats.missRate / stats.accuracy).toFixed(0)
                : 0;
        document.getElementById("stat-green1").textContent = green1Text;

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
        Utils.playSound("click");
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

        var record = state.history[index];

        // 显示图片
        var pictureUrl = picturePool[record.pictureId];
        document.getElementById("details-picture").src = pictureUrl;

        var item = document.getElementById("picture-history");
        if (!record.correct) {
            // 显示出现记录
            var historyText = "";
            var allAppearRounds = state.appearedPictures[record.pictureId];

            var rounds = [];
            for (let i = 0; i < allAppearRounds.length; i++) {
                if (allAppearRounds[i] < index) {
                    rounds.push(allAppearRounds[i]);
                }
            }
            if (rounds.length === 0) {
                historyText = "这张图片在之前没有重复出现";
            } else {
                historyText = "这张图片在第 " + rounds.join("、") + " 题出现过";
            }
            item.classList.remove("hide");
            document.getElementById("picture-history").textContent =
                historyText;
        } else {
            item.classList.add("hide");
        }

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
            Utils.playSound("click");
            state.currentDetailsIndex--;
            renderDetails();
        }
    }

    /**
     * 下一题
     */
    function nextQuestion() {
        if (state.currentDetailsIndex < state.history.length - 1) {
            Utils.playSound("click");
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
        Utils.playSound("click");

        // 计算正确率
        var stats = calculateStats();
        document.getElementById("popup-accuracy").textContent =
            "" + stats.accuracy.toFixed(0) + "%";

        // 生成题目网格
        var grid = document.getElementById("question-grid");
        var innerGrid = grid.querySelector(".question-grid-train-inner");
        if (!innerGrid) {
            innerGrid = document.createElement("div");
            innerGrid.className = "question-grid-train-inner";
            grid.innerHTML = "";
            grid.appendChild(innerGrid);
        } else {
            innerGrid.innerHTML = "";
        }

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

            innerGrid.appendChild(btn);
        }

        // 初始化拖动功能
        initScrollableGrid(grid, innerGrid);
    }

    /**
     * 初始化可滚动网格的触摸拖动功能
     */
    function initScrollableGrid(container, innerContainer) {
        var startY = 0;
        var currentY = 0;
        var isDragging = false;
        var startTranslateY = 0;
        var translateY = 0;
        var minTranslateY = 0;
        var maxTranslateY = 0;

        // 计算最大滚动距离
        function calculateBounds() {
            var containerHeight = container.offsetHeight;
            var innerHeight = innerContainer.offsetHeight;
            maxTranslateY = 0;
            if (innerHeight > containerHeight) {
                minTranslateY = containerHeight - innerHeight;
            } else {
                minTranslateY = 0;
            }
        }

        // 设置变换
        function setTransform(value) {
            translateY = value;
            if (translateY > maxTranslateY) {
                translateY = maxTranslateY;
            }
            if (translateY < minTranslateY) {
                translateY = minTranslateY;
            }
            innerContainer.style.transform = "translateY(" + translateY + "px)";
        }

        // 开始拖动（通用函数）
        function startDrag(clientY) {
            isDragging = true;
            startY = clientY;
            startTranslateY = translateY;
            calculateBounds();
            innerContainer.style.transition = "none";
        }

        // 拖动中（通用函数）
        function moveDrag(clientY) {
            if (!isDragging) return;
            currentY = clientY;
            var deltaY = currentY - startY;
            setTransform(startTranslateY + deltaY);
        }

        // 结束拖动（通用函数）
        function endDrag() {
            if (!isDragging) return;
            isDragging = false;
            innerContainer.style.transition = "transform 0.1s ease-out";
            setTransform(translateY);
        }

        // 触摸开始
        function handleTouchStart(e) {
            if (e.touches.length !== 1) return;
            startDrag(e.touches[0].clientY);
        }

        // 触摸移动
        function handleTouchMove(e) {
            if (!isDragging || e.touches.length !== 1) return;
            // 阻止默认滚动行为
            if (e.preventDefault) {
                e.preventDefault();
            }
            moveDrag(e.touches[0].clientY);
        }

        // 触摸结束
        function handleTouchEnd(e) {
            endDrag();
        }

        // 鼠标按下
        function handleMouseDown(e) {
            e.preventDefault();
            startDrag(e.clientY);
        }

        // 鼠标移动
        function handleMouseMove(e) {
            if (!isDragging) return;
            e.preventDefault();
            moveDrag(e.clientY);
        }

        // 鼠标抬起
        function handleMouseUp(e) {
            endDrag();
        }

        // 鼠标离开（防止鼠标移出元素后无法抬起）
        function handleMouseLeave(e) {
            endDrag();
        }

        // 移除旧的事件监听器（如果存在）
        var oldTouchStart = container._touchStartHandler;
        var oldTouchMove = container._touchMoveHandler;
        var oldTouchEnd = container._touchEndHandler;
        var oldMouseDown = container._mouseDownHandler;
        var oldMouseMove = container._mouseMoveHandler;
        var oldMouseUp = container._mouseUpHandler;
        var oldMouseLeave = container._mouseLeaveHandler;

        if (oldTouchStart) {
            container.removeEventListener("touchstart", oldTouchStart);
        }
        if (oldTouchMove) {
            container.removeEventListener("touchmove", oldTouchMove);
        }
        if (oldTouchEnd) {
            container.removeEventListener("touchend", oldTouchEnd);
        }
        if (oldMouseDown) {
            container.removeEventListener("mousedown", oldMouseDown);
        }
        if (oldMouseMove) {
            document.removeEventListener("mousemove", oldMouseMove);
        }
        if (oldMouseUp) {
            document.removeEventListener("mouseup", oldMouseUp);
        }
        if (oldMouseLeave) {
            container.removeEventListener("mouseleave", oldMouseLeave);
        }

        // 保存事件处理器的引用
        container._touchStartHandler = handleTouchStart;
        container._touchMoveHandler = handleTouchMove;
        container._touchEndHandler = handleTouchEnd;
        container._mouseDownHandler = handleMouseDown;
        container._mouseMoveHandler = handleMouseMove;
        container._mouseUpHandler = handleMouseUp;
        container._mouseLeaveHandler = handleMouseLeave;

        // 添加新的事件监听器（使用 ES5 兼容方式）
        container.addEventListener("touchstart", handleTouchStart, false);
        container.addEventListener("touchmove", handleTouchMove, false);
        container.addEventListener("touchend", handleTouchEnd, false);
        container.addEventListener("mousedown", handleMouseDown, false);
        document.addEventListener("mousemove", handleMouseMove, false);
        document.addEventListener("mouseup", handleMouseUp, false);
        container.addEventListener("mouseleave", handleMouseLeave, false);

        // 初始化边界和位置
        setTimeout(function () {
            calculateBounds();
            translateY = 0;
            setTransform(0);
        }, 100);
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
        Utils.playSound("click");
        showPage("page-result");
    }

    /**
     * 重新开始
     */
    function restart() {
        Utils.playSound("click");
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
        Utils.playSound("error");

        var btnError = document.getElementById("error-btn");
        btnError.classList.remove("hide");
        if (clicked && !shouldClick) {
            errorText.textContent = "这张图片没有重复出现哦";
            btnError.textContent = "我知道了 🫡";
        } else if (!clicked && shouldClick) {
            errorText.textContent = "注意，这张图片出现过，需要点击😯";
            btnError.textContent = "这张图片出现过 ✅";
        }

        errorEl.classList.add("show");

        // 1.5秒后隐藏并继续
        setTimeout(function () {
            errorEl.classList.remove("show");
        }, 2000);
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
        showNextPicture: showNextPicture,
    };
})();

// 页面加载完成后初始化
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", PictureMemoryGame.init);
} else {
    PictureMemoryGame.init();
}
