// pages/dashboard.js (Example for Next.js Pages Router)
import { kv } from '@vercel/kv';

// This function runs on the server before the page is sent to the browser.
export async function getServerSideProps() {
  // 1. Get all keys that start with "conversion:"
  const keys = await kv.keys('conversion:*');
  
  // 2. Fetch all the data for those keys
  // If there are no keys, mget returns null, so we default to an empty array
  const conversions = keys.length ? await kv.mget(...keys) : [];

  // 3. Send the data to the page component as a "prop"
  return {
    props: {
      conversions,
    },
  };
}

// This is the React component that renders your page.
export default function Dashboard({ conversions }) {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>Conversion Dashboard 📊</h1>
      {conversions.length === 0 ? (
        <p>No conversions received yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Transaction ID</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Click ID</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Payout</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Received At</th>
            </tr>
          </thead>
          <tbody>
            {conversions.map((conv, index) => (
              <tr key={index}>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{conv.txid || 'N/A'}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{conv.click_id}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{conv.payout}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{conv.status}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{new Date(conv.receivedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
