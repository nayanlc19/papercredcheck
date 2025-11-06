/**
 * Populate predatory data using Supabase JS client
 * Uses anon key from .env (no password needed)
 */

require('dotenv').config();
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GitHub raw URLs
const URLS = {
  publishers: 'https://raw.githubusercontent.com/stop-predatory-journals/stop-predatory-journals.github.io/master/_data/publishers.csv',
  journals: 'https://raw.githubusercontent.com/stop-predatory-journals/stop-predatory-journals.github.io/master/_data/journals.csv',
  hijacked: 'https://raw.githubusercontent.com/stop-predatory-journals/stop-predatory-journals.github.io/master/_data/hijacked.csv',
  metrics: 'https://raw.githubusercontent.com/stop-predatory-journals/stop-predatory-journals.github.io/master/_data/metrics.csv'
};

/**
 * Fetch CSV from URL
 */
function fetchCSV(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Parse CSV to array of objects
 */
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = values[i] || null;
    });
    return obj;
  }).filter(obj => Object.values(obj).some(v => v));
}

/**
 * Insert publishers in batches
 */
async function insertPublishers(data) {
  console.log(`\nInserting ${data.length} publishers...`);
  const batchSize = 100;
  let inserted = 0;
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize).map(row => ({
      name: row.name,
      website: row.url || null,
      source: 'stop-predatory-journals',
      country: null,
      notes: row.abbr || null
    }));
    
    const { error, count } = await supabase
      .from('PredatoryPublisher')
      .insert(batch)
      .select('*', { count: 'exact', head: true });
    
    if (error && !error.message.includes('duplicate')) {
      console.error(`Batch ${i}-${i+batchSize} error:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`  ${inserted}/${data.length}`);
    }
  }
  console.log(`✅ Inserted ${inserted} publishers`);
  return inserted;
}

/**
 * Insert journals in batches
 */
async function insertJournals(data) {
  console.log(`\nInserting ${data.length} journals...`);
  const batchSize = 100;
  let inserted = 0;
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize).map(row => ({
      title: row.name,
      issn: null,
      publisher: null,
      source: 'stop-predatory-journals'
    }));
    
    const { error } = await supabase
      .from('PredatoryJournal')
      .insert(batch);
    
    if (error && !error.message.includes('duplicate')) {
      console.error(`Batch ${i}-${i+batchSize} error:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`  ${inserted}/${data.length}`);
    }
  }
  console.log(`✅ Inserted ${inserted} journals`);
  return inserted;
}

/**
 * Insert hijacked journals
 */
async function insertHijacked(data) {
  console.log(`\nInserting ${data.length} hijacked journals...`);
  const batchSize = 50;
  let inserted = 0;
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)
      .filter(row => row.authentic && (row.hijackedurl || row.althijackedurl))
      .map(row => ({
        legitimateTitle: row.authentic,
        legitimateIssn: null,
        fakeWebsite: row.hijackedurl || row.althijackedurl || '',
        notes: row.hijacked || null
      }));
    
    if (batch.length === 0) continue;
    
    const { error } = await supabase
      .from('HijackedJournal')
      .insert(batch);
    
    if (error && !error.message.includes('duplicate')) {
      console.error(`Batch ${i}-${i+batchSize} error:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`  ${inserted} inserted`);
    }
  }
  console.log(`✅ Inserted ${inserted} hijacked journals`);
  return inserted;
}

/**
 * Insert fake metrics
 */
async function insertMetrics(data) {
  console.log(`\nInserting ${data.length} fake metrics...`);
  const batchSize = 50;
  let inserted = 0;
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize).map(row => ({
      name: row.name,
      website: row.url || null
    }));
    
    const { error } = await supabase
      .from('FakeMetric')
      .insert(batch);
    
    if (error && !error.message.includes('duplicate')) {
      console.error(`Batch ${i}-${i+batchSize} error:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`  ${inserted}/${data.length}`);
    }
  }
  console.log(`✅ Inserted ${inserted} fake metrics`);
  return inserted;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting predatory data population...\n');
  const startTime = Date.now();
  
  try {
    // 1. Publishers
    console.log('📥 Fetching publishers CSV...');
    const publishersCSV = await fetchCSV(URLS.publishers);
    const publishers = parseCSV(publishersCSV);
    const publishersCount = await insertPublishers(publishers);
    
    // 2. Journals
    console.log('\n📥 Fetching journals CSV...');
    const journalsCSV = await fetchCSV(URLS.journals);
    const journals = parseCSV(journalsCSV);
    const journalsCount = await insertJournals(journals);
    
    // 3. Hijacked
    console.log('\n📥 Fetching hijacked CSV...');
    const hijackedCSV = await fetchCSV(URLS.hijacked);
    const hijacked = parseCSV(hijackedCSV);
    const hijackedCount = await insertHijacked(hijacked);
    
    // 4. Fake Metrics
    console.log('\n📥 Fetching metrics CSV...');
    const metricsCSV = await fetchCSV(URLS.metrics);
    const metrics = parseCSV(metricsCSV);
    const metricsCount = await insertMetrics(metrics);
    
    // Update cache
    const { error: cacheError } = await supabase
      .from('DataSourceCache')
      .upsert({
        sourceName: 'stop-predatory-journals',
        recordCount: publishersCount + journalsCount + hijackedCount + metricsCount,
        lastFetched: new Date().toISOString()
      }, {
        onConflict: 'sourceName'
      });
    
    if (cacheError) console.warn('Cache update error:', cacheError.message);
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ COMPLETE! ${elapsed}s`);
    console.log(`   Publishers: ${publishersCount}`);
    console.log(`   Journals: ${journalsCount}`);
    console.log(`   Hijacked: ${hijackedCount}`);
    console.log(`   Fake Metrics: ${metricsCount}`);
    console.log(`   TOTAL: ${publishersCount + journalsCount + hijackedCount + metricsCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
