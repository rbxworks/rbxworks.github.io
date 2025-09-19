// api/postback.js
// Vercel-style serverless function (Node 18+ assumed)

const GITHUB_API = 'https://api.github.com';

export default async function handler(req, res) {
  const params = req.method === 'GET' ? req.query : req.body;
  const { secret, user_id, amount, status } = params;

  const {
    GITHUB_TOKEN,
    REPO_OWNER,
    REPO_NAME,
    FILE_PATH = 'data/rewards.json',
    BRANCH = 'main',
    POSTBACK_SECRET
  } = process.env;

  if (secret !== POSTBACK_SECRET) return res.status(403).send('Forbidden');
  if (!user_id || !amount || status !== '1') return res.status(400).send('Bad Request');

  try {
    // 1) Fetch current file from GitHub
    const getUrl = `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`;
    let getResp = await fetch(getUrl, {
      headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': 'revtooo-postback' }
    });

    let sha = null;
    let balances = {};

    if (getResp.status === 200) {
      const payload = await getResp.json();
      sha = payload.sha;
      const content = payload.content ? Buffer.from(payload.content, 'base64').toString() : '{}';
      try { balances = JSON.parse(content); } catch (e) { balances = {}; }
    } else if (getResp.status === 404) {
      balances = {};
      sha = null;
    } else {
      const t = await getResp.text();
      console.error('GitHub GET error', t);
      return res.status(500).send('GitHub GET error');
    }

    // 2) Update balance
    const uid = String(user_id);
    const amt = Number(amount);
    if (!balances[uid]) balances[uid] = 0;
    balances[uid] += amt;

    // 3) Save back to GitHub
    const newContent = Buffer.from(JSON.stringify(balances, null, 2)).toString('base64');
    const putUrl = `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    const putBody = {
      message: `Update balance for ${uid}`,
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

    return res.status(200).send(`OK - new balance: ${balances[uid]}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
}
