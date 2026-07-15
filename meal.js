const API_KEY = "dba1fc9266654cf5921022efad652d33";
const OFFICE_CODE = "B10";
const SCHOOL_CODE = "7041169";

let selectedDate = new Date();

/* 숫자를 두 자리로 변환 */
function pad(number) {
    return String(number).padStart(2, "0");
}

/* 날짜를 YYYY-MM-DD 형식으로 변환 */
function formatInputDate(date) {
    return (
        date.getFullYear() +
        "-" +
        pad(date.getMonth() + 1) +
        "-" +
        pad(date.getDate())
    );
}

/* 날짜를 YYYYMMDD 형식으로 변환 */
function formatApiDate(date) {
    return (
        date.getFullYear() +
        pad(date.getMonth() + 1) +
        pad(date.getDate())
    );
}

/* 급식 이름 정리 */
function cleanMealName(mealName) {
    return String(mealName || "")
        .replace(/"/g, "")
        .replace(/\//g, "")
        .replace(/'/g, "");
}

/* 화면 날짜 표시 */
function updateDateTitle() {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const date = selectedDate.getDate();

    document.querySelector("#dat").textContent =
        `${year}년 ${month}월 ${date}일`;
}

/* 급식 정보 불러오기 */
async function loadMeal() {
    const container = document.querySelector("#container");
    const mealDate = formatApiDate(selectedDate);

    updateDateTitle();

    container.textContent = "급식 정보를 불러오는 중입니다.";

    const url =
        "https://open.neis.go.kr/hub/mealServiceDietInfo" +
        `?KEY=${API_KEY}` +
        "&Type=json" +
        "&pIndex=1" +
        "&pSize=100" +
        `&ATPT_OFCDC_SC_CODE=${OFFICE_CODE}` +
        `&SD_SCHUL_CODE=${SCHOOL_CODE}` +
        `&MLSV_YMD=${mealDate}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP 오류: ${response.status}`);
        }

        const data = await response.json();

        const meal =
            data?.mealServiceDietInfo?.[1]?.row?.[0]?.DDISH_NM;

        if (!meal) {
            container.textContent = "급식 정보가 없습니다.";
            return;
        }

        container.innerHTML = cleanMealName(meal);
    } catch (error) {
        console.error("급식 정보 오류:", error);
        container.textContent = "급식 정보가 없습니다.";
    }
}

/* 날짜 선택 */
function setdates() {
    const dateInput = document.getElementById("date");

    if (!dateInput.value) {
        return;
    }

    const [year, month, date] = dateInput.value
        .split("-")
        .map(Number);

    selectedDate = new Date(year, month - 1, date);

    loadMeal();
}

/* 다음 날 */
function setdate() {
    selectedDate.setDate(selectedDate.getDate() + 1);

    const dateInput = document.getElementById("date");

    if (dateInput) {
        dateInput.value = formatInputDate(selectedDate);
    }

    loadMeal();
}

/* 이전 날 */
function setminus() {
    selectedDate.setDate(selectedDate.getDate() - 1);

    const dateInput = document.getElementById("date");

    if (dateInput) {
        dateInput.value = formatInputDate(selectedDate);
    }

    loadMeal();
}

/* 페이지가 열리면 오늘 급식 자동 표시 */
document.addEventListener("DOMContentLoaded", function () {
    const dateInput = document.getElementById("date");

    if (dateInput) {
        dateInput.value = formatInputDate(selectedDate);
    }

    loadMeal();
});

function initAnimatedSwipe(selector, nextAction, previousAction) {
    const panel = document.querySelector(selector);

    if (!panel) {
        return;
    }

    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let moveX = 0;
    let moveY = 0;
    let startTime = 0;

    let dragging = false;
    let animating = false;

    function waitFrame() {
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                requestAnimationFrame(resolve);
            });
        });
    }

    function animatePanel(x, opacity, duration, easing) {
        return new Promise((resolve) => {
            let finished = false;

            function finish() {
                if (finished) {
                    return;
                }

                finished = true;
                panel.removeEventListener("transitionend", finish);
                resolve();
            }

            panel.style.transition = [
                `transform ${duration}ms ${easing}`,
                `opacity ${duration}ms ease`
            ].join(", ");

            panel.addEventListener("transitionend", finish, {
                once: true
            });

            requestAnimationFrame(() => {
                panel.style.transform =
                    `translate3d(${x}px, 0, 0)`;

                panel.style.opacity = String(opacity);
            });

            setTimeout(finish, duration + 60);
        });
    }

    function clearPanelStyle() {
        panel.style.transition = "";
        panel.style.transform = "";
        panel.style.opacity = "";
    }

    panel.addEventListener("pointerdown", (event) => {
        if (animating) {
            return;
        }

        if (
            event.pointerType === "mouse" &&
            event.button !== 0
        ) {
            return;
        }

        pointerId = event.pointerId;

        startX = event.clientX;
        startY = event.clientY;

        moveX = 0;
        moveY = 0;

        startTime = performance.now();
        dragging = true;

        panel.style.transition = "none";

        try {
            panel.setPointerCapture(pointerId);
        } catch (error) {
            /* 일부 브라우저에서는 생략 */
        }
    });

    panel.addEventListener("pointermove", (event) => {
        if (
            !dragging ||
            event.pointerId !== pointerId
        ) {
            return;
        }

        moveX = event.clientX - startX;
        moveY = event.clientY - startY;

        /*
         * 세로 이동이 더 크면
         * 일반 페이지 스크롤로 처리
         */
        if (Math.abs(moveY) >= Math.abs(moveX)) {
            panel.style.transform = "";
            panel.style.opacity = "";

            return;
        }

        const draggedX = moveX * 0.82;

        const opacity = Math.max(
            0.72,
            1 - Math.abs(draggedX) /
            (panel.clientWidth * 1.5)
        );

        panel.style.transform =
            `translate3d(${draggedX}px, 0, 0)`;

        panel.style.opacity = String(opacity);
    });

    async function finishSwipe(event) {
        if (
            !dragging ||
            event.pointerId !== pointerId
        ) {
            return;
        }

        dragging = false;

        try {
            panel.releasePointerCapture(pointerId);
        } catch (error) {
            /* 일부 브라우저에서는 생략 */
        }

        const elapsed = Math.max(
            1,
            performance.now() - startTime
        );

        const velocity =
            Math.abs(moveX) / elapsed;

        const horizontalSwipe =
            Math.abs(moveX) > Math.abs(moveY);

        const minimumDistance = Math.min(
            56,
            panel.clientWidth * 0.16
        );

        const shouldChange =
            horizontalSwipe &&
            (
                Math.abs(moveX) >= minimumDistance ||
                velocity >= 0.55
            );

        /* 짧게 밀었으면 원래 자리로 복귀 */

        if (!shouldChange) {
            await animatePanel(
                0,
                1,
                180,
                "cubic-bezier(0.22, 0.61, 0.36, 1)"
            );

            clearPanelStyle();
            return;
        }

        animating = true;

        const isNext = moveX < 0;
        const panelWidth =
            panel.getBoundingClientRect().width;

        /*
         * 현재 내용을 화면 밖으로 이동
         */

        await animatePanel(
            isNext ? -panelWidth : panelWidth,
            0,
            170,
            "cubic-bezier(0.4, 0, 1, 1)"
        );

        /*
         * 날짜 변경
         */

        const result = isNext
            ? nextAction()
            : previousAction();

        if (
            result &&
            typeof result.then === "function"
        ) {
            await result;
        }

        await waitFrame();

        /*
         * 새 내용을 반대편에 준비
         */

        panel.style.transition = "none";

        panel.style.transform = `translate3d(${
            isNext ? panelWidth : -panelWidth
        }px, 0, 0)`;

        panel.style.opacity = "0";

        panel.offsetHeight;

        /*
         * 새 내용이 가운데로 들어오는 애니메이션
         */

        await animatePanel(
            0,
            1,
            230,
            "cubic-bezier(0.22, 0.61, 0.36, 1)"
        );

        clearPanelStyle();

        animating = false;
        pointerId = null;
    }

    panel.addEventListener(
        "pointerup",
        finishSwipe
    );

    panel.addEventListener(
        "pointercancel",
        async (event) => {
            if (
                !dragging ||
                event.pointerId !== pointerId
            ) {
                return;
            }

            dragging = false;

            await animatePanel(
                0,
                1,
                180,
                "cubic-bezier(0.22, 0.61, 0.36, 1)"
            );

            clearPanelStyle();
        }
    );
}
document.addEventListener("DOMContentLoaded", () => {
    initAnimatedSwipe(
        ".meal-content",
        setdate,
        setminus
    );
});
