import { Response } from "express";

export const sendMobileRedirect = (res: Response, targetUrl: string, message = "Redirecting to PoolPay App") => {
  res.send(`
    <html>
      <head>
        <title>Redirecting...</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f6f9fc; }
          .container { text-align: center; padding: 20px; border-radius: 8px; background: white; box-shadow: 0 4px 6px rgba(50,50,93,.11), 0 1px 3px rgba(0,0,0,.08); }
          .button { display: inline-block; padding: 12px 24px; background: #6772e5; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 20px; }
          h2 { color: #32325d; }
          p { color: #525f7f; }
        </style>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.location.href = "${targetUrl}";
            }, 500);
          };
        </script>
      </head>
      <body>
        <div class="container">
          <h2>${message}</h2>
          <p>We are taking you back to the app to complete the process.</p>
          <p>If you are not redirected automatically, please click the button below:</p>
          <a href="${targetUrl}" class="button">Return to App</a>
        </div>
      </body>
    </html>
  `);
};
