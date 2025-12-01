/**
 * Database Seed Script
 * 
 * Seeds the database with:
 * - All international cricket teams
 * - Major competitions
 * - Recent real match results
 * - Demo user
 * 
 * Run with: npm run db:seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// All international cricket teams (ICC Full Members + Associate Members)
const internationalTeams = [
  // ICC Full Members
  { externalId: 'team_ind', name: 'India', shortName: 'IND', country: 'India', isNational: true },
  { externalId: 'team_aus', name: 'Australia', shortName: 'AUS', country: 'Australia', isNational: true },
  { externalId: 'team_eng', name: 'England', shortName: 'ENG', country: 'England', isNational: true },
  { externalId: 'team_pak', name: 'Pakistan', shortName: 'PAK', country: 'Pakistan', isNational: true },
  { externalId: 'team_nz', name: 'New Zealand', shortName: 'NZ', country: 'New Zealand', isNational: true },
  { externalId: 'team_sa', name: 'South Africa', shortName: 'SA', country: 'South Africa', isNational: true },
  { externalId: 'team_sl', name: 'Sri Lanka', shortName: 'SL', country: 'Sri Lanka', isNational: true },
  { externalId: 'team_wi', name: 'West Indies', shortName: 'WI', country: 'West Indies', isNational: true },
  { externalId: 'team_ban', name: 'Bangladesh', shortName: 'BAN', country: 'Bangladesh', isNational: true },
  { externalId: 'team_afg', name: 'Afghanistan', shortName: 'AFG', country: 'Afghanistan', isNational: true },
  { externalId: 'team_ire', name: 'Ireland', shortName: 'IRE', country: 'Ireland', isNational: true },
  { externalId: 'team_zim', name: 'Zimbabwe', shortName: 'ZIM', country: 'Zimbabwe', isNational: true },
  
  // ICC Associate Members (Top Teams)
  { externalId: 'team_ned', name: 'Netherlands', shortName: 'NED', country: 'Netherlands', isNational: true },
  { externalId: 'team_sco', name: 'Scotland', shortName: 'SCO', country: 'Scotland', isNational: true },
  { externalId: 'team_uae', name: 'UAE', shortName: 'UAE', country: 'United Arab Emirates', isNational: true },
  { externalId: 'team_usa', name: 'USA', shortName: 'USA', country: 'United States', isNational: true },
  { externalId: 'team_nep', name: 'Nepal', shortName: 'NEP', country: 'Nepal', isNational: true },
  { externalId: 'team_oman', name: 'Oman', shortName: 'OMN', country: 'Oman', isNational: true },
  { externalId: 'team_nam', name: 'Namibia', shortName: 'NAM', country: 'Namibia', isNational: true },
  { externalId: 'team_can', name: 'Canada', shortName: 'CAN', country: 'Canada', isNational: true },
  { externalId: 'team_png', name: 'Papua New Guinea', shortName: 'PNG', country: 'Papua New Guinea', isNational: true },
  { externalId: 'team_hk', name: 'Hong Kong', shortName: 'HK', country: 'Hong Kong', isNational: true },
];

// Major IPL Teams
const iplTeams = [
  { externalId: 'team_csk', name: 'Chennai Super Kings', shortName: 'CSK', country: 'India', isNational: false },
  { externalId: 'team_mi', name: 'Mumbai Indians', shortName: 'MI', country: 'India', isNational: false },
  { externalId: 'team_rcb', name: 'Royal Challengers Bangalore', shortName: 'RCB', country: 'India', isNational: false },
  { externalId: 'team_kkr', name: 'Kolkata Knight Riders', shortName: 'KKR', country: 'India', isNational: false },
  { externalId: 'team_dc', name: 'Delhi Capitals', shortName: 'DC', country: 'India', isNational: false },
  { externalId: 'team_pbks', name: 'Punjab Kings', shortName: 'PBKS', country: 'India', isNational: false },
  { externalId: 'team_rr', name: 'Rajasthan Royals', shortName: 'RR', country: 'India', isNational: false },
  { externalId: 'team_srh', name: 'Sunrisers Hyderabad', shortName: 'SRH', country: 'India', isNational: false },
  { externalId: 'team_gt', name: 'Gujarat Titans', shortName: 'GT', country: 'India', isNational: false },
  { externalId: 'team_lsg', name: 'Lucknow Super Giants', shortName: 'LSG', country: 'India', isNational: false },
];

// Major Competitions
const competitions = [
  { externalId: 'comp_wc_odi', name: 'ICC Cricket World Cup', shortName: 'CWC', type: 'INTERNATIONAL' as const },
  { externalId: 'comp_wc_t20', name: 'ICC T20 World Cup', shortName: 'T20WC', type: 'INTERNATIONAL' as const },
  { externalId: 'comp_wtc', name: 'ICC World Test Championship', shortName: 'WTC', type: 'INTERNATIONAL' as const },
  { externalId: 'comp_ct', name: 'ICC Champions Trophy', shortName: 'CT', type: 'INTERNATIONAL' as const },
  { externalId: 'comp_ipl', name: 'Indian Premier League', shortName: 'IPL', type: 'FRANCHISE' as const },
  { externalId: 'comp_bbl', name: 'Big Bash League', shortName: 'BBL', type: 'FRANCHISE' as const },
  { externalId: 'comp_psl', name: 'Pakistan Super League', shortName: 'PSL', type: 'FRANCHISE' as const },
  { externalId: 'comp_cpl', name: 'Caribbean Premier League', shortName: 'CPL', type: 'FRANCHISE' as const },
  { externalId: 'comp_bgt', name: 'Border-Gavaskar Trophy', shortName: 'BGT', type: 'INTERNATIONAL' as const },
  { externalId: 'comp_ashes', name: 'The Ashes', shortName: 'ASHES', type: 'INTERNATIONAL' as const },
  { externalId: 'comp_asia', name: 'Asia Cup', shortName: 'ASIA', type: 'INTERNATIONAL' as const },
  { externalId: 'comp_sa_ind', name: 'South Africa v India 2023-24', shortName: 'SA v IND', type: 'INTERNATIONAL' as const },
  { externalId: 'comp_bilateral', name: 'Bilateral Series', shortName: 'BIL', type: 'INTERNATIONAL' as const },
];

async function main() {
  console.log('🌱 Seeding database...\n');

  // Seed International Teams
  console.log('📍 Creating international teams...');
  const teamMap: Record<string, any> = {};
  for (const team of internationalTeams) {
    const t = await prisma.team.upsert({
      where: { externalId: team.externalId },
      create: team,
      update: { name: team.name, shortName: team.shortName },
    });
    teamMap[team.externalId] = t;
  }
  console.log(`✅ Created ${internationalTeams.length} international teams`);

  // Seed IPL Teams
  console.log('\n📍 Creating IPL teams...');
  for (const team of iplTeams) {
    const t = await prisma.team.upsert({
      where: { externalId: team.externalId },
      create: team,
      update: { name: team.name, shortName: team.shortName },
    });
    teamMap[team.externalId] = t;
  }
  console.log(`✅ Created ${iplTeams.length} IPL teams`);

  // Seed Competitions
  console.log('\n📍 Creating competitions...');
  const compMap: Record<string, any> = {};
  for (const comp of competitions) {
    const c = await prisma.competition.upsert({
      where: { externalId: comp.externalId },
      create: {
        externalId: comp.externalId,
        name: comp.name,
        shortName: comp.shortName,
        type: comp.type,
        isActive: true,
      },
      update: { name: comp.name },
    });
    compMap[comp.externalId] = c;
  }
  console.log(`✅ Created ${competitions.length} competitions`);

  // Create Recent Match Results
  console.log('\n📍 Creating recent match results...');

  const recentMatches = [
    // South Africa vs India ODI Series 2023
    {
      externalId: 'match_sa_ind_odi_1',
      competition: 'comp_sa_ind',
      homeTeam: 'team_sa',
      awayTeam: 'team_ind',
      format: 'ODI' as const,
      status: 'COMPLETED' as const,
      venue: 'Wanderers Stadium',
      city: 'Johannesburg',
      daysAgo: 3,
      winner: 'team_sa',
      result: 'South Africa won by 8 wickets',
      homeScore: '116/10',
      awayScore: '117/2',
    },
    {
      externalId: 'match_sa_ind_odi_2',
      competition: 'comp_sa_ind',
      homeTeam: 'team_sa',
      awayTeam: 'team_ind',
      format: 'ODI' as const,
      status: 'COMPLETED' as const,
      venue: 'St Georges Park',
      city: 'Port Elizabeth',
      daysAgo: 5,
      winner: 'team_ind',
      result: 'India won by 20 runs',
      homeScore: '296/10',
      awayScore: '276/10',
    },
    {
      externalId: 'match_sa_ind_odi_3',
      competition: 'comp_sa_ind',
      homeTeam: 'team_sa',
      awayTeam: 'team_ind',
      format: 'ODI' as const,
      status: 'COMPLETED' as const,
      venue: 'Newlands',
      city: 'Cape Town',
      daysAgo: 7,
      winner: 'team_ind',
      result: 'India won by 6 wickets',
      homeScore: '248/10',
      awayScore: '250/4',
    },

    // Border-Gavaskar Trophy (Australia vs India Test Series)
    {
      externalId: 'match_bgt_test_1',
      competition: 'comp_bgt',
      homeTeam: 'team_aus',
      awayTeam: 'team_ind',
      format: 'TEST' as const,
      status: 'COMPLETED' as const,
      venue: 'Optus Stadium',
      city: 'Perth',
      daysAgo: 10,
      winner: 'team_aus',
      result: 'Australia won by 10 wickets',
      homeScore: '104/0',
      awayScore: '150/10',
    },
    {
      externalId: 'match_bgt_test_2',
      competition: 'comp_bgt',
      homeTeam: 'team_aus',
      awayTeam: 'team_ind',
      format: 'TEST' as const,
      status: 'COMPLETED' as const,
      venue: 'Adelaide Oval',
      city: 'Adelaide',
      daysAgo: 18,
      winner: 'team_ind',
      result: 'India won by 295 runs',
      homeScore: '180/10',
      awayScore: '475/10',
    },

    // England vs West Indies
    {
      externalId: 'match_eng_wi_t20_1',
      competition: 'comp_bilateral',
      homeTeam: 'team_wi',
      awayTeam: 'team_eng',
      format: 'T20I' as const,
      status: 'COMPLETED' as const,
      venue: 'Kensington Oval',
      city: 'Bridgetown',
      daysAgo: 2,
      winner: 'team_eng',
      result: 'England won by 7 wickets',
      homeScore: '158/9',
      awayScore: '159/3',
    },
    {
      externalId: 'match_eng_wi_t20_2',
      competition: 'comp_bilateral',
      homeTeam: 'team_wi',
      awayTeam: 'team_eng',
      format: 'T20I' as const,
      status: 'COMPLETED' as const,
      venue: 'Kensington Oval',
      city: 'Bridgetown',
      daysAgo: 4,
      winner: 'team_wi',
      result: 'West Indies won by 9 runs',
      homeScore: '180/6',
      awayScore: '171/8',
    },

    // Pakistan vs New Zealand
    {
      externalId: 'match_pak_nz_test_1',
      competition: 'comp_bilateral',
      homeTeam: 'team_pak',
      awayTeam: 'team_nz',
      format: 'TEST' as const,
      status: 'COMPLETED' as const,
      venue: 'National Stadium',
      city: 'Karachi',
      daysAgo: 8,
      winner: 'team_nz',
      result: 'New Zealand won by an innings and 32 runs',
      homeScore: '438/10',
      awayScore: '200/10',
    },

    // Sri Lanka vs Bangladesh
    {
      externalId: 'match_sl_ban_odi_1',
      competition: 'comp_bilateral',
      homeTeam: 'team_sl',
      awayTeam: 'team_ban',
      format: 'ODI' as const,
      status: 'COMPLETED' as const,
      venue: 'R. Premadasa Stadium',
      city: 'Colombo',
      daysAgo: 6,
      winner: 'team_sl',
      result: 'Sri Lanka won by 5 wickets',
      homeScore: '262/5',
      awayScore: '258/10',
    },
  ];

  for (const match of recentMatches) {
    const comp = compMap[match.competition];
    const home = teamMap[match.homeTeam];
    const away = teamMap[match.awayTeam];
    const winner = teamMap[match.winner];

    if (comp && home && away) {
      await prisma.match.upsert({
        where: { externalId: match.externalId },
        create: {
          externalId: match.externalId,
          competitionId: comp.id,
          homeTeamId: home.id,
          awayTeamId: away.id,
          format: match.format,
          status: match.status,
          venue: match.venue,
          city: match.city,
          startTime: new Date(Date.now() - match.daysAgo * 24 * 60 * 60 * 1000),
          winnerId: winner?.id,
          result: match.result,
          currentScore: match.homeScore,
        },
        update: {
          result: match.result,
          winnerId: winner?.id,
          status: match.status,
        },
      });

      // Create innings data
      await prisma.innings.upsert({
        where: {
          matchId_inningsNumber: {
            matchId: (await prisma.match.findUnique({ where: { externalId: match.externalId } }))!.id,
            inningsNumber: 1,
          },
        },
        create: {
          matchId: (await prisma.match.findUnique({ where: { externalId: match.externalId } }))!.id,
          inningsNumber: 1,
          battingTeamId: home.id,
          runs: parseInt(match.homeScore.split('/')[0]),
          wickets: parseInt(match.homeScore.split('/')[1]) || 10,
        },
        update: {},
      });
    }
  }
  console.log(`✅ Created ${recentMatches.length} recent match results`);

  // Create Upcoming Matches
  console.log('\n📍 Creating upcoming matches...');

  const upcomingMatches = [
    {
      externalId: 'match_upcoming_1',
      competition: 'comp_bgt',
      homeTeam: 'team_aus',
      awayTeam: 'team_ind',
      format: 'TEST' as const,
      venue: 'Melbourne Cricket Ground',
      city: 'Melbourne',
      daysFromNow: 5,
    },
    {
      externalId: 'match_upcoming_2',
      competition: 'comp_bilateral',
      homeTeam: 'team_eng',
      awayTeam: 'team_nz',
      format: 'ODI' as const,
      venue: "Lord's",
      city: 'London',
      daysFromNow: 3,
    },
    {
      externalId: 'match_upcoming_3',
      competition: 'comp_bilateral',
      homeTeam: 'team_pak',
      awayTeam: 'team_sa',
      format: 'T20I' as const,
      venue: 'Gaddafi Stadium',
      city: 'Lahore',
      daysFromNow: 7,
    },
  ];

  for (const match of upcomingMatches) {
    const comp = compMap[match.competition];
    const home = teamMap[match.homeTeam];
    const away = teamMap[match.awayTeam];

    if (comp && home && away) {
      await prisma.match.upsert({
        where: { externalId: match.externalId },
        create: {
          externalId: match.externalId,
          competitionId: comp.id,
          homeTeamId: home.id,
          awayTeamId: away.id,
          format: match.format,
          status: 'SCHEDULED',
          venue: match.venue,
          city: match.city,
          startTime: new Date(Date.now() + match.daysFromNow * 24 * 60 * 60 * 1000),
        },
        update: {},
      });
    }
  }
  console.log(`✅ Created ${upcomingMatches.length} upcoming matches`);

  // Create Demo User
  console.log('\n📍 Creating demo user...');
  const passwordHash = await bcrypt.hash('password123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@cricapp.com' },
    create: {
      email: 'demo@cricapp.com',
      name: 'Demo User',
      passwordHash,
      subscription: {
        create: {
          plan: 'PRO',
          status: 'ACTIVE',
        },
      },
    },
    update: {},
  });
  console.log(`✅ Created demo user: ${user.email}`);

  // Add favorites for demo user
  const india = teamMap['team_ind'];
  const sa = teamMap['team_sa'];
  if (india && sa) {
    await prisma.favoriteTeam.upsert({
      where: { userId_teamId: { userId: user.id, teamId: india.id } },
      create: { userId: user.id, teamId: india.id },
      update: {},
    });
    await prisma.favoriteTeam.upsert({
      where: { userId_teamId: { userId: user.id, teamId: sa.id } },
      create: { userId: user.id, teamId: sa.id },
      update: {},
    });
    console.log('✅ Added favorite teams for demo user (India, South Africa)');
  }

  // Create notification preferences
  const notificationTypes = ['MATCH_START', 'TOSS_RESULT', 'MATCH_RESULT'] as const;
  const channels = ['IN_APP', 'EMAIL'] as const;

  // Create global notification preferences (teamId is null for global prefs)
  const prefsToCreate = notificationTypes.flatMap((type) =>
    channels.map((channel) => ({
      userId: user.id,
      type,
      channel,
      enabled: true,
    }))
  );

  // Delete existing and recreate to avoid conflicts
  await prisma.notificationPreference.deleteMany({
    where: { userId: user.id },
  });

  await prisma.notificationPreference.createMany({
    data: prefsToCreate,
    skipDuplicates: true,
  });
  console.log('✅ Created notification preferences');

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  🎉 Seeding complete!                                          ║
╠════════════════════════════════════════════════════════════════╣
║  International Teams: ${internationalTeams.length.toString().padEnd(38)}║
║  IPL Teams:           ${iplTeams.length.toString().padEnd(38)}║
║  Competitions:        ${competitions.length.toString().padEnd(38)}║
║  Recent Results:      ${recentMatches.length.toString().padEnd(38)}║
║  Upcoming Matches:    ${upcomingMatches.length.toString().padEnd(38)}║
║                                                                ║
║  Demo credentials:                                             ║
║    Email:    demo@cricapp.com                                  ║
║    Password: password123                                       ║
║    Plan:     PRO (all features enabled)                        ║
║                                                                ║
║  Recent Match Results include:                                 ║
║    • SA vs India ODI Series (3 matches)                        ║
║    • Australia vs India Tests (BGT)                            ║
║    • England vs West Indies T20Is                              ║
║    • Pakistan vs New Zealand Test                              ║
║    • Sri Lanka vs Bangladesh ODI                               ║
╚════════════════════════════════════════════════════════════════╝
`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
