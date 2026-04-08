/* ============================================================
   Static data: Reply templates, AI prompts, workflow steps
   ============================================================ */

export const REPLY_TEMPLATES = [
  {
    id: 'gifted-reply', title: 'Gifted Collaboration Reply', icon: 'Gift', category: 'Inbound',
    text: `Hi [Contact Name],\n\nThank you so much for reaching out and thinking of me for this collaboration with [Brand Name]! I love what you're building.\n\nI'd be happy to consider a gifted collaboration. Before I confirm, could you share a few details?\n\n- What specific deliverables are you looking for? (e.g. Reels, Stories, TikToks, static posts)\n- What's the timeline for content to go live?\n- Are there any usage rights or exclusivity terms I should know about?\n\nI want to make sure we're aligned on expectations so we can create something amazing together.\n\nLooking forward to hearing from you!\n\nBest,\n[Your Name]`
  },
  {
    id: 'paid-reply', title: 'Paid Collaboration Reply', icon: 'DollarSign', category: 'Inbound',
    text: `Hi [Contact Name],\n\nThank you for reaching out about a paid collaboration with [Brand Name] — I appreciate you thinking of me!\n\nI'm definitely interested in learning more. To make sure this is a great fit for both sides, could you share:\n\n- The campaign brief or deliverables overview\n- Timeline and content go-live dates\n- Budget range for this partnership\n- Any exclusivity, usage rights, or whitelisting expectations\n\nI'm happy to send over my media kit and rate card as well. Let me know the best way to move forward!\n\nBest,\n[Your Name]`
  },
  {
    id: 'share-rates', title: '"Share Your Rates" Response', icon: 'Tag', category: 'Negotiation',
    text: `Hi [Contact Name],\n\nThanks for your interest in working together! I'd love to share my rates.\n\nHere's a quick overview of my standard pricing:\n\n- Instagram Reel: $[X]\n- Instagram Story Set (3-5 frames): $[X]\n- TikTok Video: $[X]\n- Bundle (Reel + Stories + TikTok): $[X]\n\nUsage rights and whitelisting/boosting are available at an additional cost depending on scope and duration.\n\nThese are starting rates — I'm always happy to discuss packages that fit your campaign goals and budget. Let me know what you have in mind!\n\nBest,\n[Your Name]`
  },
  {
    id: 'follow-up-ghost', title: 'Follow-Up If Brand Ghosts', icon: 'Clock', category: 'Follow-up',
    text: `Hi [Contact Name],\n\nI hope you're doing well! I wanted to follow up on our conversation about the [Brand Name] collaboration from [date/timeframe].\n\nI'm still very interested in working together and wanted to check in to see if there are any updates on the campaign timeline or next steps.\n\nHappy to jump on a quick call or continue over email — whatever works best for your team!\n\nLooking forward to hearing from you.\n\nBest,\n[Your Name]`
  },
  {
    id: 'decline', title: 'Decline Response', icon: 'XCircle', category: 'Closing',
    text: `Hi [Contact Name],\n\nThank you so much for thinking of me for this opportunity with [Brand Name]. I really appreciate you reaching out.\n\nAfter reviewing the details, I've decided this particular collaboration isn't the right fit for me at this time. I want to make sure every partnership I take on is one I can fully commit to and deliver my best work for.\n\nI hope we can stay connected for future opportunities — I'd love to collaborate when the timing and fit align!\n\nWishing you all the best with this campaign.\n\nWarmly,\n[Your Name]`
  },
  {
    id: 'warm-redirect', title: 'Warm Redirect', icon: 'ArrowUpRight', category: 'Closing',
    text: `Hi [Contact Name],\n\nThank you for reaching out about this collaboration! While this particular opportunity isn't the best fit for my current content focus, I know a few creators who might be perfect for it.\n\nWould it be helpful if I made an introduction? I have some talented people in my network who align well with [Brand Name]'s aesthetic and audience.\n\nI'd love to stay on your radar for future campaigns that are more closely aligned with my niche. Always happy to chat!\n\nBest,\n[Your Name]`
  },
  {
    id: 'usage-rights', title: 'Usage Rights Clarification', icon: 'Shield', category: 'Negotiation',
    text: `Hi [Contact Name],\n\nThanks for sending over the campaign details! I'm excited about this collaboration.\n\nBefore I sign off, I wanted to clarify the usage rights terms. Could you confirm:\n\n- How long does the brand intend to use my content? (e.g. 30 days, 90 days, perpetual)\n- Will the content be used in paid ads, whitelisting, or boosted posts?\n- Will the content appear on any channels beyond my own? (e.g. brand's social, website, email, retail displays)\n- Is there an exclusivity window, and if so, how long?\n\nThese details help me price the partnership accurately and ensure we're both protected. Happy to discuss further!\n\nBest,\n[Your Name]`
  },
  {
    id: 'timeline', title: 'Timeline Clarification', icon: 'Calendar', category: 'Clarification',
    text: `Hi [Contact Name],\n\nThanks for the collaboration details — I'm interested in moving forward!\n\nTo plan my content calendar, could you share a few timeline specifics?\n\n- When does the brand need content drafts submitted for review?\n- What's the target go-live date?\n- Is there a specific campaign window or launch date this is tied to?\n- How many rounds of revision are included?\n\nOnce I have these details, I can confirm my availability and block off time to create something great.\n\nBest,\n[Your Name]`
  },
  {
    id: 'invoice-payment', title: 'Invoice & Payment Follow-Up', icon: 'Receipt', category: 'Follow-up',
    text: `Hi [Contact Name],\n\nI hope you're doing well! I wanted to follow up regarding my invoice for the [Brand Name] collaboration (Invoice #[X], sent on [date]).\n\nAccording to my records, payment of $[amount] was due on [due date]. Could you check on the status and let me know when I can expect it to be processed?\n\nI've re-attached the invoice below for easy reference. If there's anything else you need from my end — W-9, updated payment details, etc. — I'm happy to provide that right away.\n\nThank you so much for your help!\n\nBest,\n[Your Name]`
  },
];

export const AI_PROMPTS = [
  {
    id: 'summarize-thread', title: 'Summarize This Email Thread', icon: 'Mail', category: 'Analysis',
    text: `I'm going to paste an email thread between me (a content creator) and a brand. Please summarize:\n\n1. Who reached out and what brand they represent\n2. What they're proposing (paid, gifted, affiliate, etc.)\n3. Key deliverables mentioned\n4. Any rates, timelines, or deadlines discussed\n5. What the current status is (waiting on me, waiting on them, etc.)\n6. Recommended next action I should take\n\nHere's the thread:\n[PASTE EMAIL THREAD HERE]`
  },
  {
    id: 'draft-reply', title: 'Draft a Professional Reply', icon: 'PenLine', category: 'Drafting',
    text: `I need help drafting a professional response to a brand collaboration email. Here's the context:\n\nBrand: [BRAND NAME]\nWhat they want: [BRIEF DESCRIPTION]\nMy goal: [e.g. accept, negotiate, ask for more info, decline politely]\nTone: Professional but warm, confident, not salesy\n\nHere's their email:\n[PASTE THEIR EMAIL HERE]\n\nPlease draft a response that sounds like me — a creator who knows their worth but is approachable and collaborative.`
  },
  {
    id: 'negotiate', title: 'Negotiate Warmly', icon: 'Handshake', category: 'Negotiation',
    text: `A brand offered me a collaboration and I want to negotiate the terms. Help me draft a warm, professional counter-offer.\n\nBrand: [BRAND NAME]\nTheir offer: [WHAT THEY OFFERED — rate, deliverables, usage rights]\nWhat I want instead: [YOUR IDEAL TERMS]\nMy reasoning: [WHY — e.g. usage rights add value, deliverables require more production time]\n\nPlease draft a response that:\n- Acknowledges their offer positively\n- Makes my counter-proposal clear but not aggressive\n- Explains the value I bring to justify my ask\n- Keeps the door open for meeting in the middle`
  },
  {
    id: 'clarify-deliverables', title: 'Clarify Deliverables', icon: 'ListChecks', category: 'Clarification',
    text: `I received a brand collaboration email but the deliverables are vague. Help me draft a friendly email that asks for clarity without sounding difficult.\n\nHere's what they said:\n[PASTE THE RELEVANT PART OF THEIR EMAIL]\n\nI need clarity on:\n- Exact number and type of content pieces\n- Content approval process and revision rounds\n- Whether they want organic only or if paid amplification/whitelisting is involved\n- Timeline from draft submission to go-live\n- Any exclusivity or competing brand restrictions\n\nPlease draft a warm, professional email asking for these details.`
  },
  {
    id: 'polish-email', title: 'Rewrite Into a Polished Response', icon: 'Wand2', category: 'Drafting',
    text: `I wrote a rough draft reply to a brand email but it doesn't sound professional enough. Please rewrite it to sound polished, confident, and warm.\n\nKeep my main points but make it:\n- More concise\n- Better structured\n- Professional but not stiff\n- Clear on next steps\n\nHere's my rough draft:\n[PASTE YOUR DRAFT HERE]`
  },
  {
    id: 'next-response', title: 'Identify the Best Next Response', icon: 'Compass', category: 'Strategy',
    text: `I'm not sure how to respond to this brand email. Please analyze it and recommend the best next step.\n\nContext about me:\n- My niche: [YOUR NICHE]\n- My usual rate range: [YOUR RATES]\n- Whether I'm open to gifted: [YES/NO/DEPENDS]\n- Current bandwidth: [BUSY / AVAILABLE / SELECTIVE]\n\nHere's the email I received:\n[PASTE EMAIL HERE]\n\nPlease tell me:\n1. What type of opportunity this is\n2. Whether it seems legitimate and worth pursuing\n3. Any red flags to watch for\n4. The recommended response strategy\n5. A draft reply I can customize`
  },
  {
    id: 'action-plan', title: 'Turn Email Into an Action Plan', icon: 'ClipboardList', category: 'Planning',
    text: `I just received a brand collaboration email and I need to turn it into a clear action plan. Please read the email and create:\n\n1. A summary of the opportunity (one paragraph)\n2. A checklist of action items I need to complete\n3. Key dates and deadlines to track\n4. Questions I still need answered before moving forward\n5. A suggested priority level (high, medium, low)\n\nHere's the email:\n[PASTE EMAIL HERE]`
  },
];

export const WORKFLOW_STEPS = [
  { number: 1, title: 'Check Your Inbox', desc: 'Open your email and quickly scan for new brand outreach, collaboration inquiries, PR pitches, and partnership opportunities. Don\'t respond yet — just identify what\'s new.', time: '~2 min' },
  { number: 2, title: 'Log & Categorize', desc: 'Add every new opportunity to the Opportunities tracker. Tag each one with a type (paid, gifted, affiliate, PR, partnership) and set the initial status to "New."', time: '~2 min' },
  { number: 3, title: 'Prioritize by Revenue & Urgency', desc: 'Review your open opportunities. Move paid and time-sensitive deals to "High" priority. Set medium for promising leads, and low for everything else.', time: '~1 min' },
  { number: 4, title: 'Send Your Replies', desc: 'Use the Reply Library for quick, polished responses. For complex situations, head to Prompt Studio for AI-powered drafting. Respond to high-priority items first.', time: '~3 min' },
  { number: 5, title: 'Log Follow-Ups', desc: 'For any opportunity waiting on a response, set a follow-up date. Update the status to "Follow-up" and add a note with what you\'re waiting on.', time: '~1 min' },
  { number: 6, title: 'Close & Archive Dead Leads', desc: 'Move stale opportunities (no response after 2+ follow-ups) to "Archived." Close out completed partnerships. Keep your tracker clean and current.', time: '~1 min' },
];
