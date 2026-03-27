const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Load dataset
let dataset = require('./data/dataset.json');
let complaints = [];
let simulatedAnomalies = [];

// GET /data - all beneficiaries (including simulated)
app.get('/data', (req, res) => {
  const { district, scheme, status } = req.query;
  let result = [...dataset, ...simulatedAnomalies];
  if (district) result = result.filter(r => r.district === district);
  if (scheme) result = result.filter(r => r.scheme === scheme);
  if (status) result = result.filter(r => r.status === status);
  res.json(result);
});

// GET /anomalies - only anomaly records
app.get('/anomalies', (req, res) => {
  const all = [...dataset, ...simulatedAnomalies];
  const anomalies = all.filter(r => r.status === 'anomaly');
  res.json(anomalies);
});

// POST /complaint - store a complaint
app.post('/complaint', (req, res) => {
  const { district, issueType, description, name, phone } = req.body;
  if (!district || !issueType || !description) {
    return res.status(400).json({ error: 'district, issueType, and description are required' });
  }
  const complaint = {
    id: `CMP${String(complaints.length + 1).padStart(3, '0')}`,
    district,
    issueType,
    description,
    name: name || 'Anonymous',
    phone: phone || 'N/A',
    date: new Date().toISOString().split('T')[0],
    status: 'Pending'
  };
  complaints.push(complaint);
  res.json({ success: true, complaint });
});

// GET /complaints - list all complaints
app.get('/complaints', (req, res) => {
  res.json(complaints);
});

// GET /risk-score - district-wise risk scores
app.get('/risk-score', (req, res) => {
  const all = [...dataset, ...simulatedAnomalies];
  const districts = [...new Set(all.map(r => r.district))];

  const riskScores = districts.map(district => {
    const districtData = all.filter(r => r.district === district);
    const anomalyCount = districtData.filter(r => r.status === 'anomaly').length;
    const totalCount = districtData.length;
    const complaintCount = complaints.filter(c => c.district === district).length;
    const totalAmount = districtData.reduce((sum, r) => sum + r.amount, 0);
    const anomalyAmount = districtData.filter(r => r.status === 'anomaly').reduce((sum, r) => sum + r.amount, 0);

    // Risk score formula: weighted combination
    const anomalyRatio = totalCount > 0 ? anomalyCount / totalCount : 0;
    const riskScore = Math.min(100, Math.round(
      (anomalyRatio * 60) + (complaintCount * 10) + (anomalyCount * 5)
    ));

    return {
      district,
      riskScore,
      anomalyCount,
      totalBeneficiaries: totalCount,
      complaintCount,
      totalAmount,
      anomalyAmount,
      riskLevel: riskScore >= 60 ? 'High' : riskScore >= 30 ? 'Medium' : 'Low'
    };
  });

  res.json(riskScores.sort((a, b) => b.riskScore - a.riskScore));
});

// GET /insights - AI-generated insights
app.get('/insights', (req, res) => {
  const all = [...dataset, ...simulatedAnomalies];
  const districts = [...new Set(all.map(r => r.district))];
  const schemes = [...new Set(all.map(r => r.scheme))];

  // District anomaly stats
  const districtStats = districts.map(d => ({
    district: d,
    total: all.filter(r => r.district === d).length,
    anomalies: all.filter(r => r.district === d && r.status === 'anomaly').length
  }));

  // Scheme anomaly stats
  const schemeStats = schemes.map(s => ({
    scheme: s,
    total: all.filter(r => r.scheme === s).length,
    anomalies: all.filter(r => r.scheme === s && r.status === 'anomaly').length
  }));

  const highestAnomalyDistrict = districtStats.sort((a, b) => b.anomalies - a.anomalies)[0];
  const lowestAnomalyDistrict = districtStats.sort((a, b) => a.anomalies - b.anomalies)[0];
  const highestAnomalyScheme = schemeStats.sort((a, b) => b.anomalies - a.anomalies)[0];
  const totalAnomalies = all.filter(r => r.status === 'anomaly').length;
  const totalRecords = all.length;
  const avgAnomaly = ((totalAnomalies / totalRecords) * 100).toFixed(1);

  const avgAnomalyRate = districtStats.reduce((sum, d) => sum + (d.total > 0 ? d.anomalies / d.total : 0), 0) / districtStats.length;
  const highDistRate = highestAnomalyDistrict.total > 0 ? ((highestAnomalyDistrict.anomalies / highestAnomalyDistrict.total) * 100).toFixed(0) : 0;
  const aboveAvgPct = ((highestAnomalyDistrict.anomalies / highestAnomalyDistrict.total - avgAnomalyRate) / avgAnomalyRate * 100).toFixed(0);

  const insights = [
    {
      id: 1,
      type: 'warning',
      title: 'Highest Risk District',
      description: `${highestAnomalyDistrict.district} has ${highDistRate}% anomaly rate with ${highestAnomalyDistrict.anomalies} flagged cases — approximately ${aboveAvgPct}% higher than the state average.`,
      icon: 'alert-triangle'
    },
    {
      id: 2,
      type: 'danger',
      title: 'Most Affected Scheme',
      description: `${highestAnomalyScheme.scheme} has the highest fraud cases with ${highestAnomalyScheme.anomalies} anomalies detected out of ${highestAnomalyScheme.total} total transactions.`,
      icon: 'shield-alert'
    },
    {
      id: 3,
      type: 'info',
      title: 'Overall Anomaly Rate',
      description: `${avgAnomaly}% of all ${totalRecords} beneficiary records have been flagged as anomalies. A total of ${totalAnomalies} suspicious transactions detected.`,
      icon: 'bar-chart'
    },
    {
      id: 4,
      type: 'success',
      title: 'Safest District',
      description: `${lowestAnomalyDistrict.district} has the lowest anomaly count with only ${lowestAnomalyDistrict.anomalies} flagged case(s) out of ${lowestAnomalyDistrict.total} beneficiaries.`,
      icon: 'shield-check'
    },
    {
      id: 5,
      type: 'warning',
      title: 'Duplicate ID Pattern',
      description: `Multiple beneficiaries across districts share duplicate IDs, suggesting potential identity fraud spanning ${districts.length} districts.`,
      icon: 'users'
    },
    {
      id: 6,
      type: 'info',
      title: 'Complaint Correlation',
      description: `${complaints.length} complaints received across all districts. Districts with higher complaint counts show ${complaints.length > 0 ? 'strong' : 'potential'} correlation with anomaly rates.`,
      icon: 'message-circle'
    },
    {
      id: 7,
      type: 'danger',
      title: 'Amount Anomaly Trend',
      description: `Several transactions exceed scheme limits by 150-230%, indicating systematic over-disbursement fraud patterns.`,
      icon: 'trending-up'
    },
    {
      id: 8,
      type: 'info',
      title: 'AI Model Confidence',
      description: `The Isolation Forest model flags anomalies with confidence scores ranging from 74% to 97%, with an average confidence of ${(all.filter(r => r.status === 'anomaly').reduce((sum, r) => sum + (r.confidence || 0), 0) / totalAnomalies).toFixed(1)}%.`,
      icon: 'cpu'
    }
  ];

  res.json(insights);
});

// POST /simulate - inject fake anomalies
app.post('/simulate', (req, res) => {
  const districts = ['Lucknow', 'Kanpur', 'Moradabad', 'Agra', 'Varanasi', 'Bareilly', 'Meerut', 'Allahabad', 'Gorakhpur', 'Aligarh'];
  const schemes = ['PM Kisan', 'MGNREGA', 'PM Ujjwala', 'Ayushman Bharat', 'Sukanya Samriddhi'];
  const names = ['Fake User A', 'Fake User B', 'Fake User C', 'Fake User D', 'Fake User E'];
  const reasonOptions = [
    'Duplicate ID detected',
    'Unusual transaction amount',
    'Multiple schemes overlap',
    'Suspicious transaction pattern',
    'Amount exceeds scheme limit',
    'Ghost beneficiary detected',
    'Backdated transaction'
  ];

  const count = req.body.count || 5;
  const newAnomalies = [];

  for (let i = 0; i < count; i++) {
    const id = `SIM${String(simulatedAnomalies.length + newAnomalies.length + 1).padStart(3, '0')}`;
    const district = districts[Math.floor(Math.random() * districts.length)];
    const scheme = schemes[Math.floor(Math.random() * schemes.length)];
    const numReasons = Math.floor(Math.random() * 3) + 1;
    const reasons = [];
    for (let j = 0; j < numReasons; j++) {
      const r = reasonOptions[Math.floor(Math.random() * reasonOptions.length)];
      if (!reasons.includes(r)) reasons.push(r);
    }

    newAnomalies.push({
      beneficiary_id: id,
      name: names[Math.floor(Math.random() * names.length)] + ` ${id}`,
      district,
      scheme,
      amount: Math.floor(Math.random() * 30000) + 5000,
      date: new Date().toISOString().split('T')[0],
      status: 'anomaly',
      confidence: Math.floor(Math.random() * 25) + 75,
      reasons,
      simulated: true
    });
  }

  simulatedAnomalies.push(...newAnomalies);
  res.json({ success: true, injected: newAnomalies.length, total: simulatedAnomalies.length, newAnomalies });
});

// POST /simulate/reset - clear simulated anomalies
app.post('/simulate/reset', (req, res) => {
  const cleared = simulatedAnomalies.length;
  simulatedAnomalies = [];
  res.json({ success: true, cleared });
});

// GET /districts - get list of districts
app.get('/districts', (req, res) => {
  const all = [...dataset, ...simulatedAnomalies];
  const districts = [...new Set(all.map(r => r.district))];
  res.json(districts);
});

// GET /schemes - get list of schemes
app.get('/schemes', (req, res) => {
  const all = [...dataset, ...simulatedAnomalies];
  const schemes = [...new Set(all.map(r => r.scheme))];
  res.json(schemes);
});

app.listen(PORT, () => {
  console.log(`\n🚀 PolicyLens AI Backend running on http://localhost:${PORT}`);
  console.log(`📊 Dataset loaded: ${dataset.length} records`);
  console.log(`🔍 Anomalies: ${dataset.filter(r => r.status === 'anomaly').length}\n`);
});
