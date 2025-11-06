/**
 * Populate predatory data from Stop Predatory Journals GitHub repo
 * Downloads CSVs and inserts into Supabase
 */

const https = require('https');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GitHub raw URLs
const URLS = {
  publishers: 'https://raw.githubusercontent.com/stop-predatory-journals/stop-predatory-journals.github.io/master/_data/publishers.csv',
  journals: 'https://raw.githubusercontent.com/stop-predatory-journals/stop-predatory-journals.github.io/master/_data/journals.csv',
  hijacked: 'https://raw.githubusercontent.com/stop-predatory-journals/stop-predatory-journals.github.io/master/_data/hijacked.csv',
  metrics: 'https://raw.githubusercontent.com/stop-predatory-journals/stop-predatory-journals.github.io/master/_data/metrics.csv'
};

/**
 * Fetch CSV data from URL
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
 * Parse CSV string to array of objects
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
 * Insert publishers data
 */
async function insertPublishers(data) {
  console.log(`\nInserting ${data.length} publishers...`);
  let inserted = 0;
  
  for (const row of data) {
    try {
      await prisma.predatoryPublisher.create({
        data: {
          name: row.name,
          website: row.url || null,
          source: 'stop-predatory-journals',
          country: null,
          notes: row.abbr || null
        }
      });
      inserted++;
      if (inserted % 100 === 0) console.log(`  ${inserted}/${data.length}`);
    } catch (error) {
      if (!error.message.includes('Unique constraint')) {
        console.error(`Error inserting ${row.name}:`, error.message);
      }
    }
  }
  console.log(`✅ Inserted ${inserted} publishers`);
  return inserted;
}

/**
 * Insert journals data
 */
async function insertJournals(data) {
  console.log(`\nInserting ${data.length} journals...`);
  let inserted = 0;
  
  for (const row of data) {
    try {
      await prisma.predatoryJournal.create({
        data: {
          title: row.name,
          issn: null,
          publisher: null,
          source: 'stop-predatory-journals'
        }
      });
      inserted++;
      if (inserted % 100 === 0) console.log(`  ${inserted}/${data.length}`);
    } catch (error) {
      if (!error.message.includes('Unique constraint')) {
        console.error(`Error inserting ${row.name}:`, error.message);
      }
    }
  }
  console.log(`✅ Inserted ${inserted} journals`);
  return inserted;
}

/**
 * Insert hijacked journals data
 */
async function insertHijacked(data) {
  console.log(`\nInserting ${data.length} hijacked journals...`);
  let inserted = 0;
  
  for (const row of data) {
    try {
      await prisma.hijackedJournal.create({
        data: {
          legitimateTitle: row.authentic,
          legitimateIssn: null,
          fakeWebsite: row.hijackedurl || row.althijackedurl || '',
          notes: row.hijacked || null
        }
      });
      inserted++;
    } catch (error) {
      if (!error.message.includes('Unique constraint')) {
        console.error(`Error inserting hijacked journal:`, error.message);
      }
    }
  }
  console.log(`✅ Inserted ${inserted} hijacked journals`);
  return inserted;
}

/**
 * Insert fake metrics data
 */
async function insertMetrics(data) {
  console.log(`\nInserting ${data.length} fake metrics...`);
  let inserted = 0;
  
  for (const row of data) {
    try {
      await prisma.fakeMetric.create({
        data: {
          name: row.name,
          website: row.url || null
        }
      });
      inserted++;
    } catch (error) {
      if (!error.message.includes('Unique constraint')) {
        console.error(`Error inserting ${row.name}:`, error.message);
      }
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
    await prisma.dataSourceCache.upsert({
      where: { sourceName: 'stop-predatory-journals' },
      update: {
        recordCount: publishersCount + journalsCount + hijackedCount + metricsCount,
        lastFetched: new Date()
      },
      create: {
        sourceName: 'stop-predatory-journals',
        recordCount: publishersCount + journalsCount + hijackedCount + metricsCount,
        lastFetched: new Date()
      }
    });
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ COMPLETE! ${elapsed}s`);
    console.log(`   Publishers: ${publishersCount}`);
    console.log(`   Journals: ${journalsCount}`);
    console.log(`   Hijacked: ${hijackedCount}`);
    console.log(`   Fake Metrics: ${metricsCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
