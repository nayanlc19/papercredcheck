/**
 * Test the predatory journal scoring system
 */

import 'dotenv/config';
import { scoreJournal, getRiskLevel } from '../lib/scorer';

async function testScorer() {
  console.log('🧪 Testing Predatory Journal Scorer\n');
  
  // Test cases: known predatory and legitimate journals
  const testCases = [
    {
      name: 'Academic Journals',
      publisher: 'Academic Journals',
      issn: null,
      expected: 'Should score HIGH (known predatory publisher)'
    },
    {
      name: 'International Journal of Advanced Research',
      publisher: 'International Research Journals',
      issn: null,
      expected: 'Should score HIGH (predatory publisher + journal pattern)'
    },
    {
      name: 'Nature',
      publisher: 'Springer Nature',
      issn: '0028-0836',
      expected: 'Should score MINIMAL (legitimate journal)'
    },
    {
      name: 'Science',
      publisher: 'American Association for the Advancement of Science',
      issn: '0036-8075',
      expected: 'Should score MINIMAL (legitimate journal)'
    },
    {
      name: 'Advances in Science',
      publisher: 'Advancements in Science',
      issn: null,
      expected: 'Should score MODERATE-HIGH (name pattern match)'
    }
  ];
  
  for (const test of testCases) {
    console.log(`\n📋 Testing: ${test.name}`);
    console.log(`   Publisher: ${test.publisher}`);
    console.log(`   Expected: ${test.expected}\n`);
    
    const result = await scoreJournal(test.name, test.issn, test.publisher);
    const risk = getRiskLevel(result.predatoryScore);
    
    console.log(`   ⚠️  SCORE: ${result.predatoryScore}/100`);
    console.log(`   🎯 RISK: ${risk.label}`);
    console.log(`   🔍 Confidence: ${result.matchConfidence}%`);
    console.log(`   📊 Sources: ${result.evidenceSources.join(', ') || 'none'}`);
    
    if (result.details.length > 0) {
      console.log(`   📝 Evidence:`);
      result.details.forEach(d => console.log(`      - ${d}`));
    }
    
    console.log(`   ${'='.repeat(80)}`);
  }
  
  console.log('\n✅ Testing complete!\n');
}

testScorer().catch(console.error).finally(() => process.exit(0));
