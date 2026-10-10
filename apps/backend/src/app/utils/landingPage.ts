export const getLandingPageHTML = (
  port: string | number,
  initialUptime: number
) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Community Savings App API | POOLPAY</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #6366f1;
            --secondary: #a855f7;
            --bg: #0f172a;
            --card-bg: rgba(30, 41, 59, 0.7);
            --text: #f8fafc;
            --accent: #22d3ee;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Outfit', sans-serif;
            background-color: var(--bg);
            background-image: 
                radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 40%),
                radial-gradient(circle at 90% 80%, rgba(168, 85, 247, 0.1) 0%, transparent 40%);
            color: var(--text);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow-x: hidden;
        }

        .container {
            max-width: 900px;
            width: 95%;
            padding: 40px;
            background: var(--card-bg);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            text-align: center;
            animation: fadeIn 0.8s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .badge {
            background: rgba(99, 102, 241, 0.2);
            color: var(--accent);
            padding: 6px 16px;
            border-radius: 100px;
            font-size: 0.85rem;
            font-weight: 600;
            display: inline-block;
            margin-bottom: 24px;
            border: 1px solid rgba(34, 211, 238, 0.3);
        }

        h1 {
            font-size: 3.5rem;
            font-weight: 700;
            margin-bottom: 16px;
            background: linear-gradient(to right, var(--primary), var(--secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.02em;
        }

        p.description {
            font-size: 1.1rem;
            color: #94a3b8;
            margin-bottom: 40px;
            line-height: 1.6;
        }

        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }

        .status-card {
            background: rgba(15, 23, 42, 0.5);
            padding: 20px;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.05);
            transition: all 0.3s ease;
        }

        .status-card:hover {
            border-color: var(--primary);
            transform: translateY(-5px);
        }

        .status-card h3 {
            font-size: 0.9rem;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 8px;
        }

        .status-card p {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text);
        }

        .status-dot {
            height: 8px;
            width: 8px;
            background-color: #10b981;
            border-radius: 50%;
            display: inline-block;
            margin-right: 8px;
            box-shadow: 0 0 10px #10b981;
        }

        .actions {
            display: flex;
            gap: 16px;
            justify-content: center;
        }

        .btn {
            padding: 14px 28px;
            border-radius: 12px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .btn-primary {
            background: var(--primary);
            color: white;
            box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.4);
        }

        .btn-primary:hover {
            background: #4f46e5;
            transform: scale(1.05);
        }

        .btn-outline {
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
        }

        .btn-outline:hover {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(255, 255, 255, 0.4);
        }

        footer {
            margin-top: 40px;
            font-size: 0.85rem;
            color: #475569;
        }
        .hidden {
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <span class="badge">Backend v1.0.0 &bull; Port: ${port}</span>
        <h1>Production Core</h1>
        <p class="description">POOLPAY Community-Based Savings & Money Pooling System. <br> High-performance API infrastructure with real-time financial tracking.</p>
        
        <div class="status-grid">
            <div class="status-card">
                <h3>Server Status</h3>
                <p><span class="status-dot"></span>Operational</p>
            </div>
            <div class="status-card">
                <h3>Uptime</h3>
                <p id="uptime">Calculating...</p>
            </div>
            <div class="status-card">
                <h3>Auth Mode</h3>
                <p>Hybrid (JWT/Pass)</p>
            </div>
        </div>

        <div class="actions">
            <a href="/api-docs" class="btn btn-primary">API Documentation</a>
            <a href="/postman_collection.json" class="btn btn-outline" download>Postman Collection (Legacy)</a>
            <a href="/master_postman_collection.json" class="btn btn-outline" download>Master Postman Collection</a>
        </div>

        <footer>
            Built with ❤️ by POOLPAY Team &bull; &copy; 2026
        </footer>
    </div>

    <script>
        window.addEventListener('DOMContentLoaded', () => {
            const initialUptime = parseFloat("${initialUptime}") || 0;
            const pageLoadTime = performance.now();
            const uptimeElement = document.getElementById('uptime');

            if (!uptimeElement) return;

            function updateUptime() {
                const timeSinceLoad = (performance.now() - pageLoadTime) / 1000;
                const totalUptime = Math.floor(initialUptime + timeSinceLoad);
                
                const hours = Math.floor(totalUptime / 3600);
                const minutes = Math.floor((totalUptime % 3600) / 60);
                const seconds = totalUptime % 60;
                
                uptimeElement.innerText = hours + 'h ' + minutes + 'm ' + seconds + 's';
            }
            setInterval(updateUptime, 1000);
            updateUptime();
        });
    </script>
</body>
</html>
`;
