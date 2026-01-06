const API_URL = "http://localhost:3000/api/seo/scan";
const SECRET = "YOUR_SECRET_HERE"; // Match .env

async function pushData() {
  const payload = {
    clientName: "TnT Infrastructure",
    domain: "tnt-infra.co.za",
    healthScore: Math.floor(Math.random() * (100 - 80) + 80), // Random 80-100
    organicTraffic: Math.floor(Math.random() * 500),
    rankings: [{ keyword: "Cabling", position: 3 }]
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "x-anynet-secret": SECRET 
    },
    body: JSON.stringify(payload)
  });

  const json = await res.json();
  console.log("Scan Saved:", json);
}

pushData();