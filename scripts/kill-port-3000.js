const { exec } = require('child_process');
const os = require('os');

const isWindows = os.platform() === 'win32';

function killPort3000() {
    return new Promise((resolve) => {
        console.log('🔍 正在检查端口 3000...');

        if (isWindows) {
            // Windows: 查找占用3000端口的进程
            exec('netstat -ano | findstr :3000', (error, stdout) => {
                if (error || !stdout.trim()) {
                    console.log('✅ 端口 3000 未被占用');
                    resolve();
                    return;
                }

                // 解析输出获取PID
                const lines = stdout.trim().split('\n');
                const pids = new Set();

                lines.forEach(line => {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length >= 5 && parts[1].includes(':3000')) {
                        const pid = parts[4];
                        if (pid && pid !== '0') {
                            pids.add(pid);
                        }
                    }
                });

                if (pids.size === 0) {
                    console.log('✅ 端口 3000 未被占用');
                    resolve();
                    return;
                }

                // 终止找到的进程
                let processedCount = 0;
                pids.forEach(pid => {
                    exec(`taskkill /f /pid ${pid}`, (killError) => {
                        processedCount++;
                        if (!killError) {
                            console.log(`🗑️ 已终止进程 PID: ${pid}`);
                        }

                        if (processedCount === pids.size) {
                            console.log('🗑️ 已终止占用端口 3000 的进程');
                            resolve();
                        }
                    });
                });
            });
        } else {
            // Unix/Linux/macOS: 使用 lsof 查找并终止进程
            exec('lsof -ti:3000', (error, stdout) => {
                if (error || !stdout.trim()) {
                    console.log('✅ 端口 3000 未被占用');
                    resolve();
                    return;
                }

                const pids = stdout.trim().split('\n').filter(pid => pid);
                if (pids.length === 0) {
                    console.log('✅ 端口 3000 未被占用');
                    resolve();
                    return;
                }

                exec(`kill -9 ${pids.join(' ')}`, (killError) => {
                    if (killError) {
                        console.log('✅ 端口 3000 已清理或未被占用');
                    } else {
                        console.log('🗑️ 已终止占用端口 3000 的进程');
                    }
                    resolve();
                });
            });
        }
    });
}

// 如果直接运行此脚本
if (require.main === module) {
    killPort3000()
        .then(() => {
            console.log('✨ 端口清理完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ 清理端口时出错:', error.message);
            process.exit(1);
        });
}

module.exports = killPort3000;