// All site content that gets rendered by main.js lives here.

window.PROJECTS = [
  // ── Side A: solo ──
  {
    side: "a",
    title: "Nombook",
    format: "iOS App · on the App Store",
    img: "assets/img/nombook-og.png",
    skills: ["Swift", "SwiftUI", "Foundation Models", "Vision", "CloudKit"],
    desc: [
      "A cozy little recipe diary for iPhone — a recipe keeper, meal planner and cooking diary in one. Solo-built and launched in 7 languages, reaching thousands of downloads within its first month.",
      "Save the dishes you actually cook, plan the week, shop from the list, cook step by step with timers, and write down how each one went.",
      "Recipes can be typed, pasted, saved from a link or scanned from a cookbook page or handwritten card, read and structured privately on device with Apple's Foundation Models and Vision OCR, then synced through private iCloud: no server, no account. Every recipe gets its own photo or one of 110+ hand-drawn covers, and each cook is logged with half-star ratings, notes and photos.",
      "Every feature is free: no account, no ads, no subscription and nothing tracked.",
    ],
    links: [
      { label: "App Store", href: "https://apps.apple.com/us/app/nombook-recipe-keeper-diary/id6792402315" },
      { label: "Website", href: "https://www.nombook.app/" },
    ],
  },
  {
    side: "a",
    title: "Muse",
    format: "Web · AI music studio",
    img: "assets/img/muse.jpg",
    skills: ["Next.js", "TypeScript", "Claude API", "ElevenLabs API", "WebGL"],
    desc: [
      "A generative music studio where you describe a feeling instead of writing a prompt. Pick a mood, set the energy, search for artists and choose instruments, and an LLM (Claude) turns that intent into a precise, editable prompt for ElevenLabs, which composes 30 seconds of music.",
      "Music is driven by mood and texture, not words, so a blank text box is the wrong interface for most people. The right-hand canvas reacts live to every choice with a mood gradient and a WebGL aurora shader, then becomes the editable prompt and an audio player.",
    ],
    youtube: "kAIogoNvFvk",
    links: [
      { label: "Try it", href: "https://muse-one-tau.vercel.app/" },
      { label: "Demo video", href: "https://youtu.be/kAIogoNvFvk" },
    ],
  },
  {
    side: "a",
    title: "Jiuye 九野",
    format: "Web · Art gallery",
    img: "assets/img/jiuye-art.jpg",
    skills: ["React", "TypeScript", "Vite", "Sass", "Vercel"],
    desc: [
      "An online gallery I built for my dad's paintings. The name 九野 (Jiuye) comes with his motto, 任由画感 无问西东: let the brushwork follow feeling, and ask not of east or west.",
      "It shows 29 works in two collections, oil on canvas and fluid art, with bilingual Chinese and English captions, an artist introduction and a lightbox you can page through with the keyboard. Small touches like an ink-trail cursor and soft scroll reveals keep it as quiet as the paintings.",
    ],
    links: [{ label: "Visit the gallery", href: "https://www.jiuye.art/" }],
  },
  {
    side: "a",
    title: "Wheel of Dinner",
    format: "iOS App",
    img: "assets/img/wheel-of-dinner.png",
    fit: "contain",
    skills: ["Swift", "MapKit", "CoreLocation", "Firebase", "Yelp API"],
    desc: [
      "Having trouble deciding what to eat? Couldn't reach an agreement when eating out as a group? Find a list of your favorite restaurants nearby and let Wheel of Dinner decide for you!",
      "Wheel of Dinner is a random restaurant-generating app. It recommends restaurants based on the location you enter, adds them to a list, and finally picks where you're eating.",
    ],
    video: "assets/video/wheel-of-dinner.mp4",
    links: [{ label: "Demo", href: "assets/video/wheel-of-dinner.mp4" }],
  },
  {
    side: "a",
    title: "Food Saviour",
    format: "Mobile / PC Game · 3D",
    img: "assets/img/food-saviour.png",
    skills: ["Unity Engine", "C#"],
    desc: [
      "A 3D game built in Unity where players collect food in a randomly generated, Mars-like maze in space.",
      "Used Unity NavMesh to create troops of AI agents that automatically find the best path and attack the moving player.",
    ],
    video: "assets/video/food-saviour.mp4",
    links: [
      { label: "Demo", href: "assets/video/food-saviour.mp4" },
      { label: "GitHub", href: "https://github.com/crispyinuo/Food-Saviours" },
    ],
  },
  {
    side: "a",
    title: "Tree Tactics",
    format: "Mobile / PC Game · VR",
    img: "assets/img/tree-tactics.png",
    skills: ["Unity Engine", "C#"],
    desc: [
      "A grid-based game where players strategically plant trees, aiming to line up four in a row while navigating around randomly placed obstacles.",
      "Turn-based mechanics let two players alternate their moves.",
    ],
    youtube: "YFu9bXdXZZs",
    links: [{ label: "Demo", href: "https://youtu.be/YFu9bXdXZZs" }],
  },
  {
    side: "a",
    title: "Animal Protector: Sky Dome",
    format: "Mobile Game · AR",
    img: "assets/img/animal-protector.png",
    fit: "contain",
    skills: ["Unity Engine", "C#"],
    desc: [
      "An AR mobile game where players become guardians of innocent animals, protecting them from descending missiles. Five animals are randomly placed on the board, and players tap missiles to intercept them with arrows.",
      "AR cards in the real world replenish arrows, adding a layer of strategy. Scoring is based on how long you protect the animals, so you have to ration arrows wisely to survive longer.",
    ],
    youtube: "lJeIjVzOzUg",
    links: [{ label: "Demo", href: "https://youtu.be/lJeIjVzOzUg" }],
  },

  // ── Side B: group ──
  {
    side: "b",
    title: "Harmony Blocks",
    format: "VR Music Sandbox",
    event: { label: "Immerse The Bay Hackathon", href: "https://immersethebay.stanfordxr.org/" },
    img: "assets/img/harmony-blocks.png",
    feat: ["Christian Yang", "Helena Su"],
    award: "🏆 1st Prize · Immerse The Bay @ Stanford (Ultraleap for Entertainment track)",
    skills: ["Unity Engine", "C#", "Ultraleap SDK", "Blender"],
    desc: [
      "Using Unity and Ultraleap's Unity package, we sculpted a virtual space where physics and sound coalesce.",
      "The key was integrating advanced hand tracking through Ultraleap's external camera, allowing intuitive, natural interaction with our virtual instruments.",
    ],
    links: [
      { label: "Devpost", href: "https://devpost.com/software/harmony-blocks" },
      { label: "GitHub", href: "https://github.com/helenawsu/harmonyblocks/tree/NewMain" },
    ],
  },
  {
    side: "b",
    title: "(Re)live™",
    format: "3D Memory Archive",
    event: { label: "MIT Reality Hack", href: "https://www.mitrealityhack.com/" },
    img: "assets/img/relive.png",
    feat: ["Christian Yang", "Mandy Liu", "Yihong Xu"],
    skills: ["Unreal Engine", "Luma AI"],
    desc: [
      "A 3D memory archive built with Gaussian Splatting from Luma AI for 3D scanning. The aim: a shared, interactive archive of 3D scenes where people revisit cherished memories together, synchronously or asynchronously.",
      "The VR space is enhanced with spatial audio and video footage of each location, and users can leave voice comments to truly immerse themselves in the experience.",
    ],
    youtube: "NnvsZr0K6TI",
    links: [
      { label: "Project intro", href: "https://www.youtube.com/watch?v=xJ3Nto0kNnM" },
      { label: "Demo", href: "https://www.youtube.com/watch?v=NnvsZr0K6TI" },
      { label: "GitHub", href: "https://github.com/GP2P/HungryGaussians" },
    ],
  },
  {
    side: "b",
    title: "Third Eye Tarots",
    format: "iOS App · AI",
    img: "assets/img/third-eye-tarots.png",
    fit: "contain",
    feat: ["Jack Wang", "Wade Liu", "Richard Ge", "Isha Zhang"],
    skills: ["Swift", "UIKit", "ChatGPT API"],
    desc: [
      "An iOS app that gives AI tarot readings based on users' questions.",
      "Used the ChatGPT API to create customized readings for a more personal experience.",
    ],
    video: "assets/video/third-eye-tarots.mp4",
    links: [{ label: "Demo", href: "assets/video/third-eye-tarots.mp4" }],
  },
  {
    side: "b",
    title: "EasyTeamUp",
    format: "Android App",
    img: "assets/img/easyteamup.png",
    fit: "contain",
    feat: ["Daniel Chen", "William Hu"],
    skills: ["Java", "Node.js", "MongoDB", "JUnit"],
    desc: [
      "An Android app for creating, sharing and joining events around the USC campus.",
      "Used Node.js, MongoDB, Java, the Google API and JUnit to build features like event filtering and a dynamic event map.",
    ],
    video: "assets/video/easyteamup.mp4",
    links: [{ label: "Demo", href: "assets/video/easyteamup.mp4" }],
  },
  {
    side: "b",
    title: "SmarTune",
    format: "Prototype",
    event: {
      label: "Human-Building Interaction Hackathon",
      href: "https://www.intelligentenvironments.usc.edu/workshops/2022/2/3/human-building-interaction-online-hackathon",
    },
    img: "assets/img/smartune.png",
    fit: "contain",
    feat: ["Ala Nekouvaght Tak", "Pooya Adami"],
    award: "🥈 2nd place among all teams",
    skills: ["Figma"],
    desc: ["A prototype for SmarTune — intelligent active noise control for the built environment."],
    links: [{ label: "Demo", href: "https://drive.google.com/file/d/15N9kECbBFzkUHJKIhRQZNWq3rye3F5dX/view?usp=sharing" }],
  },
  {
    side: "b",
    title: "Colorly",
    format: "Web App",
    img: "assets/img/colorly.png",
    fit: "contain",
    feat: ["Daniel Chen", "William Hu", "Jess Cheng", "Karim Rahal", "Zuoning Zhang"],
    skills: ["Vue.js", "JavaScript", "HTML", "Figma"],
    desc: ["A website for searching and shopping clothes from third-party stores by a specific color palette."],
    links: [],
  },
];

window.DANCE = [
  { id: "TqY6XMm6h54", title: "Pursuit of Passion", where: "Prelude Dance Competition · NorCal 2024" },
  { id: "BG2YCEJtUV0", title: "Pursuit of Passion", where: "World of Dance · Los Angeles 2025" },
  { id: "XGTgBObfp8I", title: "Chaotic 3", where: "Prelude Dance Competition · SoCal 2022" },
  { id: "f506TcWLIVQ", title: "K-Pop Cover — Helicopter", where: "CLC · Spade A Shanghai" },
  { id: "-UE1sNws87U", title: "K-Pop Cover — Domino", where: "Stray Kids · Halloween vampire edition" },
];

window.CHOIR = [
  { id: "TN2AFsNQlVg", title: "Chan Mali Chan", where: "USC Thornton Oriana Choir" },
  { id: "Qqt_0pdWpRc", title: "Much Too Soon in the Season", where: "USC Thornton Oriana Choir · Tchaikovsky" },
  { id: "etDrDmT1OSI", title: "Wau Bulan", where: "Suara Southeast Asian Choir" },
  { id: "kNyBYsPplF4", title: "Yo le canto todo el día", where: "USC Thornton Oriana Choir · David Brunner" },
  { id: "8Ob_g8I6Xho", title: "Rasa Sayang", where: "Suara Southeast Asian Choir" },
];

window.SONGS = [
  { track: "1620545490", title: "Water In My Ears" },
  { track: "1507148470", title: "Heartbeats" },
  { track: "1395264040", title: "In The Silence Lives The Satan" },
  { track: "1376216446", title: "Ocean Bait", note: "instrumental — fully recorded version coming soon…" },
  { track: "1384204243", title: "Simple Days", note: "co-written with Juan Razuri-Maldonado" },
];

window.SKILLS = {
  lang: ["Java", "Swift", "C++", "C#", "JavaScript", "R", "Kotlin", "HTML5", "Python", "CSS3", "SQL"],
  tool: ["Git", "Unity", "Firebase", "MongoDB", "Figma"],
  fw: ["React", "Vue.js", "Node.js", "Next.js"],
};
