(async function () {
    const X1 = 780, X2 = 1140; // 左闭右开
    const Y1 = 99, Y2 = 103;   // 左闭右开
    const WIDTH = X2 - X1;
    const HEIGHT = Y2 - Y1;
  
    const LOG_INTERVAL_MS = 2000; // 每 2 秒输出一次
    let lastLogTime = 0;
  
    while (true) {
        const now = Date.now();
        const region = captureGameRegion();
  
        if (!region) {
            log.warn("captureGameRegion 返回空，跳过本次检测");
            await sleep(50);
            continue;
        }
  
        let crop;
        try {
            crop = region.DeriveCrop(X1, Y1, WIDTH, HEIGHT);
        } catch (e) {
            log.warn("DeriveCrop 失败: {msg}", e.message);
            region.Dispose();
            await sleep(50);
            continue;
        }
  
        try {
            const mat = crop.SrcMat;
            if (!mat) {
                log.warn("无法获取有效 SrcMat，跳过本次检测");
                continue;
            }
  
            // === 计算平均颜色 ===
            const mean_color = mat.mean(); // 返回 { val0: B, val1: G, val2: R }
            const avgB = mean_color.val0;
            const avgG = mean_color.val1;
            const avgR = mean_color.val2;
  
            // 每 2 秒输出一次平均颜色
            if (now - lastLogTime >= LOG_INTERVAL_MS) {
                log.info("平均颜色: R={r}, G={g}, B={b}", 
                    avgR.toFixed(1), avgG.toFixed(1), avgB.toFixed(1)
                );
                lastLogTime = now;
            }
  
            // === 触发条件 ===
            if (avgR >= 250 && avgG >= 250 && avgB >= 250) {
                let waittime = 2950;
                log.info("触发条件满足，{waittime} ms后按下 E 键",waittime);
                await sleep(waittime);
                keyPress("E");
                log.info("已按下 E 键，等待 5 秒...");
                await sleep(5000);
            }
  
            // 释放矩阵
            mat.Dispose();
  
        } catch (e) {
            log.error("颜色计算失败: {msg}", e.message);
        } finally {
            try { crop.Dispose(); } catch {}
            try { region.Dispose(); } catch {}
        }
  
        await sleep(25); // BetterGI 默认截图间隔
    }
  })();
  