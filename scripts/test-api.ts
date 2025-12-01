/**
 * Test script to verify Cricket API connection
 * Run with: npx tsx scripts/test-api.ts
 */

import 'dotenv/config';

const API_KEY = process.env.CRICKET_API_KEY;
const BASE_URL = process.env.CRICKET_API_BASE_URL || 'https://api.cricapi.com/v1';

async function testApi() {
  console.log('🏏 Testing Cricket API Connection...\n');

  if (!API_KEY) {
    console.error('❌ CRICKET_API_KEY not found in .env file');
    process.exit(1);
  }

  console.log(`API Key: ${API_KEY.substring(0, 8)}...`);
  console.log(`Base URL: ${BASE_URL}\n`);

  // Test 1: Get current matches
  console.log('📡 Fetching current matches...');
  try {
    const response = await fetch(`${BASE_URL}/currentMatches?apikey=${API_KEY}&offset=0`);
    const data = await response.json();

    if (data.status === 'failure') {
      console.error('❌ API Error:', data.reason);
      return;
    }

    console.log(`✅ Found ${data.data?.length || 0} current matches\n`);

    // Show sample match
    if (data.data && data.data.length > 0) {
      const match = data.data[0];
      console.log('📋 Sample Match:');
      console.log(`   Name: ${match.name}`);
      console.log(`   Status: ${match.status}`);
      console.log(`   Teams: ${match.teams?.join(' vs ')}`);
      console.log(`   Date: ${match.date}`);
      if (match.score && match.score.length > 0) {
        console.log(`   Score: ${match.score[0]?.r}/${match.score[0]?.w} (${match.score[0]?.o} overs)`);
      }
    }
  } catch (error) {
    console.error('❌ Failed to fetch matches:', error);
  }

  // Test 2: Get upcoming matches
  console.log('\n📡 Fetching upcoming matches...');
  try {
    const response = await fetch(`${BASE_URL}/matches?apikey=${API_KEY}&offset=0`);
    const data = await response.json();

    if (data.status === 'success') {
      const upcoming = data.data?.filter((m: any) => !m.matchStarted) || [];
      console.log(`✅ Found ${upcoming.length} upcoming matches`);
    }
  } catch (error) {
    console.error('❌ Failed to fetch upcoming matches:', error);
  }

  // Test 3: Check API credits
  console.log('\n📊 API Info:');
  console.log('   Free tier: 100 requests/day');
  console.log('   Rate limit: Check your dashboard at cricketdata.org');

  console.log('\n✅ API connection test complete!');
}

testApi();

