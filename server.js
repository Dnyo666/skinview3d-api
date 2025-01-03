require('dotenv').config();

const express = require('express');
const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

// 获取Chrome可执行文件路径
function getChromePath() {
    if (process.platform === 'win32') {
        const paths = [
            process.env.PUPPETEER_EXECUTABLE_PATH,
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
            process.env.PROGRAMFILES + '\\Google\\Chrome\\Application\\chrome.exe',
            process.env['PROGRAMFILES(X86)'] + '\\Google\\Chrome\\Application\\chrome.exe',
        ].filter(Boolean);

        for (const path of paths) {
            if (fs.existsSync(path)) {
                return path;
            }
        }
        throw new Error('未找到Chrome浏览器，请安装Chrome或在环境变量中指定PUPPETEER_EXECUTABLE_PATH');
    } else if (process.platform === 'linux') {
        const paths = [
            process.env.PUPPETEER_EXECUTABLE_PATH,
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
            '/usr/bin/google-chrome',
            '/usr/bin/google-chrome-stable'
        ].filter(Boolean);

        for (const path of paths) {
            if (fs.existsSync(path)) {
                return path;
            }
        }
        throw new Error('未找到Chrome/Chromium浏览器，请安装或在环境变量中指定PUPPETEER_EXECUTABLE_PATH');
    }
    return process.env.PUPPETEER_EXECUTABLE_PATH || '(Default)';
}

// 配置
const config = {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    cacheDuration: parseInt(process.env.CACHE_DURATION) || 600000,
    renderTimeout: parseInt(process.env.RENDER_TIMEOUT) || 1000,
    defaultWidth: parseInt(process.env.DEFAULT_WIDTH) || 300,
    defaultHeight: parseInt(process.env.DEFAULT_HEIGHT) || 400,
    puppeteerArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu'
    ]
};

console.log('Configuration:', config);

// 缓存
const skinCache = new Map();

// 清理过期缓存
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of skinCache.entries()) {
        if (now - value.timestamp > config.cacheDuration) {
            skinCache.delete(key);
        }
    }
}, config.cacheDuration);

// 通过 UUID 获取皮肤
async function getSkinByUUID(uuid) {
    // 检查缓存
    const cached = skinCache.get(uuid);
    if (cached && Date.now() - cached.timestamp < config.cacheDuration) {
        console.log('使用缓存的皮肤数据:', uuid);
        return cached.data;
    }

    console.log('从 Mojang API 获取皮肤数据:', uuid);

    // 获取玩家信息
    const profileResponse = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`);
    if (!profileResponse.ok) {
        throw new Error(`无法获取玩家信息: ${profileResponse.status}`);
    }

    const profileData = await profileResponse.json();
    if (!profileData.properties || !profileData.properties[0]) {
        throw new Error('无效的玩家数据');
    }

    // 解码纹理数据
    const texturesBase64 = profileData.properties[0].value;
    const texturesData = JSON.parse(Buffer.from(texturesBase64, 'base64').toString());

    // 获取皮肤和披风 URL
    const result = {
        skin: texturesData.textures.SKIN ? texturesData.textures.SKIN.url : null,
        cape: texturesData.textures.CAPE ? texturesData.textures.CAPE.url : null
    };

    // 更新缓存
    skinCache.set(uuid, {
        timestamp: Date.now(),
        data: result
    });

    console.log('获取到的皮肤数据:', result);
    return result;
}

const app = express();

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// 渲染端点
app.get('/render', async (req, res) => {
    const startTime = Date.now();
    console.log('收到渲染请求:', req.query);

    let browser;
    try {
        let skinUrl = req.query.skin;
        let capeUrl = req.query.cape;

        if (req.query.uuid) {
            const skinData = await getSkinByUUID(req.query.uuid);
            skinUrl = skinData.skin;
            if (!capeUrl && skinData.cape) {
                capeUrl = skinData.cape;
            }
        }

        if (!skinUrl) {
            throw new Error('未提供皮肤 URL 或 UUID');
        }

        const width = parseInt(req.query.width) || config.defaultWidth;
        const height = parseInt(req.query.height) || config.defaultHeight;
        const angle = parseFloat(req.query.angle) || 0;
        const angleY = parseFloat(req.query.angleY) || 30;

        console.log('正在启动浏览器...');
        browser = await puppeteer.launch({
            args: process.platform === 'linux' ? [...config.puppeteerArgs, '--disable-dev-shm-usage'] : config.puppeteerArgs,
            headless: 'new'
        });

        console.log('正在创建页面...');
        const page = await browser.newPage();
        await page.setViewport({ width, height });

        // 监听控制台消息
        page.on('console', msg => console.log('浏览器控制台:', msg.text()));
        page.on('pageerror', err => console.error('页面JS错误:', err));

        // 构建URL
        const renderUrl = new URL('render.html', `http://localhost:${config.port}`);
        renderUrl.searchParams.set('skin', skinUrl);
        if (capeUrl) renderUrl.searchParams.set('cape', capeUrl);
        renderUrl.searchParams.set('angle', angle.toString());
        renderUrl.searchParams.set('angleY', angleY.toString());

        console.log('正在加载页面...', renderUrl.toString());
        await page.setDefaultNavigationTimeout(60000);
        await page.setDefaultTimeout(60000);

        await page.goto(renderUrl.toString(), { 
            waitUntil: ['networkidle0', 'load'],
            timeout: 60000
        });
        console.log('页面加载完成');

        // 等待渲染元素
        console.log('等待渲染元素...');
        await page.waitForSelector('#skin_container', { timeout: 60000 });
        console.log('渲染元素已就绪');

        // 等待渲染完成
        console.log('等待渲染完成...');
        await page.evaluate(async (timeout) => {
            return new Promise((resolve, reject) => {
                let startTime = Date.now();
                let checkInterval = setInterval(() => {
                    if (window.renderComplete) {
                        clearInterval(checkInterval);
                        resolve();
                    } else if (Date.now() - startTime > timeout) {
                        clearInterval(checkInterval);
                        reject(new Error('渲染超时'));
                    }
                }, 100);
            });
        }, config.renderTimeout);

        // 等待一帧以确保渲染完成
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));

        // 截图
        console.log('正在截图...');
        const screenshot = await page.screenshot({
            type: 'png',
            omitBackground: true
        });

        const endTime = Date.now();
        console.log(`渲染完成，耗时 ${endTime - startTime}ms`);

        res.type('png').send(screenshot);
    } catch (error) {
        console.error('渲染错误:', error);
        res.status(500).json({
            error: error.message,
            details: error.stack
        });
    } finally {
        if (browser) {
            await browser.close().catch(console.error);
        }
    }
});

// 启动服务器
app.listen(config.port, config.host, () => {
    console.log(`服务器运行在 ${config.host}:${config.port}`);
    if (config.host === '0.0.0.0') {
        console.log(`本地访问地址: http://localhost:${config.port}`);
        console.log(`局域网访问地址: http://${require('os').hostname()}:${config.port}`);
    } else {
        console.log(`访问地址: http://${config.host}:${config.port}`);
    }
}); 