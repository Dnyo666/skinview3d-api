const { execSync } = require('child_process');
const os = require('os');

function installLinuxDependencies() {
    if (os.platform() !== 'linux') {
        return;
    }

    console.log('检测到 Linux 系统，正在安装 Puppeteer 依赖...');

    try {
        // 检查包管理器
        let installCommand;
        try {
            execSync('which apt-get', { stdio: 'ignore' });
            installCommand = 'apt-get update && apt-get install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2';
        } catch {
            try {
                execSync('which yum', { stdio: 'ignore' });
                installCommand = 'yum install -y nss atk at-spi2-atk cups-libs libdrm libxkbcommon libXcomposite libXdamage libXfixes libXrandr mesa-libgbm alsa-lib';
            } catch {
                console.warn('未检测到支持的包管理器（apt-get/yum），请手动安装依赖。');
                return;
            }
        }

        // 检查是否有 root 权限
        const isRoot = process.getuid && process.getuid() === 0;
        if (!isRoot) {
            console.warn('需要 root 权限来安装系统依赖。');
            console.warn('请手动运行以下命令：');
            console.warn(`sudo ${installCommand}`);
            return;
        }

        // 安装依赖
        console.log('正在安装系统依赖...');
        execSync(installCommand, { stdio: 'inherit' });
        console.log('系统依赖安装完成！');

    } catch (error) {
        console.error('安装依赖时出错：', error.message);
        console.warn('请手动安装所需的系统依赖。');
    }
}

if (require.main === module) {
    installLinuxDependencies();
}

module.exports = installLinuxDependencies; 