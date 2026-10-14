/*
 * ===========================================================
 *  EDIT THIS FILE: all of the site's text and links are here.
 *  You shouldn't need to touch the HTML to update content.
 * ===========================================================
 */
window.SITE = {
  artist: "Appetite of the Mind",
  formerly: "Risk of Rain",           // the name your first 3 songs came out under
  tagline: "Feed the Appetite.",
  location: "Finland",
  contactEmail: "hello@example.com",  // EDIT: a public contact address
  millionairesOnEarth: 60000000,      // rough global estimate (UBS Global Wealth Report ballpark)
  ask: 1,                             // euros

  // EDIT: your profiles. Empty ones are hidden automatically.
  links: {
    youtube: "https://www.youtube.com/",  // EDIT: your channel URL, e.g. https://www.youtube.com/@yourhandle
    spotify: "",
    instagram: "",
    tiktok: "",
    soundcloud: "",
    bandcamp: "",
  },

  // EDIT: paste the YouTube video ID (the part after watch?v=) for each song.
  // A song without an ID shows a placeholder card instead.
  tracks: [
    { title: "Song One", releasedAs: "Risk of Rain", year: "", youtubeId: "", note: "" },
    { title: "Song Two", releasedAs: "Risk of Rain", year: "", youtubeId: "", note: "" },
    { title: "Song Three", releasedAs: "Risk of Rain", year: "", youtubeId: "", note: "" },
    { title: "The album", releasedAs: "Appetite of the Mind", year: "Coming", youtubeId: "",
      note: "This is the one you're funding." },
  ],

  // EDIT: what the album costs. Shown on /money, and the bars fill up as money comes in.
  budget: [
    { item: "Studio time (recording)", eur: 3000 },
    { item: "Mixing & mastering", eur: 2000 },
    { item: "Session musicians", eur: 1500 },
    { item: "Artwork & music videos", eur: 1500 },
    { item: "Vinyl test pressing", eur: 1000 },
    { item: "Distribution & release", eur: 500 },
  ],

  // EDIT: what unlocks at each supporter count. Unlocked ones light up automatically.
  milestones: [
    { at: 100, reward: "First 100 names locked into the album credits, forever." },
    { at: 500, reward: "Unreleased demo goes out free to everyone." },
    { at: 1000, reward: "Live-streamed studio session. You pick a song for me to cover." },
    { at: 5000, reward: "Supporters-only bonus track." },
    { at: 10000, reward: "Every supporter's name hidden in the album artwork." },
    { at: 100000, reward: "Free release show in Finland, and I stream it worldwide." },
    { at: 1000000, reward: "I frame the dashboard, hang it in the studio, and the album gets a vinyl run for real." },
  ],

  // Short text used in share buttons
  shareText: "This artist is asking every millionaire on Earth for €1 to fund an album. I'm not a millionaire but I'm in 👀",
};
