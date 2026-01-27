/**
 * 注意力测试游戏逻辑 - 使用 ES5 语法
 */
Utils.pageConfig = {
    "page-welcome": { x: 50, colorTop: "#5ca1ff", colorBottom: "#a3d26e" },
    "page-mindset": { x: -30, colorTop: "#5ca1ff", colorBottom: "#ffffff" },
    "page-rules-1": { x: -30, colorTop: "#5ca1ff", colorBottom: "#ffffff" },
    "page-rules-2": { x: -30, colorTop: "#5ca1ff", colorBottom: "#ffffff" },
    "page-tutorial": { x: -30, colorTop: "#5ca1ff", colorBottom: "#ffffff" },
    "page-task": { x: 0, colorTop: "#ffffff", colorBottom: "#5ca1ff" },
    "page-game": { x: 0, colorTop: "#ffffff", colorBottom: "#ffffff" },
    "page-result": { x: -30, colorTop: "#5ca1ff", colorBottom: "#ffffff" },
    "page-details": { x: -30, colorTop: "#5ca1ff", colorBottom: "#ffffff" },
};

var AttentionGame = (function () {
    "use strict";

    // 游戏状态
    var state = {
        currentPageIndex: 0,
        gamePhase: "welcome", // welcome, mindset, task, rules-1, rules-2, tutorial, game, result
        tutorialData: {
            items: [],
            selected: [],
            correctCount: 0,
            errors: 0,
        },
        gameData: {
            pages: [],
            currentPage: 0,
            totalPages: 3,
            timePerPage: 20,
            startTime: null,
            pageTimes: [],
            pageResults: [],
        },
        results: {
            totalTime: 0,
            correctCount: 0,
            errorCount: 0,
            omissionCount: 0,
            accuracy: 0,
            speed: 0,
            focus: 0,
            score: 0,
        },
        showResult: false,
        detailsPage: 0,
    };

    var timers = {
        gameTimer: null,
        mascotIdle: null,
    };

    var hideTimer = null;

    const itemState = {
        normal: "normal",
        highlight: "highlight",
        chose: "result1",
        missing: "result2",
    };

    var types = [
        // q
        { letter: "q", index: 7 },
        { letter: "q", index: 8 },
        { letter: "q", index: 9 },
        { letter: "q", index: 10 },
        { letter: "q", index: 11 },
        { letter: "q", index: 12 },

        // b
        { letter: "b", index: 1 },
        { letter: "b", index: 2 },
        { letter: "b", index: 3 },
        { letter: "b", index: 4 },
        { letter: "b", index: 5 },
        { letter: "b", index: 6 },
        { letter: "b", index: 7 },
        { letter: "b", index: 8 },
        { letter: "b", index: 9 },
        { letter: "b", index: 10 },
        { letter: "b", index: 11 },
        { letter: "b", index: 12 },
    ];

    /**
     * 初始化游戏
     */
    function init() {
        console.log("Initializing Attention Game...");

        // 初始化配置
        Config.init();
        // 预加载所有图片资源
        var imagesToPreload = [
            "../images/game1/welcome_bg.png",
            "../images/game1/welcom_mask.png",
            "../images/game1/attention_logo.png",
            "../images/game1/welcome_txt_bg.png",
            "../images/game1/big_txt_bg.png",
            "../images/game1/btn_detail.png",
            "../images/game1/goto_tutorial.png",
            "../images/game1/btn_next_step_long.png",
            "../images/game1/btn_back.png",
            "../images/game1/btn_again.png",
            "../images/game1/test_next_game.png",
            "../images/game1/btn_next_step.png",
            "../images/game1/last_page.png",
            "../images/game1/next_page.png",
        ];

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
        var qFolder = ["q/highlight/", "q/result1/", "q/normal/", "q/result2/"];
        var bFolder = ["b/highlight/", "b/result1/", "b/normal/"];
        for (let i = 0; i < qFolder.length; i++) {
            for (let j = 1; j <= 15; j++) {
                imagesToPreload.push(
                    "../images/game1/" + qFolder[i] + Utils.format2(j) + ".png"
                );
            }
        }
        for (let i = 0; i < bFolder.length; i++) {
            for (let j = 1; j <= 15; j++) {
                imagesToPreload.push(
                    "../images/game1/" + bFolder[i] + Utils.format2(j) + ".png"
                );
            }
        }
    }

    function initGame() {
        // 绑定欢迎页点击事件
        var welcomePage = document.getElementById("page-welcome");
        if (welcomePage) {
            welcomePage.classList.add("active");
            welcomePage.addEventListener("click", function () {
                nextPage();
            });
        }

        console.log("Attention Game initialized");
    }

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
            // 更新游戏阶段
            updateGamePhase(nextPageId);
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
            "page-mindset",
            "page-rules-1",
            "page-rules-2",
            "page-tutorial",
            "page-task",
            "page-game",
            "page-result",
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
            "page-welcome": "welcome",
            "page-mindset": "mindset",
            "page-task": "task",
            "page-rules-1": "rules-1",
            "page-rules-2": "rules-2",
            "page-tutorial": "tutorial",
            "page-game": "game",
            "page-result": "result",
        };

        state.gamePhase = phaseMap[pageId] || state.gamePhase;
        console.log("Game phase:", state.gamePhase);
    }

    /**
     * 显示规则页面
     */
    function showRules() {
        var currentPage = getCurrentPage();
        var rulesPage = document.getElementById("page-rules-1");

        Animation.pageTransition(currentPage, rulesPage, function () {
            updateGamePhase("page-rules-1");
        });
    }

    /**
     * 开始练习模式
     */
    function startTutorial() {
        console.log("Starting tutorial...");

        var currentPage = getCurrentPage();
        var tutorialPage = document.getElementById("page-tutorial");
        Utils.playSound("click");
        // 生成练习题目
        generateTutorialItems();
        // 渲染练习网格
        renderTutorialGrid();

        Animation.pageTransition(currentPage, tutorialPage, function () {
            updateGamePhase("page-tutorial");
        });
    }

    /**
     * 生成练习题目
     */
    function generateTutorialItems() {
        var config = Config.get("games.attention");
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

        console.log("Tutorial items generated:", items);
    }

    /**
     * 生成正确的 q（带两条竖线）
     */
    function generateCorrectQ() {
        var types = [
            // 上下有两条
            { letter: "q", index: 1 },
            { letter: "q", index: 2 },
            { letter: "q", index: 3 },
            { letter: "q", index: 4 },
            { letter: "q", index: 5 },
            { letter: "q", index: 6 },
        ];

        var type = types[Utils.randomInt(0, types.length - 1)];

        return {
            letter: type.letter,
            index: type.index,
            isCorrect: true,
        };
    }

    /**
     * 生成错误的字母
     */
    function generateIncorrectLetter() {
        var type = types[Utils.randomInt(0, types.length - 1)];

        return {
            letter: type.letter,
            index: type.index,
            isCorrect: false,
        };
    }

    /**
     * 渲染练习网格
     */
    function renderTutorialGrid() {
        var grid = document.getElementById("tutorial-grid");
        if (!grid) return;

        grid.innerHTML = "";

        for (var i = 0; i < state.tutorialData.items.length; i++) {
            var item = state.tutorialData.items[i];
            var gridItem = getAGridItem(item);

            // 选中且正确
            gridItem.classList.add("correct");
            gridItem.setAttribute("tutorial-index", i);

            updateItemState(gridItem, itemState.normal);

            gridItem.addEventListener("click", function () {
                handleTutorialItemClick(this);
            });

            grid.appendChild(gridItem);
        }
    }

    function showTutorialToast(corrent) {
        const img = document.getElementById("toast-corrent");
        const imgE = document.getElementById("toast-error");

        // 清除旧定时器
        if (hideTimer) {
            clearTimeout(hideTimer);
            hideTimer = null;
        }

        img.classList.remove("show");
        imgE.classList.remove("show");
        img.classList.add("hide");
        imgE.classList.add("hide");

        if (!corrent) {
            Utils.playSound("error");
        }
        let tempImg = corrent ? img : imgE;
        tempImg.classList.remove("hide");
        tempImg.classList.add("show");

        // 1 秒后自动消失
        hideTimer = setTimeout(() => {
            tempImg.classList.remove("show");
            tempImg.classList.add("hide");
        }, 1000);
    }

    /**
     * 处理练习模式的点击事件
     */
    function handleTutorialItemClick(element) {
        var index = parseInt(element.getAttribute("tutorial-index"));
        var item = state.tutorialData.items[index];
        Utils.playSound("click");
        var isSelected = state.tutorialData.selected.indexOf(index) !== -1;

        if (isSelected) {
            // 取消选中
            state.tutorialData.selected = state.tutorialData.selected.filter(
                function (i) {
                    return i !== index;
                }
            );
            element.classList.remove("selected", "correct", "error");
            Animation.deselectFeedback(element);
            updateItemState(element, itemState.normal);
        } else {
            // 选中
            state.tutorialData.selected.push(index);
            element.classList.add("selected");
            Animation.selectFeedback(element);

            updateItemState(element, itemState.chose);

            // 检查是否正确
            if (item.isCorrect) {
                element.classList.add("correct");
                element.classList.remove("error");

                // 检查是否完成
                checkTutorialComplete();
            } else {
                showTutorialToast(item.isCorrect);
                element.classList.add("error");
                element.classList.remove("correct");
                state.tutorialData.errors++;

                // 错误提示
                Animation.errorShake(element);

                // 1秒后恢复默认色
                setTimeout(function () {
                    element.classList.remove("selected", "error");
                    updateItemState(element, itemState.normal);

                    state.tutorialData.selected =
                        state.tutorialData.selected.filter(function (i) {
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
            var completeDiv = document.getElementById("tutorial-complete");
            if (completeDiv) {
                completeDiv.style.display = "block";
            }

            // 禁用所有选项
            var gridItems = document.querySelectorAll(
                "#tutorial-grid .grid-item"
            );
            for (var j = 0; j < gridItems.length; j++) {
                gridItems[j].classList.add("disabled");
            }

            setTimeout(function () {
                nextPage();
            }, 1000);
        } else {
            showTutorialToast(true);
        }
    }

    function completePage() {
        // 停止计时器
        if (timers.gameTimer) {
            clearInterval(timers.gameTimer);
        }
        var pageIndex = state.gameData.currentPage;
        var pageData = state.gameData.pages[pageIndex];

        // 记录结束时间
        pageData.endTime = Date.now();
        pageData.timeSpent = Math.floor(
            (pageData.endTime - pageData.startTime) / 1000
        );

        // 计算本页结果
        calculatePageResult(pageIndex);

        Utils.playSound("click");
        if (state.showResult) {
            nextGamePage();
        } else {
            state.showResult = true;
            renderDetailsPageInTest(pageIndex);
        }
    }

    function renderDetailsPageInTest(pageIndex) {
        var pageData = state.gameData.pages[pageIndex];
        var grid = document.getElementById("detail-test-grid");
        if (!grid) return;

        grid.innerHTML = "";
        grid.classList.remove("hide");
        grid.classList.add("active");

        for (var i = 0; i < pageData.items.length; i++) {
            var item = pageData.items[i];
            var gridItem = getAGridItem(item);
            gridItem.classList.add("small");

            // 判断状态
            var isSelected = pageData.selected.indexOf(i) !== -1;
            var isCorrect = item.isCorrect;

            if (isSelected && isCorrect) {
                // 选中且正确
                gridItem.classList.add("correct");
                updateItemState(gridItem, itemState.chose);
            } else if (!isSelected && isCorrect) {
                // 漏选
                updateItemState(gridItem, itemState.missing);
                gridItem.classList.add("omission");
            } else if (isSelected && !isCorrect) {
                // 错选
                updateItemState(gridItem, itemState.chose);
                gridItem.classList.add("error");
            } else if (!isSelected && !isCorrect) {
                gridItem.classList.add("correct");
                updateItemState(gridItem, itemState.normal);
            }

            grid.appendChild(gridItem);
        }

        // 更新按钮状态
        // var btnPrev = document.getElementById("btn-prev-detail");
        // var btnNext = document.getElementById("btn-next-detail");

        // if (btnPrev) {
        //     if (pageIndex === 0) btnPrev.classList.add("back");
        //     else btnPrev.classList.remove("back");
        // }

        // if (btnNext) {
        //     if (pageIndex === state.gameData.totalPages - 1)
        //         btnNext.classList.add("back");
        //     else btnNext.classList.remove("back");
        // }

        var btnNext = document.getElementById("test-next-btn");
        if (btnNext) {
            // if (pageIndex === state.gameData.totalPages - 1) {
            //     btnNext.textContent = "测试";
            // } else {
            btnNext.textContent = "下一关 👉";
            // }
        }
    }

    /**
     * 开始正式游戏
     */
    function startMainGame() {
        Utils.playSound("click");

        console.log("Starting main game...");

        var currentPage = getCurrentPage();
        var gamePage = document.getElementById("page-game");

        // 生成游戏数据
        generateGameData();
        startGamePage(0);

        Animation.tutorialToGameTransition(currentPage, gamePage, function () {
            currentPage.classList.remove("active");
        });
    }

    /**
     * 生成游戏数据
     */
    function generateGameData() {
        var config = Config.get("games.attention");
        var itemsPerPage = config.itemsPerPage || 56;
        var correctItemsPerPage = config.correctItemsPerPage || 25;

        // state.gameData = {};
        state.gameData.pages = [];
        state.gameData.timePerPage = config.timePerPage || 20;
        var totalPages = state.gameData.totalPages || 3;

        for (var i = 0; i < totalPages; i++) {
            var items = [];

            // 生成正确的 q
            for (var j = 0; j < correctItemsPerPage; j++) {
                items.push(generateCorrectQ());
            }

            // 生成错误的字母
            for (var k = correctItemsPerPage; k < itemsPerPage; k++) {
                items.push(generateIncorrectLetter());
            }

            // 打乱顺序
            items = Utils.shuffleArray(items);

            state.gameData.pages.push({
                items: items,
                selected: [],
                startTime: null,
                endTime: null,
                timeSpent: 0,
            });
        }

        console.log(
            "Game data generated:",
            state.gameData.pages.length,
            "pages"
        );
    }

    /**
     * 开始某一页游戏
     */
    function startGamePage(pageIndex, needrender = true) {
        state.gameData.currentPage = pageIndex;
        var pageData = state.gameData.pages[pageIndex];
        state.showResult = false;

        // 更新页面信息
        var currentPageSpan = document.getElementById("current-page");
        var totalPagesSpan = document.getElementById("total-pages");
        if (currentPageSpan) currentPageSpan.textContent = pageIndex + 1;
        if (totalPagesSpan)
            totalPagesSpan.textContent = state.gameData.totalPages;

        renderProgressBar(pageIndex, state.gameData.totalPages, "progress-bar");

        // 更新按钮文本
        var btnNext = document.getElementById("test-next-btn");
        if (btnNext) {
            // if (pageIndex === state.gameData.totalPages - 1) {
            //     btnNext.textContent = "测试";
            // } else {
            btnNext.textContent = "完成";
            // }
        }

        if (needrender)
            // 渲染游戏网格
            renderGameGridTo(
                document.getElementById("main-grid"),
                pageData.items
            );

        // 开始计时
        pageData.startTime = Date.now();
        startGameTimer();
    }

    /**
     * 渲染游戏网格
     */
    function renderGameGridTo(grid, items) {
        grid.innerHTML = "";

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var gridItem = getAGridItem(item);

            gridItem.setAttribute("indexInGrid", i);

            updateItemState(gridItem, itemState.normal);
            gridItem.classList.add("small");
            gridItem.addEventListener("click", function () {
                handleGameItemClick(this);
            });

            grid.appendChild(gridItem);
        }
    }

    function updateItemState(gridItem, state) {
        const letter = gridItem.getAttribute("letter");
        const index = gridItem.getAttribute("index");

        gridItem.style.backgroundImage = `url('../images/game1/${letter}/${state}/${Utils.format2(
            index
        )}.png')`;
    }

    /**
     * 处理游戏模式的点击事件
     */
    function handleGameItemClick(element) {
        var pageIndex = state.gameData.currentPage;
        var pageData = state.gameData.pages[pageIndex];
        var index = parseInt(element.getAttribute("indexInGrid"));
        console.log("item点击Index：" + index);
        var isSelected = pageData.selected.indexOf(index) !== -1;
        console.log("item点击isSelected：" + isSelected);
        Utils.playSound("click");
        if (isSelected) {
            // 取消选中
            pageData.selected = pageData.selected.filter(function (i) {
                return i !== index;
            });
            element.classList.remove("selected");
            updateItemState(element, itemState.normal);
            Animation.deselectFeedback(element);
        } else {
            // 选中
            pageData.selected.push(index);
            element.classList.add("selected");
            updateItemState(element, itemState.highlight);
            Animation.selectFeedback(element);
        }
    }

    function getAGridItem(item) {
        var gridItem = document.createElement("div");
        gridItem.className = "grid-item";
        gridItem.setAttribute("index", item.index);
        gridItem.setAttribute("letter", item.letter);
        return gridItem;
    }

    /**
     * 开始游戏计时器
     */
    function startGameTimer() {
        var timeLeft = state.gameData.timePerPage;
        updateTimerDisplay(timeLeft);

        // 清除之前的计时器
        if (timers.gameTimer) {
            clearInterval(timers.gameTimer);
        }

        timers.gameTimer = setInterval(function () {
            timeLeft--;
            updateTimerDisplay(timeLeft);

            if (timeLeft <= 0) {
                clearInterval(timers.gameTimer);
                // 时间到，自动进入下一页
                nextGamePage();
            }
        }, 1000);
    }

    /**
     * 更新计时器显示
     */
    function updateTimerDisplay(seconds) {
        var timerElement = document.getElementById("game-timer");
        if (!timerElement) return;

        timerElement.textContent = "时间：" + Utils.formatTime(seconds);

        // 根据剩余时间改变样式
        timerElement.classList.remove("warning", "danger");
        if (seconds <= 5) {
            timerElement.classList.add("danger");
        } else if (seconds <= 10) {
            timerElement.classList.add("warning");
        }
    }

    /**
     * 下一页游戏
     */
    function nextGamePage() {
        state.showResult = false;
        var pageIndex = state.gameData.currentPage;

        // 检查是否还有下一页
        if (pageIndex < state.gameData.totalPages - 1) {
            var currentPage = state.gameData.currentPage;
            var nextPage = currentPage + 1;
            if (nextPage >= state.gameData.totalPages) return;

            var currentGrid = document.getElementById("main-grid");
            var nextPageIndex = pageIndex + 1;
            var nextGrid = document.getElementById("next-grid");
            var detailGrid = document.getElementById("detail-test-grid");

            // ① 先渲染下一页（在屏幕外）
            renderGameGridTo(nextGrid, state.gameData.pages[nextPage].items);
            // ② 等一帧，确保 Grid 已布局完成
            requestAnimationFrame(function () {
                currentGrid.classList.add("slide-out");
                detailGrid.classList.add("slide-out");

                nextGrid.classList.add("slide-in");
                nextGrid.classList.remove("hide");
                nextGrid.classList.add("next");
                // ③ 动画结束后交换身份
                nextGrid.addEventListener(
                    "transitionend",
                    function () {
                        currentGrid.classList.remove("active", "slide-out");
                        detailGrid.classList.remove("active", "slide-out");
                        currentGrid.classList.add("hide");
                        detailGrid.classList.add("hide");

                        nextGrid.classList.remove("next", "slide-in");
                        nextGrid.classList.add("active");
                        // 交换 id（保持你原逻辑）
                        currentGrid.id = "next-grid";
                        nextGrid.id = "main-grid";

                        startGamePage(nextPageIndex, false);
                    },
                    { once: true }
                );
            });
        } else {
            var detailGrid = document.getElementById("detail-test-grid");
            detailGrid.classList.add("hide");
            // 游戏结束，显示结果
            showResult();
        }
    }

    /**
     * 计算某一页的结果
     */
    function calculatePageResult(pageIndex) {
        var pageData = state.gameData.pages[pageIndex];
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
            totalCorrect: totalCorrect,
        };

        console.log("Page", pageIndex + 1, "result:", pageData.result);
    }

    /**
     * 显示结果页面
     */
    function showResult(needSound = true) {
        console.log("Showing result...");

        // 计算总体结果
        calculateTotalResult();

        var currentPage = getCurrentPage();

        if (needSound) Utils.playSound("success");

        var resultPage = document.getElementById("page-result");

        currentPage.classList.remove("active");
        // 渲染结果
        renderResult();

        Animation.gameToResultTransition(currentPage, resultPage, function () {
            resultPage.classList.add("active");

            // 徽章动画
            var badge = resultPage.querySelector(".result-badge");
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

        for (var i = 0; i < state.gameData.pages.length; i++) {
            var pageData = state.gameData.pages[i];
            var result = pageData.result;

            totalTime += pageData.timeSpent;
            totalCorrect += result.correctCount;
            totalError += result.errorCount;
            totalOmission += result.omissionCount;
            totalItems += result.totalCorrect;
        }

        // 计算指标
        var completedItems = totalCorrect + totalError + totalOmission;
        var accuracy =
            completedItems > 0
                ? Math.round((totalCorrect / completedItems) * 100)
                : 0;
        var speed = totalCorrect + totalError + totalOmission;
        var focus = totalCorrect - (totalError + totalOmission);

        state.results = {
            totalTime: totalTime,
            correctCount: totalCorrect,
            errorCount: totalError,
            omissionCount: totalOmission,
            totalItems: totalItems,
            accuracy: accuracy,
            speed: speed,
            focus: focus,
            score: completedItems - (totalError + totalOmission),
        };

        console.log("Total result:", state.results);
    }

    /**
     * 渲染结果
     */
    function renderResult() {
        var results = state.results;

        // 根据集中程度动态调整结果页文案
        var line1 = document.getElementById("result-line-1");
        var line2 = document.getElementById("result-line-2");
        var line3 = document.getElementById("result-line-3");
        if (line1 && line2 && line3) {
            if (results.focus < 28.89) {
                line1.textContent = "辛苦啦！";
                line2.textContent = "这次完成了全部挑战。";
                line3.textContent = "继续练习会更稳更准！";
            } else {
                line1.textContent = "恭喜你！ 🎉";
                line2.textContent = "完成了全部挑战。";
                line3.textContent = "你真是眼疾手快！👏";
            }
        }

        // 更新标题
        var title = document.getElementById("result-title");
        if (title) {
            if (results.accuracy >= 90) {
                title.textContent = "真正的字母侦探！";
            } else if (results.accuracy >= 70) {
                title.textContent = "表现不错！";
            } else {
                title.textContent = "继续加油！";
            }
        }

        // 更新统计数据
        var statTime = document.getElementById("stat-time");
        var statAccuracy = document.getElementById("stat-accuracy");
        var statSpeed = document.getElementById("stat-speed");
        var statFocus = document.getElementById("stat-focus");

        if (statTime)
            statTime.textContent = Utils.formatTime(results.totalTime);
        if (statAccuracy) statAccuracy.textContent = results.accuracy + "%";
        if (statSpeed) statSpeed.textContent = results.speed;
        if (statFocus) statFocus.textContent = results.focus;
    }

    /**
     * 上报测试数据
     */
    function submitTestData() {
        var testData = {
            gameType: "attention",
            timestamp: Date.now(),
            token: Config.get("user.token"),
            results: state.results,
            details: {
                pages: state.gameData.pages.map(function (page) {
                    return {
                        timeSpent: page.timeSpent,
                        result: page.result,
                    };
                }),
            },
        };

        API.submitTestData(testData)
            .then(function (response) {
                console.log("Test data submitted:", response);
            })
            .catch(function (error) {
                console.error("Failed to submit test data:", error);
            });
    }

    /**
     * 重新开始
     */
    function restart() {
        console.log("Restarting game...");

        // 重置状态
        state.gameData = {
            pages: [],
            currentPage: 0,
            totalPages: Config.get("games.attention.pages"),
            timePerPage: Config.get("games.attention.timePerPage"),
            startTime: null,
            pageTimes: [],
            pageResults: [],
        };

        state.results = {
            totalTime: 0,
            correctCount: 0,
            errorCount: 0,
            omissionCount: 0,
            accuracy: 0,
            speed: 0,
            focus: 0,
        };

        // 重新加载页面
        startMainGame();
    }

    /**
     * 渲染进度条
     */
    function renderProgressBar(currentPage, totalPages, progressBarId) {
        var progressBar = document.getElementById(
            progressBarId || "progress-bar"
        );
        if (!progressBar) return;

        progressBar.innerHTML = "";

        for (var i = 0; i < totalPages; i++) {
            var dot = document.createElement("div");
            dot.className = "progress-dot-train";
            if (i === currentPage) {
                dot.classList.add("active");
            }

            // 为详情页的进度点添加点击事件
            if (progressBarId === "details-progress-bar") {
                (function (pageIndex) {
                    dot.addEventListener("click", function () {
                        jumpToDetailPage(pageIndex);
                    });
                })(i);
                dot.style.cursor = "pointer";
            }

            progressBar.appendChild(dot);
        }
    }

    /**
     * 跳转到指定详情页
     */
    function jumpToDetailPage(pageIndex) {
        Utils.playSound("click");

        if (pageIndex >= 0 && pageIndex < state.gameData.totalPages) {
            state.detailsPage = pageIndex;
            renderDetailsPage(pageIndex);
        }
    }

    /**
     * 更新进度条状态
     */
    function updateProgressBarStatus(progressBarId) {
        var progressBar = document.getElementById(
            progressBarId || "details-progress-bar"
        );
        if (!progressBar) return;

        var dots = progressBar.querySelectorAll(".progress-dot-train");

        for (var i = 0; i < state.gameData.pages.length; i++) {
            var pageData = state.gameData.pages[i];
            var result = pageData.result;

            if (result && dots[i]) {
                dots[i].classList.remove("correct", "error");
                if (result.errorCount === 0 && result.omissionCount === 0) {
                    dots[i].classList.add("correct");
                } else {
                    dots[i].classList.add("error");
                }
            }
        }
    }

    /**
     * 查看答题详情
     */
    function viewDetails() {
        console.log("Viewing details...");
        Utils.playSound("click");
        state.detailsPage = 0;

        var resultPage = document.getElementById("page-result");
        var detailsPage = document.getElementById("page-details");

        Animation.pageTransition(resultPage, detailsPage, function () {
            // 渲染进度条
            renderProgressBar(
                0,
                state.gameData.totalPages,
                "details-progress-bar"
            );
            updateProgressBarStatus("details-progress-bar");

            // 渲染第一页详情
            renderDetailsPage(0);
        });
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

    /**
     * 渲染详情页面
     */
    function renderDetailsPage(pageIndex) {
        var pageData = state.gameData.pages[pageIndex];
        var grid = document.getElementById("details-grid");
        if (!grid) return;

        grid.innerHTML = "";

        var title = document.getElementById("detail-title");
        title.textContent = "📄 第" + numberToChinese(pageIndex + 1) + "关";

        for (var i = 0; i < pageData.items.length; i++) {
            var item = pageData.items[i];
            var gridItem = getAGridItem(item);
            gridItem.classList.add("small");

            // 判断状态
            var isSelected = pageData.selected.indexOf(i) !== -1;
            var isCorrect = item.isCorrect;

            if (isSelected && isCorrect) {
                // 选中且正确
                gridItem.classList.add("correct");
                updateItemState(gridItem, itemState.chose);
            } else if (!isSelected && isCorrect) {
                // 漏选
                updateItemState(gridItem, itemState.missing);
                gridItem.classList.add("omission");
            } else if (isSelected && !isCorrect) {
                // 错选
                updateItemState(gridItem, itemState.chose);
                gridItem.classList.add("error");
            } else if (!isSelected && !isCorrect) {
                gridItem.classList.add("correct");
                updateItemState(gridItem, itemState.normal);
            }

            grid.appendChild(gridItem);
        }

        // 更新进度条当前页
        var dots = document.querySelectorAll(
            "#details-progress-bar .progress-dot-train"
        );
        for (var j = 0; j < dots.length; j++) {
            dots[j].classList.remove("active");
            if (j === pageIndex) {
                dots[j].classList.add("active");
            }
        }

        // 更新按钮状态
        var btnPrev = document.getElementById("btn-prev-detail");
        var btnNext = document.getElementById("btn-next-detail");

        if (btnPrev) {
            if (pageIndex === 0) btnPrev.classList.add("back");
            else btnPrev.classList.remove("back");
        }

        if (btnNext) {
            if (pageIndex === state.gameData.totalPages - 1)
                btnNext.classList.add("back");
            else btnNext.classList.remove("back");
        }
    }

    /**
     * 上一页详情
     */
    function prevDetailPage() {
        Utils.playSound("click");

        if (state.detailsPage > 0) {
            state.detailsPage--;
            renderDetailsPage(state.detailsPage);
        } else {
            showResult(false);
        }
    }

    /**
     * 返回结果页
     */
    function backToResult() {
        Utils.playSound("click");
        showResult(false);
    }

    /**
     * 下一页详情
     */
    function nextDetailPage() {
        Utils.playSound("click");
        if (state.detailsPage < state.gameData.totalPages - 1) {
            state.detailsPage++;
            renderDetailsPage(state.detailsPage);
        } else {
            showResult(false);
        }
    }

    /**
     * 返回主页
     */
    function backToHome() {
        window.location.href =
            "../index.html?token=" + (Config.get("user.token") || "");
    }

    // 导出公共方法
    return {
        init: init,
        nextPage: nextPage,
        showRules: showRules,
        startTutorial: startTutorial,
        generateCorrectQ: generateCorrectQ,
        generateIncorrectLetter: generateIncorrectLetter,
        startMainGame: startMainGame,
        nextGamePage: nextGamePage,
        viewDetails: viewDetails,
        restart: restart,
        backToResult: backToResult,
        prevDetailPage: prevDetailPage,
        nextDetailPage: nextDetailPage,
        backToHome: backToHome,
        jumpToDetailPage: jumpToDetailPage,
        completePage: completePage,
    };
})();

// 页面加载完成后初始化
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", AttentionGame.init);
} else {
    AttentionGame.init();
}
