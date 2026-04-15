// ==UserScript==
// @name         Linux.do 自动阅读助手
// @namespace    https://linux.do/
// @version      0.0.6
// @description  自动滚动浏览 linux.do，每次滚动半个屏幕，停留5秒，自动点赞
// @author       You
// @match        https://linux.do/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    /* ========== 配置项 ========== */
    let scrollInterval = 5000;       // 每次滚动间隔（毫秒）
    let scrollRatio    = 0.8;        // 每次滚动占屏幕高度的比例（0.8 = 80%）
    let scrollDirection = 'down';     // 滚动方向：'down' 或 'up'
    /* ============================ */

    let timer = null;
    let isRunning = false;
    let isLikeEnabled = false; // 点赞功能开关
    let downCounter = 0;    // 向下滚动计数器
    let startTime = null;   // 开始执行时间
    let likeCount = 0;      // 滚动计数，用于每5次触发一次点赞
    let totalLiked = 0;     // 总点赞数（不持久化，刷新即清零）
    let currentTopicId = getTopicId(location.href); // 记录当前topic ID

    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
        #auto-scroll-panel {
            position: fixed;
            z-index: 99999;
            top: 80px;
            right: 20px;
            background: rgba(36, 39, 46, 0.95);
            border: 1px solid rgba(100, 110, 130, 0.5);
            border-radius: 12px;
            padding: 16px;
            min-width: 220px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.35);
            color: #e6edf3;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            font-size: 13px;
            user-select: none;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            transition: opacity 0.3s, transform 0.3s;
        }
        #auto-scroll-panel.minimized {
            padding: 8px 12px;
            min-width: auto;
        }
        #auto-scroll-panel.minimized .panel-body { display: none; }

        #auto-scroll-panel .panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            cursor: move;
        }
        #auto-scroll-panel.minimized .panel-header { margin-bottom: 0; }

        #auto-scroll-panel .panel-title {
            font-weight: 600;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        #auto-scroll-panel .panel-title .dot {
            width: 8px; height: 8px;
            border-radius: 50%;
            background: #484f58;
            transition: background 0.3s;
        }
        #auto-scroll-panel .panel-title .dot.active {
            background: #3fb950;
            box-shadow: 0 0 8px rgba(63,185,80,0.6);
        }

        #auto-scroll-panel .btn-minimize {
            background: none; border: none;
            color: #8b949e; cursor: pointer;
            font-size: 16px; padding: 0 2px;
            line-height: 1;
        }
        #auto-scroll-panel .btn-minimize:hover { color: #e6edf3; }

        .panel-body { display: flex; flex-direction: column; gap: 10px; }

        #auto-scroll-panel button.btn {
            border: none;
            border-radius: 8px;
            padding: 8px 0;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s, transform 0.1s;
        }
        #auto-scroll-panel button.btn:active { transform: scale(0.97); }

        .btn-start {
            background: #238636;
            color: #fff;
        }
        .btn-start:hover { background: #2ea043; }
        .btn-start.running {
            background: #da3633;
        }
        .btn-start.running:hover { background: #f85149; }

        .btn-direction {
            background: rgba(110,118,129,0.2);
            color: #e6edf3;
            border: 1px solid rgba(110,118,129,0.3) !important;
        }
        .btn-direction:hover { background: rgba(110,118,129,0.35); }

        .setting-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
        }
        .setting-row label {
            color: #8b949e;
            font-size: 12px;
            white-space: nowrap;
        }
        .setting-row input[type="range"] {
            flex: 1;
            accent-color: #58a6ff;
            height: 4px;
        }
        .setting-row .val {
            color: #58a6ff;
            font-size: 12px;
            min-width: 36px;
            text-align: right;
            font-variant-numeric: tabular-nums;
        }

        .stats-row {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            padding: 8px 10px;
            background: rgba(110,118,129,0.1);
            border-radius: 6px;
            font-size: 11px;
        }
        .stats-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
        }
        .stats-item .label {
            color: #8b949e;
            font-size: 10px;
        }
        .stats-item .value {
            color: #58a6ff;
            font-weight: 600;
            font-size: 13px;
        }

        .status-text {
            text-align: center;
            font-size: 11px;
            color: #484f58;
        }
        .status-text.active { color: #3fb950; }

        .toggle-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
        }
        .toggle-row label {
            color: #8b949e;
            font-size: 12px;
        }
        .toggle-switch {
            position: relative;
            width: 40px;
            height: 22px;
            background: rgba(110,118,129,0.3);
            border-radius: 11px;
            cursor: pointer;
            transition: background 0.2s;
        }
        .toggle-switch.active {
            background: #238636;
        }
        .toggle-switch::after {
            content: '';
            position: absolute;
            top: 3px;
            left: 3px;
            width: 16px;
            height: 16px;
            background: #fff;
            border-radius: 50%;
            transition: transform 0.2s;
        }
        .toggle-switch.active::after {
            transform: translateX(18px);
        }
    `;
    document.head.appendChild(style);

    // 创建面板
    const panel = document.createElement('div');
    panel.id = 'auto-scroll-panel';
    panel.innerHTML = `
        <div class="panel-header">
            <div class="panel-title">
                <span class="dot" id="statusDot"></span>
                <span>自动滚动</span>
            </div>
            <button class="btn-minimize" id="btnMinimize" title="最小化">−</button>
        </div>
        <div class="panel-body">
            <button class="btn btn-start" id="btnToggle">▶ 开始</button>
            <button class="btn btn-direction" id="btnDirection">⬇ 方向：向下</button>

            <div class="toggle-row">
                <label>自动点赞</label>
                <div class="toggle-switch" id="likeToggle"></div>
            </div>

            <div class="setting-row" id="likeIntervalRow" style="display: none;">
                <label>滚动</label>
                <input type="number" id="likeInterval" min="1" max="50" value="5" style="width:50px;background:rgba(110,118,129,0.2);border:1px solid rgba(110,118,129,0.3);border-radius:4px;color:#58a6ff;text-align:center;padding:2px 4px;">
                <span style="color:#8b949e;font-size:12px;">次点赞</span>
            </div>

            <div class="setting-row">
                <label>间隔</label>
                <input type="range" id="rangeInterval" min="1" max="15" step="0.5" value="5">
                <span class="val" id="valInterval">5s</span>
            </div>
            <div class="setting-row">
                <label>幅度</label>
                <input type="range" id="rangeRatio" min="0.1" max="1" step="0.05" value="0.8">
                <span class="val" id="valRatio">80%</span>
            </div>

            <div class="stats-row">
                <div class="stats-item">
                    <span class="label">已点赞</span>
                    <span class="value" id="likedCount">0</span>
                </div>
                <div class="stats-item">
                    <span class="label">运行时间</span>
                    <span class="value" id="runTime">00:00</span>
                </div>
            </div>

            <div class="status-text" id="statusText">已停止</div>
        </div>
    `;
    document.body.appendChild(panel);

    // DOM 引用
    const btnToggle    = document.getElementById('btnToggle');
    const btnDirection = document.getElementById('btnDirection');
    const btnMinimize  = document.getElementById('btnMinimize');
    const statusDot    = document.getElementById('statusDot');
    const statusText   = document.getElementById('statusText');
    const rangeInterval = document.getElementById('rangeInterval');
    const rangeRatio    = document.getElementById('rangeRatio');
    const valInterval   = document.getElementById('valInterval');
    const valRatio      = document.getElementById('valRatio');
    const likedCountEl  = document.getElementById('likedCount');
    const runTimeEl     = document.getElementById('runTime');
    const likeToggle    = document.getElementById('likeToggle');
    const likeIntervalRow = document.getElementById('likeIntervalRow');
    const likeIntervalInput = document.getElementById('likeInterval');
    let likeInterval = 5;

    // ====== 拖拽逻辑 ======
    let isDragging = false, startX, startY, origX, origY;
    const header = panel.querySelector('.panel-header');
    header.addEventListener('mousedown', onDown);
    header.addEventListener('touchstart', onDown, { passive: false });

    function onDown(e) {
        if (e.target.closest('.btn-minimize')) return;
        isDragging = true;
        const ev = e.touches ? e.touches[0] : e;
        const rect = panel.getBoundingClientRect();
        startX = ev.clientX; startY = ev.clientY;
        origX = rect.left;   origY = rect.top;
        panel.style.left = origX + 'px';
        panel.style.top  = origY + 'px';
        panel.style.right = 'auto';
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onUp);
        e.preventDefault();
    }
    function onMove(e) {
        if (!isDragging) return;
        const ev = e.touches ? e.touches[0] : e;
        panel.style.left = (origX + ev.clientX - startX) + 'px';
        panel.style.top  = (origY + ev.clientY - startY) + 'px';
        e.preventDefault();
    }
    function onUp() {
        isDragging = false;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onUp);
    }

    // ====== 最小化 ======
    btnMinimize.addEventListener('click', () => {
        panel.classList.toggle('minimized');
        btnMinimize.textContent = panel.classList.contains('minimized') ? '+' : '−';
    });

    // ====== 运行时间计时器 ======
    let runTimeTimer = null;
    function startRunTimeTimer() {
        startTime = Date.now();
        runTimeTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const secs = (elapsed % 60).toString().padStart(2, '0');
            runTimeEl.textContent = `${mins}:${secs}`;
        }, 1000);
    }
    function stopRunTimeTimer() {
        if (runTimeTimer) {
            clearInterval(runTimeTimer);
            runTimeTimer = null;
        }
    }

    // ====== 更新统计 ======
    function updateStats() {
        likedCountEl.textContent = totalLiked;
    }

    // ====== 检测是否阅读完成 ======
    function checkReadingComplete() {
        const timelineReplies = document.querySelector('.timeline-replies');
        if (!timelineReplies) return false;

        const text = timelineReplies.textContent.trim();
        // 匹配格式如 "1 / 42", "42 / 42", "10/42" 等
        const match = text.match(/(\d+)\s*\/\s*(\d+)/);
        if (!match) return false;

        const current = parseInt(match[1], 10);
        const total = parseInt(match[2], 10);

        console.log(`阅读进度: ${current}/${total}`);

        // 当当前值等于总值时，表示已阅读完成
        if (current === total && total > 0) {
            console.log('帖子已阅读完成，自动停止');
            return true;
        }
        return false;
    }

    // ====== 点赞功能 ======
    // 查找并点击 discourse-reactions-reaction-button
    function doLike() {
        // 查找当前视口内的点赞按钮
        const buttons = document.querySelectorAll('div.discourse-reactions-reaction-button');
        if (buttons.length === 0) return false;

        // 找到第一个在视口内的按钮
        for (const btn of buttons) {
            const rect = btn.getBoundingClientRect();
            // 按钮在视口内（上下10%范围内）
            if (rect.top < window.innerHeight * 1.1 && rect.bottom > -window.innerHeight * 0.1) {
                // 模拟点击
                btn.click();
                totalLiked++;
                updateStats();
                statusText.textContent = `已点赞 ${totalLiked} 次`;
                return true;
            }
        }
        return false;
    }

    // ====== 核心滚动逻辑 ======
    function doScroll() {
        // 检测是否已阅读完成
        if (checkReadingComplete()) {
            statusText.textContent = '✓ 当前帖子已阅读完成';
            statusText.style.color = '#3fb950';
            stopScrolling(true);
            return 'completed';
        }

        let actualDirection = scrollDirection;
        let isSpecialUp = false;

        if (scrollDirection === 'down') {
            if (downCounter >= 10) {
                actualDirection = 'up';
                downCounter = 0;
                isSpecialUp = true;
                statusText.textContent = '补偿向上滚动 (5s)...';
            } else {
                downCounter++;
                actualDirection = 'down';
                statusText.textContent = `向下滚动中 (${downCounter}/10)...`;
            }
        } else {
            downCounter = 0;
            statusText.textContent = '向上滚动中...';
        }

        const scrollAmount = window.innerHeight * scrollRatio;
        const delta = actualDirection === 'down' ? scrollAmount : -scrollAmount;

        window.scrollBy({
            top: delta,
            behavior: 'smooth'
        });

        // 每滚动N次尝试点赞一次（仅在点赞开关开启时）
        if (isLikeEnabled) {
            likeCount++;
            if (likeCount >= likeInterval) {
                doLike();
                likeCount = 0;
            }
        }

        return isSpecialUp;
    }

    function startScrolling() {
        if (timer) return;
        isRunning = true;
        btnToggle.textContent = '⏸ 暂停';
        btnToggle.classList.add('running');
        statusDot.classList.add('active');
        statusText.classList.add('active');
        // 重置状态文本颜色和样式
        statusText.style.color = '';

        startRunTimeTimer();

        const run = () => {
            if (!isRunning) return;
            const result = doScroll();
            if (result === 'completed') return;
            const nextInterval = result ? 5000 : scrollInterval;
            timer = setTimeout(run, nextInterval);
        };

        run();
    }

    function stopScrolling(completed = false) {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        isRunning = false;
        downCounter = 0;
        likeCount = 0;
        btnToggle.textContent = '▶ 开始';
        btnToggle.classList.remove('running');
        statusDot.classList.remove('active');
        if (!completed) {
            statusText.textContent = '已停止';
            statusText.style.color = '';
        }
        statusText.classList.remove('active');
        stopRunTimeTimer();
    }

    // ====== 按钮事件 ======
    btnToggle.addEventListener('click', () => {
        if (isRunning) {
            stopScrolling();
        } else {
            // 重置状态文本，确保可以重新开始
            statusText.style.color = '';
            statusText.classList.remove('active');
            startScrolling();
        }
    });

    btnDirection.addEventListener('click', () => {
        scrollDirection = scrollDirection === 'down' ? 'up' : 'down';
        downCounter = 0;
        btnDirection.textContent = scrollDirection === 'down'
            ? '⬇ 方向：向下'
            : '⬆ 方向：向上';
    });

    likeToggle.addEventListener('click', () => {
        isLikeEnabled = !isLikeEnabled;
        likeToggle.classList.toggle('active', isLikeEnabled);
        likeIntervalRow.style.display = isLikeEnabled ? 'flex' : 'none';
        likeCount = 0;
        if (isLikeEnabled) {
            statusText.textContent = '已开启自动点赞';
            statusText.style.color = '#3fb950';
        } else {
            statusText.textContent = '已关闭自动点赞';
            statusText.style.color = '#8b949e';
        }
    });

    likeIntervalInput.addEventListener('input', () => {
        likeInterval = Math.max(1, Math.min(50, parseInt(likeIntervalInput.value) || 5));
        likeIntervalInput.value = likeInterval;
        likeCount = 0;
    });

    rangeInterval.addEventListener('input', () => {
        scrollInterval = parseFloat(rangeInterval.value) * 1000;
        valInterval.textContent = rangeInterval.value + 's';
        if (isRunning) {
            clearTimeout(timer);
            const run = () => {
                if (!isRunning) return;
                const isSpecialUp = doScroll();
                const nextInterval = isSpecialUp ? 5000 : scrollInterval;
                timer = setTimeout(run, nextInterval);
            };
            timer = setTimeout(run, scrollInterval);
        }
    });

    rangeRatio.addEventListener('input', () => {
        scrollRatio = parseFloat(rangeRatio.value);
        valRatio.textContent = Math.round(scrollRatio * 100) + '%';
    });

    // ====== 获取Topic ID ======
    function getTopicId(url) {
        // 匹配 /t/topic/1968971/16 格式，提取 topic 后的数字
        const match = url.match(/\/t\/topic\/(\d+)/);
        if (match) {
            return match[1];
        }
        // 如果匹配不到，返回完整URL作为fallback
        return url;
    }

    // ====== URL变化检测 ======
    let urlCheckTimer = null;
    function checkUrlChange() {
        const newTopicId = getTopicId(location.href);
        if (newTopicId !== currentTopicId) {
            currentTopicId = newTopicId;

            // 如果正在运行，停止滚动
            if (isRunning) {
                stopScrolling();
            }

            // 重置所有状态
            downCounter = 0;
            likeCount = 0;
            totalLiked = 0;
            updateStats();

            // 重置UI状态
            statusText.textContent = '已停止';
            statusText.style.color = '';
            statusText.classList.remove('active');
            btnToggle.textContent = '▶ 开始';
            btnToggle.classList.remove('running');
            statusDot.classList.remove('active');
        }
    }

    // 使用多种方式检测URL变化
    // 1. 定时检测（兼容性好）- 每5秒检测一次
    setInterval(checkUrlChange, 5000);

    // 2. 监听popstate事件（浏览器前进/后退）
    window.addEventListener('popstate', checkUrlChange);

    // 3. 监听pushState/replaceState（SPA路由变化）
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
        originalPushState.apply(this, args);
        setTimeout(checkUrlChange, 0);
    };

    history.replaceState = function(...args) {
        originalReplaceState.apply(this, args);
        setTimeout(checkUrlChange, 0);
    };

})();
