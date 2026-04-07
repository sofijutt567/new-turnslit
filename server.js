// File: api/verify-turnstile.js

export default async function handler(req, res) {
    // 1. CORS Setup (Taake aapka frontend isey block na kare)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Pre-flight request handling
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 2. Sirf POST request allow karein
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Only POST method is allowed' });
    }

    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ success: false, error: 'Captcha token is missing' });
    }

    // 3. Secret Key SIRF Vercel Environment Variables se aayegi (Hardcode khatam kar diya)
    const SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

    // Agar Vercel mein variable nahi laga hoga toh yeh error dega
    if (!SECRET_KEY) {
        console.error('Server Error: TURNSTILE_SECRET_KEY environment variable is missing in Vercel.');
        return res.status(500).json({ success: false, error: 'Server misconfiguration' });
    }

    try {
        // 4. Cloudflare ki API par request bhejna
        const formData = new URLSearchParams();
        formData.append('secret', SECRET_KEY);
        formData.append('response', token);

        const cfResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const data = await cfResponse.json();

        // 5. Result wapis Frontend ko bhejna
        if (data.success) {
            return res.status(200).json({ success: true, message: 'Verified' });
        } else {
            return res.status(400).json({ success: false, error: 'Verification failed', details: data['error-codes'] });
        }
    } catch (error) {
        console.error('Cloudflare Verification Error:', error);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}
