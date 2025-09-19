// api/getRewards.js
const GITHUB_API = 'https://api.github.com';

export default async function handler(req, res) {
  const user_id = req.query.user_id;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  const {
    GITHUB_TOKEN,
    REPO_OWNER,
    REPO_NAME,
    FILE_PATH = 'data/rewards.json',
    BRANCH = 'main'
  } = process.env;

  try {
    const getUrl = `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`;
    const getResp = await fetch(getUrl, {
      headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': 'revtooo-postback' }
    });

    if (!getResp.ok) {
      if (getResp.status === 404) return res.status(200).json([]); // empty
      const t = await getResp.text();
      return res.status(500).json({ error: 'GitHub GET error', details: t });
    }

    const payload = await getResp.json();
    const content = payload.content ? Buffer.from(payload.content, 'base64').toString() : '[]';
    let arr = [];
    try { arr = JSON.parse(content); } catch (e) { arr = []; }

    // return only this user's transactions
    const filtered = arr.filter(r => String(r.user_id) === String(user_id));
    // CORS — allow your site origin here, or use *
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json(filtered);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
