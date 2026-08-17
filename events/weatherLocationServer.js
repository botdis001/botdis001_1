const express = require('express');
const router = express.Router();

// API สำหรับรับพิกัดจากหน้าเว็บแล้วส่งสภาพอากาศเข้า DM ของ Discord User
router.get('/weather-location', async (req, res) => {
    const { userId, lat, lon } = req.query;

    if (!userId || !lat || !lon) {
        return res.send(`<h2>❌ ข้อมูลไม่ครบถ้วน กรุณาลองใหม่อีกครั้ง</h2>`);
    }

    try {
        // ดึงข้อมูลสภาพอากาศจาก OpenWeather API หรือแหล่งที่คุณใช้งานอยู่ (ตัวอย่างใช้ Open-Meteo ฟรีไม่ต้องใช้ Key)
        const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`
        );
        const weatherData = await weatherRes.json();

        // ค้นหา User ใน Discord เพื่อส่ง DM
        const client = req.app.get('discordClient');
        const user = await client.users.fetch(userId).catch(() => null);

        if (user) {
            // ส่งข้อความสภาพอากาศเข้า DM
            await user.send(`📍 **ผลสภาพอากาศจากตำแหน่งปัจจุบันของคุณ**\n- อุณหภูมิ: ${weatherData.current.temperature_2m}°C\n- ความชื้น: ${weatherData.current.relative_humidity_2m}%\n- ความเร็วลม: ${weatherData.current.wind_speed_10m} กม./ชม.`);
            
            res.send(`
                <!DOCTYPE html>
                <html lang="th">
                <head>
                    <meta charset="UTF-8">
                    <title>สำเร็จ!</title>
                    <style>body { font-family: sans-serif; text-align: center; padding-top: 50px; background: #2f3136; color: white; }</style>
                </head>
                <body>
                    <h2>✅ ดึงพิกัดและส่งสภาพอากาศเข้า DM ของคุณเรียบร้อยแล้ว!</h2>
                    <p>คุณสามารถปิดหน้านี้แล้วกลับไปที่ Discord ได้เลยครับ</p>
                </body>
                </html>
            `);
        } else {
            res.send(`<h2>❌ ไม่พบผู้ใช้ Discord กรุณาลองกดปุ่มใหม่อีกครั้ง</h2>`);
        }
    } catch (error) {
        console.error('Weather Location Error:', error);
        res.send(`<h2>❌ เกิดข้อผิดพลาดในการประมวลผลสภาพอากาศ</h2>`);
    }
});

module.exports = router;
