function resizeStage() {
    const designWidth = 750;
    const designHeight = 1437;
    const scale = Math.min(
        window.innerWidth / designWidth,
        window.innerHeight / designHeight
    );
    const stage = document.querySelector(".stage");
    // stage.style.transform = `scale(${scale})`;
    stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

window.addEventListener("resize", resizeStage);
resizeStage();
