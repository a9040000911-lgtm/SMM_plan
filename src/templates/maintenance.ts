/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

export const MAINTENANCE_TEMPLATE = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Технические работы — SMMPLAN</title>
    <style>
        body {
            background: #02040a;
            color: #00f0ff;
            font-family: 'Courier New', Courier, monospace;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            overflow: hidden;
            text-transform: uppercase;
        }
        .container {
            border: 2px solid #00f0ff;
            padding: 40px;
            background: rgba(0, 240, 255, 0.05);
            box-shadow: 0 0 20px rgba(0, 240, 255, 0.2);
            text-align: center;
            position: relative;
            max-width: 90%;
        }
        .container::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            border: 2px solid #00f0ff;
            animation: pulse 2s infinite;
            pointer-events: none;
        }
        h1 {
            font-size: 24px;
            margin-bottom: 20px;
            letter-spacing: 5px;
            text-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
        }
        p {
            font-size: 12px;
            line-height: 1.6;
            color: rgba(0, 240, 255, 0.7);
            max-width: 400px;
        }
        .loader {
            width: 50px;
            height: 5px;
            background: rgba(0, 240, 255, 0.1);
            margin: 30px auto;
            position: relative;
            overflow: hidden;
        }
        .loader::after {
            content: '';
            position: absolute;
            width: 30%;
            height: 100%;
            background: #00f0ff;
            animation: load 1.5s infinite linear;
        }
        @keyframes load {
            0% { left: -30%; }
            100% { left: 100%; }
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.3; }
            100% { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>РЕЖИМ ТЕХОБСЛУЖИВАНИЯ</h1>
        <div class="loader"></div>
        <p>Проводятся технические работы по обновлению системных протоколов. Мы вернемся в онлайн в кратчайшие сроки.</p>
        <p style="margin-top: 20px; font-size: 10px; opacity: 0.5;">STATUS: ОБНОВЛЕНИЕ_СИСТЕМЫ...</p>
    </div>
</body>
</html>`;
