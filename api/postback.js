// api/postback.js
// Vercel-style serverless function (Node 18+ assumed)

const GITHUB_API = 'https://api.github.com';

export default async function handler(req, res) {
  // Accept GET or POST
  const params = req.method === 'GET' ? req.query : req.body;
  const {
    secret,
    user_id,
    amount,
    transaction_id, // Kept for logging, but not for duplicate checks
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

  // --- Validation ---
  if (secret !== POSTBACK_SECRET) return res.status(403).send('Forbidden');
  if (!user_id || status !== '1') return res.status(400).send('Bad Request: Missing user_id or status is not "1"');

  try {
    // --- 1) GET the current rewards file from GitHub ---
    const getUrl = `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`;
    let getResp = await fetch(getUrl, {
      headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': 'postback-balance-updater' }
    });

    let sha = null;
    let userData = {};

    if (getResp.status === 200) {
      const payload = await getResp.json();
      sha = payload.sha;
      const content = payload.content ? Buffer.from(payload.content, 'base64').toString() : '{}';
      try {
        // Ensure that if content is "null" or invalid, we default to an empty object
        userData = JSON.parse(content) || {};
        if (typeof userData !== 'object' || userData === null) {
            userData = {}; // Sanity check if the file contains a non-object (e.g. just "null")
        }
      } catch (e) {
        userData = {}; // If JSON is malformed, start fresh
      }
    } else if (getResp.status !== 404) {
      const errorText = await getResp.text();
      console.error('GitHub GET error:', errorText);
      return res.status(500).send('GitHub GET error');
    }
    // If status is 404, we just continue with the empty userData object.

    const userRecord = userData[user_id];
    const newAmount = Number(amount || 0);

    // --- 2) Update or create the user record ---
    // The duplicate transaction check has been removed as requested.

    if (userRecord) {
      // Bug Fix: If userRecord.balance is null, undefined, or missing, treat it as 0 before adding.
      userRecord.balance = (userRecord.balance || 0) + newAmount;
      userRecord.last_updated = new Date().toISOString();
    } else {
      // User is new, create a new record for them.
      userData[user_id] = {
        balance: newAmount,
        last_updated: new Date().toISOString()
      };
    }

    // --- 3) Prepare and PUT the updated file back to GitHub ---
    const newContent = Buffer.from(JSON.stringify(userData, null, 2)).toString('base64');
    const putUrl = `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    const putBody = {
      // Updated commit message for clarity
      message: `Update balance for user ${user_id} via tx ${transaction_id || 'N/A'}`,
      content: newContent,
      branch: BRANCH
    };
    if (sha) {
        putBody.sha = sha;
    }

    const putResp = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'User-Agent': 'postback-balance-updater',
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
    console.error('Server error:', err);
    res.status(500).send('Server error');
  }
}
