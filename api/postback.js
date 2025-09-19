// api/postback.js
// Vercel-style serverless function (Node 18+ assumed)

const GITHUB_API = 'https://api.github.com';

export default async function handler(req, res) {
  // Accept GET or POST from Revtooo (many networks use GET)
  const params = req.method === 'GET' ? req.query : req.body;
  const {
    secret,           // required to validate the request
    user_id,
    amount,
    transaction_id,
    status
  } = params;

  const {
    GITHUB_TOKEN,
    REPO_OWNER,
    REPO_NAME,
    FILE_PATH = 'data/rewards.json',
    BRANCH = 'main',
    POSTBACK_SECRET
  } = process.env;

  if (secret !== POSTBACK_SECRET) return res.status(403).send('Forbidden');
  if (!user_id || !transaction_id || status !== '1') return res.status(400).send('Bad Request');

  try {
    // 1) GET the file from GitHub
    const getUrl = `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`;
    let getResp = await fetch(getUrl, {
      headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': 'revtooo-postback' }
    });

    let sha = null;
    let current = [];

    if (getResp.status === 200) {
      const payload = await getResp.json();
      sha = payload.sha;
      const content = payload.content ? Buffer.from(payload.content, 'base64').toString() : '[]';
      try { current = JSON.parse(content); } catch (e) { current = []; }
    } else if (getResp.status === 404) {
      current = [];
      sha = null;
    } else {
      const t = await getResp.text();
      console.error('GitHub GET error', t);
      return res.status(500).send('GitHub GET error');
    }

    // 2) avoid dup tx
    if (current.some(r => r.transaction_id == transaction_id)) {
      return res.status(200).send('OK - already recorded');
    }

    // 3) append this transaction
    current.push({
      user_id: String(user_id),
      amount: Number(amount || 0),
      transaction_id: String(transaction_id),
      status,
      time: new Date().toISOString()
    });

    const newContent = Buffer.from(JSON.stringify(current, null, 2)).toString('base64');

    // 4) PUT update file
    const putUrl = `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    const putBody = {
      message: `Add reward ${transaction_id}`,
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
      console.error('GitHub PUT error', err);
      return res.status(500).send('GitHub PUT error');
    }

    return res.status(200).send('OK');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
}
