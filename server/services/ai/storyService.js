const { GoogleGenerativeAI } = require('@google/generative-ai')
const Groq = require('groq-sdk')
const logger = require('../../utils/logger')

const TOTAL_PAGES = 16

const ART_STYLE_DESCRIPTORS = {
  watercolor: 'soft watercolor illustration, gentle brush strokes, pastel tones, children\'s book painting style, warm and dreamy',
  comic: 'vibrant comic book illustration, bold clean outlines, bright saturated colors, dynamic composition, graphic novel art for children',
  storybook: 'classic storybook illustration, detailed pen and ink with color wash, whimsical and detailed, reminiscent of classic fairy-tale art',
}

const THEME_CONTEXT = {
  'save-the-world': 'The child discovers a crisis threatening their world and uses their special job skills to save the day.',
  'magic-quest': 'A magical quest unfolds where the child must find a legendary artifact using cleverness and courage.',
  'ocean-journey': 'An epic ocean adventure where the child explores underwater kingdoms and befriends sea creatures.',
  'mountain-hero': 'A daring mountain expedition where the child conquers impossible peaks and discovers hidden treasures.',
  'city-adventure': 'An exciting urban adventure through a fantastic city where the child solves a great mystery.',
  'space-mission': 'An intergalactic space mission where the child travels to distant planets to complete a heroic task.',
}

const SYSTEM_PROMPT = `You are a world-class children's book author specializing in personalized stories for children aged 1-12. You create warm, exciting, age-appropriate adventures where the named child is always the brave and capable hero.

Your stories follow this structure across exactly ${TOTAL_PAGES} pages:
- Pages 1-2: Introduction — establish the world, introduce the child hero and their special talent
- Pages 3-5: The Call — discover the challenge or adventure that needs the hero's help
- Pages 6-11: The Journey — obstacles, allies (best friend, pet), and growing skills
- Pages 12-13: The Crisis — the hardest moment, the child doubts but perseveres
- Pages 14-15: The Resolution — the child uses their job skills to triumph magnificently
- Page 16: Celebration — the child is celebrated as a hero, looking forward to the next adventure

LANGUAGE RULES:
- Match vocabulary and sentence complexity precisely to the child's age (age 1-3: very simple 1-2 short sentences; age 4-6: simple sentences 2-3; age 7-9: engaging sentences 2-4; age 10-12: richer narrative 3-5 sentences)
- Always refer to the child by their first name
- Use present tense for immediacy ("Emma runs", not "Emma ran")
- End most pages with a gentle hook to turn the page

IMAGE PROMPT RULES (critical — quality and VARIETY of illustrations depends entirely on this):
- imagePrompt MUST ALWAYS BE WRITTEN IN ENGLISH regardless of story language
- Structure every prompt as: [CHARACTER + ACTION] + [UNIQUE SETTING] + [LIGHTING + MOOD] — aim for 35-55 words
- CHARACTER: always write "brave young [boy/girl] child hero in [their favourite colour] outfit" — include what they are holding or doing relevant to their job
- ACTION: use vivid present-tense action verbs — VARY the actions across pages (soaring, racing, discovering, building, healing, diving, climbing, conjuring, leaping, hiding, triumphantly raising, presenting, consoling, leading)
- SETTING — THIS IS CRITICAL: EVERY PAGE MUST SHOW A COMPLETELY DIFFERENT LOCATION AND ENVIRONMENT:
  * Pages 1-2: the child's home neighbourhood or school
  * Pages 3-5: a new location they travel to (forest, mountain, market, rooftop, cave, harbour)
  * Pages 6-8: an even more exotic or magical place (underground chamber, floating island, ancient ruins, underwater)
  * Pages 9-11: the most dramatic environment yet (volcano rim, storm clouds, palace throne room, deep jungle)
  * Pages 12-13: the crisis location — dark, threatening, high stakes
  * Pages 14-15: the triumph location — open sky, bright plaza, summit, stage
  * Page 16: celebration back home or in a magical hall
- LIGHTING: always end with a lighting phrase that matches the story mood — vary it per page (warm golden sunrise, dramatic lightning-lit sky, soft magical twilight, cool moonlight, blazing noon sun, flickering torchlight, rainbow after storm)
- NEVER describe the face or eyes — only silhouette, posture, clothing, and action
- NEVER write two consecutive prompts with the same location or background elements
- NO language other than English — NO Arabic, NO French, NO German

OUTPUT FORMAT:
You MUST return ONLY valid JSON — no markdown, no explanation, no preamble. The JSON must have exactly this shape:
{
  "title": "string — the book title (e.g. 'Emma and the Ocean Quest')",
  "pages": [
    {
      "pageNumber": 1,
      "text": "string — the story text for this page",
      "imagePrompt": "string — the illustration prompt for this page"
    }
  ]
}

The pages array MUST contain exactly ${TOTAL_PAGES} entries numbered 1 through ${TOTAL_PAGES}.`

function buildUserPrompt(child, bookParams) {
  const {
    name, age, gender, language, culture,
    bestFriendName, petName, favoriteColor, favoriteFood, hometown,
  } = child

  const { chosenJob, storyTheme, episodeNumber, dedication } = bookParams

  const genderPronoun = gender === 'girl' ? 'she/her' : gender === 'boy' ? 'he/him' : 'they/them'
  const artStyleDesc = ART_STYLE_DESCRIPTORS[bookParams.artStyle] || ART_STYLE_DESCRIPTORS.watercolor
  const themeContext = THEME_CONTEXT[storyTheme] || THEME_CONTEXT['save-the-world']

  const personalDetails = [
    `Child's name: ${name}`,
    `Age: ${age} years old`,
    `Gender: ${gender} (pronouns: ${genderPronoun})`,
    `Dream job / role in the story: ${chosenJob}`,
    `Story theme: ${themeContext}`,
    `Art style: ${bookParams.artStyle} — use this descriptor in every imagePrompt: "${artStyleDesc}"`,
    `Book language: ${language} — WRITE THE ENTIRE STORY IN ${language.toUpperCase()}`,
    culture ? `Cultural background: ${culture} — weave culturally appropriate names, foods, and settings naturally into the story` : null,
    hometown ? `Hometown: ${hometown} — use this as a story setting detail` : null,
    bestFriendName ? `Best friend: ${bestFriendName} — appears as an important supporting character` : null,
    petName ? `Pet: ${petName} — appears as a loyal companion who helps at a key moment` : null,
    favoriteColor ? `Favourite colour: ${favoriteColor} — feature this colour on the hero's costume or outfit` : null,
    favoriteFood ? `Favourite food: ${favoriteFood} — mention it as a reward or comfort moment` : null,
    episodeNumber > 1 ? `This is Episode ${episodeNumber} of ${name}'s Hero Universe — reference that they have been on adventures before and are becoming a legendary hero` : null,
    dedication ? `Dedication (for page 1): "${dedication}"` : null,
  ].filter(Boolean).join('\n')

  const heroDesc = `brave young ${gender === 'girl' ? 'girl' : gender === 'boy' ? 'boy' : 'child'} hero${favoriteColor ? ` in ${favoriteColor} outfit` : ''}`

  return `Create a complete ${TOTAL_PAGES}-page personalized children's adventure book with these details:

${personalDetails}

IMAGE PROMPT CHARACTER RULE — IMPORTANT:
In every single imagePrompt, the main character MUST be described as: "${heroDesc}"
This exact phrasing ensures consistent character appearance across all 16 illustrations.

Remember:
1. ${name} is ALWAYS the hero — they must solve the problem themselves using their ${chosenJob} skills
2. Every single page needs BOTH a "text" field and an "imagePrompt" field
3. Write the story entirely in ${language}
4. imagePrompt fields MUST be in English regardless of the story language
5. Every imagePrompt must follow the structure: [character doing action] + [specific setting with 2-3 details] + [lighting/mood phrase]
6. Return ONLY the JSON object — no other text`
}

async function parseStoryResponse(content) {
  const cleaned = content
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  let parsed
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No valid JSON object found in story response')
    parsed = JSON.parse(match[0])
  }

  if (!parsed.title || typeof parsed.title !== 'string') {
    throw new Error('Story response missing title')
  }
  if (!Array.isArray(parsed.pages)) {
    throw new Error('Story response missing pages array')
  }
  if (parsed.pages.length !== TOTAL_PAGES) {
    throw new Error(`Expected ${TOTAL_PAGES} pages, got ${parsed.pages.length}`)
  }

  parsed.pages.forEach((page, i) => {
    if (!page.text || !page.imagePrompt) {
      throw new Error(`Page ${i + 1} missing text or imagePrompt`)
    }
    page.pageNumber = i + 1
  })

  return parsed
}

// ─── GEMINI PROVIDER ──────────────────────────────────────────────────────────
async function generateWithGemini(child, bookParams) {
  const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genai.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  })

  const result = await model.generateContent(buildUserPrompt(child, bookParams))
  const text = result.response.text()
  if (!text) throw new Error('Empty response from Gemini API')
  return text
}

// ─── GROQ PROVIDER ────────────────────────────────────────────────────────────
async function generateWithGroq(child, bookParams) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant'

  const completion = await groq.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(child, bookParams) },
    ],
    temperature: 0.9,
    max_tokens: 4000,
  })

  const text = completion.choices[0]?.message?.content
  if (!text) throw new Error('Empty response from Groq API')
  return text
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
exports.generateStory = async function (child, bookParams) {
  const providers = [
    { name: 'Gemini', fn: generateWithGemini },
    { name: 'Groq', fn: generateWithGroq },
  ]

  let lastError
  for (const provider of providers) {
    try {
      logger.info(`[storyService] Trying ${provider.name} for "${child.name}"`)
      const startTime = Date.now()
      const rawContent = await provider.fn(child, bookParams)
      logger.info(`[storyService] ${provider.name} responded in ${Date.now() - startTime}ms`)

      const story = await parseStoryResponse(rawContent)
      logger.info(`[storyService] Story parsed via ${provider.name}: "${story.title}", ${story.pages.length} pages`)
      return story
    } catch (err) {
      logger.warn(`[storyService] ${provider.name} failed: ${err.message}`)
      lastError = err

      const isQuota =
        err.status === 429 ||
        err.message?.includes('rate_limit') ||
        err.message?.includes('quota') ||
        err.message?.includes('Too Many Requests') ||
        err.message?.includes('RESOURCE_EXHAUSTED') ||
        err.message?.includes('reduce your message size')

      if (!isQuota) {
        // Non-quota error (bad JSON, network, etc.) — don't try next provider
        throw err
      }
      // Quota error — try next provider
    }
  }

  throw lastError
}
