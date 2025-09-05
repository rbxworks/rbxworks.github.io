// pages/dashboard.js
import { kv } from '@vercel/kv';
import styles from '../styles/Dashboard.module.css'; // Optional: for styling

// This function runs on the server before the page loads
export async function getServerSideProps() {
  // 1. Get all keys that start with "data:"
  const keys = await kv.keys('data:*');
  
  // 2. If there are keys, fetch the data for all of them
  const conversions = keys.length ? await kv.mget(...keys) : [];

  // 3. Send the data to the page
  return {
    props: {
      conversions,
    },
  };
}

// This is the component that renders your page
export default function Dashboard({ conversions }) {
  return (
    <div className={styles.container}>
      <h1>🚀 Live Data from Vercel KV</h1>
      {conversions.length === 0 ? (
        <p>No data has been saved yet.</p>
      ) : (
        <ul className={styles.list}>
          {conversions.map((conv, index) => (
            <li key={index} className={styles.listItem}>
              <strong>User:</strong> {conv.user || 'N/A'} <br />
              <strong>Value:</strong> {conv.value || 'N/A'} <br />
              <strong>Received:</strong> {new Date(conv.receivedAt).toLocaleString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}