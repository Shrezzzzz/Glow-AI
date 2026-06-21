import { getSalonsForLocation } from './googlePlacesService'
import { characters } from '../data/characterDatabase'

function normalise(str) {
  if (!str) return ''
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, '')
}

/**
 * Local AI Concierge Service
 * Structured so it can be easily swapped with OpenAI/Claude/Gemini later.
 */
export async function generateConciergeResponse(userMessage, profileState, coords) {
  const { faceShape, skinAnalysis, hairAnalysis, form } = profileState || {}
  const budget = form?.budgetRange || '₹3000'
  const intent = form?.userIntent || userMessage

  // 1. Personalized Beauty Plan (Mock AI Logic)
  const isWedding = normalise(intent).includes('wedding') || normalise(intent).includes('bridal')
  const plan = isWedding 
    ? `✨ Based on your profile:

**30-Day Wedding Glow Plan**
- **Week 1:** Hydration + skin recovery
- **Week 2:** Hair nourishment
- **Week 3:** Facial + brows
- **Week 4:** Final styling session

*Estimated Budget: ₹3500–₹4200*`
    : `✨ Based on your profile:

**Instant Glow-Up Plan**
- **Prep:** Deep cleanse & hydration
- **Styling:** Texture enhancement for your ${hairAnalysis?.technicalClassification || 'hair type'}
- **Finish:** Signature styling session

*Estimated Budget: ${budget}*`

  // 2. Character-Inspired Recommendation
  let bestCharacter = characters[0]
  let maxScore = 0
  const intentWords = normalise(intent).split(/\s+/)

  characters.forEach(char => {
    let score = 50
    // Face shape match
    if (faceShape?.technicalClassification && char.faceShapes.includes(faceShape.technicalClassification)) score += 15
    // Style profile match
    if (form?.styleProfile && char.styleProfiles.includes(form.styleProfile)) score += 20
    // Intent semantic match
    const targetText = [char.name, char.source, ...char.aesthetics, char.stylingNotes].map(normalise).join(' ')
    let intentHits = 0
    intentWords.forEach(word => {
      if (word.length > 3 && targetText.includes(word)) intentHits++
    })
    score += (intentHits * 10)

    if (score > maxScore) {
      maxScore = score
      bestCharacter = char
    }
  })

  // Format Character Recommendation
  const characterRec = `**Character Inspiration: ${bestCharacter.name} (${bestCharacter.source})**
- **Why it suits you:** ${bestCharacter.stylingNotes}
- **Suggested Hairstyle:** ${bestCharacter.aesthetics.join(', ')}
- **Match Score:** ${Math.min(99, maxScore)}%`

  // 3. Salon Recommendations
  let salons = []
  try {
    const rawSalons = await getSalonsForLocation(coords || { lat: 19.0760, lng: 72.8777 }, 5000, {})
    salons = rawSalons.slice(0, 3).map((s, i) => ({
      ...s,
      matchScore: 95 - (i * 3) // Mock match score
    }))
  } catch (error) {
    console.error("Failed to fetch salons", error)
  }

  let salonText = salons.length > 0 ? `\n\n**Top Salons for this look:**\n` : ''
  salons.forEach((s, i) => {
    salonText += `${i + 1}. **${s.name}**
   ⭐ ${s.rating}
   ${s.distance.toFixed(1)} km away
   ${s.matchScore}% match\n\n`
  })

  // Combine Response
  const fullResponse = `${plan}\n\n${characterRec}${salonText}Let me know if you want me to book one of these for you! ✨`

  return fullResponse
}
