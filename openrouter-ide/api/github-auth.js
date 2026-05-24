const jwt = require('jsonwebtoken');
const { Octokit } = require('@octokit/rest');

const GITHUB_APP_ID = process.env.GITHUB_APP_ID || '123456';
const PRIVATE_KEY_PATH = process.env.PRIVATE_KEY_PATH || 'F:\\App Builder\\ai-custom-app-builder.2026-05-23.private-key (23).pem';
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '518218b6f1ba4f1771f732206a98045accc05956';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { code, action, installation_id, user_data } = req.body;

    if (action === 'get_token' && code) {
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          client_id: GITHUB_APP_ID,
          client_secret: CLIENT_SECRET,
          code
        })
      });

      const tokenData = await tokenResponse.json();
      return res.json(tokenData);
    }

    if (action === 'get_installation_token' && installation_id) {
      const privateKey = require('fs').readFileSync(PRIVATE_KEY_PATH, 'utf8');
      const now = Math.floor(Date.now() / 1000);
      
      const payload = {
        iat: now - 60,
        exp: now + 600,
        iss: GITHUB_APP_ID
      };

      const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });

      const installationTokenResponse = await fetch(
        `https://api.github.com/app/installations/${installation_id}/access_tokens`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      const installationTokenData = await installationTokenResponse.json();
      return res.json(installationTokenData);
    }

    if (action === 'save_data' && user_data) {
      const { token, path, content, message } = user_data;
      
      const octokit = new Octokit({ auth: token });
      
      let sha;
      try {
        const { data: existingFile } = await octokit.repos.getContent({
          owner: 'everythingtt',
          repo: 'App-Builder',
          path
        });
        sha = existingFile.sha;
      } catch (e) {
        // File doesn't exist yet
      }

      await octokit.repos.createOrUpdateFileContents({
        owner: 'everythingtt',
        repo: 'App-Builder',
        path,
        message: message || 'Save IDE state',
        content: Buffer.from(JSON.stringify(content)).toString('base64'),
        sha
      });

      return res.json({ success: true });
    }

    if (action === 'load_data' && user_data) {
      const { token, path } = user_data;
      
      const octokit = new Octokit({ auth: token });
      
      const { data: fileData } = await octokit.repos.getContent({
        owner: 'everythingtt',
        repo: 'App-Builder',
        path
      });

      const content = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf8'));
      return res.json({ success: true, content });
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('GitHub Auth Error:', error);
    res.status(500).json({ error: error.message });
  }
};
