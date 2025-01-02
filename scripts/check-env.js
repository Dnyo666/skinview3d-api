const fs = require('fs');
const path = require('path');

function checkEnvironment() {
    console.log('正在检查环境...');

    // 检查必要目录
    const dirs = ['public'];
    for (const dir of dirs) {
        if (!fs.existsSync(path.join(process.cwd(), dir))) {
            console.error(`错误: ${dir} 目录不存在`);
            process.exit(1);
        }
    }

    // 检查必要文件
    const files = ['public/render.html', '.env'];
    for (const file of files) {
        if (!fs.existsSync(path.join(process.cwd(), file))) {
            console.error(`错误: ${file} 文件不存在`);
            process.exit(1);
        }
    }

    // 检查环境变量
    const requiredEnvVars = ['PORT'];
    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            console.warn(`警告: 环境变量 ${envVar} 未设置，将使用默认值`);
        }
    }

    // 检查端口可用性
    const port = process.env.PORT || 3000;
    const net = require('net');
    const server = net.createServer();
    
    server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`错误: 端口 ${port} 已被占用`);
            process.exit(1);
        }
    });
    
    server.once('listening', () => {
        server.close();
        console.log('环境检查通过！');
    });
    
    server.listen(port);
}

if (require.main === module) {
    checkEnvironment();
}

module.exports = checkEnvironment; 