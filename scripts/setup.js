const fs = require('fs');
const path = require('path');

function setup() {
    console.log('正在执行初始化设置...');

    const envExample = path.join(process.cwd(), '.env.example');
    const envFile = path.join(process.cwd(), '.env');

    // 如果 .env 文件不存在，则从 .env.example 复制
    if (!fs.existsSync(envFile) && fs.existsSync(envExample)) {
        try {
            fs.copyFileSync(envExample, envFile);
            console.log('.env 文件创建成功');
        } catch (error) {
            console.error('创建 .env 文件失败:', error);
            process.exit(1);
        }
    }

    // 检查必要的目录
    const requiredDirs = ['public', 'scripts'];
    for (const dir of requiredDirs) {
        const dirPath = path.join(process.cwd(), dir);
        if (!fs.existsSync(dirPath)) {
            try {
                fs.mkdirSync(dirPath);
                console.log(`创建目录 ${dir} 成功`);
            } catch (error) {
                console.error(`创建目录 ${dir} 失败:`, error);
                process.exit(1);
            }
        }
    }

    console.log('初始化设置完成！');
}

if (require.main === module) {
    setup();
}

module.exports = setup; 