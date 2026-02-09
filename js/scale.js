function resizeStage() {
    const designWidth = 750;
    const designHeight = 1437;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // 1. stage 和 page 跟随设备窗口大小
    const stage = document.querySelector(".stage");
    stage.style.width = `${windowWidth}px`;
    stage.style.height = `${windowHeight}px`;
    stage.style.transform = `translate(-50%, -50%)`; // 保持居中

    const pages = document.querySelectorAll(".page");
    pages.forEach(page => {
        page.style.width = `${windowWidth}px`;
        page.style.height = `${windowHeight}px`;
    });

    // 2. page-content 和 page-base：等比缩放到一边填满设备
    const contentScale = Math.min(
        windowWidth / designWidth,
        windowHeight / designHeight
    );

    const pageContents = document.querySelectorAll(".page-content");
    const pageBases = document.querySelectorAll(".page-base");

    pageContents.forEach(content => {
        content.style.transform = `translate(-50%, -50%) scale(${contentScale})`;
    });



    // 3. page-background：智能缩放
    const pageBackgrounds = document.querySelectorAll(".page-background");

    // 判断是宽度贴合还是高度贴合
    const isWidthFit = windowWidth / designWidth < windowHeight / designHeight;

    let ratio;
    if (isWidthFit) {
        // 宽度贴合，计算高度留空比例
        ratio = windowHeight / (designHeight * contentScale);
    } else {
        // 高度贴合，计算宽度留空比例
        ratio = windowWidth / (designWidth * contentScale);
    }
    if (ratio < 1.13) {
        // 留空比例小于 1.1，拉伸填满设备
            const scaleX = windowWidth / designWidth;
            const scaleY = windowHeight / designHeight;
        pageBackgrounds.forEach(bg => {
            bg.style.transform = `translate(-50%, -50%) scale(${scaleX}, ${scaleY})`;
        });

        pageBases.forEach(base => {
            base.style.transform = `translate(-50%, -50%) scale(${contentScale / scaleX}, ${contentScale / scaleY})`;
        });
    }
    else {
        pageBackgrounds.forEach(bg => {
            bg.style.transform = `translate(-50%, -50%) scale(${contentScale})`;
        });
        pageBases.forEach(base => {
            base.style.transform = `translate(-50%, -50%) scale(${1})`;
        });
    }


}

window.addEventListener("resize", resizeStage);
resizeStage();
