import { EditorView, basicSetup } from "https://esm.sh/codemirror";
import { EditorState } from "https://esm.sh/@codemirror/state";
import { html } from "https://esm.sh/@codemirror/lang-html";
import { css } from "https://esm.sh/@codemirror/lang-css";


// ==================================================
// СБРОС SCROLL ПРИ ПЕРЕЗАГРУЗКЕ
// ==================================================

if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
}


// ==================================================
// ОТКЛЮЧАЕМ АВТОМАТИЧЕСКИЙ SCROLL ANCHORING
// ==================================================

document.documentElement.style.overflowAnchor = "none";


// ==================================================
// ПЛАВНЫЙ ИНЕРЦИОННЫЙ СКРОЛЛ
// ==================================================

let scrollTarget = 0;
let isScrolling = false;


// Максимальная позиция скролла
function getMaxScroll() {
    return Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
    );
}


// ==================================================
// ОСНОВНАЯ АНИМАЦИЯ СКРОЛЛА
// ==================================================

function smoothScroll() {

    const currentScroll = window.scrollY;

    // Если высота страницы изменилась,
    // не позволяем target выйти за пределы
    scrollTarget = Math.max(
        0,
        Math.min(
            getMaxScroll(),
            scrollTarget
        )
    );

    const distance =
        scrollTarget - currentScroll;


    // Если почти дошли до цели
    if (Math.abs(distance) < 0.5) {

        window.scrollTo(
            0,
            scrollTarget
        );

        isScrolling = false;

        return;
    }


    // Плавность / инерция
    window.scrollTo(
        0,
        currentScroll + distance * 0.12
    );


    requestAnimationFrame(
        smoothScroll
    );
}


// ==================================================
// ЗАПУСК ПЛАВНОГО СКРОЛЛА
// ==================================================

function startSmoothScroll() {

    if (isScrolling) {
        return;
    }

    isScrolling = true;

    requestAnimationFrame(
        smoothScroll
    );
}


// ==================================================
// WHEEL
// ==================================================

window.addEventListener(
    "wheel",
    (event) => {

        // Если есть горизонтальный скролл
        if (
            Math.abs(event.deltaX) >
            Math.abs(event.deltaY)
        ) {
            return;
        }


        event.preventDefault();


        // Добавляем движение к текущей цели
        scrollTarget += event.deltaY;


        // Не даём прокрутить выше начала страницы
        scrollTarget = Math.max(
            0,
            scrollTarget
        );


        // Не даём прокрутить ниже конца страницы
        scrollTarget = Math.min(
            getMaxScroll(),
            scrollTarget
        );


        // Запускаем анимацию
        startSmoothScroll();

    },
    {
        passive: false
    }
);


// ==================================================
// СБРОС СКРОЛЛА ПРИ ЗАГРУЗКЕ
// ==================================================

function resetScroll() {

    scrollTarget = 0;

    isScrolling = false;

    window.scrollTo(
        0,
        0
    );
}


// Сразу сбрасываем позицию
resetScroll();


// После загрузки DOM
window.addEventListener(
    "DOMContentLoaded",
    () => {

        resetScroll();

        requestAnimationFrame(() => {

            resetScroll();

            requestAnimationFrame(() => {

                resetScroll();

            });

        });

    }
);


// Для восстановления страницы
// через Back / Forward Cache
window.addEventListener(
    "pageshow",
    () => {

        resetScroll();

        requestAnimationFrame(() => {

            resetScroll();

        });

    }
);


// ==================================================
// АВТОМАТИЧЕСКАЯ ПРОКРУТКА К ОТКРЫТОМУ БЛОКУ
// ==================================================

function scrollToClue(clue) {

    if (!clue) {
        return;
    }


    /*
        Первый requestAnimationFrame:
        ждём применения изменения состояния.

        Второй requestAnimationFrame:
        даём браузеру пересчитать layout
        и фактическую высоту clue.
    */

    requestAnimationFrame(() => {

        requestAnimationFrame(() => {

            const clueRect =
                clue.getBoundingClientRect();


            const hiddenBottom =
                clueRect.bottom -
                window.innerHeight;


            // Если нижняя часть блока
            // находится ниже экрана
            if (hiddenBottom > 0) {

                const offset =
                    hiddenBottom + 20;


                // Устанавливаем цель
                // через нашу систему скролла
                scrollTarget =
                    window.scrollY + offset;


                // Ограничиваем снизу
                scrollTarget =
                    Math.min(
                        getMaxScroll(),
                        scrollTarget
                    );


                // Плавно прокручиваем
                startSmoothScroll();

            }

        });

    });
}


// ==================================================
// ПЛАВНЫЙ СКРОЛЛ ПОСЛЕ ЗАКРЫТИЯ БЛОКА
// ==================================================

function fixScrollAfterClose(
    previousScroll
) {

    /*
        Когда clue закрывается,
        его высота уменьшается.

        Браузер может автоматически
        изменить scrollY.

        Поэтому ждём, пока высота страницы
        реально изменится.
    */

    requestAnimationFrame(() => {

        requestAnimationFrame(() => {

            const maxScroll =
                getMaxScroll();


            /*
                Старая позиция может оказаться
                больше новой максимальной позиции.

                Например:

                было:
                scrollY = 1500

                после закрытия:
                maxScroll = 1200

                тогда целевой scroll = 1200
            */

            const target =
                Math.min(
                    previousScroll,
                    maxScroll
                );


            /*
                Если браузер уже самостоятельно
                изменил scrollY, не делаем резкий
                window.scrollTo.

                Передаём новую позицию
                в нашу плавную систему.
            */

            if (
                Math.abs(
                    window.scrollY - target
                ) > 0.5
            ) {

                scrollTarget =
                    target;

                startSmoothScroll();

            } else {

                scrollTarget =
                    target;

            }

        });

    });
}


// ==================================================
// CODEMIRROR
// ==================================================

function showCode(
    selector,
    code,
    language = "html"
) {

    const blocks =
        document.querySelectorAll(
            selector
        );


    if (!blocks.length) {

        console.error(
            `Элемент ${selector} не найден`
        );

        return;
    }


    const languageMode =
        language === "css"
            ? css()
            : html();


    blocks.forEach((block) => {

        new EditorView({

            state:
                EditorState.create({

                    doc: code,

                    extensions: [

                        basicSetup,

                        languageMode,


                        // Только просмотр
                        EditorView.editable.of(
                            false
                        ),


                        // Запрещаем выделение мышкой
                        EditorView.domEventHandlers({

                            mousedown: (event) => {

                                event.preventDefault();

                                return true;

                            },


                            selectstart: (event) => {

                                event.preventDefault();

                                return true;

                            }

                        }),


                        // Стили CodeMirror
                        EditorView.theme({

                            "&": {

                                backgroundColor:
                                    "#0d111c",

                                color:
                                    "#c9d1d9",

                                fontSize:
                                    "15px",

                                borderRadius:
                                    "14px",

                                userSelect:
                                    "none",

                                WebkitUserSelect:
                                    "none"

                            },


                            ".cm-content": {

                                padding:
                                    "20px 0",

                                userSelect:
                                    "none",

                                WebkitUserSelect:
                                    "none"

                            },


                            ".cm-gutters": {

                                backgroundColor:
                                    "#0a0e18",

                                color:
                                    "#4b5568",

                                border:
                                    "none",

                                paddingRight:
                                    "10px",

                                userSelect:
                                    "none",

                                WebkitUserSelect:
                                    "none"

                            },


                            ".cm-line": {

                                padding:
                                    "0 20px"

                            },


                            ".cm-scroller": {

                                overflow:
                                    "auto"

                            },


                            ".cm-activeLine": {

                                backgroundColor:
                                    "rgba(255, 255, 255, 0.025)"

                            },


                            ".cm-activeLineGutter": {

                                backgroundColor:
                                    "transparent"

                            }

                        })

                    ]

                }),


            parent:
                block

        });

    });

}


// ==================================================
// КНОПКА КОПИРОВАНИЯ
// ==================================================

function addCopyButton(
    selector,
    code
) {

    const blocks =
        document.querySelectorAll(
            selector
        );


    if (!blocks.length) {

        console.error(
            `Элемент ${selector} не найден`
        );

        return;
    }


    blocks.forEach((block) => {

        block.style.position =
            "relative";


        // Создаём кнопку
        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.textContent =
            "Скопировать";


        // Стили кнопки
        Object.assign(
            button.style,
            {

                position:
                    "absolute",

                top:
                    "12px",

                right:
                    "12px",

                padding:
                    "10px 15px",

                border:
                    "1px solid #61329a",

                borderRadius:
                    "8px",

                background:
                    "#0d111c",

                color:
                    "#c9d1d9",

                cursor:
                    "pointer",

                zIndex:
                    "10",

                transition:
                    "0.2s",

                width:
                    "140px",

                minHeight:
                    "39px"

            }
        );


        // Hover
        button.addEventListener(
            "mouseenter",
            () => {

                button.style.background =
                    "#61329a";

            }
        );


        button.addEventListener(
            "mouseleave",
            () => {

                button.style.background =
                    "#0d111c";

            }
        );


        // Копирование
        button.addEventListener(
            "click",
            async () => {

                try {

                    await navigator.clipboard.writeText(
                        code
                    );


                    button.textContent =
                        "Скопировано ✓";


                    setTimeout(() => {

                        button.textContent =
                            "Скопировать";

                    }, 1500);


                } catch (error) {

                    console.error(
                        "Не удалось скопировать код:",
                        error
                    );

                }

            }
        );


        // Добавляем кнопку
        block.appendChild(
            button
        );

    });

}


// ==================================================
// ЧЕКБОКСЫ
// ==================================================

const checkboxes =
    document.querySelectorAll(
        ".wrapper__checkbox"
    );


checkboxes.forEach(
    (checkbox) => {

        /*
         * Берём родительский блок чекбокса.
         * Здесь НЕ привязываемся к .wrapper__item,
         * чтобы не зависеть от конкретной структуры карточки.
         */

        const parent =
            checkbox.parentElement;


        if (!parent) {
            return;
        }


        const text =
            parent.querySelector(
                ".wrapper__checkbox-text"
            );


        const showIcon =
            parent.querySelector(
                ".wrapper__checkbox-icon--show"
            );


        const hideIcon =
            parent.querySelector(
                ".wrapper__checkbox-icon--hide"
            );


        // ==================================================
        // НАХОДИМ CLUE
        // ==================================================

        const clue =
            checkbox
                .closest(
                    ".wrapper__subtitle"
                )
                ?.nextElementSibling;


        const hasClue =
            clue &&
            clue.classList.contains(
                "wrapper__clue"
            );


        // ==================================================
        // ОБНОВЛЕНИЕ CHECKBOX
        // ==================================================

        function updateCheckbox(
            shouldScroll = false
        ) {

            // ==================================================
            // ОТКРЫТИЕ
            // ==================================================

            if (checkbox.checked) {

                if (text) {

                    text.textContent =
                        "Скрыть подсказку";

                }


                if (showIcon) {

                    showIcon.style.display =
                        "block";

                }


                if (hideIcon) {

                    hideIcon.style.display =
                        "none";

                }


                // ==================================================
                // АВТОМАТИЧЕСКАЯ ПРОКРУТКА
                // ==================================================

                /*
                    ВАЖНО:

                    scrollToClue запускается
                    только если shouldScroll === true.

                    При первоначальной загрузке:
                    updateCheckbox(false)

                    Поэтому страница сама
                    никуда не прокручивается.
                */

                if (
                    shouldScroll &&
                    hasClue
                ) {

                    scrollToClue(
                        clue
                    );

                }

            } else {

                // ==================================================
                // ЗАКРЫТИЕ
                // ==================================================

                /*
                    Сохраняем позицию ДО того,
                    как блок уменьшится.
                */

                const previousScroll =
                    window.scrollY;


                if (text) {

                    text.textContent =
                        "Отобразить подсказку";

                }


                if (showIcon) {

                    showIcon.style.display =
                        "none";

                }


                if (hideIcon) {

                    hideIcon.style.display =
                        "block";

                }


                // ==================================================
                // ПЛАВНАЯ КОРРЕКЦИЯ ПОСЛЕ ЗАКРЫТИЯ
                // ==================================================

                if (hasClue) {

                    fixScrollAfterClose(
                        previousScroll
                    );

                }

            }

        }


        // ==================================================
        // ПЕРВОНАЧАЛЬНОЕ СОСТОЯНИЕ
        // ==================================================

        /*
            Здесь false!

            Если checkbox уже checked
            при загрузке страницы,
            текст и иконки обновятся,
            но автоматического скролла не будет.
        */

        updateCheckbox(
            false
        );


        // ==================================================
        // ИЗМЕНЕНИЕ CHECKBOX ПОЛЬЗОВАТЕЛЕМ
        // ==================================================

        checkbox.addEventListener(
            "change",
            () => {

                /*
                    Здесь true,
                    потому что изменение произошло
                    после взаимодействия пользователя.
                */

                updateCheckbox(
                    true
                );

            }
        );

    }
);


// ==================================================
// ЗАДАНИЕ 1 - РАЗМЕТКА
// ==================================================

showCode(
    ".wrapper__html-1",

    `<div class="card">
    <h3>Заголовок карточки</h3>
    <p>Это параграф внутри карточки.</p>
</div>`,

    "html"
);


addCopyButton(
    ".wrapper__html-1",

    `<div class="card">
    <h3>Заголовок карточки</h3>
    <p>Это параграф внутри карточки.</p>
</div>`
);


// ==================================================
// ЗАДАНИЕ 1 - СТИЛИЗАЦИЯ
// ==================================================

showCode(
    ".wrapper__scss-1",

    `.card:has(p){
    border: solid 1px #61329a;
    box-shadow: 0 0 10px #61329a;
}`,

    "css"
);


addCopyButton(
    ".wrapper__scss-1",

    `.card:has(p){
    border: solid 1px #61329a;
    box-shadow: 0 0 10px #61329a;
}`
);


// ==================================================
// ЗАДАНИЕ 2 - РАЗМЕТКА
// ==================================================

showCode(
    ".wrapper__html-2",

    `<div class="card">
    <h3>Заголовок карточки</h3>
    <div class="choice">Блок с классом .choice</div>
</div>`,

    "html"
);


addCopyButton(
    ".wrapper__html-2",

    `<div class="card">
    <h3>Заголовок карточки</h3>
    <div class="choice">Блок с классом .choice</div>
</div>`
);


// ==================================================
// ЗАДАНИЕ 2 - СТИЛИЗАЦИЯ
// ==================================================

showCode(
    ".wrapper__scss-2",

    `.card:has(.choice){
    border: solid 1px #61329a;
    box-shadow: 0 0 10px #61329a;
}`,

    "css"
);


addCopyButton(
    ".wrapper__scss-2",

    `.card:has(.choice){
    border: solid 1px #61329a;
    box-shadow: 0 0 10px #61329a;
}`
);


// ==================================================
// ЗАДАНИЕ 3 - РАЗМЕТКА
// ==================================================

showCode(
    ".wrapper__html-3",

    `<div class="card">
    <h3>Заголовок карточки</h3>
    <div class="task">
        <p>Абзац внутри элемента .task</p>
    </div>
</div>`,

    "html"
);


addCopyButton(
    ".wrapper__html-3",

    `<div class="card">
    <h3>Заголовок карточки</h3>
    <div class="task">
        <p>Абзац внутри элемента .task</p>
    </div>
</div>`
);


// ==================================================
// ЗАДАНИЕ 3 - СТИЛИЗАЦИЯ
// ==================================================

showCode(
    ".wrapper__scss-3",

    `.card:has(.task){
    border: solid 1px #61329a;
    box-shadow: 0 0 10px #61329a;
}`,

    "css"
);


addCopyButton(
    ".wrapper__scss-3",

    `.card:has(.task > p){
    border: solid 1px #61329a;
    box-shadow: 0 0 10px #61329a;
}`
);
// ==================================================
// ЗАДАНИЕ 4 - РАЗМЕТКА
// ==================================================

showCode(
    ".wrapper__html-4",

    `<div class="card">
    <h3>Заголовок карточки</h3>
    <div class="card">
        <div class="element">
            Блок элемент
            <div class="task">
                Блок task
                <button>
                    Кнопка на первом уровне вложенности
                    внутри элемента .task
                </button>
            </div>
        </div>
    </div>
</div>`,

    "html"
);


addCopyButton(
    ".wrapper__html-4",

    `<div class="card">
    <h3>Заголовок карточки</h3>
    <div class="card">
        <div class="element">
            Блок элемент
            <div class="task">
                Блок task
                <button>
                    Кнопка на первом уровне вложенности внутри элемента .task
                </button>
            </div>
        </div>
    </div>
</div>`
);


// ==================================================
// ЗАДАНИЕ 4 - СТИЛИЗАЦИЯ
// ==================================================

showCode(
    ".wrapper__scss-4",

    `.card:has(.element .task > button){
    border: solid 1px #61329a;
    box-shadow: 0 0 10px #61329a;
}`,

    "css"
);


addCopyButton(
    ".wrapper__scss-4",

    `.card:has(.element .task > button){
    border: solid 1px #61329a;
    box-shadow: 0 0 10px #61329a;
}`
);
// ==================================================
// ЗАДАНИЕ 5 - РАЗМЕТКА
// ==================================================

showCode(
    ".wrapper__html-5",

    `<div class="card">
    <h3>Заголовок карточки</h3>
    <div class="card">
        <h3>Подзаголовок</h3>
        <p>Абзац</p>
    </div>
</div>`,

    "html"
);


addCopyButton(
    ".wrapper__html-5",

    `<div class="card">
    <h3>Заголовок карточки</h3>
    <div class="card">
        <h3>Подзаголовок</h3>
        <p>Абзац</p>
    </div>
</div>`
);


// ==================================================
// ЗАДАНИЕ 5 - СТИЛИЗАЦИЯ
// ==================================================

showCode(
    ".wrapper__scss-5",

    `.card:has(h3 + p){
    border: solid 1px #61329a;
    box-shadow: 0 0 10px #61329a;
}`,

    "css"
);


addCopyButton(
    ".wrapper__scss-5",

    `.card:has(h3 + p){
    border: solid 1px #61329a;
    box-shadow: 0 0 10px #61329a;
}`
);
// ==================================================
// ЗАДАНИЕ 6 - РАЗМЕТКА
// ==================================================

showCode(
    ".wrapper__html-6",

    `<div class="card">
    <h3>Заголовок карточки</h3>
    <div class="card">
        <h3>Подзаголовок</h3>
        <span>Какой-то текст</span>
        <p>Абзац</p>
    </div>
</div>`,

    "html"
);


addCopyButton(
    ".wrapper__html-6",

    `<div class="card">
    <h3>Заголовок карточки</h3>
    <div class="card">
        <h3>Подзаголовок</h3>
        <span>Какой-то текст</span>
        <p>Абзац</p>
    </div>
</div>`
);


// ==================================================
// ЗАДАНИЕ 6 - СТИЛИЗАЦИЯ
// ==================================================

showCode(
    ".wrapper__scss-6",

    `.card:has(h3 ~ p){
    border: solid 1px #61329a;
    box-shadow: 0 0 10px #61329a;
}`,

    "css"
);


addCopyButton(
    ".wrapper__scss-6",

    `.card:has(h3 ~ p){
    border: solid 1px #61329a;
    box-shadow: 0 0 10px #61329a;
}`
);
// ==================================================
// ЗАДАНИЕ 7 - РАЗМЕТКА
// ==================================================

showCode(
    ".wrapper__html-7",

    `<ol class="list">
    <li>Пункт</li>
    <li>Пункт</li>
    <li>Пункт</li>
</ol>`,

    "html"
);


addCopyButton(
    ".wrapper__html-7",

    `<ol class="list">
        <li>Пункт</li>
        <li>Пункт</li>
        <li>Пункт</li>
    </ol>`
);


// ==================================================
// ЗАДАНИЕ 7 - СТИЛИЗАЦИЯ
// ==================================================

showCode(
    ".wrapper__scss-7",

    `.list:has(li:first-child){
    border: solid 1px #61329a;
    box-shadow: 0 0 10px #61329a;
}`,

    "css"
);


addCopyButton(
    ".wrapper__scss-7",

    `.list:has(li:first-child){
    border: solid 1px #61329a;
    box-shadow: 0 0 10px #61329a;
}`
);
// ==================================================
// ЗАДАНИЕ 8 - РАЗМЕТКА
// ==================================================

showCode(
    ".wrapper__html-8",

    `<ol class="list">
    <li>Пункт</li>
    <li>Пункт</li>
    <li>Пункт</li>
</ol>`,

    "html"
);


addCopyButton(
    ".wrapper__html-8",

    `<ol class="list">
        <li>Пункт</li>
        <li>Пункт</li>
        <li>Пункт</li>
    </ol>`
);


// ==================================================
// ЗАДАНИЕ 8 - СТИЛИЗАЦИЯ
// ==================================================

showCode(
    ".wrapper__scss-8",

    `.list:has(li:last-child){
    border: solid 1px #61329a;
    box-shadow: 0 0 10px #61329a;
}`,

    "css"
);


addCopyButton(
    ".wrapper__scss-8",

    `.list:has(li:last-child){
    border: solid 1px #61329a;
    box-shadow: 0 0 10px #61329a;
}`
);
// ==================================================
// ЗАДАНИЕ 9 - РАЗМЕТКА
// ==================================================

showCode(
    ".wrapper__html-9",

    `<ol class="list">
    <li>Пункт</li>
    <li>Пункт</li>
    <li>Пункт</li>
</ol>`,

    "html"
);


addCopyButton(
    ".wrapper__html-9",

    `<ol class="list">
        <li>Пункт</li>
        <li>Пункт</li>
        <li>Пункт</li>
    </ol>`
);


// ==================================================
// ЗАДАНИЕ 9 - СТИЛИЗАЦИЯ
// ==================================================

showCode(
    ".wrapper__scss-9",

    `.list:has(>:nth-child(2)){
    border: solid 1px #61329a;
    box-shadow: 0 0 10px #61329a;
}`,

    "css"
);


addCopyButton(
    ".wrapper__scss-9",

    `.list:has(>:nth-child(2)){
    border: solid 1px #61329a;
    box-shadow: 0 0 10px #61329a;
}`
);
// ==================================================
// ЗАДАНИЕ 10 - РАЗМЕТКА
// ==================================================

showCode(
    ".wrapper__html-10",

    `<div class="lists">
    <ol class="list">
        <li>Пункт</li>
        <li>Пункт</li>
        <li>Пункт</li>
    </ol>
</div>`,

    "html"
);


addCopyButton(
    ".wrapper__html-10",

    `<ol class="list">
        <li>Пункт</li>
        <li>Пункт</li>
        <li>Пункт</li>
    </ol>`
);


// ==================================================
// ЗАДАНИЕ 10 - СТИЛИЗАЦИЯ
// ==================================================

showCode(
    ".wrapper__scss-10",

    `.lists:has(.list:empty){
    border: solid 1px #61329a;
    box-shadow: 0 0 10px #61329a;
}`,

    "css"
);


addCopyButton(
    ".wrapper__scss-10",

    `.lists:has(.list:empty){
    border: solid 1px #61329a;
    box-shadow: 0 0 10px #61329a;
}`
);