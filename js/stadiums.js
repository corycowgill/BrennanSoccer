// Brennan's Soccer Showdown - Stadium Data
// 3 distinct stadium environments

const STADIUMS = [
  {
    id: 'grand_arena',
    name: 'The Grand Arena',
    subtitle: 'London, England',
    capacity: '80,000',
    description: 'A legendary European cathedral of football',
    // Visual theme
    skyGradient: ['#1a1a3e', '#2d2d6e', '#4a4a8a'],  // Night sky
    floodlights: true,
    crowdColor1: '#cc3333',
    crowdColor2: '#3333cc',
    crowdColor3: '#cccc33',
    crowdDensity: 0.95,
    // Pitch
    grassColor1: '#2d8c3c',
    grassColor2: '#34a045',
    // Stadium structure
    standColor: '#555566',
    standAccent: '#888899',
    roofColor: '#334',
    hasRoof: true,
    // Atmosphere
    ambience: 'roar',        // Crowd sound type
    weatherEffect: null,
    // Field surroundings
    trackColor: '#cc5533',   // Athletics track
    hasTrack: false,
    adBoardColors: ['#0066cc', '#cc0033', '#33cc33', '#ffcc00'],
  },
  {
    id: 'estadio_sol',
    name: 'Estadio del Sol',
    subtitle: 'Madrid, Spain',
    capacity: '65,000',
    description: 'A sunlit palace of the beautiful game',
    skyGradient: ['#87CEEB', '#5BA3D9', '#3A7BD5'],  // Daytime blue sky
    floodlights: false,
    crowdColor1: '#FFFFFF',
    crowdColor2: '#FFD700',
    crowdColor3: '#FF4444',
    crowdDensity: 0.90,
    grassColor1: '#3a9e4f',
    grassColor2: '#42b058',
    standColor: '#E8DCC8',
    standAccent: '#D4C4A8',
    roofColor: '#DDD',
    hasRoof: true,
    ambience: 'chant',
    weatherEffect: 'sun',
    hasTrack: false,
    adBoardColors: ['#ff6600', '#0099cc', '#cc0066', '#66cc00'],
  },
  {
    id: 'liberty_park',
    name: 'Liberty Park Stadium',
    subtitle: 'Chicago, USA',
    capacity: '45,000',
    description: 'Modern American soccer fortress by the lakefront',
    skyGradient: ['#ff7e5f', '#feb47b', '#ffcf8a'],  // Sunset
    floodlights: true,
    crowdColor1: '#ff3333',
    crowdColor2: '#3366ff',
    crowdColor3: '#ffffff',
    crowdDensity: 0.85,
    grassColor1: '#2b8a38',
    grassColor2: '#329e42',
    standColor: '#4A5568',
    standAccent: '#2D3748',
    roofColor: '#2D3748',
    hasRoof: false,
    ambience: 'drums',
    weatherEffect: null,
    hasTrack: false,
    adBoardColors: ['#e53e3e', '#3182ce', '#38a169', '#d69e2e'],
  },
];

function getStadiumById(id) {
  return STADIUMS.find(s => s.id === id);
}
