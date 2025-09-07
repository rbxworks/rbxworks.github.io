// --- ⬇️ PASTE YOUR GOOGLE APPS SCRIPT URL HERE (SAME ONE AS BEFORE)! ⬇️ ---
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwoGE8x9rUvFljzvgliYaX-lwWPpraaDbm2B2AIxMsLyWwZAXM-MYazEDoyZdfXs6PLBg/exec";

// This is an async function that handles displaying the data.
export default async function handler(request, response) {
  let tableRows = '<tr><td colspan="5">Could not load data. Check Vercel logs.</td></tr>';
  let error_message = '';

  try {
    // Fetch data from our Google Apps Script using a GET request.
    const res = await fetch(APPS_SCRIPT_URL);
    if (!res.ok) {
      throw new Error(`Google Script returned an error: ${res.statusText}`);
    }
    const result = await res.json();
    
    // Check the response from our script
    if (result.status === 'success' && result.data) {
      // Reverse the array to show the newest entries first
      const reversedData = result.data.reverse();
      // Build the HTML table rows from the data
      tableRows = reversedData.map(row => `
        <tr>
          <td>${new Date(row[0]).toLocaleString()}</td>
          <td>${row[1]}</td>
          <td>${row[2]}</td>
          <td>${row[3]}</td>
          <td>${row[4]}</td>
        </tr>
      `).join('');
    } else {
      tableRows = `<tr><td colspan="5">Error: ${result.message || 'No data found.'}</td></tr>`;
    }

  } catch (error) {
    console.error("Error fetching data from Google Script:", error);
    error_message = `<p style="color: red;">Failed to load data: ${error.message}</p>`;
  }
  
  // The full HTML page to display the table.
  const htmlPage = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="refresh" content="30">
      <title>Postback Data</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f8f9fa; color: #212529; margin: 0; padding: 2rem; }
        .container { max-width: 1200px; margin: auto; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
        header { padding: 1.5rem; background-color: #007bff; color: white; }
        h1 { margin: 0; font-size: 1.5rem; }
        p { margin: 0.25rem 0 0; opacity: 0.9; }
        .table-container { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #dee2e6; }
        th { background-color: #f1f3f5; }
        tr:nth-child(even) { background-color: #f8f9fa; }
        tr:hover { background-color: #e9ecef; }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>Postback Conversion Log</h1>
          <p>This page automatically refreshes every 30 seconds.</p>
        </header>
        ${error_message}
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Click ID</th>
                <th>Payout</th>
                <th>Transaction ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      </div>
    </body>
    </html>
  `;

  response.setHeader('Content-Type', 'text/html');
  response.status(200).send(htmlPage);
}
