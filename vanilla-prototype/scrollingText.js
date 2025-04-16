export function makeScrollingText(selector, { speed = 100 } = {}) {
    injectCSS();
    const padding = 20;
    const container = document.querySelector(selector);
    if (!container || typeof container.textContent !== 'string') return;

    const text = container.textContent.trim();
    container.innerHTML = '';
    container.classList.add('scrolling-text-container');

    const wrapper = document.createElement('div');
    wrapper.className = 'scrolling-text-wrapper';

    let stopAnimation = false;
    let preEditTextContent = '';

    const startEdit = (e) => {
        preEditTextContent = e.target.textContent;
        stopAnimation = true;
    }

    const saveText = (e) => {
        console.log('save', e);
        if (e.target === item1) {
            item2.textContent = item1.textContent;
        } else {
            item1.textContent = item2.textContent;
        }
        stopAnimation = false;
        requestAnimationFrame(step);
    }

    const onKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
        }
        else if (e.key === 'Escape') {
            e.target.textContent = preEditTextContent;
            e.preventDefault();
            e.currentTarget.blur();
        }
    }

    const createItem = () => {
        const div = document.createElement('div');
        div.className = 'scrolling-text-item';
        div.textContent = text;
        div.setAttribute('contentEditable', true);
        div.addEventListener('click', startEdit);
        div.addEventListener('blur', saveText);
        div.addEventListener('keydown', onKeyDown)
        return div;
    };

    const item1 = createItem();
    const item2 = createItem();

    wrapper.appendChild(item1);
    wrapper.appendChild(item2);
    container.appendChild(wrapper);

    let width = 0;
    let x1 = 0;
    let x2 = 0;
    let lastTime = performance.now();

    const step = (now) => {
        if (stopAnimation) {
            return;
        }
        const deletaT = (now - lastTime) / 1000;
        lastTime = now;

        if (!width) {
            width = item1.offsetWidth;
            x1 = 0;
            x2 = width + padding;;
        }

        x1 -= speed * deletaT;
        x2 -= speed * deletaT;

        const viewportRight = container.offsetWidth;

        if (x1 <= -width) {
            x1 = Math.max(x2 + padding + width, viewportRight);
        }
        if (x2 <= -width) {
            x2 = Math.max(x1 + padding + width, viewportRight);
        }

        item1.style.transform = `translateX(${x1}px)`;
        item2.style.transform = `translateX(${x2}px)`;

        requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
}

function injectCSS() {
    const style = document.createElement('style');
    style.textContent = `
.scrolling-text-wrapper {
    position: relative;
    overflow: hidden;
    width: 100%;
    height: 100%;
}

.scrolling-text-item {
    position: absolute;
    top: 0;
    left: 0;
    white-space: nowrap;
    will-change: transform;
}
    `;
    document.head.appendChild(style);
}
