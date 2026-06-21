/**
 * characterDatabase.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Database of character-inspired looks and aesthetics for the recommendation engine.
 */

export const characters = [
  // ── BOLLYWOOD ─────────────────────────────────────────────────────────────
  {
    id: 'veronica_cocktail',
    name: 'Veronica',
    source: 'Cocktail',
    category: 'Bollywood',
    faceShapes: ['Oval', 'Heart'],
    hairTypes: ['Type 2A-2C', 'Type 1A-1C'],
    styleProfiles: ["Women's Styles", "Custom Mix"],
    occasions: ['Party', 'Wedding', 'Date Night', 'Festival'],
    aesthetics: ['Soft Glam', 'Luxury Chic'],
    stylingNotes: 'Soft layered waves with volume at the crown and natural glam makeup.',
    hairstyles: ['Long Layers', 'Butterfly Cut']
  },
  {
    id: 'kaira_dearzindagi',
    name: 'Kaira',
    source: 'Dear Zindagi',
    category: 'Bollywood',
    faceShapes: ['Oval', 'Round'],
    hairTypes: ['Type 2A-2C', 'Type 3A-3C'],
    styleProfiles: ["Women's Styles", "Custom Mix"],
    occasions: ['Everyday', 'College Farewell', 'Casual Refresh', 'Vacation'],
    aesthetics: ['Boho', 'Soft Glam'],
    stylingNotes: 'Effortless beach waves with minimal, fresh-faced makeup.',
    hairstyles: ['Textured Lob', 'Beach Waves']
  },
  {
    id: 'naina_yjhd',
    name: 'Naina',
    source: 'Yeh Jawaani Hai Deewani',
    category: 'Bollywood',
    faceShapes: ['Round', 'Square', 'Oval'],
    hairTypes: ['Type 1A-1C', 'Type 2A-2C'],
    styleProfiles: ["Women's Styles", "Custom Mix"],
    occasions: ['Wedding', 'Engagement', 'Reception', 'Festival'],
    aesthetics: ['Royal Traditional', 'Soft Glam'],
    stylingNotes: 'Sleek straight hair transitioning into soft curls, paired with defined eyes.',
    hairstyles: ['Straight with Curled Ends', 'Half-Up Half-Down']
  },
  {
    id: 'rani_rockyaurrani',
    name: 'Rani',
    source: 'Rocky Aur Rani Kii Prem Kahaani',
    category: 'Bollywood',
    faceShapes: ['Square', 'Rectangle', 'Heart'],
    hairTypes: ['Type 2A-2C', 'Type 3A-3C'],
    styleProfiles: ["Women's Styles", "Custom Mix"],
    occasions: ['Wedding', 'Festival', 'Party'],
    aesthetics: ['Royal Traditional', 'Bold Glam'],
    stylingNotes: 'Voluminous blown-out hair with dramatic kohl-rimmed eyes and nude lips.',
    hairstyles: ['Voluminous Blowout', 'Soft Curls']
  },
  {
    id: 'kabir_singh',
    name: 'Kabir',
    source: 'Kabir Singh',
    category: 'Bollywood',
    faceShapes: ['Square', 'Oblong', 'Rectangle'],
    hairTypes: ['Type 2A-2C', 'Type 1A-1C'],
    styleProfiles: ["Men's Styles", "Custom Mix"],
    occasions: ['Casual Refresh', 'Date Night'],
    aesthetics: ['Rugged', 'Casual'],
    stylingNotes: 'Grown-out textured fringe with a well-maintained beard.',
    hairstyles: ['Messy Fringe', 'Mid-Length Flow']
  },
  {
    id: 'ranbir_yjhd',
    name: 'Bunny',
    source: 'Yeh Jawaani Hai Deewani',
    category: 'Bollywood',
    faceShapes: ['Heart', 'Oval'],
    hairTypes: ['Type 1A-1C', 'Type 2A-2C'],
    styleProfiles: ["Men's Styles", "Custom Mix"],
    occasions: ['Wedding', 'Party', 'Festival'],
    aesthetics: ['Charming', 'Soft Glam'],
    stylingNotes: 'Classic gelled back hair with slight volume at the front for a neat festive look.',
    hairstyles: ['Textured Quiff', 'Classic Swept Back']
  },

  // ── HOLLYWOOD ─────────────────────────────────────────────────────────────
  {
    id: 'blair_waldorf',
    name: 'Blair Waldorf',
    source: 'Gossip Girl',
    category: 'Hollywood',
    faceShapes: ['Round', 'Heart'],
    hairTypes: ['Type 1A-1C', 'Type 2A-2C'],
    styleProfiles: ["Women's Styles", "Custom Mix"],
    occasions: ['Party', 'Date Night', 'Office Event'],
    aesthetics: ['Old Money', 'Preppy', 'Luxury Chic'],
    stylingNotes: 'Polished, structured waves often accessorized with headbands. Classic red lip.',
    hairstyles: ['Polished Waves', 'Sleek Blowout']
  },
  {
    id: 'emily_cooper',
    name: 'Emily Cooper',
    source: 'Emily in Paris',
    category: 'Hollywood',
    faceShapes: ['Oval', 'Oblong'],
    hairTypes: ['Type 2A-2C', 'Type 3A-3C'],
    styleProfiles: ["Women's Styles", "Custom Mix"],
    occasions: ['Date Night', 'Vacation', 'Party'],
    aesthetics: ['Chic', 'Bold Glam'],
    stylingNotes: 'Bouncy, defined curls with a deep side part and bold statement lips.',
    hairstyles: ['Bouncy Curls', 'Deep Side Part']
  },
  {
    id: 'rachel_green',
    name: 'Rachel Green',
    source: 'Friends',
    category: 'Hollywood',
    faceShapes: ['Square', 'Rectangle', 'Diamond'],
    hairTypes: ['Type 1A-1C'],
    styleProfiles: ["Women's Styles", "Custom Mix"],
    occasions: ['Everyday', 'Office Event', 'Casual Refresh'],
    aesthetics: ['90s Minimalist', 'Soft Glam'],
    stylingNotes: 'The iconic layered face-framing "Rachel" cut with natural minimalist makeup.',
    hairstyles: ['Layered Shag', 'Face-Framing Layers']
  },
  {
    id: 'harvey_specter',
    name: 'Harvey Specter',
    source: 'Suits',
    category: 'Hollywood',
    faceShapes: ['Square', 'Oblong'],
    hairTypes: ['Type 1A-1C', 'Type 2A-2C'],
    styleProfiles: ["Men's Styles", "Custom Mix"],
    occasions: ['Office Event', 'Interview', 'Wedding'],
    aesthetics: ['Corporate Executive', 'Old Money'],
    stylingNotes: 'Impeccably styled hard-part with a pompadour fade. Sharp and commanding.',
    hairstyles: ['Hard Part Pompadour', 'Slicked Back']
  },

  // ── K-DRAMA ───────────────────────────────────────────────────────────────
  {
    id: 'hong_haein',
    name: 'Hong Hae-in',
    source: 'Queen of Tears',
    category: 'K-Drama',
    faceShapes: ['Oval', 'Heart'],
    hairTypes: ['Type 1A-1C', 'Type 2A-2C'],
    styleProfiles: ["Women's Styles", "Custom Mix"],
    occasions: ['Office Event', 'Corporate Event', 'Date Night'],
    aesthetics: ['Corporate Executive', 'Korean Minimalist', 'Luxury Chic'],
    stylingNotes: 'Ultra-sleek, glossy straight hair or subtle waves with dewy "glass skin" makeup.',
    hairstyles: ['Glass Hair Straight', 'Subtle C-Curl']
  },
  {
    id: 'ri_jeonghyeok',
    name: 'Ri Jeong-hyeok',
    source: 'Crash Landing on You',
    category: 'K-Drama',
    faceShapes: ['Oval', 'Square'],
    hairTypes: ['Type 1A-1C'],
    styleProfiles: ["Men's Styles", "Custom Mix"],
    occasions: ['Everyday', 'Date Night', 'Office Event'],
    aesthetics: ['Korean Minimalist', 'Clean'],
    stylingNotes: 'Soft, textured two-block cut that frames the face elegantly.',
    hairstyles: ['Two-Block Cut', 'Soft Textured Fringe']
  },
  {
    id: 'kang_taemoo',
    name: 'Kang Tae-moo',
    source: 'Business Proposal',
    category: 'K-Drama',
    faceShapes: ['Oblong', 'Rectangle', 'Oval'],
    hairTypes: ['Type 1A-1C', 'Type 2A-2C'],
    styleProfiles: ["Men's Styles", "Custom Mix"],
    occasions: ['Interview', 'Office Event', 'Corporate Event'],
    aesthetics: ['Corporate Executive', 'Luxury Chic'],
    stylingNotes: 'Sleek, parted comma hair (curved fringe) for a sharp, wealthy CEO look.',
    hairstyles: ['Comma Hair', 'Slick Side Part']
  },

  // ── AESTHETICS (Generic / Gender-Neutral representations) ────────────────
  {
    id: 'old_money_aesthetic',
    name: 'Old Money Heir',
    source: 'Aesthetic',
    category: 'Aesthetics',
    faceShapes: ['Square', 'Oval', 'Oblong', 'Rectangle'],
    hairTypes: ['Type 1A-1C', 'Type 2A-2C'],
    styleProfiles: ["Men's Styles", "Women's Styles", "Gender-Neutral Styles", "Custom Mix"],
    occasions: ['Party', 'Wedding', 'Date Night'],
    aesthetics: ['Old Money', 'Luxury Chic'],
    stylingNotes: 'Understated elegance. Blowouts for long hair; perfectly swept classic tapers for short hair.',
    hairstyles: ['Classic Taper', 'Voluminous Blowout', 'Swept Back']
  },
  {
    id: 'korean_minimalist',
    name: 'Seoul Street Style',
    source: 'Aesthetic',
    category: 'Aesthetics',
    faceShapes: ['Heart', 'Oval', 'Round'],
    hairTypes: ['Type 1A-1C'],
    styleProfiles: ["Men's Styles", "Women's Styles", "Gender-Neutral Styles", "Custom Mix"],
    occasions: ['Everyday', 'College Farewell', 'Casual Refresh'],
    aesthetics: ['Korean Minimalist'],
    stylingNotes: 'Focus on healthy, glowing skin (glass skin) and soft, unstructured hair.',
    hairstyles: ['Soft Shag', 'Hush Cut', 'Two-Block']
  },
  {
    id: 'soft_glam_neutral',
    name: 'Soft Glam Elegance',
    source: 'Aesthetic',
    category: 'Aesthetics',
    faceShapes: ['Diamond', 'Heart', 'Oval'],
    hairTypes: ['Type 2A-2C', 'Type 3A-3C'],
    styleProfiles: ["Men's Styles", "Women's Styles", "Gender-Neutral Styles", "Custom Mix"],
    occasions: ['Wedding', 'Reception', 'Engagement'],
    aesthetics: ['Soft Glam'],
    stylingNotes: 'Blurred boundaries, soft contouring, and enhanced natural textures.',
    hairstyles: ['Textured Curls', 'Soft Updo', 'Brushed-out Waves']
  }
]
