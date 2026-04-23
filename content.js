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
  subtitle: "Help Tim remember who he is",

  // Shown on the parchment scroll when the game starts. Each entry is one
  // page; press SPACE to advance. Entries can be plain strings or objects
  // like { text: "...", big: true } to render that page at extra-large size.
  introScroll: [
    "Tim feels himself awaken. His head is pounding.\n" +
    "With a lot of effort, he opens his eyes and finds himself in an unfamiliar room.\n" +
    "In fact, everything is unfamiliar.\n" +
    "He doesn't remember who he is. What he loves. What makes him tick.\n" +
    "His reason for being.",

    "He spots a door on the opposite side of the room.\n" +
    "With no other apparent options, he heads for the door.\n" +
    "Maybe there are answers on the other side.",
  ],

  // Shown on the parchment scroll after Tim escapes into the meadow.
  endingScroll: [
    "Tim emerges from the dungeon into a beautiful meadow.\n" +
    "He blinks in the sun. With the return of these memories,\n" +
    "it all comes rushing back to him.\n" +
    "His reason for being. His purpose in life.\n" +
    "\"Of course! How could I have forgotten?\"",

    { text: "\"The shareholders!\"", big: true },

    "\"This whole time, I wasn't looking for love or fulfillment.\n" +
    "I am uniquely positioned to deliver shareholder value.\n" +
    "I've got to get back!\"\n\n" +
    "He logs his imprisonment and time spent recovering from amnesia as PTO.\n" +
    "With a new spring in his step, he heads up the path\n" +
    "and starts his commute back to the office.",
  ],

  // Tim's question to each NPC. The prompts are already written in-character
  // ("Do you remember…?"), so we just speak the prompt as-is.
  questionTemplate: "{prompt}",

  // ----------------------------------------------------------
  // The six dungeon-dwellers.
  //
  // Each NPC has an `intro`: a short back-and-forth played BEFORE Tim
  // asks his question. Each step is either { npc: "..." } or { tim: "..." }.
  // Use `||` inside a step to paginate further if it runs long.
  // ----------------------------------------------------------
  npcs: [
    {
      id: "goblin",
      name: "High Heel Goblin",
      sprite: "assets/npc-goblin.png",
      intro: [
        { npc: "The goblin twirls and pirouettes in its $500 stilettos. \"Oh, Tim! You caught me mid-routine.\"" },
        { tim: "...aren't those bad for your feet?" },
        { npc: "The goblin grins a pointy little grin. \"What do you need?\"" },
      ],
      maxHeight: 200,
      flipX: true,
    },
    {
      id: "fairy",
      name: "Jacked Fairy w/ Cigar",
      sprite: "assets/npc-fairy.png",
      intro: [
        { npc: "The uncomfortably jacked fairy coughs a swampy cough. \"Siddown, sweetie. Auntie's been waiting on you.\"" },
        { tim: "You ever thought about quitting the cigars?" },
        { npc: "She takes a long, slow drag and blows a toxic green smoke ring. \"I'll quit when I'm dead, baby. Ask your question.\"" },
      ],
      maxHeight: 170,
      flipX: true,
    },
    {
      id: "piggums",
      name: "Mean Mr. Piggums",
      sprite: "assets/npc-piggums.png",
      intro: [
        { npc: "Mr. Piggums glares at Tim with eyes that are registered as deadly weapons. \"Ugh.\"" },
        { tim: "I come in peace, Mr. Piggums. I just need a little help." },
        { npc: "\"Fine. Make it quick. I've got loathing to get back to.\"" },
      ],
      maxHeight: 185,
      flipX: true,
    },
    {
      id: "grandma",
      name: "ATV Grandma",
      sprite: "assets/npc-grandma.png",
      intro: [
        { npc: "ATV Grandma revs her engine. \"Doc says I cain't lift more'n 10 pounds. One bump and that's a wrap on ATV Grandma.\"" },
        { tim: "I can help you lift things — but maybe you could help me with one question first?" },
        { npc: "Grandma cackles. \"Deal, sugar. Fire away.\"" },
      ],
      maxHeight: 185,
    },
    {
      id: "cheez",
      name: "Tha Cheez",
      sprite: "assets/npc-cheez.png",
      intro: [
        { npc: "Tha Cheez's eyes narrow. \"Are you a cop? You gotta tell me if you're a cop.\"" },
        { tim: "I'm not a cop, Cheez. I just need help remembering something about myself." },
        { npc: "Tha Cheez studies Tim for a long moment, then shrugs. \"Yeah, alright. I got what you need.\"" },
      ],
      maxHeight: 195,
    },
    {
      id: "statue",
      name: "Blue Smiling Statue of Liberty",
      sprite: "assets/npc-statue.png",
      intro: [
        { npc: "The Blue Smiling Statue of Liberty smiles a big blue smile. \"Did you ever feel like your creator was out of ideas when he made you?\"" },
        { tim: "...no?" },
        { npc: "The smile doesn't waver. \"Just me then. Okay. You want your memories? I can help.\"" },
      ],
      maxHeight: 220,
    },
  ],

  // ----------------------------------------------------------
  // PERSONAL PROMPTS — game picks 3 per playthrough
  // ----------------------------------------------------------
  personalPrompts: [
    {
      prompt: "I know there's something I love doing outside of work... do you know what it is?",
      answer:
        "The thing that most inspires you, that makes you feel the most alive, is music: listening to it, playing it. The craft of songwriting. " +
        "|| You have written for over 3,300 days straight — 10 minutes every morning. And you start writing again as soon as you sign out of work. " +
        "|| You might be almost 40, but you still dream of becoming a rock and roll star.",
    },
    {
      prompt: "Have I told you about any recent highlights in my life?",
      answer:
        "Your band just finished recording an EP called \"It Didn't Hit Me Until Today.\" This is the culmination of 2+ years' worth of work. You're announcing the pre-order on May 1, 2026. " +
        "|| You also had to attend a work summit that's *really* messing with your promotion plans.",
    },
    {
      prompt: "There's an odd fact about me I can't quite recall. Do you know what it is?",
      answer:
        "You are on your third eardrum in your right ear. You have had it replaced twice. " +
        "|| Sometimes when you ask people to repeat themselves, they think you're not listening — but it's because you missed what they said over the constant high-pitched ringing in your head.",
    },
    {
      prompt: "My weekends still have a rhythm to them. Do you know what they look like?",
      answer:
        "Saturdays usually start with yogurt, fruit, and granola. Then you practice piano or work on something for the band. " +
        "|| Depending on the weather, you'll either go for a run or do Yoga with Adriene. " +
        "|| Once exercise is out of the way, you order salmon and seasoned Cajun fries from New England Seafood and watch a movie with your Mom. " +
        "|| If your friends are around, you'll get together to work on more band production and then play a board game or watch some TV. " +
        "|| Sunday morning is another yogurt, fruit, and granola bowl. At 10:00 AM, you meet your regular gaming group and play video games for about 2-2.5 hours. " +
        "|| Then a midday run. Then lunch — usually a salad, because you ate too much yesterday. " +
        "|| Sunday afternoon is more piano practice. You wind down by reflecting on the previous week and planning for the next. " +
        "|| Your therapist thinks you need more variety in your life.",
    },
    {
      prompt: "I know I'm learning something right now. Do you know what it is?",
      answer:
        "Piano. You're teaching yourself. You're doing one of those \"Grown Adults Learning Child Skill\" books. " +
        "|| Even though you've been a musician for a long time, you spent most of your life not being able to read music. Now you can, and you're actually pretty proud of it.",
    },
    {
      prompt: "There's a small thing that always makes me happy. Do you know what it is?",
      answer:
        "Every night you eat sliced apples with peanut butter. You've done this probably 6 out of 7 days a week for years and it never fails to bring you joy.",
    },
    {
      prompt: "I could ramble about something forever. Do you know what it is?",
      answer:
        "You love music. Not just the musicians — David Bowie, Kate Bush, The National, and (most recently) Raye — but everything that goes into the music they make. How they wrote the songs. How they recorded them. " +
        "|| Also, very ironically, you love discussing product management frameworks and mental models. " +
        "|| You're an idealist, and your standards can sometimes make you tedious to work with.",
    },
    {
      prompt: "There's a hobby or interest I always come back to. Do you know what it is?",
      answer:
        "Fantasy and sci-fi novels. You grew up loving them and you always return to them to escape and recharge. " +
        "|| There's a lot of science behind the empathy that comes with being a sci-fi fan. It's probably why you grew up so compassionate.",
    },
    {
      prompt: "There's one kind of adventure I'd never turn down. Do you know what it is?",
      answer:
        "You will always say yes to a concert. If a friend invites you to see an artist you've never heard of, you are highly likely to say yes.",
    },
    {
      prompt: "I know I have a comfort ritual that feels very me. Do you know what it is?",
      answer:
        "When you go places — especially places where you'll be out for the night — you always bring a lunch pail filled with fruit and healthy snacks. " +
        "|| You always feel more comfortable if you have an apple, cara cara orange, watermelon, or pineapple nearby.",
    },
  ],

  // ----------------------------------------------------------
  // WAYS-OF-WORKING PROMPTS — game picks 3 per playthrough
  // ----------------------------------------------------------
  workPrompts: [
    {
      prompt: "My ideal work environment is fuzzy in my mind. Do you know what it looks like?",
      answer:
        "You work from home right now, but whether you're in your house or an office, you are very particular about your space. " +
        "|| You need a space that you know other people aren't touching, with easy access to pens and notepads.",
    },
    {
      prompt: "Did I ever tell you about my preferred way of working with people?",
      answer:
        "Virtually or in-person, you prefer async communication for context-setting and meetings (calls) for decision-making. " +
        "|| You used to be very in favor of asynchronous work for most things, but as you've grown older and wiser, you recognize that was just a by-product of pointless meetings and work environments where you couldn't focus on priority tasks. " +
        "|| Now that you work in a company that respects your time more, you prefer to do real product work — collaborating through demos and whiteboards live with teams.",
    },
    {
      prompt: "I know when I do my best work... do you know when that is?",
      answer:
        "You work best in the morning, but honestly you work best any time you have 2+ hours of uninterrupted time. " +
        "|| You're one of those maniacs who uses the pomodoro technique when you really need to focus, and you find it works for you.",
    },
    {
      prompt: "Something at work always frustrates me. Do you know what it is?",
      answer:
        "You struggle when you're in a work culture with high expectations for results and low tolerance for risk or experimentation. " +
        "|| Big launches and giant milestones have been obsolete in tech for years at this point — and they're primordial in the world of AI. " +
        "|| You get frustrated by your inability to clearly articulate that driving results in the world of AI requires a new way of product delivery, where building to learn is key.",
    },
    {
      prompt: "If someone needs a quick response from me, do you know what works best?",
      answer:
        "You try to be responsive and friendly, but you separate \"response\" from \"action.\" You prefer informal conversation for context-setting (like Slack), and you'll always respond on Slack. " +
        "|| If someone needs you to take an action, they should be very explicit about the action and by when they need it. " +
        "|| This isn't because you don't want to help — it's because your role comes with so much context-switching that it's easy for things to slip through the cracks unless you have clear expectations for where you add value.",
    },
    {
      prompt: "I know there's a best way to give me feedback. Do you know what it is?",
      answer:
        "Directly. You respond well to clear, straightforward feedback and would rather someone tell you plainly than expect you to read between the lines. " +
        "|| It's an artifact of your communication style: you are open and direct with feedback, but you recognize that being too direct can sometimes come off as callused. " +
        "|| Direct feedback works for you, though, because you always take it as someone giving you a thoughtful opportunity to grow.",
    },
    {
      prompt: "I tend to default in a certain direction at work. Do you know how?",
      answer:
        "Big picture and speed. You care about detail when it matters, but one of your strengths is keeping the bigger picture in sight and helping things move forward quickly.",
    },
    {
      prompt: "There's something I especially appreciate in teammates. Do you know what it is?",
      answer:
        "A willingness to experiment and share what they're learning. You love working with people who are comfortable taking risks, experimenting, and sharing long before they're ready. " +
        "|| You strive to provide psychological safety for your partners and peers so the team can operate at their best, without the threat or fear of judgment.",
    },
    {
      prompt: "I'm trying to improve something about how I work. Do you know what it is?",
      answer:
        "You need to be more concise. As you work more with senior leaders, you're trying to shorten your communication and avoid giving too much context when a sharper answer would do.",
    },
    {
      prompt: "If I go quiet in a meeting, do you know what that usually means?",
      answer:
        "You're actively practicing not speaking in meetings for the sake of meetings. You have a point of view on everything and you're very comfortable sharing it, but you realize that your willingness to fill the silence might mean someone else is missing the chance to speak. " +
        "|| However, if you were actively engaged earlier and then go quiet, it usually means you feel like your ideas aren't being meaningfully considered.",
    },
    {
      prompt: "There's one thing in collaboration that always gets under my skin. Do you know what it is?",
      answer:
        "Inflexibility. You believe in strong outcomes but flexible approaches to meeting those outcomes. " +
        "|| Collaboration gets frustrating when people come in attached to one solution and leave no room to explore better options together. " +
        "|| It particularly bothers you when you're accountable for an outcome but forced into an artificial constraint because a team took a goal against building a thing instead of driving a result.",
    },
    {
      prompt: "I know there's a kind of problem I love solving. Do you know which kind?",
      answer:
        "You love complex problems that other people are hesitant to tackle or haven't solved yet. You gravitate toward the hardest, messiest challenges. " +
        "|| You believe that if a problem had an existing solution, it would have been solved already.",
    },
    {
      prompt: "If bad news or blockers come up, do you know how I want people to bring them to me?",
      answer:
        "Early. As soon as someone learns the bad news, they should tell you. You'd rather have the information quickly so the team can deal with it. " +
        "|| You try to take a non-judgmental approach to bad news, blockers, or mistakes, but you have particularly high expectations when it comes to identifying how the team will learn and grow from those challenges. " +
        "|| When the heck is someone going to start doing retros around here?",
    },
    {
      prompt: "What helps me feel trusted and supported at work?",
      answer:
        "You work best when you're understood for what you're actually good at. " +
        "|| You feel most trusted when people take the time to learn your capabilities and experience level, and help you grow in real development areas rather than second-guessing basics or just preferring a different style.",
    },
    {
      prompt: "There's a kind of meeting that drains me fast. Do you know what kind?",
      answer:
        "A meeting with no agenda, no structure, and no clear objective. You need to know what the attendees are trying to get out of the time together.",
    },
    {
      prompt: "I make decisions a certain way. Do you know how?",
      answer:
        "Usually quickly, but with care. You're comfortable making decisions, especially when needed. " +
        "|| But you also try to be considerate of customers and partners — sometimes you'll slow a decision down more than is natural for you if it will help partners feel comfortable and supported in the process.",
    },
  ],
};
