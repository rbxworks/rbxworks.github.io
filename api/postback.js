// api/postback.js
// Vercel-style serverless function (Node 18+ assumed)

const GITHUB_API = 'https://api.github.com';

export default async function handler(req, res) {
  const params = req.method === 'GET' ? req.query : req.body;
  const { secret, user_id, amount, transaction_id, status } = params;

  const {
    GITHUB_TOKEN,
    REPO_OWNER,
    REPO_NAME,
    FILE_PATH = 'data/rewards.json',
    BRANCH = 'main',
    POSTBACK_SECRET
  } = process.env;

  // Validate request
  if (secret !== POSTBACK_SECRET) return res.status(403).send('Forbidden');
  if (!user_id || status !== '1') return res.status(400).send('Bad Request');

  try {
    // 1) GET the existing file from GitHub
    const getUrl = `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`;
    const getResp = await fetch(getUrl, {
      headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': 'revtooo-postback' }
    });

    let sha = null;
    let records = [];

    if (getResp.status === 200) {
      const payload = await getResp.json();
      sha = payload.sha;
      const content = Buffer.from(payload.content, 'base64').toString();
      try {
        records = JSON.parse(content) || [];
        if (!Array.isArray(records)) records = [];
      } catch {
        records = [];
      }
    } else if (getResp.status !== 404) {
      const errText = await getResp.text();
      console.error('GitHub GET error:', errText);
      return res.status(500).send('GitHub GET error');
    }

    // 2) Add new transaction (always)
    records.push({
      user_id: String(user_id),
      amount: Number(amount || 0),
      transaction_id: String(transaction_id || Date.now()),
      status,
      time: new Date().toISOString()
    });

    // 3) PUT updated file back to GitHub
    const newContent = Buffer.from(JSON.stringify(records, null, 2)).toString('base64');
    const putUrl = `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    const putBody = {
      message: `Log new reward for user ${user_id} (${amount})`,
      content: newContent,
      branch: BRANCH
    };
    if (sha) putBody.sha = sha;

    const putResp = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'User-Agent': 'revtooo-postback',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(putBody)
    });

    if (!putResp.ok) {
      const err = await putResp.text();
      console.error('GitHub PUT error:', err);
      return res.status(500).send('GitHub PUT error');
    }

    return res.status(200).send('OK - logged new entry');
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).send('Server error');
  }
}
