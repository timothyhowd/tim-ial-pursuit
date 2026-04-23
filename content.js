// ============================================================
// TIM-IAL PURSUIT — content
//
// EDIT THIS FILE to fill in your real text.
//
// Each playthrough:
//   - 3 of N personal prompts are picked
//   - 3 of N work prompts are picked
//   - One prompt is assigned to each of the 6 dwellers, in
//     a random order
// (See content-template.csv if you'd rather fill answers
//  in a spreadsheet.)
//
// LONG ANSWERS — paginate with `||` to force a page break, e.g.
//     answer: "First half of the memory. || Second half."
// or pass an array:
//     answer: ["First page.", "Second page.", "Third page."]
// Long single-string answers also auto-paginate at sentence
// boundaries (~320 chars per page).
// ============================================================

const CONTENT = {
  title: "Tim-ial Pursuit",
  subtitle: "Tim has lost the memories that make him who he is.",

  // Shown on the parchment scroll when the game starts.
  introScroll:
    "Tim awakens in cold stone, his head pounding.\n\n" +
    "He cannot remember who he is, what he loves, or how he works.\n" +
    "Six dungeon-dwellers stand between him and the world above.\n\n" +
    "Each one holds a piece of him.\n" +
    "Open the door. Talk to all six. Walk east into the light.",

  // Shown on the parchment scroll after Tim escapes into the meadow.
  endingScroll:
    "Tim emerges into the meadow, blinking in the sun.\n\n" +
    "The memories settle back into him: who he is, what he loves,\n" +
    "the way he writes, the way he works, the way he shows up.\n\n" +
    "He brushes the dust from his glasses, and walks east —\n" +
    "ready, once more, to deliver shareholder value.",

  // Tim's question to each NPC. The prompts are already written in-character
  // ("Do you remember…?"), so we just speak the prompt as-is.
  questionTemplate: "{prompt}",

  // ----------------------------------------------------------
  // The six dungeon-dwellers.
  // ----------------------------------------------------------
  npcs: [
    {
      id: "goblin",
      name: "High Heel Goblin",
      sprite: "assets/npc-goblin.png",
      flavor:
        "The goblin balances precariously on a single stiletto.\n\"Ohhh, Tim. I remember this one...\"",
      maxHeight: 200,
      flipX: true,
    },
    {
      id: "fairy",
      name: "Jacked Fairy w/ Cigar",
      sprite: "assets/npc-fairy.png",
      flavor:
        "She blows a slow ring of smoke.\n\"Sit down, sweetie. Auntie's gonna remind you.\"",
      maxHeight: 170,
      flipX: true,
    },
    {
      id: "piggums",
      name: "Mean Mr. Piggums",
      sprite: "assets/npc-piggums.png",
      flavor:
        "Mr. Piggums snorts derisively.\n\"Ugh. Fine. Here's one I happen to remember.\"",
      maxHeight: 185,
      flipX: true,
    },
    {
      id: "grandma",
      name: "ATV Grandma",
      sprite: "assets/npc-grandma.png",
      flavor:
        "Her engine idles. She kicks up dust.\n\"Climb on, kiddo. Lemme tell ya somethin'.\"",
      maxHeight: 185,
    },
    {
      id: "cheez",
      name: "Tha Cheez",
      sprite: "assets/npc-cheez.png",
      flavor:
        "His eyes glaze a little redder.\n\"Aged like me, you have. Hear me out.\"",
      maxHeight: 195,
    },
    {
      id: "statue",
      name: "Blue Smiling Statue of Liberty",
      sprite: "assets/npc-statue.png",
      flavor:
        "She lowers her torch to your eye level.\n\"Give me your tired, your puzzled, your forgotten.\"",
      maxHeight: 220,
    },
  ],

  // ----------------------------------------------------------
  // PERSONAL PROMPTS — game picks 3 per playthrough
  // ----------------------------------------------------------
  personalPrompts: [
    {
      prompt: "I know there was something I loved doing outside of work… do you remember what it was?",
      answer: "Playing music — especially writing songs. I love not just music itself, but the craft of making it: songwriting, mixing, mastering, and always learning more about how music gets created.",
    },
    {
      prompt: "A recent highlight is slipping away from me — do you remember what happened?",
      answer: "My band just finished recording an EP called \"It Didn't Hit Me Until Today,\" and we're announcing the pre-order next week. I'm really excited to finally share something we've been working on for a while.",
    },
    {
      prompt: "There's an odd fact about me I can't quite recall. Do you remember it?",
      answer: "I'm on my third eardrum. I've had my right eardrum replaced twice, and it still doesn't work — but honestly, it's not as bad as it used to be.",
    },
    {
      prompt: "My weekends used to have a rhythm to them. Do you remember what they looked like?",
      answer: "Saturdays usually start with yogurt, fruit, and granola, then piano practice or reading. I'll do some to-dos, get lunch with my mom — usually fish and Cajun fries — and spend the evening with friends playing board games or watching a show. || Sundays start with online games with friends in Seattle and England, and later I usually journal, reflect, and get ready for the week ahead.",
    },
    {
      prompt: "I know I'm learning something right now. Do you remember what it is?",
      answer: "Piano. I've been teaching myself, and even though I've been a musician for a long time, I spent most of my life not being able to read music. Now I can, and I love that.",
    },
    {
      prompt: "There's a small thing that always makes me happy. Do you remember what it is?",
      answer: "Apples and peanut butter at night. It's my favorite way to end the day.",
    },
    {
      prompt: "I could ramble about something forever. Do you remember what it is?",
      answer: "Music, especially songwriting and artists like David Bowie — I could walk through his whole chronology and talk about how he shaped pop music. || I could also go on forever about product management frameworks, and about why science fiction and fantasy build empathy and problem-solving better than most nonfiction.",
    },
    {
      prompt: "There's a hobby or interest I always come back to. Do you remember what it is?",
      answer: "Fantasy and sci-fi novels. I grew up loving them, and they're still one of my favorite ways to escape and recharge.",
    },
    {
      prompt: "There's one kind of adventure I'd never turn down. Do you remember what it is?",
      answer: "A concert. If someone asks me to go to a concert, I'm in.",
    },
    {
      prompt: "I had a comfort ritual that felt very me. Do you remember what it was?",
      answer: "Fruit at night, always. Apples with peanut butter, plus things like oranges, watermelon, or pineapple. || My friends know me as the person who brings a little lunchbox with fruit and maybe an iced tea, even if everyone else is ordering pizza.",
    },
  ],

  // ----------------------------------------------------------
  // WAYS-OF-WORKING PROMPTS — game picks 3 per playthrough
  // ----------------------------------------------------------
  workPrompts: [
    {
      prompt: "My ideal work environment is fuzzy in my mind. Do you remember what it looks like?",
      answer: "Honestly, my house. I'm particular about my setup — desk, notes, notebooks, monitors — and I do my best work in a space I can control and optimize.",
    },
    {
      prompt: "I know I had a preferred way of working with people. Do you remember it?",
      answer: "I prefer doing my work virtually, but working with people in person when it actually makes sense. For solving real problems, I prefer live conversations or calls over long async back-and-forth.",
    },
    {
      prompt: "I used to know when I did my best work… do you remember when that is?",
      answer: "In the mornings. Since I'm on the East Coast, I try to start about two hours before most people so I can get focused work done before meetings begin.",
    },
    {
      prompt: "Something at work always frustrated me. Do you remember what it was?",
      answer: "A lack of risk-taking. It frustrates me when people avoid experimenting and then are surprised when things don't improve.",
    },
    {
      prompt: "If someone needed a quick response from me, what worked best?",
      answer: "Be explicit about why you need it and when. Something like, \"Tim, I need a response from you today because of X.\" || I don't naturally operate in constant quick-response mode, so context helps.",
    },
    {
      prompt: "I know there was a best way to give me feedback. Do you remember how?",
      answer: "Directly. I respond well to clear, straightforward feedback and would rather someone tell me plainly than expect me to read between the lines.",
    },
    {
      prompt: "I tended to default in a certain direction at work. Do you remember how?",
      answer: "Big picture and speed. I care about detail when it matters, but one of my strengths is keeping the bigger picture in sight and helping things move forward quickly.",
    },
    {
      prompt: "There was something I especially appreciated in teammates. Do you remember what it was?",
      answer: "A willingness to experiment and share what they're learning. I love working with people who try new things and bring those discoveries back to the team.",
    },
    {
      prompt: "I was trying to improve something about how I work. Do you remember what it was?",
      answer: "Being more concise. As I work more with senior leaders, I'm trying to shorten my communication and avoid giving too much context when a sharper answer would do.",
    },
    {
      prompt: "If I go quiet in a meeting, do you remember what that usually means?",
      answer: "Sometimes it just means I don't have anything useful to add and I don't want to speak for the sake of speaking. || But if I was engaged earlier and then go quiet, it usually means I feel like my ideas aren't being meaningfully considered.",
    },
    {
      prompt: "There was one thing in collaboration that always got under my skin. Do you remember what it was?",
      answer: "Inflexibility. I believe in being rigid on the goal and flexible on the details, so collaboration gets frustrating when people come in attached to one solution and leave no room to explore better options together.",
    },
    {
      prompt: "I know there was a kind of problem I loved solving. Do you remember which kind?",
      answer: "Complex problems that other people are hesitant to tackle or haven't solved yet. I tend to gravitate toward the hardest, messiest challenges.",
    },
    {
      prompt: "If bad news or blockers came up, how did I want people to bring them to me?",
      answer: "Early. As soon as you know, tell me. I'd rather have the information quickly so we can deal with it, and I also like teams that use retrospectives to understand what happened and improve.",
    },
    {
      prompt: "What helped me feel trusted and supported at work?",
      answer: "Being understood for what I'm actually good at. I feel most trusted when people take the time to learn my capabilities and experience level, and help me grow in real development areas rather than second-guessing basics or just preferring a different style.",
    },
    {
      prompt: "There's a kind of meeting that drains me fast. Do you remember what kind?",
      answer: "A meeting with no agenda, no structure, and no clear objective. I need to know what we're trying to get out of the time together.",
    },
    {
      prompt: "I made decisions a certain way. Do you remember how?",
      answer: "Usually quickly, but with care. I'm comfortable making decisions, especially when needed, but I also want customers and partners to feel comfortable and supported in the process.",
    },
  ],
};
