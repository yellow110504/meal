const API_KEY = "dba1fc9266654cf5921022efad652d33";
const OFFICE_CODE = "B10";
const SCHOOL_CODE = "7041169";

const today = new Date();

let year = today.getFullYear();
let month = today.getMonth() + 1;

let currentRequest = null;


/* 숫자를 두 자리로 변환 */
function pad(value) {
    return String(value).padStart(2, "0");
}


/* 같은 연도와 월인지 확인 */
function isSameMonth(date, targetYear, targetMonth) {
    return (
        date.getFullYear() === targetYear &&
        date.getMonth() === targetMonth - 1
    );
}


/* 오늘 날짜인지 확인 */
function isToday(date) {
    return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
    );
}


/* HTML 특수문자 변환 */
function decodeHtml(value) {
    const textarea = document.createElement("textarea");

    textarea.innerHTML = String(value || "");

    return textarea.value;
}


/* 한 개의 급식명 정리 */
function cleanMealItem(value) {
    return decodeHtml(value)
        /*
         * 숫자와 마침표로 이루어진 알레르기 정보만 제거
         * 메뉴 이름의 일반 괄호는 유지
         */
        .replace(/\(\s*\d+(?:\.\d+)*\.?\s*\)/g, "")
        .replace(/\(구로\)/g, "")
        .replace(/['"]/g, "")
        .replace(/\s+/g, " ")
        .replace(/\//g, "")
        .trim();
}


/* 급식 데이터를 메뉴 배열로 변환 */
function cleanMeal(mealName) {
    return String(mealName || "")
        .split(/<br\s*\/?>/gi)
        .map(cleanMealItem)
        .filter(Boolean);
}


/* 해당 월의 첫날과 마지막 날 */
function getMonthRange(targetYear, targetMonth) {
    const lastDay = new Date(
        targetYear,
        targetMonth,
        0
    ).getDate();

    return {
        start:
            String(targetYear) +
            pad(targetMonth) +
            "01",

        end:
            String(targetYear) +
            pad(targetMonth) +
            pad(lastDay)
    };
}


/* API 주소 생성 */
function createApiUrl(targetYear, targetMonth) {
    const range = getMonthRange(
        targetYear,
        targetMonth
    );

    const params = new URLSearchParams({
        KEY: API_KEY,
        Type: "json",
        pIndex: "1",
        pSize: "100",
        ATPT_OFCDC_SC_CODE: OFFICE_CODE,
        SD_SCHUL_CODE: SCHOOL_CODE,
        MLSV_FROM_YMD: range.start,
        MLSV_TO_YMD: range.end
    });

    return (
        "https://open.neis.go.kr/hub/mealServiceDietInfo?" +
        params.toString()
    );
}


/* 해당 월 급식 불러오기 */
async function fetchMeals(targetYear, targetMonth) {
    if (currentRequest) {
        currentRequest.abort();
    }

    currentRequest = new AbortController();

    const response = await fetch(
        createApiUrl(targetYear, targetMonth),
        {
            signal: currentRequest.signal
        }
    );

    if (!response.ok) {
        throw new Error(
            `급식 API 요청 실패: ${response.status}`
        );
    }

    const data = await response.json();

    const rows =
        data?.mealServiceDietInfo?.[1]?.row ?? [];

    const mealMap = new Map();

    rows.forEach((row) => {
        const mealDate = String(
            row.MLSV_YMD || ""
        );

        const day = Number(
            mealDate.slice(6, 8)
        );

        if (!day) {
            return;
        }

        const mealItems = cleanMeal(
            row.DDISH_NM
        );

        if (!mealMap.has(day)) {
            mealMap.set(day, []);
        }

        mealMap
            .get(day)
            .push(...mealItems);
    });

    return mealMap;
}


/* 화면에 현재 월 표시 */
function updateMonthTitle() {
    const title = document.getElementById("dat");

    if (!title) {
        return;
    }

    title.textContent =
        `${year}년 ${month}월`;
}


/* 날짜 칸 생성 */
function createCalendarCell(date, mealMap) {
    const cell = document.createElement("div");

    cell.className = "calendar-cell";
    cell.setAttribute("role", "gridcell");

    const currentMonth = isSameMonth(
        date,
        year,
        month
    );

    /*
     * 이전 달이나 다음 달 날짜는
     * 숫자를 표시하지 않는 빈칸으로 유지
     */
    if (!currentMonth) {
        cell.classList.add("is-empty");
        cell.setAttribute("aria-hidden", "true");

        return cell;
    }

    const day = date.getDate();

    if (isToday(date)) {
        cell.classList.add("is-today");
        cell.setAttribute(
            "aria-current",
            "date"
        );
    }

    const dayNumber =
        document.createElement("span");

    dayNumber.className = "day-number";
    dayNumber.textContent = String(day);

    cell.appendChild(dayNumber);

    const meals = mealMap.get(day) ?? [];

    if (meals.length > 0) {
        const mealList =
            document.createElement("div");

        mealList.className = "meal-list";

        meals.forEach((meal) => {
            const item =
                document.createElement("span");

            item.className = "meal-item";
            item.textContent = meal;

            mealList.appendChild(item);
        });

        cell.appendChild(mealList);
    }

    return cell;
}


/* 달력 행 생성 */
function createCalendarRows(mealMap) {
    const rowsContainer =
        document.getElementById("calendarRows");

    if (!rowsContainer) {
        return;
    }

    rowsContainer.innerHTML = "";

    const firstDate = new Date(
        year,
        month - 1,
        1
    );

    const lastDate = new Date(
        year,
        month,
        0
    );

    /*
     * 첫날이 들어 있는 주의 월요일
     * getDay(): 일 0, 월 1 ... 토 6
     */
    const mondayOffset =
        (firstDate.getDay() + 6) % 7;

    const weekStart =
        new Date(firstDate);

    weekStart.setDate(
        firstDate.getDate() - mondayOffset
    );

    /*
     * 한 주에서 월요일부터 금요일까지만 생성
     */
    while (weekStart <= lastDate) {
        const weekdays = [];

        for (let index = 0; index < 5; index++) {
            const date = new Date(weekStart);

            date.setDate(
                weekStart.getDate() + index
            );

            weekdays.push(date);
        }

        /*
         * 월~금 중 현재 월 날짜가 하나도 없으면
         * 첫 줄 또는 마지막 줄을 생성하지 않음
         */
        const hasCurrentMonthDate =
            weekdays.some((date) => {
                return isSameMonth(
                    date,
                    year,
                    month
                );
            });

        if (hasCurrentMonthDate) {
            const row =
                document.createElement("div");

            row.className = "calendar-row";
            row.setAttribute("role", "row");

            weekdays.forEach((date) => {
                row.appendChild(
                    createCalendarCell(
                        date,
                        mealMap
                    )
                );
            });

            rowsContainer.appendChild(row);
        }

        weekStart.setDate(
            weekStart.getDate() + 7
        );
    }
}


/* 달력 전체 출력 */
async function renderCalendar() {
    updateMonthTitle();

    const rowsContainer =
        document.getElementById("calendarRows");

    if (rowsContainer) {
        rowsContainer.setAttribute(
            "aria-busy",
            "true"
        );
    }

    /*
     * API 응답을 기다리지 않고
     * 날짜부터 먼저 표시
     */
    createCalendarRows(new Map());

    const requestedYear = year;
    const requestedMonth = month;

    try {
        const mealMap = await fetchMeals(
            requestedYear,
            requestedMonth
        );

        /*
         * 빠르게 월을 변경했을 때
         * 이전 요청의 결과가 섞이는 것을 방지
         */
        if (
            requestedYear !== year ||
            requestedMonth !== month
        ) {
            return;
        }

        createCalendarRows(mealMap);
    } catch (error) {
        if (error.name === "AbortError") {
            return;
        }

        console.error(
            "급식 정보를 불러오지 못했습니다.",
            error
        );

        /*
         * 급식 요청이 실패해도
         * 날짜 달력은 그대로 유지
         */
        createCalendarRows(new Map());
    } finally {
        if (rowsContainer) {
            rowsContainer.setAttribute(
                "aria-busy",
                "false"
            );
        }
    }
}


/* 다음 달 */
function setdate() {
    month += 1;

    if (month > 12) {
        year += 1;
        month = 1;
    }

    renderCalendar();
}


/* 이전 달 */
function setminus() {
    month -= 1;

    if (month < 1) {
        year -= 1;
        month = 12;
    }

    renderCalendar();
}


/* 페이지가 열리면 현재 월 자동 표시 */
document.addEventListener(
    "DOMContentLoaded",
    renderCalendar
);

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
        ".calendar-panel",
        setdate,
        setminus
    );
});
