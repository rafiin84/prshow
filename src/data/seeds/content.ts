import type { Badge, GalleryAlbum, Movie, Quiz, QuizQuestion, Reel, Reward, RewardConfig, Difficulty } from "@/types";
import { BASE_TIME, DAY, HOUR } from "./time";

/* ---------- Movies ----------
 * Titles/years are limited to widely known facts. Cast, crew and synopses are DEMO copy
 * and flagged `verified: false` until the official team supplies approved details. */
export const MOVIES: Movie[] = [
  {
    id: "movie-comali", poster: "/images/movies/comali.jpg", backdrop: "/images/movies/comali-backdrop.jpg", title: "Comali", year: 2019, role: "Director", genres: ["Comedy", "Fantasy"], runtime: "≈ 2h 20m", hue: 38,
    synopsis: "A time-travel comedy about a man who wakes up after a long sleep to a very different world. Demo synopsis — official copy pending.",
    cast: [{ name: "Jayam Ravi", as: "Lead" }, { name: "Kajal Aggarwal" }], crew: [{ name: "Pradeep Ranganathan", job: "Director" }],
    verified: false,
    mediaSlots: [{ id: "m1", kind: "trailer", title: "Official trailer", available: false }, { id: "m2", kind: "song", title: "Featured song", available: false }, { id: "m3", kind: "bts", title: "Behind the scenes", available: true }],
    stills: ["Opening scene", "Title card", "Poster concept"], status: "published",
  },
  {
    id: "movie-love-today", poster: "/images/movies/love-today.jpg", backdrop: "/images/movies/love-today-backdrop.jpg", title: "Love Today", year: 2022, role: "Writer · Director · Actor", genres: ["Romantic comedy", "Drama"], runtime: "≈ 2h 35m", hue: 330,
    synopsis: "Two young people agree to swap phones for a day before their wedding is confirmed. Demo synopsis — official copy pending.",
    cast: [{ name: "Pradeep Ranganathan", as: "Lead" }, { name: "Ivana" }], crew: [{ name: "Pradeep Ranganathan", job: "Writer & Director" }],
    verified: false,
    mediaSlots: [{ id: "m1", kind: "trailer", title: "Official trailer", available: false }, { id: "m2", kind: "song", title: "Featured song", available: false }, { id: "m3", kind: "bts", title: "Set diaries", available: true }],
    stills: ["Phone swap", "Family dinner", "Title card"], status: "published",
  },
  {
    id: "movie-dragon", poster: "/images/movies/dragon.jpg", backdrop: "/images/movies/dragon.jpg", title: "Dragon", year: 2025, role: "Actor", genres: ["Comedy", "Drama"], runtime: "≈ 2h 30m", hue: 12,
    synopsis: "A coming-of-age campus-to-career story about shortcuts and second chances. Demo synopsis — official copy pending.",
    cast: [{ name: "Pradeep Ranganathan", as: "Lead" }, { name: "Anupama Parameswaran" }], crew: [{ name: "Ashwath Marimuthu", job: "Director" }],
    verified: false,
    mediaSlots: [{ id: "m1", kind: "trailer", title: "Official trailer", available: false }, { id: "m2", kind: "bts", title: "Making of", available: true }],
    stills: ["College days", "Interview room", "Title card"], status: "published",
  },
  {
    id: "movie-demo-next", poster: "/images/movies/prs-01.jpg", backdrop: "/images/movies/prs-01-banner.jpg", title: "Untitled Upcoming Project", year: 2026, role: "To be announced", genres: ["To be announced"], hue: 262,
    synopsis: "Placeholder entry reserved for the next official announcement. Nothing here is confirmed.",
    cast: [], crew: [], verified: false, mediaSlots: [{ id: "m1", kind: "trailer", title: "Teaser slot", available: false }], stills: ["Concept frame"], status: "published",
  },
];

/* ---------- Gallery ---------- */
const asset = (albumId: string, n: number, caption: string, hue: number, ratio: number) => ({ id: `${albumId}-a${n}`, albumId, caption, credit: "Demo artwork — replace with approved photography", hue, ratio });
export const ALBUMS: GalleryAlbum[] = [
  { id: "alb-stills", title: "Movie Stills", category: "stills", description: "Frames from the films, curated by the official team.", hue: 330, status: "published", rights: "Demo artwork. Production house clearance required before launch.",
    assets: [asset("alb-stills", 1, "Quiet moment before the big reveal", 330, 1.5), asset("alb-stills", 2, "Golden hour on the terrace", 20, 0.8), asset("alb-stills", 3, "Title card concept", 280, 1.2), asset("alb-stills", 4, "Crowd scene, wide frame", 200, 1.6), asset("alb-stills", 5, "Close-up, soft light", 350, 0.75)] },
  { id: "alb-bts", title: "Behind the Scenes", category: "bts", description: "Rehearsals, retakes and the laughter between takes.", hue: 38, status: "published", rights: "Demo artwork. Crew release forms pending.",
    assets: [asset("alb-bts", 1, "Script reading, day one", 38, 1.4), asset("alb-bts", 2, "Camera check", 60, 0.9), asset("alb-bts", 3, "Chai break on set", 25, 1.3), asset("alb-bts", 4, "Costume fitting", 300, 0.8)] },
  { id: "alb-posters", title: "Posters", category: "posters", description: "Theatrical and festival posters.", hue: 262, status: "published", rights: "Demo artwork. Poster rights held by respective studios.",
    assets: [asset("alb-posters", 1, "First-look poster concept", 262, 0.7), asset("alb-posters", 2, "Festival poster concept", 190, 0.7), asset("alb-posters", 3, "Teaser poster concept", 10, 0.7)] },
  { id: "alb-events", title: "Community Events", category: "events", description: "Fan meet-ups and community days.", hue: 150, status: "published", rights: "Demo artwork. Attendee consent required for real photos.",
    assets: [asset("alb-events", 1, "Fan meet-up, Chennai", 150, 1.5), asset("alb-events", 2, "Volunteers at a welfare drive", 120, 1.2), asset("alb-events", 3, "Screening night queue", 200, 0.9)] },
  { id: "alb-promo", title: "Promotions (draft)", category: "promo", description: "Unpublished promotional material in review.", hue: 100, status: "draft", rights: "Pending rights review.",
    assets: [asset("alb-promo", 1, "Promo banner concept", 100, 1.8)] },
];

/* ---------- Reels ---------- */
let rid = 0;
const reel = (p: Partial<Reel> & Pick<Reel, "title" | "creatorName" | "source" | "status">): Reel => {
  rid += 1;
  return {
    id: `reel-r${rid}`, caption: "", category: "Fan edit", creatorId: p.source === "official" ? "official" : "fan-x", durationSec: 24, hue: (rid * 47) % 360,
    likes: 100 + rid * 37, saves: 10 + rid * 5, comments: [], createdAt: BASE_TIME - rid * 6 * HOUR, published: p.status === "approved", captionsAvailable: rid % 2 === 0, ...p,
  };
};
export const REELS: Reel[] = [
  reel({ title: "Behind the title card", caption: "How the title design came together. Demo clip.", creatorName: "PR Show Official", source: "official", status: "approved", category: "Official", durationSec: 31, likes: 1240, saves: 210, comments: [{ id: "c1", author: "Arjun V", body: "That typography is gorgeous.", at: BASE_TIME - 3 * HOUR }, { id: "c2", author: "Nisha R", body: "More behind-the-scenes please!", at: BASE_TIME - 2 * HOUR }] }),
  reel({ title: "Love Today rewatch ritual", caption: "Phone-swap challenge with my cousins (nobody lost a friend).", creatorId: "fan-meera", creatorName: "Meera Sundaram", source: "fan", status: "approved", category: "Fan edit", likes: 612, saves: 88, loc: { districtId: "chennai", acId: "mylapore", wardId: "w-mylapore-12" }, comments: [{ id: "c3", author: "Karthikeyan P", body: "Ha! Brave.", at: BASE_TIME - 5 * HOUR }] }),
  reel({ title: "Dragon soundtrack on the veena", caption: "A classical take, played by ear.", creatorId: "fan-janani", creatorName: "Janani Murugan", source: "fan", status: "approved", category: "Music cover", likes: 903, saves: 190, loc: { districtId: "trichy", acId: "srirangam", wardId: "w-sri-2" }, comments: [] }),
  reel({ title: "Pondy Bazaar screening-night vlog", caption: "Queue energy before the show.", creatorId: "fan-divya", creatorName: "Divya Lakshmi", source: "fan", status: "approved", category: "Event recap", likes: 340, saves: 41, loc: { districtId: "chennai", acId: "t-nagar", wardId: "w-tnagar-8" } }),
  reel({ title: "Comali trivia in 30 seconds", caption: "Five facts, one breath.", creatorId: "fan-arjun", creatorName: "Arjun Venkat", source: "fan", status: "approved", category: "Trivia", likes: 215, saves: 20, loc: { districtId: "chennai", acId: "mylapore", wardId: "w-mylapore-12" } }),
  reel({ title: "Mandaveli fan club banner timelapse", caption: "Painting the community banner for the meet-up.", creatorId: "fan-meera", creatorName: "Meera Sundaram", source: "fan", status: "pending_review", category: "Event recap", caseId: "case-1", published: false, loc: { districtId: "chennai", acId: "mylapore", wardId: "w-mylapore-12" } }),
  reel({ title: "Dialogue mashup (needs clearance)", caption: "Clips cut from the film with background music.", creatorId: "fan-arjun", creatorName: "Arjun Venkat", source: "fan", status: "escalated", category: "Fan edit", caseId: "case-2", published: false, loc: { districtId: "chennai", acId: "mylapore", wardId: "w-mylapore-12" } }),
  reel({ title: "Bike ride to the premiere", caption: "Sharing my route and exact home address in the comments!", creatorId: "fan-karthi", creatorName: "Karthikeyan P", source: "fan", status: "pending_review", category: "Event recap", caseId: "case-3", published: false, loc: { districtId: "chennai", acId: "velachery", wardId: "w-velachery-21" } }),
  reel({ title: "Unauthorised ticket resale", caption: "DM me for extra tickets, cheap price.", creatorId: "fan-ravi", creatorName: "Ravichandran S", source: "fan", status: "rejected", category: "Event recap", reviewNote: "Ticket resale is not allowed under the community guidelines.", published: false, loc: { districtId: "madurai", acId: "madurai-central", wardId: "w-mdc-5" } }),
  reel({ title: "Poster collage speed-art", caption: "Digital painting of the festival poster concept.", creatorId: "fan-nisha", creatorName: "Nisha Rahman", source: "fan", status: "needs_correction", category: "Fan art", reviewNote: "Please add the rights confirmation for the reference image and resubmit.", published: false, caseId: "case-4", loc: { districtId: "chennai", acId: "mylapore", wardId: "w-mylapore-13" } }),
];

/* ---------- Quizzes ---------- */
let qn = 0;
const q = (prompt: string, options: string[], correctIndex: number, explanation: string, category: string, difficulty: Difficulty = "easy", clue?: string): QuizQuestion => {
  qn += 1;
  return { id: `q${qn}`, prompt, options, correctIndex, explanation, category, difficulty, clue };
};
const quiz = (id: string, title: string, blurb: string, mode: Quiz["mode"], difficulty: Difficulty, hue: number, questions: QuizQuestion[]): Quiz => ({
  id, title, blurb, mode, difficulty, hue, status: "published", questions, pointsPerCorrect: 10, createdBy: "adm-central", aiGenerated: false, updatedAt: BASE_TIME - 20 * DAY,
});

export const QUIZZES: Quiz[] = [
  quiz("quiz-trivia-films", "The PR Film Shelf", "Years, roles and the stories behind the films.", "trivia", "easy", 330, [
    q("Which film was released in 2022 and is a romantic comedy about swapping phones?", ["Comali", "Love Today", "Dragon", "None of these"], 1, "Love Today (2022) is built around a phone-swap premise.", "Movies"),
    q("In which year was Comali released?", ["2017", "2018", "2019", "2021"], 2, "Comali released in 2019.", "Movies"),
    q("Pradeep Ranganathan directed which of these films?", ["Comali", "Dragon", "Neither", "Both"], 0, "He directed Comali (2019). Dragon (2025) was directed by Ashwath Marimuthu.", "Movies", "medium"),
    q("Which film in the catalogue is from 2025?", ["Dragon", "Love Today", "Comali", "Untitled Upcoming Project"], 0, "Dragon is the 2025 release in this catalogue.", "Movies"),
    q("Who wrote and directed Love Today?", ["Pradeep Ranganathan", "Ashwath Marimuthu", "A guest director", "Nobody credited"], 0, "Pradeep Ranganathan wrote and directed Love Today.", "Movies", "medium"),
  ]),
  quiz("quiz-dialogue-demo", "Finish the Line", "Demo clues: complete the fictional dialogue.", "dialogue", "medium", 38, [
    q("“I'll call you back after I ______.” (demo line)", ["reboot", "finish this scene", "find my charger", "get the popcorn"], 2, "Demo line — real dialogue will be added with approved scripts.", "Dialogue", "easy", "Demo clue: a classic phone-obsessed line."),
    q("“Don't judge a plan by its ______.” (demo line)", ["font", "first draft", "cover", "budget"], 1, "Demo line for gameplay testing.", "Dialogue", "medium", "Demo clue"),
    q("“Everyone has a ______ in their pocket.” (demo line)", ["secret", "ticket", "story", "password"], 0, "Demo line for gameplay testing.", "Dialogue", "easy", "Demo clue"),
    q("“Let's rewind and try that ______.” (demo line)", ["again", "slowly", "quietly", "tomorrow"], 0, "Demo line for gameplay testing.", "Dialogue", "easy", "Demo clue"),
  ]),
  quiz("quiz-scene-demo", "Name That Scene", "Demo clues describing the type of scene.", "scene", "medium", 200, [
    q("A character hands over their phone and waits nervously. Which scene type is this?", ["Reveal", "Chase", "Dance number", "Flashback"], 0, "Demo scene clue.", "Scenes"),
    q("Two families sit around a long dining table in awkward silence.", ["Festival finale", "Family dinner", "Courtroom", "Train station"], 1, "Demo scene clue.", "Scenes"),
    q("A job interview where the answers keep escalating.", ["Interview", "Wedding", "Race", "Press meet"], 0, "Demo scene clue.", "Scenes", "hard"),
  ]),
  quiz("quiz-song-demo", "Hum the Hook", "Demo clues about musical moments.", "song", "easy", 280, [
    q("A song that starts with a single flute note. What is the opening instrument?", ["Flute", "Drums", "Piano", "Guitar"], 0, "Demo song clue.", "Songs"),
    q("A wedding-sequence song is usually shot at which type of location?", ["Mandapam", "Airport", "Library", "Parking lot"], 0, "Demo song clue.", "Songs"),
    q("Which instrument often drives a celebratory folk beat?", ["Parai", "Harp", "Cello", "Synth pad"], 0, "Demo song clue.", "Songs"),
  ]),
  quiz("quiz-daily", "Daily Challenge", "Three quick questions, fresh each day. Demo content is deterministic.", "daily", "medium", 12, [
    q("Which year did Love Today release?", ["2020", "2021", "2022", "2023"], 2, "Love Today released in 2022.", "Movies"),
    q("PR Show's tagline is…", ["Beyond the Screen.", "Roll Camera.", "Fans First.", "Encore."], 0, "“Beyond the Screen.” is the PR Show tagline.", "Community"),
    q("Which kind of content needs approval before it appears in Reels?", ["Fan-submitted reels", "Official reels", "Neither", "All comments"], 0, "Fan reels stay private until a moderator approves them.", "Community"),
  ]),
  quiz("quiz-onboarding", "Welcome Quiz", "Optional warm-up that earns your first badge.", "onboarding", "easy", 150, [
    q("What does the PR tab in the app lead to?", ["Movies and official gallery", "Payments", "Direct messages", "Settings"], 0, "The PR tab is home to movies and the official gallery.", "Community"),
    q("Can fans send direct messages to other fans in PR Show?", ["Yes", "No", "Only on weekends", "Only verified fans"], 1, "Direct messaging is admin-only.", "Community"),
  ]),
  { ...quiz("quiz-draft-1", "Behind the Camera (Draft)", "Draft quiz awaiting review.", "trivia", "medium", 60, [
    q("Which of these is a stage of film production before shooting?", ["Pre-production", "Colour grading", "Dubbing", "Release"], 0, "Pre-production covers planning before cameras roll.", "Movies", "medium"),
  ]), status: "draft", createdBy: "adm-central", aiGenerated: true, updatedAt: BASE_TIME - 2 * DAY },
];

export const GAME_MODES = [
  { mode: "trivia", name: "Movie Trivia", blurb: "Facts, years and film-shelf knowledge.", hue: 330 },
  { mode: "dialogue", name: "Dialogue Guess", blurb: "Finish the iconic line.", hue: 38 },
  { mode: "scene", name: "Scene Guess", blurb: "Recognise the moment from a clue.", hue: 200 },
  { mode: "song", name: "Song Guess", blurb: "Name the hook, instrument or mood.", hue: 280 },
] as const;

/* ---------- Badges, rewards ---------- */
export const BADGES: Badge[] = [
  { id: "b-first-quiz", name: "First Take", description: "Completed your first quiz.", hint: "Finish any quiz.", hue: 38 },
  { id: "b-perfect", name: "Perfect Score", description: "Answered every question correctly in a quiz.", hint: "Get 100% in any quiz.", hue: 150 },
  { id: "b-three-quizzes", name: "Regular", description: "Completed three quizzes.", hint: "Finish three quizzes.", hue: 200 },
  { id: "b-verified", name: "Verified Member", description: "Membership approved by a moderator.", hint: "Get your membership approved.", hue: 330 },
  { id: "b-event", name: "Front Row", description: "RSVP'd to a community event.", hint: "Confirm an event RSVP.", hue: 12 },
  { id: "b-welfare", name: "Giving Hand", description: "Registered for a welfare activity.", hint: "Join a welfare activity.", hue: 120 },
  { id: "b-creator", name: "Creator", description: "Had a reel approved by moderators.", hint: "Get a fan reel approved.", hue: 280 },
];
export const REWARDS: Reward[] = [
  { id: "rw-wall-1", kind: "wallpaper", name: "Golden Hour Wallpaper", description: "Warm gradient wallpaper (demo artwork).", pointsRequired: 50, hue: 38 },
  { id: "rw-wall-2", kind: "wallpaper", name: "Midnight Marquee Wallpaper", description: "Dark cinematic wallpaper (demo artwork).", pointsRequired: 120, hue: 262 },
  { id: "rw-wall-3", kind: "wallpaper", name: "Festival Pink Wallpaper", description: "Poster-inspired wallpaper (demo artwork).", pointsRequired: 200, hue: 330 },
  { id: "rw-pass", kind: "movie_pass", name: "Movie Pass (Simulated)", description: "A simulated reward. Not a real ticket and not redeemable.", pointsRequired: 400, hue: 12 },
  { id: "rw-ticket", kind: "event_ticket", name: "Event Ticket (Simulated)", description: "A simulated reward. Not a real ticket and not redeemable.", pointsRequired: 600, hue: 200 },
];
export const REWARD_CONFIG: RewardConfig = { pointsPerCorrect: 10, perfectBonus: 20, rsvpPoints: 15, welfarePoints: 30, reelApprovedPoints: 40 };
