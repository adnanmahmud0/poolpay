export const getTermsAndConditionsHTML = () => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Terms and Conditions - PoolPay</title>
    <style>
        :root {
            --primary: #4f46e5;
            --primary-dark: #4338ca;
            --text-main: #1f2937;
            --text-light: #6b7280;
            --bg: #f9fafb;
        }
        body {
            font-family: 'Inter', -apple-system, sans-serif;
            line-height: 1.6;
            color: var(--text-main);
            background-color: var(--bg);
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 800px;
            margin: 40px auto;
            padding: 40px;
            background: white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            border-radius: 12px;
        }
        header {
            border-bottom: 2px solid #f3f4f6;
            margin-bottom: 30px;
            padding-bottom: 20px;
        }
        h1 {
            color: var(--primary);
            margin: 0;
            font-size: 2.5rem;
            font-weight: 800;
        }
        h2 {
            color: var(--text-main);
            margin-top: 30px;
            font-size: 1.5rem;
            border-left: 4px solid var(--primary);
            padding-left: 15px;
        }
        p, li {
            font-size: 1.1rem;
            color: var(--text-light);
        }
        .intro-box {
            background: #eef2ff;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid var(--primary);
            margin-bottom: 30px;
        }
        footer {
            margin-top: 50px;
            text-align: center;
            font-size: 0.9rem;
            color: var(--text-light);
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
        @media (max-width: 640px) {
            .container { margin: 10px; padding: 20px; }
            h1 { font-size: 1.8rem; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>PoolPay Terms & Conditions</h1>
            <p>Last Updated: May 14, 2026</p>
        </header>

        <div class="intro-box">
            <strong>Welcome to PoolPay!</strong> By using PoolPay, you agree to this Legal Bundle, which includes our Terms & Conditions and Privacy Policy. Please read carefully. We provide a platform for users to pool and transfer money. We are not a bank. Users are responsible for verifying transactions before sending funds.
        </div>

        <h2>1. Acceptance of Terms</h2>
        <p>By registering or using PoolPay, you agree to comply with these Terms & Conditions and all applicable laws. If you do not agree, do not use the service.</p>

        <h2>2. Eligibility</h2>
        <ul>
            <li>Be at least 18 years old.</li>
            <li>Provide accurate and complete information during registration.</li>
            <li>Not use the service for any illegal activity.</li>
        </ul>

        <h2>3. Account Registration & Security</h2>
        <p>You are responsible for maintaining the confidentiality of your account information, including your username, password, and 2FA codes. You must immediately notify PoolPay of any unauthorized use of your account.</p>

        <h2>4. How PoolPay Works</h2>
        <p>PoolPay is a platform for pooling and transferring money. We are not a bank and do not hold deposits. Transactions are processed through authorized third-party payment processors.</p>

        <h2>5. Payments & Fees</h2>
        <p>Transactions may incur service fees, which will be clearly displayed before confirmation. PoolPay may charge withdrawal or currency conversion fees. Users are responsible for verifying transaction details before confirming.</p>

        <h2>6. Prohibited Activities</h2>
        <p>You may not use PoolPay to commit fraud, money laundering, use stolen payment methods, or engage in any illegal activity. Violations may result in account termination and legal action.</p>

        <h2>7. Fraud Prevention & Monitoring</h2>
        <p>PoolPay monitors transactions for suspicious activity. We reserve the right to freeze, reverse, or block transactions suspected of fraud. Users may be required to provide additional verification.</p>

        <h2>8. Transactions & Errors</h2>
        <p>Transactions may not be reversible. PoolPay is not responsible for user errors or sending funds to the wrong recipient. Users must double-check all transaction details before confirming.</p>

        <h2>9. Limitation of Liability</h2>
        <p>PoolPay is not liable for any direct or indirect losses arising from user errors, unauthorized access, third-party service failures, or fraud.</p>

        <h2>10. Account Suspension & Termination</h2>
        <p>PoolPay may suspend, freeze, or terminate accounts for fraud, violating these Terms, or legal requirements.</p>

        <h2>11. Third-Party Services</h2>
        <p>PoolPay uses third-party payment processors to handle funds (Stripe). PoolPay is not responsible for failures or errors caused by these services.</p>

        <h2>12. Privacy & Data Protection</h2>
        <p>We collect and use personal data as described in our Privacy Policy. Users consent to PoolPay’s collection, use, and storage of data to provide services.</p>

        <h2>13. Compliance with Laws</h2>
        <p>Users must comply with all local, state, and federal laws, including AML and KYC requirements. PoolPay may report suspicious activity to authorities.</p>

        <h2>14. SMS Consent & Verification Information</h2>
        <div class="intro-box">
            <p>PoolPay uses SMS messages for account verification, authentication, password recovery, email or phone verification, and account security purposes. Users explicitly consent to receive SMS messages by entering their phone number and tapping the “Register” button within the application after manually checking the consent checkbox. Message frequency varies based on user activity. Message and data rates may apply. Reply STOP to opt out or HELP for assistance.</p>
            <p style="margin-top: 10px;">For detailed SMS consent and verification workflow documentation, please visit:</p>
            <a href="/sms-consent" style="color: var(--primary); font-weight: bold; word-break: break-all;"><script>document.write(window.location.origin + '/sms-consent')</script></a>
        </div>


        <h2>15. Dispute Resolution</h2>
        <p>Any disputes will be resolved through binding arbitration. These Terms are governed by the laws of our jurisdiction.</p>

        <h2>15. Changes to Terms</h2>
        <p>PoolPay may update these Terms at any time. Updated Terms will be posted on the website and app. Continued use after updates constitutes acceptance.</p>

        <h2>16. Contact Information</h2>
        <p>Email: support@poolpay.com</p>

        <footer>
            &copy; 2026 PoolPay. All rights reserved.
        </footer>
    </div>
</body>
</html>
`;

export const getPrivacyPolicyHTML = () => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - PoolPay</title>
    <style>
        :root {
            --primary: #10b981;
            --primary-dark: #059669;
            --text-main: #1f2937;
            --text-light: #6b7280;
            --bg: #f9fafb;
        }
        body {
            font-family: 'Inter', -apple-system, sans-serif;
            line-height: 1.6;
            color: var(--text-main);
            background-color: var(--bg);
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 800px;
            margin: 40px auto;
            padding: 40px;
            background: white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            border-radius: 12px;
        }
        header {
            border-bottom: 2px solid #f3f4f6;
            margin-bottom: 30px;
            padding-bottom: 20px;
        }
        h1 {
            color: var(--primary);
            margin: 0;
            font-size: 2.5rem;
            font-weight: 800;
        }
        h2 {
            color: var(--text-main);
            margin-top: 30px;
            font-size: 1.5rem;
            border-left: 4px solid var(--primary);
            padding-left: 15px;
        }
        p, li {
            font-size: 1.1rem;
            color: var(--text-light);
        }
        footer {
            margin-top: 50px;
            text-align: center;
            font-size: 0.9rem;
            color: var(--text-light);
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
        @media (max-width: 640px) {
            .container { margin: 10px; padding: 20px; }
            h1 { font-size: 1.8rem; }
            h2 { font-size: 1.3rem; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Privacy Policy</h1>
            <p>Your privacy is important to us.</p>
        </header>

        <h2>1. Information We Collect</h2>
        <p>We collect information you provide directly to us, such as when you create an account, complete a transaction, or communicate with us. This includes your name, email, phone number, and financial information required for processing payments via Stripe.</p>

        <h2>2. How We Use Information</h2>
        <p>We use the information to provide, maintain, and improve our services, process transactions, send technical notices, and prevent fraudulent activity.</p>

        <h2>3. Sharing of Information</h2>
        <p>We do not share your personal information with third parties except as required to provide our services (e.g., Stripe for payment processing) or as required by law.</p>

        <h2>4. SMS Consent & Verification Information</h2>
        <div style="background: #eef2ff; padding: 20px; border-radius: 8px; border-left: 4px solid var(--primary); margin-bottom: 30px;">
            <p><strong>No mobile information will be shared with third parties/affiliates for marketing/promotional purposes. All the above categories exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties.</strong></p>
            <p style="margin-top: 10px;">For detailed SMS consent and opt-in workflow documentation, please visit:</p>
            <a href="/sms-consent" style="color: var(--primary); font-weight: bold; word-break: break-all;"><script>document.write(window.location.origin + '/sms-consent')</script></a>
        </div>

        <h2>5. Data Security</h2>
        <p>We use industry-standard security measures to protect your data. However, no method of transmission over the Internet is 100% secure.</p>

        <h2>5. Your Choices</h2>
        <p>You can update your account information at any time via the app settings. You may also request data deletion by contacting support.</p>

        <h2>6. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at support@poolpay.com.</p>

        <footer>
            &copy; 2026 PoolPay. All rights reserved.
        </footer>
    </div>
</body>
</html>
`;

export const getDataDeletionInstructionsHTML = () => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account & Data Deletion - PoolPay</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #1A227F;
            --primary-dark: #121858;
            --danger: #ef4444;
            --danger-hover: #dc2626;
            --danger-light: #fef2f2;
            --success: #10b981;
            --text-main: #0f172a;
            --text-muted: #64748b;
            --bg-page: #f8fafc;
            --border-color: #e2e8f0;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: var(--text-main);
            background-color: var(--bg-page);
            min-height: 100vh;
            padding: 24px 16px;
        }
        .container {
            max-width: 720px;
            margin: 20px auto 60px;
        }
        .brand-header {
            text-align: center;
            margin-bottom: 28px;
        }
        .brand-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #eef2ff;
            color: var(--primary);
            font-weight: 700;
            font-size: 0.85rem;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            padding: 6px 14px;
            border-radius: 9999px;
            margin-bottom: 12px;
        }
        .brand-header h1 {
            font-size: 2.1rem;
            font-weight: 800;
            color: var(--text-main);
            letter-spacing: -0.025em;
            margin-bottom: 8px;
        }
        .brand-header p {
            color: var(--text-muted);
            font-size: 1rem;
        }
        .card {
            background: white;
            border: 1px solid var(--border-color);
            border-radius: 20px;
            box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.02);
            padding: 32px;
            margin-bottom: 28px;
        }
        .step-progress {
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
            margin-bottom: 32px;
        }
        .step-progress::before {
            content: '';
            position: absolute;
            top: 18px;
            left: 20px;
            right: 20px;
            height: 2px;
            background: var(--border-color);
            z-index: 1;
        }
        .step-item {
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            background: white;
            padding: 0 8px;
        }
        .step-circle {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.875rem;
            font-weight: 700;
            background: #f1f5f9;
            color: var(--text-muted);
            border: 2px solid #e2e8f0;
            transition: all 0.25s ease;
        }
        .step-item.active .step-circle {
            background: var(--primary);
            color: white;
            border-color: var(--primary);
        }
        .step-item.completed .step-circle {
            background: #10b981;
            color: white;
            border-color: #10b981;
        }
        .step-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--text-muted);
        }
        .step-item.active .step-label {
            color: var(--primary);
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--text-main);
            margin-bottom: 8px;
        }
        .form-control {
            width: 100%;
            padding: 13px 16px;
            font-size: 0.95rem;
            border: 1.5px solid var(--border-color);
            border-radius: 12px;
            background: #fdfdfd;
            transition: all 0.2s ease;
            outline: none;
            font-family: inherit;
        }
        .form-control:focus {
            border-color: var(--primary);
            background: white;
            box-shadow: 0 0 0 4px rgba(26, 34, 127, 0.08);
        }
        .otp-input-group {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin: 24px 0 16px;
        }
        .otp-digit {
            width: 48px;
            height: 56px;
            font-size: 1.5rem;
            font-weight: 700;
            text-align: center;
            border: 2px solid var(--border-color);
            border-radius: 12px;
            outline: none;
            transition: all 0.2s;
        }
        .otp-digit:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(26, 34, 127, 0.12);
        }
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            padding: 14px 20px;
            font-size: 0.98rem;
            font-weight: 600;
            border-radius: 12px;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
            font-family: inherit;
        }
        .btn-primary {
            background: var(--primary);
            color: white;
        }
        .btn-primary:hover:not(:disabled) {
            background: var(--primary-dark);
            transform: translateY(-1px);
        }
        .btn-danger {
            background: var(--danger);
            color: white;
        }
        .btn-danger:hover:not(:disabled) {
            background: var(--danger-hover);
            transform: translateY(-1px);
        }
        .btn-secondary {
            background: #f1f5f9;
            color: #475569;
        }
        .btn-secondary:hover:not(:disabled) {
            background: #e2e8f0;
        }
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none !important;
        }
        .alert {
            padding: 14px 16px;
            border-radius: 12px;
            font-size: 0.9rem;
            margin-bottom: 20px;
            display: none;
            align-items: flex-start;
            gap: 10px;
        }
        .alert-error {
            background: #fef2f2;
            color: #b91c1c;
            border: 1px solid #fecaca;
        }
        .alert-info {
            background: #eff6ff;
            color: #1d4ed8;
            border: 1px solid #bfdbfe;
        }
        .user-preview-card {
            background: #f8fafc;
            border: 1px solid var(--border-color);
            border-radius: 14px;
            padding: 20px;
            margin-bottom: 24px;
        }
        .user-preview-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dashed #e2e8f0;
            font-size: 0.92rem;
        }
        .user-preview-row:last-child {
            border-bottom: none;
        }
        .user-preview-row .label {
            color: var(--text-muted);
            font-weight: 500;
        }
        .user-preview-row .value {
            font-weight: 600;
            color: var(--text-main);
        }
        .warning-callout {
            background: #fef2f2;
            border-left: 4px solid var(--danger);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
        }
        .warning-callout h4 {
            color: #991b1b;
            font-size: 0.95rem;
            font-weight: 700;
            margin-bottom: 6px;
        }
        .warning-callout ul {
            padding-left: 20px;
            color: #7f1d1d;
            font-size: 0.88rem;
        }
        .warning-callout li {
            margin-bottom: 4px;
        }
        /* Modal */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(4px);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            padding: 16px;
        }
        .modal-box {
            background: white;
            border-radius: 20px;
            max-width: 460px;
            width: 100%;
            padding: 28px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            text-align: center;
            animation: modalPop 0.2s ease-out;
        }
        @keyframes modalPop {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        .modal-icon {
            width: 56px;
            height: 56px;
            background: #fee2e2;
            color: var(--danger);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
            font-size: 28px;
        }
        .modal-title {
            font-size: 1.35rem;
            font-weight: 800;
            color: var(--text-main);
            margin-bottom: 10px;
        }
        .modal-desc {
            font-size: 0.92rem;
            color: var(--text-muted);
            margin-bottom: 24px;
            line-height: 1.5;
        }
        .modal-actions {
            display: flex;
            gap: 12px;
        }
        .modal-actions .btn {
            flex: 1;
        }
        /* Success Screen */
        .success-box {
            text-align: center;
            padding: 24px 8px;
        }
        .success-icon {
            width: 72px;
            height: 72px;
            background: #ecfdf5;
            color: var(--success);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
        }
        .success-title {
            font-size: 1.6rem;
            font-weight: 800;
            color: var(--text-main);
            margin-bottom: 12px;
        }
        .success-desc {
            color: var(--text-muted);
            font-size: 0.95rem;
            margin-bottom: 24px;
            max-width: 480px;
            margin-left: auto;
            margin-right: auto;
        }
        .policy-section {
            background: white;
            border: 1px solid var(--border-color);
            border-radius: 20px;
            padding: 32px;
        }
        .policy-section h2 {
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--text-main);
            margin-bottom: 16px;
            border-left: 4px solid var(--primary);
            padding-left: 12px;
        }
        .policy-section p, .policy-section li {
            color: var(--text-muted);
            font-size: 0.92rem;
            line-height: 1.6;
        }
        .policy-section ul {
            padding-left: 20px;
            margin: 12px 0;
        }
        .policy-section li {
            margin-bottom: 6px;
        }
        .spinner {
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top: 2px solid white;
            border-radius: 50%;
            width: 18px;
            height: 18px;
            animation: spin 0.8s linear infinite;
            display: inline-block;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        footer {
            text-align: center;
            font-size: 0.85rem;
            color: var(--text-muted);
            margin-top: 36px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="brand-header">
            <div class="brand-badge">PoolPay Privacy Portal</div>
            <h1>Account & Data Deletion</h1>
            <p>Request permanent deletion of your PoolPay account and associated personal data.</p>
        </div>

        <div class="card">
            <!-- Progress indicator -->
            <div class="step-progress" id="stepProgress">
                <div class="step-item active" id="prog-1">
                    <div class="step-circle">1</div>
                    <span class="step-label">Login</span>
                </div>
                <div class="step-item" id="prog-2">
                    <div class="step-circle">2</div>
                    <span class="step-label">OTP</span>
                </div>
                <div class="step-item" id="prog-3">
                    <div class="step-circle">3</div>
                    <span class="step-label">Delete</span>
                </div>
                <div class="step-item" id="prog-4">
                    <div class="step-circle">4</div>
                    <span class="step-label">Done</span>
                </div>
            </div>

            <!-- Global Error Banner -->
            <div class="alert alert-error" id="errorBanner">
                <span id="errorMessage"></span>
            </div>

            <!-- STEP 1: Login & Credentials -->
            <div id="step1View">
                <div class="form-group">
                    <label for="identifier">Email Address or Phone Number</label>
                    <input type="text" id="identifier" class="form-control" placeholder="user@example.com or +1234567890" autocomplete="username">
                </div>
                <div class="form-group">
                    <label for="password">Account Password</label>
                    <input type="password" id="password" class="form-control" placeholder="Enter your account password" autocomplete="current-password">
                </div>
                <button type="button" class="btn btn-primary" id="btnSendOtp" onclick="handleSendOtp()">
                    <span id="btnSendOtpText">Send Verification Code</span>
                </button>
            </div>

            <!-- STEP 2: OTP Verification -->
            <div id="step2View" style="display: none;">
                <div class="alert alert-info" style="display: flex;">
                    <span>A 6-digit verification code has been sent to your registered email and phone number. Code expires in 10 minutes.</span>
                </div>
                <div class="form-group" style="text-align: center;">
                    <label>Enter 6-Digit Code</label>
                    <div class="otp-input-group">
                        <input type="text" maxlength="1" class="otp-digit" inputmode="numeric" autofocus>
                        <input type="text" maxlength="1" class="otp-digit" inputmode="numeric">
                        <input type="text" maxlength="1" class="otp-digit" inputmode="numeric">
                        <input type="text" maxlength="1" class="otp-digit" inputmode="numeric">
                        <input type="text" maxlength="1" class="otp-digit" inputmode="numeric">
                        <input type="text" maxlength="1" class="otp-digit" inputmode="numeric">
                    </div>
                </div>
                <button type="button" class="btn btn-primary" id="btnVerifyOtp" onclick="handleVerifyOtp()">
                    <span id="btnVerifyOtpText">Verify Identity</span>
                </button>
                <div style="display: flex; justify-content: space-between; margin-top: 16px; font-size: 0.88rem;">
                    <a href="javascript:void(0)" onclick="handleSendOtp()" style="color: var(--primary); text-decoration: none; font-weight: 600;">Resend Code</a>
                    <a href="javascript:void(0)" onclick="goToStep(1)" style="color: var(--text-muted); text-decoration: none;">Change Login Info</a>
                </div>
            </div>

            <!-- STEP 3: Confirm Account Deletion Action -->
            <div id="step3View" style="display: none;">
                <div class="user-preview-card">
                    <div class="user-preview-row">
                        <span class="label">Account Name:</span>
                        <span class="value" id="previewName">-</span>
                    </div>
                    <div class="user-preview-row">
                        <span class="label">Registered Email:</span>
                        <span class="value" id="previewEmail">-</span>
                    </div>
                    <div class="user-preview-row">
                        <span class="label">Verification Status:</span>
                        <span class="value" style="color: var(--success);">&#10003; Identity Verified</span>
                    </div>
                </div>

                <div class="warning-callout">
                    <h4>Permanent Data Erasure Notice</h4>
                    <ul>
                        <li>Your account credentials, name, email, and phone number will be erased.</li>
                        <li>All linked payment methods and saved cards will be permanently detached and removed.</li>
                        <li>Your notification history, preferences, and group memberships will be deleted.</li>
                        <li><strong>This action is immediate, permanent, and cannot be undone.</strong></li>
                    </ul>
                </div>

                <button type="button" class="btn btn-danger" onclick="openConfirmModal()">
                    <span>Delete Account</span>
                </button>
            </div>

            <!-- STEP 4: Success Screen -->
            <div id="step4View" style="display: none;">
                <div class="success-box">
                    <div class="success-icon">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <h2 class="success-title">Account Successfully Deleted</h2>
                    <p class="success-desc">
                        Your PoolPay account and all associated personal data have been permanently deleted from our servers. A confirmation has been logged and sent to your email.
                    </p>
                    <a href="/" class="btn btn-secondary" style="text-decoration: none; display: inline-flex; width: auto; padding: 12px 28px;">
                        Back to Home
                    </a>
                </div>
            </div>
        </div>

        <!-- Confirmation Modal -->
        <div class="modal-overlay" id="confirmModal">
            <div class="modal-box">
                <div class="modal-icon">&#9888;</div>
                <h3 class="modal-title">Are you sure?</h3>
                <p class="modal-desc">
                    Are you sure you want to permanently delete your PoolPay account? All your transaction records, profile data, and payment methods will be erased forever. This action cannot be reversed.
                </p>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeConfirmModal()">Cancel</button>
                    <button type="button" class="btn btn-danger" id="btnConfirmDelete" onclick="handleConfirmDelete()">
                        <span id="btnConfirmDeleteText">Yes, Delete Account</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Google Play & Privacy Policy Standards Section -->
        <div class="policy-section">
            <h2>Data Deletion & Retention Policy</h2>
            <p>
                In compliance with Google Play Data Safety policies, the GDPR, and CCPA, users have the absolute right to request the deletion of their accounts and associated personal data at any time without retaining the mobile application.
            </p>
            <ul>
                <li><strong>Data Permanently Deleted:</strong> User profile, contact information, authentication credentials, payment methods/cards, device notification tokens, and in-app communications.</li>
                <li><strong>Regulatory Retention Exceptions:</strong> PoolPay may retain minimal transaction logs strictly required by applicable banking, anti-money laundering (AML), and financial compliance laws for statutory retention periods.</li>
                <li><strong>In-App Deletion Alternative:</strong> You may also delete your account directly inside the PoolPay app by navigating to <em>Profile &gt; Delete Account</em>.</li>
            </ul>
        </div>

        <footer>
            &copy; 2026 PoolPay Inc. All rights reserved. &bull; <a href="/privacy-policy" style="color: inherit;">Privacy Policy</a> &bull; <a href="/terms-and-conditions" style="color: inherit;">Terms & Conditions</a>
        </footer>
    </div>

    <script>
        let currentDeletionToken = null;
        let storedIdentifier = '';

        // OTP inputs auto-advance
        const otpDigits = document.querySelectorAll('.otp-digit');
        otpDigits.forEach((digit, index) => {
            digit.addEventListener('input', (e) => {
                if (e.target.value.length === 1 && index < otpDigits.length - 1) {
                    otpDigits[index + 1].focus();
                }
            });
            digit.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    otpDigits[index - 1].focus();
                }
            });
            digit.addEventListener('paste', (e) => {
                e.preventDefault();
                const pasteData = (e.clipboardData || window.clipboardData).getData('text').trim();
                if (/^\\d{6}$/.test(pasteData)) {
                    pasteData.split('').forEach((char, i) => {
                        if (otpDigits[i]) otpDigits[i].value = char;
                    });
                    otpDigits[otpDigits.length - 1].focus();
                }
            });
        });

        function getOtpValue() {
            let code = '';
            otpDigits.forEach(d => code += d.value.trim());
            return code;
        }

        function showError(msg) {
            const banner = document.getElementById('errorBanner');
            const messageEl = document.getElementById('errorMessage');
            if (msg) {
                messageEl.textContent = msg;
                banner.style.display = 'flex';
            } else {
                banner.style.display = 'none';
            }
        }

        function goToStep(step) {
            showError(null);
            document.getElementById('step1View').style.display = step === 1 ? 'block' : 'none';
            document.getElementById('step2View').style.display = step === 2 ? 'block' : 'none';
            document.getElementById('step3View').style.display = step === 3 ? 'block' : 'none';
            document.getElementById('step4View').style.display = step === 4 ? 'block' : 'none';

            for (let i = 1; i <= 4; i++) {
                const el = document.getElementById('prog-' + i);
                el.classList.remove('active', 'completed');
                if (i < step) {
                    el.classList.add('completed');
                } else if (i === step) {
                    el.classList.add('active');
                }
            }

            if (step === 2) {
                setTimeout(() => { if (otpDigits[0]) otpDigits[0].focus(); }, 150);
            }
        }

        async function handleSendOtp() {
            showError(null);
            const identifier = document.getElementById('identifier').value.trim();
            const password = document.getElementById('password').value;

            if (!identifier) {
                showError("Please enter your email address or phone number.");
                return;
            }
            if (!password) {
                showError("Please enter your account password.");
                return;
            }

            storedIdentifier = identifier;
            const btn = document.getElementById('btnSendOtp');
            const btnText = document.getElementById('btnSendOtpText');
            btn.disabled = true;
            btnText.innerHTML = '<span class="spinner"></span> Sending Code...';

            try {
                const res = await fetch('/api/v1/auth/data-deletion/request-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier, password })
                });
                const data = await res.json();
                if (!res.ok || !data.success) {
                    throw new Error(data.message || 'Failed to send verification code.');
                }
                goToStep(2);
            } catch (err) {
                showError(err.message || 'An unexpected error occurred. Please try again.');
            } finally {
                btn.disabled = false;
                btnText.textContent = 'Send Verification Code';
            }
        }

        async function handleVerifyOtp() {
            showError(null);
            const code = getOtpValue();
            if (code.length < 6) {
                showError("Please enter the complete 6-digit verification code.");
                return;
            }

            const btn = document.getElementById('btnVerifyOtp');
            const btnText = document.getElementById('btnVerifyOtpText');
            btn.disabled = true;
            btnText.innerHTML = '<span class="spinner"></span> Verifying...';

            try {
                const res = await fetch('/api/v1/auth/data-deletion/verify-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier: storedIdentifier, code })
                });
                const data = await res.json();
                if (!res.ok || !data.success) {
                    throw new Error(data.message || 'Invalid or expired code.');
                }

                currentDeletionToken = data.data.deletionToken;
                document.getElementById('previewName').textContent = data.data.user.name || 'Account Holder';
                document.getElementById('previewEmail').textContent = data.data.user.email || storedIdentifier;

                goToStep(3);
            } catch (err) {
                showError(err.message || 'Verification failed. Please check the code.');
            } finally {
                btn.disabled = false;
                btnText.textContent = 'Verify Identity';
            }
        }

        function openConfirmModal() {
            document.getElementById('confirmModal').style.display = 'flex';
        }

        function closeConfirmModal() {
            document.getElementById('confirmModal').style.display = 'none';
        }

        async function handleConfirmDelete() {
            if (!currentDeletionToken) {
                showError("Session expired. Please start over.");
                closeConfirmModal();
                goToStep(1);
                return;
            }

            const btn = document.getElementById('btnConfirmDelete');
            const btnText = document.getElementById('btnConfirmDeleteText');
            btn.disabled = true;
            btnText.innerHTML = '<span class="spinner"></span> Deleting Account...';

            try {
                const res = await fetch('/api/v1/auth/data-deletion/confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deletionToken: currentDeletionToken })
                });
                const data = await res.json();
                if (!res.ok || !data.success) {
                    throw new Error(data.message || 'Failed to delete account. Please try again.');
                }

                closeConfirmModal();
                goToStep(4);
            } catch (err) {
                closeConfirmModal();
                showError(err.message || 'Failed to process account deletion.');
            } finally {
                btn.disabled = false;
                btnText.textContent = 'Yes, Delete Account';
            }
        }
    </script>
</body>
</html>
`;

export const getSocialAuthErrorPageHTML = (
  errorMessage: string,
  frontendUrl: string
) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Access Denied - PoolPay</title>
    <style>
        :root {
            --bg-dark: #0f172a;
            --card-bg: rgba(30, 41, 59, 0.7);
            --border-glow: rgba(239, 68, 68, 0.2);
            --primary-glow: rgba(239, 68, 68, 0.8);
            --text-main: #f8fafc;
            --text-light: #94a3b8;
            --accent: #ef4444;
        }
        body {
            font-family: 'Inter', -apple-system, sans-serif;
            background: radial-gradient(circle at center, #1e1b4b 0%, var(--bg-dark) 100%);
            color: var(--text-main);
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
            overflow: hidden;
        }
        .glow-sphere {
            position: absolute;
            width: 450px;
            height: 450px;
            background: radial-gradient(circle, rgba(239, 68, 68, 0.12) 0%, rgba(239, 68, 68, 0) 70%);
            border-radius: 50%;
            z-index: 0;
            filter: blur(40px);
        }
        .container {
            max-width: 500px;
            width: 100%;
            background: var(--card-bg);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 
                        0 0 50px var(--border-glow);
            z-index: 1;
            transform: translateY(20px);
            opacity: 0;
            animation: floatIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes floatIn {
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        .icon-container {
            width: 80px;
            height: 80px;
            background: rgba(239, 68, 68, 0.1);
            border: 2px solid var(--accent);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.2);
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
            70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
            100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .icon {
            font-size: 36px;
            color: var(--accent);
        }
        h1 {
            font-size: 2rem;
            margin: 0 0 12px;
            font-weight: 800;
            background: linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .error-message {
            font-size: 1.1rem;
            color: #fca5a5;
            margin-bottom: 24px;
            font-weight: 500;
            line-height: 1.5;
        }
        .description {
            font-size: 0.95rem;
            color: var(--text-light);
            margin-bottom: 32px;
            line-height: 1.6;
        }
        .divider {
            height: 1px;
            background: rgba(255, 255, 255, 0.08);
            margin: 24px 0;
        }
        .action-button {
            display: inline-block;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            border: none;
            padding: 14px 28px;
            font-size: 1rem;
            font-weight: 600;
            border-radius: 12px;
            text-decoration: none;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
            transition: all 0.3s ease;
        }
        .action-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5);
            background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
        }
        .back-link {
            display: block;
            margin-top: 16px;
            color: var(--text-light);
            text-decoration: none;
            font-size: 0.9rem;
            transition: color 0.2s ease;
        }
        .back-link:hover {
            color: var(--text-main);
        }
    </style>
</head>
<body>
    <div class="glow-sphere"></div>
    <div class="container">
        <div class="icon-container">
            <span class="icon">🛡️</span>
        </div>
        <h1>Access Denied</h1>
        <div class="error-message">
            ${errorMessage}
        </div>
        <p class="description">
            To ensure secure isolation of our platforms, social authentication (Google & Facebook login) is restricted strictly to the native PoolPay Mobile Application. Web dashboard access is reserved exclusively for administrative credentials.
        </p>
        <div class="divider"></div>
        <p style="font-size: 0.85rem; color: #64748b; margin-top: 16px; margin-bottom: 24px;">
            Please open this authentication flow inside the native PoolPay Mobile Application to sign in.
        </p>
        <a href="${frontendUrl}/login" class="action-button">Return to Administrator Login</a>
    </div>
</body>
</html>
`;

export const getSmsConsentHTML = () => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SMS Consent and Authentication - PoolPay</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        /* Scrollbar hiding for mockup */
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
</head>
<body class="bg-gray-50 text-gray-800">
    <div class="max-w-6xl mx-auto px-4 py-12">
        <div class="bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-100">
            <!-- Header -->
            <div class="bg-gradient-to-r from-blue-700 to-blue-900 px-8 py-12 text-white text-center">
                <h1 class="text-3xl md:text-4xl font-bold mb-4">PoolPay SMS Consent & Opt-In Workflow</h1>
                <p class="text-blue-100 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">This page documents the SMS consent and account verification workflow used by PoolPay for A2P 10DLC compliance review.</p>
            </div>

            <div class="p-8 md:p-12 grid lg:grid-cols-2 gap-16">
                
                <!-- Left side: Information -->
                <div class="flex flex-col justify-center">
                    <div class="mb-10">
                        <h2 class="text-2xl font-bold text-gray-900 border-b-2 border-blue-100 pb-3 mb-6">Registration & Verification Process</h2>
                        <ul class="space-y-4">
                            <li class="flex items-start">
                                <span class="bg-blue-100 text-blue-800 font-bold rounded-full w-7 h-7 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">1</span>
                                <div class="text-gray-700 pt-0.5"><strong class="text-gray-900">Step 1:</strong> User opens the PoolPay registration page.</div>
                            </li>
                            <li class="flex items-start">
                                <span class="bg-blue-100 text-blue-800 font-bold rounded-full w-7 h-7 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">2</span>
                                <div class="text-gray-700 pt-0.5"><strong class="text-gray-900">Step 2:</strong> User enters full name, email address, mobile phone number, and password.</div>
                            </li>
                            <li class="flex items-start">
                                <span class="bg-blue-100 text-blue-800 font-bold rounded-full w-7 h-7 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">3</span>
                                <div class="text-gray-700 pt-0.5"><strong class="text-gray-900">Step 3:</strong> User reviews the SMS consent disclosure.</div>
                            </li>
                            <li class="flex items-start">
                                <span class="bg-blue-100 text-blue-800 font-bold rounded-full w-7 h-7 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">4</span>
                                <div class="text-gray-700 pt-0.5"><strong class="text-gray-900">Step 4:</strong> User manually checks the SMS consent checkbox (Optional).</div>
                            </li>
                            <li class="flex items-start">
                                <span class="bg-blue-100 text-blue-800 font-bold rounded-full w-7 h-7 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">5</span>
                                <div class="text-gray-700 pt-0.5"><strong class="text-gray-900">Step 5:</strong> User checks the Terms of Service & Privacy Policy checkbox and clicks Continue.</div>
                            </li>
                            <li class="flex items-start">
                                <span class="bg-blue-100 text-blue-800 font-bold rounded-full w-7 h-7 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">6</span>
                                <div class="text-gray-700 pt-0.5"><strong class="text-gray-900">Step 6:</strong> PoolPay sends verification codes to the user's email address and mobile phone number.</div>
                            </li>
                            <li class="flex items-start">
                                <span class="bg-blue-100 text-blue-800 font-bold rounded-full w-7 h-7 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">7</span>
                                <div class="text-gray-700 pt-0.5"><strong class="text-gray-900">Step 7:</strong> User may verify the account using either the email verification code or the SMS verification code.</div>
                            </li>
                            <li class="flex items-start">
                                <span class="bg-blue-100 text-blue-800 font-bold rounded-full w-7 h-7 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">8</span>
                                <div class="text-gray-700 pt-0.5"><strong class="text-gray-900">Step 8:</strong> After successful verification the account becomes active.</div>
                            </li>
                        </ul>
                    </div>

                    <div class="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-6">
                        <h2 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                            Compliance Policy
                        </h2>
                        <ul class="space-y-2 text-sm text-gray-600">
                            <li class="flex items-start"><span class="text-blue-500 mr-2 mt-0.5">•</span> Brand/Business name is aligned with the campaign information.</li>
                            <li class="flex items-start"><span class="text-blue-500 mr-2 mt-0.5">•</span> SMS messages are used only for account verification, authentication, password recovery, and account security purposes.</li>
                            <li class="flex items-start"><span class="text-blue-500 mr-2 mt-0.5">•</span> No mobile information will be shared with third parties/affiliates for marketing/promotional purposes. All the above categories exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties.</li>
                            <li class="flex items-start"><span class="text-blue-500 mr-2 mt-0.5">•</span> No marketing or promotional messages are sent.</li>
                            <li class="flex items-start"><span class="text-blue-500 mr-2 mt-0.5">•</span> Message frequency varies.</li>
                            <li class="flex items-start"><span class="text-blue-500 mr-2 mt-0.5">•</span> Message & data rates may apply.</li>
                            <li class="flex items-start"><span class="text-blue-500 mr-2 mt-0.5">•</span> Users may reply STOP to opt out.</li>
                            <li class="flex items-start"><span class="text-blue-500 mr-2 mt-0.5">•</span> Users may reply HELP for assistance.</li>
                        </ul>
                    </div>

                    <div class="bg-blue-50 rounded-2xl p-6 border border-blue-100 mb-6">
                        <h2 class="text-sm font-bold text-blue-900 mb-2 uppercase tracking-wide">SMS Consent Requirements</h2>
                        <ul class="space-y-2 text-sm text-blue-800">
                            <li class="flex items-start"><span class="text-blue-500 mr-2 mt-0.5">•</span> The consent checkbox is unchecked by default.</li>
                            <li class="flex items-start"><span class="text-blue-500 mr-2 mt-0.5">•</span> Checkbox is selectable for user to consent.</li>
                            <li class="flex items-start"><span class="text-blue-500 mr-2 mt-0.5">•</span> Opt-in language is explicitly separated from Terms of Service and Privacy Policy.</li>
                            <li class="flex items-start"><span class="text-blue-500 mr-2 mt-0.5">•</span> Checking consent box is not required to continue/submit the form.</li>
                            <li class="flex items-start"><span class="text-blue-500 mr-2 mt-0.5">•</span> PoolPay does not send SMS messages unless the user explicitly provides consent.</li>
                        </ul>
                    </div>
                    
                    <div class="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                        <h2 class="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Legal Documentation Links</h2>
                        <div class="space-y-3 text-sm">
                            <div>
                                <strong class="text-gray-900 block">Privacy Policy:</strong>
                                <a href="/privacy-policy" class="text-blue-600 hover:underline break-all"><script>document.write(window.location.origin + '/privacy-policy')</script></a>
                            </div>
                            <div>
                                <strong class="text-gray-900 block">Terms & Conditions:</strong>
                                <a href="/terms-and-conditions" class="text-blue-600 hover:underline break-all"><script>document.write(window.location.origin + '/terms-and-conditions')</script></a>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right side: Mockup -->
                <div class="flex flex-col items-center justify-center pt-8 lg:pt-0">
                    <h2 class="text-xl font-bold text-gray-900 mb-2 text-center">Visual Example of User Opt-In Flow</h2>
                    <p class="text-sm text-gray-600 text-center mb-8 px-4">The following mockup demonstrates the exact registration screen where users provide SMS consent before requesting account verification.</p>
                    
                    <!-- App Mockup Image -->
                    <div class="relative w-full max-w-sm mx-auto shadow-2xl rounded-[2.5rem] overflow-hidden border-[8px] border-gray-900 bg-white">
                        <img src="/public/sms-mockup.png" alt="Signup Form Mockup with SMS Consent" class="w-full h-auto object-cover" />
                    </div>
                    
                    <!-- 
                    ORIGINAL HTML MOCKUP (Kept for reference):
                    <div class="w-[340px] h-[680px] border-[12px] border-gray-900 rounded-[2.5rem] overflow-hidden bg-white shadow-2xl relative flex flex-col">
                        <div class="absolute top-0 inset-x-0 h-6 bg-gray-900 rounded-b-3xl w-40 mx-auto z-10"></div>
                        <div class="flex-1 px-6 pt-16 pb-6 overflow-y-auto hide-scroll flex flex-col bg-white">
                            <div class="text-center mb-6 mt-4">
                                <h3 class="text-2xl font-extrabold text-gray-900">Create Account</h3>
                                <p class="text-xs text-gray-500 mt-1">Join PoolPay today.</p>
                            </div>
                            <div class="space-y-4">
                                <div>
                                    <label class="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Full Name</label>
                                    <input type="text" placeholder="John Doe" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-gray-50" />
                                </div>
                                <div>
                                    <label class="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Email Address</label>
                                    <input type="email" placeholder="john@example.com" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-gray-50" />
                                </div>
                                <div>
                                    <label class="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Mobile Phone Number</label>
                                    <div class="relative">
                                        <input type="tel" placeholder="(555) 000-0000" class="w-full border border-gray-200 rounded-lg pl-12 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-gray-50" />
                                        <div class="absolute left-3 top-1/2 -translate-y-1/2 flex items-center border-r border-gray-200 pr-2">
                                            <span class="text-gray-600 text-sm font-medium">+1</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label class="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Password</label>
                                    <input type="password" placeholder="••••••••" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-gray-50" />
                                </div>
                                <div>
                                    <label class="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Confirm Password</label>
                                    <input type="password" placeholder="••••••••" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-gray-50" />
                                </div>
                            </div>
                            <div class="mt-5 mb-5 space-y-3">
                                <div class="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                    <div class="flex items-start gap-2">
                                        <div class="pt-0.5">
                                            <input type="checkbox" class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white" />
                                        </div>
                                        <label class="text-[9px] leading-tight text-gray-600 cursor-pointer">
                                            By checking, you are allowing to receive transactional/informational SMS communications regarding account verification, authentication, and security purposes from <strong>PoolPay</strong>. Message frequency may vary. Message & data rates may apply. Reply HELP for help or STOP to opt-out.
                                        </label>
                                    </div>
                                </div>
                                <div class="flex items-start gap-2 px-1">
                                    <div class="pt-0.5">
                                        <input type="checkbox" class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white" />
                                    </div>
                                    <label class="text-[9px] leading-tight text-gray-600 cursor-pointer">
                                        By checking, I accept <a href="/terms-and-conditions" class="text-blue-600 hover:underline">Terms of Service</a> & <a href="/privacy-policy" class="text-blue-600 hover:underline">Privacy Policy</a>.
                                    </label>
                                </div>
                            </div>
                            <button type="button" class="w-full bg-blue-600 text-white font-bold rounded-lg py-3 text-sm shadow-md shadow-blue-200">Continue</button>
                            <div class="mt-4 text-center text-[10px] text-gray-500 pb-4">
                                Already have an account? <span class="text-blue-600 font-medium">Login</span>
                            </div>
                        </div>
                    </div>
                    -->
                </div>

            </div>

            <!-- Footer Links -->
            <div class="bg-gray-50 border-t border-gray-100 px-8 py-6 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
                <div class="font-medium text-gray-600">&copy; 2026 PoolPay. All rights reserved.</div>
                <div class="flex space-x-6 mt-4 sm:mt-0">
                    <a href="/privacy-policy" class="hover:text-blue-600 font-medium transition">Privacy Policy</a>
                    <a href="/terms-and-conditions" class="hover:text-blue-600 font-medium transition">Terms & Conditions</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
`;
