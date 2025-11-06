/**
 * Test DOI analysis with real paper
 */

import 'dotenv/config';
import { analyzePaper } from '../lib/analyzer';

async function testDOI() {
  console.log('🧪 Testing PredCheck with Real DOI\n');
  
  // Test with a Nature paper (should be clean)
  const testDOI = '10.1038/s41586-020-2649-2';
  
  console.log(`Test DOI: ${testDOI}`);
  console.log('Paper: "Structure of the SARS-CoV-2 spike receptor-binding domain..."');
  console.log('Journal: Nature (legitimate)\n');
  
  const result = await analyzePaper(testDOI);
  
  if (result) {
    console.log('\n📊 Analysis Results:');
    console.log(`   Analysis ID: ${result.analysisId}`);
    console.log(`   Total References: ${result.totalReferences}`);
    console.log(`   High Risk Count: ${result.highRiskCount}`);
    console.log(`   Database: Saved to Supabase ✅`);
  } else {
    console.log('\n❌ Analysis failed');
  }
}

testDOI().catch(console.error).finally(() => process.exit(0));
