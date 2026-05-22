// Brennan's Soccer Showdown - Team Data
// 32 teams from leagues around the world

const TEAMS = [
  // === PREMIER LEAGUE ===
  {
    id: 'man_utd', name: 'Manchester United', shortName: 'MAN UTD', country: 'England',
    league: 'Premier League',
    primaryColor: '#DA291C', secondaryColor: '#FBE122', tertiaryColor: '#FFFFFF',
    shortsColor: '#FFFFFF', socksColor: '#000000',
    kitPattern: 'solid',
    rating: 84,
    formation: '1-2-1-1',
    players: [
      { name: 'Onana', num: 24, pos: 'GK', speed: 55, shooting: 20, passing: 65, defense: 40, gk: 86, stamina: 70, hair: 'short', hairColor: '#1a1a1a', skinTone: '#8B6914' },
      { name: 'Martinez', num: 6, pos: 'DEF', speed: 68, shooting: 45, passing: 72, defense: 84, gk: 10, stamina: 82, hair: 'short', hairColor: '#3a2a1a', skinTone: '#C4A882' },
      { name: 'Mainoo', num: 37, pos: 'DEF', speed: 74, shooting: 62, passing: 78, defense: 73, gk: 10, stamina: 85, hair: 'short', hairColor: '#1a1a1a', skinTone: '#6B4226' },
      { name: 'Bruno', num: 8, pos: 'MID', speed: 76, shooting: 82, passing: 88, defense: 55, gk: 10, stamina: 88, hair: 'medium', hairColor: '#3a2a1a', skinTone: '#D4A574' },
      { name: 'Rashford', num: 10, pos: 'FWD', speed: 92, shooting: 83, passing: 72, defense: 38, gk: 10, stamina: 80, hair: 'buzz', hairColor: '#1a1a1a', skinTone: '#6B4226' },
    ]
  },
  {
    id: 'liverpool', name: 'Liverpool', shortName: 'LIV', country: 'England',
    league: 'Premier League',
    primaryColor: '#C8102E', secondaryColor: '#C8102E', tertiaryColor: '#F6EB61',
    shortsColor: '#C8102E', socksColor: '#C8102E',
    kitPattern: 'solid',
    rating: 88,
    formation: '1-2-1-1',
    players: [
      { name: 'Alisson', num: 1, pos: 'GK', speed: 52, shooting: 18, passing: 70, defense: 38, gk: 90, stamina: 72, hair: 'short', hairColor: '#8B4513', skinTone: '#C4A882' },
      { name: 'Van Dijk', num: 4, pos: 'DEF', speed: 72, shooting: 55, passing: 75, defense: 90, gk: 10, stamina: 80, hair: 'short', hairColor: '#1a1a1a', skinTone: '#6B4226' },
      { name: 'Alexander-Arnold', num: 66, pos: 'DEF', speed: 78, shooting: 68, passing: 90, defense: 76, gk: 10, stamina: 84, hair: 'curly', hairColor: '#3a2a1a', skinTone: '#8B6914' },
      { name: 'Mac Allister', num: 10, pos: 'MID', speed: 75, shooting: 76, passing: 84, defense: 72, gk: 10, stamina: 86, hair: 'medium', hairColor: '#D4A574', skinTone: '#F5D6BA' },
      { name: 'Salah', num: 11, pos: 'FWD', speed: 90, shooting: 88, passing: 80, defense: 42, gk: 10, stamina: 82, hair: 'afro', hairColor: '#1a1a1a', skinTone: '#C4A882' },
    ]
  },
  {
    id: 'chelsea', name: 'Chelsea', shortName: 'CHE', country: 'England',
    league: 'Premier League',
    primaryColor: '#034694', secondaryColor: '#034694', tertiaryColor: '#DBA111',
    shortsColor: '#034694', socksColor: '#FFFFFF',
    kitPattern: 'solid',
    rating: 82,
    formation: '1-2-1-1',
    players: [
      { name: 'Sanchez', num: 1, pos: 'GK', speed: 48, shooting: 15, passing: 60, defense: 35, gk: 83, stamina: 70, hair: 'short', hairColor: '#1a1a1a', skinTone: '#C4A882' },
      { name: 'Fofana', num: 2, pos: 'DEF', speed: 76, shooting: 40, passing: 65, defense: 82, gk: 10, stamina: 80, hair: 'buzz', hairColor: '#1a1a1a', skinTone: '#6B4226' },
      { name: 'Caicedo', num: 25, pos: 'DEF', speed: 78, shooting: 60, passing: 80, defense: 80, gk: 10, stamina: 88, hair: 'short', hairColor: '#1a1a1a', skinTone: '#8B6914' },
      { name: 'Palmer', num: 20, pos: 'MID', speed: 80, shooting: 85, passing: 82, defense: 45, gk: 10, stamina: 78, hair: 'short', hairColor: '#3a2a1a', skinTone: '#F5D6BA' },
      { name: 'Jackson', num: 15, pos: 'FWD', speed: 86, shooting: 80, passing: 68, defense: 35, gk: 10, stamina: 82, hair: 'buzz', hairColor: '#1a1a1a', skinTone: '#6B4226' },
    ]
  },
  {
    id: 'arsenal', name: 'Arsenal', shortName: 'ARS', country: 'England',
    league: 'Premier League',
    primaryColor: '#EF0107', secondaryColor: '#FFFFFF', tertiaryColor: '#063672',
    shortsColor: '#FFFFFF', socksColor: '#EF0107',
    kitPattern: 'sleeves',
    rating: 87,
    formation: '1-2-1-1',
    players: [
      { name: 'Raya', num: 22, pos: 'GK', speed: 50, shooting: 16, passing: 72, defense: 36, gk: 87, stamina: 72, hair: 'short', hairColor: '#3a2a1a', skinTone: '#D4A574' },
      { name: 'Saliba', num: 2, pos: 'DEF', speed: 78, shooting: 42, passing: 72, defense: 88, gk: 10, stamina: 82, hair: 'short', hairColor: '#1a1a1a', skinTone: '#6B4226' },
      { name: 'Rice', num: 41, pos: 'DEF', speed: 74, shooting: 70, passing: 82, defense: 84, gk: 10, stamina: 90, hair: 'short', hairColor: '#8B4513', skinTone: '#F5D6BA' },
      { name: 'Odegaard', num: 8, pos: 'MID', speed: 76, shooting: 78, passing: 90, defense: 55, gk: 10, stamina: 82, hair: 'medium', hairColor: '#D4A574', skinTone: '#F5D6BA' },
      { name: 'Saka', num: 7, pos: 'FWD', speed: 88, shooting: 82, passing: 82, defense: 55, gk: 10, stamina: 86, hair: 'short', hairColor: '#1a1a1a', skinTone: '#6B4226' },
    ]
  },
  {
    id: 'man_city', name: 'Manchester City', shortName: 'MAN CITY', country: 'England',
    league: 'Premier League',
    primaryColor: '#6CABDD', secondaryColor: '#6CABDD', tertiaryColor: '#FFFFFF',
    shortsColor: '#FFFFFF', socksColor: '#6CABDD',
    kitPattern: 'solid',
    rating: 89,
    formation: '1-2-1-1',
    players: [
      { name: 'Ederson', num: 31, pos: 'GK', speed: 55, shooting: 20, passing: 80, defense: 38, gk: 88, stamina: 72, hair: 'buzz', hairColor: '#1a1a1a', skinTone: '#C4A882' },
      { name: 'Dias', num: 3, pos: 'DEF', speed: 72, shooting: 45, passing: 70, defense: 88, gk: 10, stamina: 82, hair: 'short', hairColor: '#3a2a1a', skinTone: '#D4A574' },
      { name: 'Rodri', num: 16, pos: 'DEF', speed: 68, shooting: 74, passing: 86, defense: 82, gk: 10, stamina: 86, hair: 'short', hairColor: '#3a2a1a', skinTone: '#D4A574' },
      { name: 'De Bruyne', num: 17, pos: 'MID', speed: 76, shooting: 86, passing: 93, defense: 55, gk: 10, stamina: 78, hair: 'medium', hairColor: '#D4A574', skinTone: '#F5D6BA' },
      { name: 'Haaland', num: 9, pos: 'FWD', speed: 88, shooting: 92, passing: 65, defense: 42, gk: 10, stamina: 82, hair: 'long', hairColor: '#F0E68C', skinTone: '#F5D6BA' },
    ]
  },
  {
    id: 'tottenham', name: 'Tottenham Hotspur', shortName: 'SPURS', country: 'England',
    league: 'Premier League',
    primaryColor: '#FFFFFF', secondaryColor: '#132257', tertiaryColor: '#132257',
    shortsColor: '#132257', socksColor: '#FFFFFF',
    kitPattern: 'solid',
    rating: 81,
    formation: '1-2-1-1',
    players: [
      { name: 'Vicario', num: 13, pos: 'GK', speed: 48, shooting: 14, passing: 62, defense: 35, gk: 84, stamina: 72, hair: 'short', hairColor: '#3a2a1a', skinTone: '#D4A574' },
      { name: 'Romero', num: 17, pos: 'DEF', speed: 74, shooting: 40, passing: 65, defense: 84, gk: 10, stamina: 80, hair: 'short', hairColor: '#1a1a1a', skinTone: '#C4A882' },
      { name: 'Bissouma', num: 38, pos: 'DEF', speed: 76, shooting: 58, passing: 74, defense: 78, gk: 10, stamina: 84, hair: 'buzz', hairColor: '#1a1a1a', skinTone: '#6B4226' },
      { name: 'Maddison', num: 10, pos: 'MID', speed: 74, shooting: 78, passing: 84, defense: 48, gk: 10, stamina: 76, hair: 'short', hairColor: '#8B4513', skinTone: '#F5D6BA' },
      { name: 'Son', num: 7, pos: 'FWD', speed: 88, shooting: 86, passing: 78, defense: 42, gk: 10, stamina: 84, hair: 'short', hairColor: '#1a1a1a', skinTone: '#E8C99A' },
    ]
  },

  // === LA LIGA ===
  {
    id: 'real_madrid', name: 'Real Madrid', shortName: 'REAL', country: 'Spain',
    league: 'La Liga',
    primaryColor: '#FFFFFF', secondaryColor: '#FFFFFF', tertiaryColor: '#FEBE10',
    shortsColor: '#FFFFFF', socksColor: '#FFFFFF',
    kitPattern: 'solid',
    rating: 91,
    formation: '1-2-1-1',
    players: [
      { name: 'Courtois', num: 1, pos: 'GK', speed: 50, shooting: 15, passing: 68, defense: 38, gk: 90, stamina: 72, hair: 'short', hairColor: '#8B4513', skinTone: '#F5D6BA' },
      { name: 'Rudiger', num: 22, pos: 'DEF', speed: 80, shooting: 48, passing: 68, defense: 86, gk: 10, stamina: 84, hair: 'buzz', hairColor: '#1a1a1a', skinTone: '#6B4226' },
      { name: 'Valverde', num: 8, pos: 'DEF', speed: 86, shooting: 76, passing: 78, defense: 78, gk: 10, stamina: 92, hair: 'short', hairColor: '#3a2a1a', skinTone: '#C4A882' },
      { name: 'Bellingham', num: 5, pos: 'MID', speed: 82, shooting: 84, passing: 82, defense: 65, gk: 10, stamina: 88, hair: 'medium', hairColor: '#3a2a1a', skinTone: '#6B4226' },
      { name: 'Vinicius Jr', num: 7, pos: 'FWD', speed: 95, shooting: 84, passing: 78, defense: 35, gk: 10, stamina: 84, hair: 'short', hairColor: '#1a1a1a', skinTone: '#6B4226' },
    ]
  },
  {
    id: 'barcelona', name: 'FC Barcelona', shortName: 'BARCA', country: 'Spain',
    league: 'La Liga',
    primaryColor: '#A50044', secondaryColor: '#004D98', tertiaryColor: '#EDBB00',
    shortsColor: '#004D98', socksColor: '#A50044',
    kitPattern: 'stripes',
    rating: 88,
    formation: '1-2-1-1',
    players: [
      { name: 'Ter Stegen', num: 1, pos: 'GK', speed: 48, shooting: 15, passing: 78, defense: 36, gk: 88, stamina: 70, hair: 'short', hairColor: '#D4A574', skinTone: '#F5D6BA' },
      { name: 'Araujo', num: 4, pos: 'DEF', speed: 82, shooting: 42, passing: 62, defense: 86, gk: 10, stamina: 82, hair: 'short', hairColor: '#1a1a1a', skinTone: '#8B6914' },
      { name: 'Pedri', num: 8, pos: 'DEF', speed: 78, shooting: 72, passing: 88, defense: 68, gk: 10, stamina: 80, hair: 'short', hairColor: '#3a2a1a', skinTone: '#D4A574' },
      { name: 'Gavi', num: 6, pos: 'MID', speed: 82, shooting: 72, passing: 82, defense: 72, gk: 10, stamina: 90, hair: 'short', hairColor: '#3a2a1a', skinTone: '#D4A574' },
      { name: 'Yamal', num: 19, pos: 'FWD', speed: 90, shooting: 80, passing: 80, defense: 35, gk: 10, stamina: 86, hair: 'curly', hairColor: '#1a1a1a', skinTone: '#8B6914' },
    ]
  },
  {
    id: 'atletico', name: 'Atletico Madrid', shortName: 'ATM', country: 'Spain',
    league: 'La Liga',
    primaryColor: '#CB3524', secondaryColor: '#FFFFFF', tertiaryColor: '#272E61',
    shortsColor: '#272E61', socksColor: '#CB3524',
    kitPattern: 'stripes',
    rating: 83,
    formation: '1-2-1-1',
    players: [
      { name: 'Oblak', num: 13, pos: 'GK', speed: 48, shooting: 12, passing: 62, defense: 38, gk: 88, stamina: 72, hair: 'short', hairColor: '#3a2a1a', skinTone: '#F5D6BA' },
      { name: 'Gimenez', num: 2, pos: 'DEF', speed: 72, shooting: 42, passing: 60, defense: 84, gk: 10, stamina: 78, hair: 'short', hairColor: '#3a2a1a', skinTone: '#C4A882' },
      { name: 'Koke', num: 6, pos: 'DEF', speed: 70, shooting: 65, passing: 84, defense: 72, gk: 10, stamina: 82, hair: 'short', hairColor: '#3a2a1a', skinTone: '#D4A574' },
      { name: 'Griezmann', num: 7, pos: 'MID', speed: 80, shooting: 82, passing: 82, defense: 55, gk: 10, stamina: 80, hair: 'medium', hairColor: '#8B4513', skinTone: '#F5D6BA' },
      { name: 'Alvarez', num: 19, pos: 'FWD', speed: 84, shooting: 82, passing: 72, defense: 48, gk: 10, stamina: 88, hair: 'short', hairColor: '#3a2a1a', skinTone: '#C4A882' },
    ]
  },

  // === SERIE A ===
  {
    id: 'ac_milan', name: 'AC Milan', shortName: 'MILAN', country: 'Italy',
    league: 'Serie A',
    primaryColor: '#FB090B', secondaryColor: '#000000', tertiaryColor: '#FFFFFF',
    shortsColor: '#FFFFFF', socksColor: '#000000',
    kitPattern: 'stripes',
    rating: 83,
    formation: '1-2-1-1',
    players: [
      { name: 'Maignan', num: 16, pos: 'GK', speed: 52, shooting: 15, passing: 70, defense: 38, gk: 87, stamina: 72, hair: 'buzz', hairColor: '#1a1a1a', skinTone: '#6B4226' },
      { name: 'Tomori', num: 23, pos: 'DEF', speed: 82, shooting: 38, passing: 62, defense: 82, gk: 10, stamina: 82, hair: 'short', hairColor: '#1a1a1a', skinTone: '#6B4226' },
      { name: 'Tonali', num: 8, pos: 'DEF', speed: 76, shooting: 68, passing: 80, defense: 76, gk: 10, stamina: 86, hair: 'medium', hairColor: '#3a2a1a', skinTone: '#D4A574' },
      { name: 'Pulisic', num: 11, pos: 'MID', speed: 84, shooting: 76, passing: 76, defense: 48, gk: 10, stamina: 82, hair: 'short', hairColor: '#3a2a1a', skinTone: '#F5D6BA' },
      { name: 'Leao', num: 10, pos: 'FWD', speed: 92, shooting: 80, passing: 72, defense: 32, gk: 10, stamina: 76, hair: 'short', hairColor: '#1a1a1a', skinTone: '#6B4226' },
    ]
  },
  {
    id: 'juventus', name: 'Juventus', shortName: 'JUVE', country: 'Italy',
    league: 'Serie A',
    primaryColor: '#000000', secondaryColor: '#FFFFFF', tertiaryColor: '#FFFFFF',
    shortsColor: '#FFFFFF', socksColor: '#000000',
    kitPattern: 'stripes',
    rating: 82,
    formation: '1-2-1-1',
    players: [
      { name: 'Szczesny', num: 1, pos: 'GK', speed: 48, shooting: 14, passing: 60, defense: 35, gk: 84, stamina: 70, hair: 'short', hairColor: '#3a2a1a', skinTone: '#F5D6BA' },
      { name: 'Bremer', num: 3, pos: 'DEF', speed: 76, shooting: 42, passing: 58, defense: 84, gk: 10, stamina: 80, hair: 'buzz', hairColor: '#1a1a1a', skinTone: '#6B4226' },
      { name: 'Locatelli', num: 5, pos: 'DEF', speed: 70, shooting: 65, passing: 80, defense: 76, gk: 10, stamina: 82, hair: 'short', hairColor: '#3a2a1a', skinTone: '#D4A574' },
      { name: 'Chiesa', num: 7, pos: 'MID', speed: 86, shooting: 80, passing: 74, defense: 42, gk: 10, stamina: 78, hair: 'medium', hairColor: '#3a2a1a', skinTone: '#D4A574' },
      { name: 'Vlahovic', num: 9, pos: 'FWD', speed: 80, shooting: 84, passing: 62, defense: 35, gk: 10, stamina: 80, hair: 'short', hairColor: '#3a2a1a', skinTone: '#F5D6BA' },
    ]
  },
  {
    id: 'inter', name: 'Inter Milan', shortName: 'INTER', country: 'Italy',
    league: 'Serie A',
    primaryColor: '#009AF1', secondaryColor: '#000000', tertiaryColor: '#FFFFFF',
    shortsColor: '#000000', socksColor: '#000000',
    kitPattern: 'stripes',
    rating: 86,
    formation: '1-2-1-1',
    players: [
      { name: 'Sommer', num: 1, pos: 'GK', speed: 45, shooting: 12, passing: 65, defense: 36, gk: 85, stamina: 68, hair: 'short', hairColor: '#3a2a1a', skinTone: '#F5D6BA' },
      { name: 'Bastoni', num: 95, pos: 'DEF', speed: 74, shooting: 48, passing: 78, defense: 84, gk: 10, stamina: 82, hair: 'short', hairColor: '#3a2a1a', skinTone: '#D4A574' },
      { name: 'Barella', num: 23, pos: 'DEF', speed: 80, shooting: 74, passing: 82, defense: 76, gk: 10, stamina: 90, hair: 'short', hairColor: '#3a2a1a', skinTone: '#D4A574' },
      { name: 'Calhanoglu', num: 20, pos: 'MID', speed: 72, shooting: 82, passing: 84, defense: 62, gk: 10, stamina: 78, hair: 'short', hairColor: '#1a1a1a', skinTone: '#D4A574' },
      { name: 'Lautaro', num: 10, pos: 'FWD', speed: 82, shooting: 86, passing: 72, defense: 42, gk: 10, stamina: 82, hair: 'short', hairColor: '#3a2a1a', skinTone: '#C4A882' },
    ]
  },
  {
    id: 'napoli', name: 'SSC Napoli', shortName: 'NAPOLI', country: 'Italy',
    league: 'Serie A',
    primaryColor: '#12A0D7', secondaryColor: '#12A0D7', tertiaryColor: '#FFFFFF',
    shortsColor: '#12A0D7', socksColor: '#12A0D7',
    kitPattern: 'solid',
    rating: 84,
    formation: '1-2-1-1',
    players: [
      { name: 'Meret', num: 1, pos: 'GK', speed: 48, shooting: 12, passing: 62, defense: 35, gk: 83, stamina: 70, hair: 'short', hairColor: '#3a2a1a', skinTone: '#D4A574' },
      { name: 'Kim', num: 3, pos: 'DEF', speed: 76, shooting: 42, passing: 65, defense: 86, gk: 10, stamina: 82, hair: 'short', hairColor: '#1a1a1a', skinTone: '#E8C99A' },
      { name: 'Lobotka', num: 68, pos: 'DEF', speed: 70, shooting: 58, passing: 84, defense: 78, gk: 10, stamina: 86, hair: 'short', hairColor: '#3a2a1a', skinTone: '#F5D6BA' },
      { name: 'Kvaratskhelia', num: 77, pos: 'MID', speed: 88, shooting: 80, passing: 78, defense: 38, gk: 10, stamina: 82, hair: 'short', hairColor: '#1a1a1a', skinTone: '#D4A574' },
      { name: 'Osimhen', num: 9, pos: 'FWD', speed: 90, shooting: 84, passing: 62, defense: 32, gk: 10, stamina: 84, hair: 'buzz', hairColor: '#1a1a1a', skinTone: '#6B4226' },
    ]
  },

  // === BUNDESLIGA ===
  {
    id: 'bayern', name: 'Bayern Munich', shortName: 'BAYERN', country: 'Germany',
    league: 'Bundesliga',
    primaryColor: '#DC052D', secondaryColor: '#DC052D', tertiaryColor: '#FFFFFF',
    shortsColor: '#DC052D', socksColor: '#DC052D',
    kitPattern: 'solid',
    rating: 87,
    formation: '1-2-1-1',
    players: [
      { name: 'Neuer', num: 1, pos: 'GK', speed: 52, shooting: 18, passing: 72, defense: 40, gk: 88, stamina: 68, hair: 'short', hairColor: '#D4A574', skinTone: '#F5D6BA' },
      { name: 'Upamecano', num: 2, pos: 'DEF', speed: 80, shooting: 40, passing: 62, defense: 84, gk: 10, stamina: 82, hair: 'buzz', hairColor: '#1a1a1a', skinTone: '#6B4226' },
      { name: 'Kimmich', num: 6, pos: 'DEF', speed: 74, shooting: 70, passing: 88, defense: 80, gk: 10, stamina: 90, hair: 'short', hairColor: '#8B4513', skinTone: '#F5D6BA' },
      { name: 'Musiala', num: 42, pos: 'MID', speed: 84, shooting: 78, passing: 82, defense: 48, gk: 10, stamina: 84, hair: 'curly', hairColor: '#3a2a1a', skinTone: '#8B6914' },
      { name: 'Kane', num: 9, pos: 'FWD', speed: 78, shooting: 92, passing: 82, defense: 45, gk: 10, stamina: 82, hair: 'short', hairColor: '#D4A574', skinTone: '#F5D6BA' },
    ]
  },
  {
    id: 'dortmund', name: 'Borussia Dortmund', shortName: 'BVB', country: 'Germany',
    league: 'Bundesliga',
    primaryColor: '#FDE100', secondaryColor: '#000000', tertiaryColor: '#000000',
    shortsColor: '#000000', socksColor: '#FDE100',
    kitPattern: 'solid',
    rating: 82,
    formation: '1-2-1-1',
    players: [
      { name: 'Kobel', num: 1, pos: 'GK', speed: 48, shooting: 14, passing: 65, defense: 36, gk: 85, stamina: 72, hair: 'short', hairColor: '#3a2a1a', skinTone: '#F5D6BA' },
      { name: 'Schlotterbeck', num: 4, pos: 'DEF', speed: 76, shooting: 45, passing: 68, defense: 82, gk: 10, stamina: 80, hair: 'short', hairColor: '#3a2a1a', skinTone: '#F5D6BA' },
      { name: 'Can', num: 23, pos: 'DEF', speed: 72, shooting: 62, passing: 72, defense: 76, gk: 10, stamina: 80, hair: 'short', hairColor: '#1a1a1a', skinTone: '#D4A574' },
      { name: 'Brandt', num: 10, pos: 'MID', speed: 78, shooting: 76, passing: 82, defense: 48, gk: 10, stamina: 78, hair: 'medium', hairColor: '#D4A574', skinTone: '#F5D6BA' },
      { name: 'Adeyemi', num: 27, pos: 'FWD', speed: 92, shooting: 76, passing: 70, defense: 32, gk: 10, stamina: 80, hair: 'buzz', hairColor: '#1a1a1a', skinTone: '#6B4226' },
    ]
  },

  // === LIGUE 1 ===
  {
    id: 'psg', name: 'Paris Saint-Germain', shortName: 'PSG', country: 'France',
    league: 'Ligue 1',
    primaryColor: '#004170', secondaryColor: '#004170', tertiaryColor: '#DA291C',
    shortsColor: '#004170', socksColor: '#DA291C',
    kitPattern: 'stripe_center',
    rating: 86,
    formation: '1-2-1-1',
    players: [
      { name: 'Donnarumma', num: 99, pos: 'GK', speed: 48, shooting: 14, passing: 62, defense: 36, gk: 87, stamina: 70, hair: 'short', hairColor: '#3a2a1a', skinTone: '#D4A574' },
      { name: 'Marquinhos', num: 5, pos: 'DEF', speed: 76, shooting: 48, passing: 72, defense: 86, gk: 10, stamina: 82, hair: 'short', hairColor: '#1a1a1a', skinTone: '#C4A882' },
      { name: 'Vitinha', num: 17, pos: 'DEF', speed: 76, shooting: 72, passing: 84, defense: 70, gk: 10, stamina: 84, hair: 'short', hairColor: '#3a2a1a', skinTone: '#D4A574' },
      { name: 'Dembele', num: 10, pos: 'MID', speed: 92, shooting: 78, passing: 80, defense: 38, gk: 10, stamina: 78, hair: 'short', hairColor: '#1a1a1a', skinTone: '#6B4226' },
      { name: 'Mbappe', num: 7, pos: 'FWD', speed: 97, shooting: 88, passing: 78, defense: 35, gk: 10, stamina: 84, hair: 'buzz', hairColor: '#1a1a1a', skinTone: '#6B4226' },
    ]
  },
  {
    id: 'marseille', name: 'Olympique Marseille', shortName: 'OM', country: 'France',
    league: 'Ligue 1',
    primaryColor: '#FFFFFF', secondaryColor: '#2FAEE0', tertiaryColor: '#2FAEE0',
    shortsColor: '#FFFFFF', socksColor: '#FFFFFF',
    kitPattern: 'solid',
    rating: 78,
    formation: '1-2-1-1',
    players: [
      { name: 'Pau Lopez', num: 1, pos: 'GK', speed: 45, shooting: 12, passing: 62, defense: 35, gk: 82, stamina: 70, hair: 'short', hairColor: '#3a2a1a', skinTone: '#D4A574' },
      { name: 'Balerdi', num: 4, pos: 'DEF', speed: 74, shooting: 38, passing: 62, defense: 78, gk: 10, stamina: 78, hair: 'short', hairColor: '#3a2a1a', skinTone: '#C4A882' },
      { name: 'Rongier', num: 21, pos: 'DEF', speed: 72, shooting: 58, passing: 76, defense: 74, gk: 10, stamina: 82, hair: 'short', hairColor: '#3a2a1a', skinTone: '#F5D6BA' },
      { name: 'Harit', num: 7, pos: 'MID', speed: 80, shooting: 72, passing: 78, defense: 42, gk: 10, stamina: 76, hair: 'short', hairColor: '#1a1a1a', skinTone: '#C4A882' },
      { name: 'Aubameyang', num: 10, pos: 'FWD', speed: 86, shooting: 80, passing: 68, defense: 32, gk: 10, stamina: 72, hair: 'buzz', hairColor: '#1a1a1a', skinTone: '#6B4226' },
    ]
  },

  // === OTHER EUROPEAN ===
  {
    id: 'ajax', name: 'AFC Ajax', shortName: 'AJAX', country: 'Netherlands',
    league: 'Eredivisie',
    primaryColor: '#FFFFFF', secondaryColor: '#D2122E', tertiaryColor: '#D2122E',
    shortsColor: '#FFFFFF', socksColor: '#D2122E',
    kitPattern: 'stripe_center',
    rating: 77,
    formation: '1-2-1-1',
    players: [
      { name: 'Pasveer', num: 22, pos: 'GK', speed: 42, shooting: 10, passing: 58, defense: 32, gk: 80, stamina: 65, hair: 'short', hairColor: '#3a2a1a', skinTone: '#F5D6BA' },
      { name: 'Timber', num: 2, pos: 'DEF', speed: 80, shooting: 42, passing: 72, defense: 80, gk: 10, stamina: 84, hair: 'curly', hairColor: '#1a1a1a', skinTone: '#8B6914' },
      { name: 'Alvarez', num: 4, pos: 'DEF', speed: 72, shooting: 60, passing: 78, defense: 78, gk: 10, stamina: 84, hair: 'short', hairColor: '#1a1a1a', skinTone: '#C4A882' },
      { name: 'Berghuis', num: 23, pos: 'MID', speed: 76, shooting: 76, passing: 80, defense: 45, gk: 10, stamina: 76, hair: 'short', hairColor: '#3a2a1a', skinTone: '#F5D6BA' },
      { name: 'Brobbey', num: 9, pos: 'FWD', speed: 86, shooting: 76, passing: 62, defense: 32, gk: 10, stamina: 80, hair: 'buzz', hairColor: '#1a1a1a', skinTone: '#6B4226' },
    ]
  },
  {
    id: 'porto', name: 'FC Porto', shortName: 'PORTO', country: 'Portugal',
    league: 'Liga Portugal',
    primaryColor: '#003893', secondaryColor: '#FFFFFF', tertiaryColor: '#FFFFFF',
    shortsColor: '#FFFFFF', socksColor: '#003893',
    kitPattern: 'stripes',
    rating: 79,
    formation: '1-2-1-1',
    players: [
      { name: 'D. Costa', num: 1, pos: 'GK', speed: 46, shooting: 12, passing: 60, defense: 34, gk: 82, stamina: 70, hair: 'short', hairColor: '#3a2a1a', skinTone: '#D4A574' },
      { name: 'Pepe', num: 3, pos: 'DEF', speed: 62, shooting: 42, passing: 60, defense: 82, gk: 10, stamina: 72, hair: 'buzz', hairColor: '#3a2a1a', skinTone: '#D4A574' },
      { name: 'Uribe', num: 8, pos: 'DEF', speed: 72, shooting: 65, passing: 76, defense: 76, gk: 10, stamina: 82, hair: 'short', hairColor: '#1a1a1a', skinTone: '#C4A882' },
      { name: 'Otavio', num: 25, pos: 'MID', speed: 80, shooting: 72, passing: 80, defense: 52, gk: 10, stamina: 80, hair: 'short', hairColor: '#3a2a1a', skinTone: '#C4A882' },
      { name: 'Taremi', num: 9, pos: 'FWD', speed: 78, shooting: 82, passing: 72, defense: 38, gk: 10, stamina: 80, hair: 'short', hairColor: '#1a1a1a', skinTone: '#C4A882' },
    ]
  },
  {
    id: 'celtic', name: 'Celtic FC', shortName: 'CELTIC', country: 'Scotland',
    league: 'Scottish Premiership',
    primaryColor: '#006633', secondaryColor: '#FFFFFF', tertiaryColor: '#FFFFFF',
    shortsColor: '#FFFFFF', socksColor: '#006633',
    kitPattern: 'hoops',
    rating: 76,
    formation: '1-2-1-1',
    players: [
      { name: 'Hart', num: 1, pos: 'GK', speed: 45, shooting: 14, passing: 62, defense: 34, gk: 82, stamina: 68, hair: 'short', hairColor: '#3a2a1a', skinTone: '#F5D6BA' },
      { name: 'Carter-Vickers', num: 20, pos: 'DEF', speed: 72, shooting: 38, passing: 62, defense: 80, gk: 10, stamina: 78, hair: 'buzz', hairColor: '#1a1a1a', skinTone: '#8B6914' },
      { name: 'McGregor', num: 42, pos: 'DEF', speed: 70, shooting: 62, passing: 80, defense: 72, gk: 10, stamina: 84, hair: 'short', hairColor: '#8B4513', skinTone: '#F5D6BA' },
      { name: 'Hatate', num: 8, pos: 'MID', speed: 78, shooting: 72, passing: 78, defense: 52, gk: 10, stamina: 80, hair: 'short', hairColor: '#1a1a1a', skinTone: '#E8C99A' },
      { name: 'Kyogo', num: 9, pos: 'FWD', speed: 84, shooting: 78, passing: 68, defense: 32, gk: 10, stamina: 82, hair: 'short', hairColor: '#1a1a1a', skinTone: '#E8C99A' },
    ]
  },
  {
    id: 'galatasaray', name: 'Galatasaray', shortName: 'GALA', country: 'Turkey',
    league: 'Super Lig',
    primaryColor: '#FFC72C', secondaryColor: '#A6001A', tertiaryColor: '#A6001A',
    shortsColor: '#A6001A', socksColor: '#FFC72C',
    kitPattern: 'halves',
    rating: 80,
    formation: '1-2-1-1',
    players: [
      { name: 'Muslera', num: 1, pos: 'GK', speed: 45, shooting: 12, passing: 58, defense: 34, gk: 82, stamina: 68, hair: 'short', hairColor: '#3a2a1a', skinTone: '#C4A882' },
      { name: 'Nelsson', num: 4, pos: 'DEF', speed: 74, shooting: 38, passing: 62, defense: 80, gk: 10, stamina: 80, hair: 'short', hairColor: '#D4A574', skinTone: '#F5D6BA' },
      { name: 'Torreira', num: 34, pos: 'DEF', speed: 72, shooting: 62, passing: 78, defense: 78, gk: 10, stamina: 84, hair: 'short', hairColor: '#1a1a1a', skinTone: '#C4A882' },
      { name: 'Ziyech', num: 10, pos: 'MID', speed: 78, shooting: 78, passing: 84, defense: 38, gk: 10, stamina: 72, hair: 'curly', hairColor: '#1a1a1a', skinTone: '#C4A882' },
      { name: 'Icardi', num: 9, pos: 'FWD', speed: 80, shooting: 84, passing: 68, defense: 32, gk: 10, stamina: 74, hair: 'short', hairColor: '#3a2a1a', skinTone: '#C4A882' },
    ]
  },

  // === MLS ===
  {
    id: 'chicago_fire', name: 'Chicago Fire', shortName: 'CHI', country: 'USA',
    league: 'MLS',
    primaryColor: '#AF2626', secondaryColor: '#7CCDEF', tertiaryColor: '#FFFFFF',
    shortsColor: '#AF2626', socksColor: '#AF2626',
    kitPattern: 'solid',
    rating: 72,
    formation: '1-2-1-1',
    players: [
      { name: 'Slonina', num: 1, pos: 'GK', speed: 48, shooting: 12, passing: 58, defense: 32, gk: 76, stamina: 72, hair: 'short', hairColor: '#3a2a1a', skinTone: '#F5D6BA' },
      { name: 'Czichos', num: 5, pos: 'DEF', speed: 68, shooting: 38, passing: 60, defense: 76, gk: 10, stamina: 78, hair: 'short', hairColor: '#D4A574', skinTone: '#F5D6BA' },
      { name: 'Gimenez', num: 19, pos: 'DEF', speed: 72, shooting: 55, passing: 72, defense: 72, gk: 10, stamina: 80, hair: 'short', hairColor: '#1a1a1a', skinTone: '#C4A882' },
      { name: 'Shaqiri', num: 10, pos: 'MID', speed: 76, shooting: 80, passing: 82, defense: 38, gk: 10, stamina: 68, hair: 'short', hairColor: '#D4A574', skinTone: '#F5D6BA' },
      { name: 'Mueller', num: 9, pos: 'FWD', speed: 78, shooting: 74, passing: 65, defense: 30, gk: 10, stamina: 78, hair: 'short', hairColor: '#8B4513', skinTone: '#F5D6BA' },
    ]
  },
  {
    id: 'la_galaxy', name: 'LA Galaxy', shortName: 'LAG', country: 'USA',
    league: 'MLS',
    primaryColor: '#FFFFFF', secondaryColor: '#004B87', tertiaryColor: '#FFD200',
    shortsColor: '#004B87', socksColor: '#FFFFFF',
    kitPattern: 'sash',
    rating: 74,
    formation: '1-2-1-1',
    players: [
      { name: 'Bond', num: 1, pos: 'GK', speed: 46, shooting: 12, passing: 58, defense: 32, gk: 76, stamina: 70, hair: 'short', hairColor: '#3a2a1a', skinTone: '#F5D6BA' },
      { name: 'Segal', num: 4, pos: 'DEF', speed: 72, shooting: 35, passing: 62, defense: 76, gk: 10, stamina: 78, hair: 'short', hairColor: '#3a2a1a', skinTone: '#F5D6BA' },
      { name: 'Delgado', num: 8, pos: 'DEF', speed: 70, shooting: 58, passing: 74, defense: 72, gk: 10, stamina: 80, hair: 'short', hairColor: '#1a1a1a', skinTone: '#C4A882' },
      { name: 'Riqui Puig', num: 10, pos: 'MID', speed: 78, shooting: 72, passing: 82, defense: 42, gk: 10, stamina: 76, hair: 'curly', hairColor: '#3a2a1a', skinTone: '#D4A574' },
      { name: 'Chicharito', num: 14, pos: 'FWD', speed: 80, shooting: 82, passing: 68, defense: 28, gk: 10, stamina: 72, hair: 'short', hairColor: '#1a1a1a', skinTone: '#C4A882' },
    ]
  },
  {
    id: 'inter_miami', name: 'Inter Miami', shortName: 'MIA', country: 'USA',
    league: 'MLS',
    primaryColor: '#F7B5CD', secondaryColor: '#231F20', tertiaryColor: '#FFFFFF',
    shortsColor: '#231F20', socksColor: '#F7B5CD',
    kitPattern: 'solid',
    rating: 80,
    formation: '1-2-1-1',
    players: [
      { name: 'Callender', num: 1, pos: 'GK', speed: 48, shooting: 12, passing: 58, defense: 34, gk: 78, stamina: 72, hair: 'buzz', hairColor: '#1a1a1a', skinTone: '#6B4226' },
      { name: 'Jordi Alba', num: 18, pos: 'DEF', speed: 78, shooting: 48, passing: 78, defense: 78, gk: 10, stamina: 76, hair: 'short', hairColor: '#3a2a1a', skinTone: '#D4A574' },
      { name: 'Busquets', num: 5, pos: 'DEF', speed: 58, shooting: 62, passing: 86, defense: 76, gk: 10, stamina: 68, hair: 'short', hairColor: '#3a2a1a', skinTone: '#D4A574' },
      { name: 'Messi', num: 10, pos: 'MID', speed: 80, shooting: 90, passing: 92, defense: 35, gk: 10, stamina: 68, hair: 'short', hairColor: '#3a2a1a', skinTone: '#D4A574' },
      { name: 'Suarez', num: 9, pos: 'FWD', speed: 72, shooting: 86, passing: 78, defense: 42, gk: 10, stamina: 68, hair: 'short', hairColor: '#3a2a1a', skinTone: '#C4A882' },
    ]
  },
  {
    id: 'atlanta', name: 'Atlanta United', shortName: 'ATL', country: 'USA',
    league: 'MLS',
    primaryColor: '#80000A', secondaryColor: '#000000', tertiaryColor: '#A19060',
    shortsColor: '#000000', socksColor: '#80000A',
    kitPattern: 'stripes_thin',
    rating: 74,
    formation: '1-2-1-1',
    players: [
      { name: 'Guzan', num: 1, pos: 'GK', speed: 42, shooting: 10, passing: 55, defense: 32, gk: 78, stamina: 65, hair: 'buzz', hairColor: '#D4A574', skinTone: '#F5D6BA' },
      { name: 'Robinson', num: 12, pos: 'DEF', speed: 76, shooting: 35, passing: 58, defense: 76, gk: 10, stamina: 80, hair: 'buzz', hairColor: '#1a1a1a', skinTone: '#6B4226' },
      { name: 'Almada', num: 10, pos: 'DEF', speed: 80, shooting: 72, passing: 80, defense: 48, gk: 10, stamina: 82, hair: 'short', hairColor: '#3a2a1a', skinTone: '#C4A882' },
      { name: 'Sosa', num: 24, pos: 'MID', speed: 74, shooting: 68, passing: 78, defense: 58, gk: 10, stamina: 80, hair: 'short', hairColor: '#3a2a1a', skinTone: '#C4A882' },
      { name: 'Araujo', num: 19, pos: 'FWD', speed: 82, shooting: 76, passing: 62, defense: 28, gk: 10, stamina: 78, hair: 'short', hairColor: '#1a1a1a', skinTone: '#C4A882' },
    ]
  },
  {
    id: 'seattle', name: 'Seattle Sounders', shortName: 'SEA', country: 'USA',
    league: 'MLS',
    primaryColor: '#005595', secondaryColor: '#005595', tertiaryColor: '#69BE28',
    shortsColor: '#005595', socksColor: '#005595',
    kitPattern: 'solid',
    rating: 76,
    formation: '1-2-1-1',
    players: [
      { name: 'Frei', num: 24, pos: 'GK', speed: 42, shooting: 10, passing: 58, defense: 34, gk: 80, stamina: 68, hair: 'buzz', hairColor: '#3a2a1a', skinTone: '#F5D6BA' },
      { name: 'Yeimar', num: 28, pos: 'DEF', speed: 76, shooting: 35, passing: 58, defense: 78, gk: 10, stamina: 80, hair: 'buzz', hairColor: '#1a1a1a', skinTone: '#6B4226' },
      { name: 'Roldan', num: 7, pos: 'DEF', speed: 74, shooting: 62, passing: 76, defense: 72, gk: 10, stamina: 84, hair: 'short', hairColor: '#1a1a1a', skinTone: '#C4A882' },
      { name: 'Rusnak', num: 11, pos: 'MID', speed: 76, shooting: 74, passing: 80, defense: 42, gk: 10, stamina: 78, hair: 'short', hairColor: '#3a2a1a', skinTone: '#F5D6BA' },
      { name: 'Jordan Morris', num: 13, pos: 'FWD', speed: 86, shooting: 76, passing: 65, defense: 30, gk: 10, stamina: 82, hair: 'short', hairColor: '#3a2a1a', skinTone: '#F5D6BA' },
    ]
  },
  {
    id: 'nycfc', name: 'New York City FC', shortName: 'NYCFC', country: 'USA',
    league: 'MLS',
    primaryColor: '#6CACE4', secondaryColor: '#041E42', tertiaryColor: '#F15524',
    shortsColor: '#041E42', socksColor: '#6CACE4',
    kitPattern: 'solid',
    rating: 73,
    formation: '1-2-1-1',
    players: [
      { name: 'Johnson', num: 1, pos: 'GK', speed: 46, shooting: 12, passing: 58, defense: 34, gk: 78, stamina: 72, hair: 'short', hairColor: '#3a2a1a', skinTone: '#F5D6BA' },
      { name: 'Martins', num: 3, pos: 'DEF', speed: 74, shooting: 35, passing: 60, defense: 76, gk: 10, stamina: 78, hair: 'buzz', hairColor: '#1a1a1a', skinTone: '#8B6914' },
      { name: 'Morales', num: 8, pos: 'DEF', speed: 72, shooting: 58, passing: 74, defense: 72, gk: 10, stamina: 80, hair: 'short', hairColor: '#1a1a1a', skinTone: '#C4A882' },
      { name: 'Rodriguez', num: 10, pos: 'MID', speed: 78, shooting: 72, passing: 78, defense: 42, gk: 10, stamina: 78, hair: 'short', hairColor: '#3a2a1a', skinTone: '#C4A882' },
      { name: 'Talles Magno', num: 43, pos: 'FWD', speed: 84, shooting: 74, passing: 68, defense: 28, gk: 10, stamina: 80, hair: 'curly', hairColor: '#1a1a1a', skinTone: '#8B6914' },
    ]
  },

  // === SOUTH AMERICA ===
  {
    id: 'boca', name: 'Boca Juniors', shortName: 'BOCA', country: 'Argentina',
    league: 'Liga Profesional',
    primaryColor: '#003DA5', secondaryColor: '#FFD200', tertiaryColor: '#FFD200',
    shortsColor: '#003DA5', socksColor: '#003DA5',
    kitPattern: 'hoopSingle',
    rating: 78,
    formation: '1-2-1-1',
    players: [
      { name: 'Romero', num: 1, pos: 'GK', speed: 46, shooting: 12, passing: 58, defense: 34, gk: 80, stamina: 70, hair: 'short', hairColor: '#1a1a1a', skinTone: '#C4A882' },
      { name: 'Rojo', num: 6, pos: 'DEF', speed: 68, shooting: 40, passing: 62, defense: 78, gk: 10, stamina: 76, hair: 'buzz', hairColor: '#3a2a1a', skinTone: '#C4A882' },
      { name: 'Medina', num: 28, pos: 'DEF', speed: 74, shooting: 58, passing: 74, defense: 72, gk: 10, stamina: 82, hair: 'short', hairColor: '#1a1a1a', skinTone: '#C4A882' },
      { name: 'Fernandez', num: 10, pos: 'MID', speed: 76, shooting: 72, passing: 78, defense: 48, gk: 10, stamina: 80, hair: 'medium', hairColor: '#3a2a1a', skinTone: '#C4A882' },
      { name: 'Cavani', num: 9, pos: 'FWD', speed: 78, shooting: 84, passing: 68, defense: 42, gk: 10, stamina: 76, hair: 'short', hairColor: '#3a2a1a', skinTone: '#D4A574' },
    ]
  },
  {
    id: 'flamengo', name: 'Flamengo', shortName: 'FLA', country: 'Brazil',
    league: 'Brasileirao',
    primaryColor: '#D10000', secondaryColor: '#000000', tertiaryColor: '#FFFFFF',
    shortsColor: '#000000', socksColor: '#D10000',
    kitPattern: 'hoops',
    rating: 80,
    formation: '1-2-1-1',
    players: [
      { name: 'Santos', num: 1, pos: 'GK', speed: 48, shooting: 14, passing: 58, defense: 34, gk: 82, stamina: 70, hair: 'short', hairColor: '#1a1a1a', skinTone: '#8B6914' },
      { name: 'Fabrizio', num: 4, pos: 'DEF', speed: 74, shooting: 38, passing: 62, defense: 78, gk: 10, stamina: 80, hair: 'short', hairColor: '#1a1a1a', skinTone: '#6B4226' },
      { name: 'Gerson', num: 20, pos: 'DEF', speed: 76, shooting: 68, passing: 80, defense: 72, gk: 10, stamina: 84, hair: 'buzz', hairColor: '#1a1a1a', skinTone: '#6B4226' },
      { name: 'De Arrascaeta', num: 14, pos: 'MID', speed: 78, shooting: 78, passing: 84, defense: 42, gk: 10, stamina: 78, hair: 'medium', hairColor: '#3a2a1a', skinTone: '#C4A882' },
      { name: 'Pedro', num: 9, pos: 'FWD', speed: 80, shooting: 82, passing: 68, defense: 30, gk: 10, stamina: 78, hair: 'short', hairColor: '#3a2a1a', skinTone: '#C4A882' },
    ]
  },
  {
    id: 'river', name: 'River Plate', shortName: 'RIVER', country: 'Argentina',
    league: 'Liga Profesional',
    primaryColor: '#FFFFFF', secondaryColor: '#D10000', tertiaryColor: '#D10000',
    shortsColor: '#000000', socksColor: '#FFFFFF',
    kitPattern: 'sash',
    rating: 78,
    formation: '1-2-1-1',
    players: [
      { name: 'Armani', num: 1, pos: 'GK', speed: 44, shooting: 10, passing: 58, defense: 34, gk: 82, stamina: 68, hair: 'short', hairColor: '#3a2a1a', skinTone: '#D4A574' },
      { name: 'P. Diaz', num: 17, pos: 'DEF', speed: 76, shooting: 42, passing: 68, defense: 78, gk: 10, stamina: 80, hair: 'short', hairColor: '#1a1a1a', skinTone: '#C4A882' },
      { name: 'Enzo Perez', num: 24, pos: 'DEF', speed: 68, shooting: 58, passing: 76, defense: 74, gk: 10, stamina: 78, hair: 'short', hairColor: '#3a2a1a', skinTone: '#D4A574' },
      { name: 'Barco', num: 20, pos: 'MID', speed: 82, shooting: 72, passing: 78, defense: 38, gk: 10, stamina: 78, hair: 'curly', hairColor: '#3a2a1a', skinTone: '#C4A882' },
      { name: 'Borja', num: 9, pos: 'FWD', speed: 80, shooting: 80, passing: 62, defense: 28, gk: 10, stamina: 76, hair: 'buzz', hairColor: '#1a1a1a', skinTone: '#6B4226' },
    ]
  },

  // === REST OF WORLD ===
  {
    id: 'al_hilal', name: 'Al Hilal', shortName: 'HILAL', country: 'Saudi Arabia',
    league: 'Saudi Pro League',
    primaryColor: '#003DA5', secondaryColor: '#003DA5', tertiaryColor: '#FFFFFF',
    shortsColor: '#FFFFFF', socksColor: '#003DA5',
    kitPattern: 'solid',
    rating: 82,
    formation: '1-2-1-1',
    players: [
      { name: 'Bono', num: 1, pos: 'GK', speed: 48, shooting: 12, passing: 58, defense: 36, gk: 84, stamina: 72, hair: 'short', hairColor: '#1a1a1a', skinTone: '#C4A882' },
      { name: 'Koulibaly', num: 4, pos: 'DEF', speed: 72, shooting: 38, passing: 58, defense: 84, gk: 10, stamina: 78, hair: 'buzz', hairColor: '#1a1a1a', skinTone: '#6B4226' },
      { name: 'Ruben Neves', num: 8, pos: 'DEF', speed: 70, shooting: 72, passing: 84, defense: 74, gk: 10, stamina: 82, hair: 'short', hairColor: '#3a2a1a', skinTone: '#D4A574' },
      { name: 'Milinkovic', num: 10, pos: 'MID', speed: 74, shooting: 78, passing: 82, defense: 62, gk: 10, stamina: 80, hair: 'short', hairColor: '#3a2a1a', skinTone: '#F5D6BA' },
      { name: 'Neymar', num: 10, pos: 'FWD', speed: 88, shooting: 84, passing: 86, defense: 32, gk: 10, stamina: 68, hair: 'medium', hairColor: '#1a1a1a', skinTone: '#C4A882' },
    ]
  },
  {
    id: 'sporting', name: 'Sporting CP', shortName: 'SCP', country: 'Portugal',
    league: 'Liga Portugal',
    primaryColor: '#006633', secondaryColor: '#FFFFFF', tertiaryColor: '#FFFFFF',
    shortsColor: '#000000', socksColor: '#006633',
    kitPattern: 'stripes',
    rating: 79,
    formation: '1-2-1-1',
    players: [
      { name: 'Adan', num: 1, pos: 'GK', speed: 44, shooting: 10, passing: 58, defense: 34, gk: 82, stamina: 68, hair: 'short', hairColor: '#3a2a1a', skinTone: '#D4A574' },
      { name: 'Coates', num: 4, pos: 'DEF', speed: 66, shooting: 45, passing: 60, defense: 82, gk: 10, stamina: 74, hair: 'short', hairColor: '#3a2a1a', skinTone: '#C4A882' },
      { name: 'Palhinha', num: 6, pos: 'DEF', speed: 72, shooting: 62, passing: 74, defense: 82, gk: 10, stamina: 86, hair: 'buzz', hairColor: '#3a2a1a', skinTone: '#D4A574' },
      { name: 'Pedro Goncalves', num: 28, pos: 'MID', speed: 80, shooting: 78, passing: 80, defense: 42, gk: 10, stamina: 78, hair: 'short', hairColor: '#3a2a1a', skinTone: '#D4A574' },
      { name: 'Gyokeres', num: 9, pos: 'FWD', speed: 86, shooting: 84, passing: 68, defense: 38, gk: 10, stamina: 84, hair: 'short', hairColor: '#D4A574', skinTone: '#F5D6BA' },
    ]
  },
];

// League groupings for menu display
const LEAGUES = [
  { name: 'Premier League', country: 'England', teams: ['man_utd', 'liverpool', 'chelsea', 'arsenal', 'man_city', 'tottenham'] },
  { name: 'La Liga', country: 'Spain', teams: ['real_madrid', 'barcelona', 'atletico'] },
  { name: 'Serie A', country: 'Italy', teams: ['ac_milan', 'juventus', 'inter', 'napoli'] },
  { name: 'Bundesliga', country: 'Germany', teams: ['bayern', 'dortmund'] },
  { name: 'Ligue 1', country: 'France', teams: ['psg', 'marseille'] },
  { name: 'MLS', country: 'USA', teams: ['chicago_fire', 'la_galaxy', 'inter_miami', 'atlanta', 'seattle', 'nycfc'] },
  { name: 'Other European', country: 'Europe', teams: ['ajax', 'porto', 'celtic', 'galatasaray', 'sporting'] },
  { name: 'South America', country: 'S. America', teams: ['boca', 'flamengo', 'river'] },
  { name: 'Rest of World', country: 'World', teams: ['al_hilal'] },
];

function getTeamById(id) {
  return TEAMS.find(t => t.id === id);
}
