import { hash } from "@/lib/utils";
import type { GalleryAsset, GalleryAlbum, GameMode, Quiz, Reel, Reward } from "@/types";

/** Stock photography (Unsplash licence) stored locally. Generic imagery only — never presented as official PR photography. */
const P = (n: string) => `/images/photos/${n}.jpg`;
const pick = (pool: string[], key: string) => P(pool[hash(key) % pool.length]);

export const MODE_IMAGE: Record<GameMode, string> = {
  trivia: P("cin1"), dialogue: P("dial1"), scene: P("bts3"), song: P("music1"), daily: "/images/sections/games.jpg", onboarding: P("cin5"),
};
export const quizImage = (q: Pick<Quiz, "mode">) => MODE_IMAGE[q.mode];

const ALBUM: Record<GalleryAlbum["category"], string> = { stills: P("cin3"), bts: P("bts1"), posters: P("cin1"), events: P("post3"), promo: P("cin2") };
export const albumImage = (a: Pick<GalleryAlbum, "category">) => ALBUM[a.category];

const ASSET_POOLS: Record<string, string[]> = {
  stills: ["cin3", "cin4", "scene1", "cin5", "post2", "cin1", "cin2"],
  bts: ["bts1", "bts2", "bts3", "bts4", "scene1", "cin3"],
  posters: ["post1", "post2", "cin1", "post3"],
  events: ["post3", "cin4", "music2", "post2"],
  promo: ["cin2", "bts4", "music3"],
};
export const assetImage = (a: Pick<GalleryAsset, "id" | "albumId">) => {
  const cat = a.albumId.replace(/^alb-/, "");
  return pick(ASSET_POOLS[cat] ?? ASSET_POOLS.stills, a.id);
};

const REEL_POOL = ["reel2", "bts1", "music2", "music3", "cin3", "bts4", "post3", "music1", "bts2", "scene1", "cin2", "dial1"];
export const reelImage = (r: Pick<Reel, "id">) => pick(REEL_POOL, r.id);

const REWARD: Record<string, string> = { "rw-wall-1": P("wall2"), "rw-wall-2": P("wall3"), "rw-wall-3": P("wall1"), "rw-pass": P("cin2"), "rw-ticket": P("post3") };
export const rewardImage = (r: Pick<Reward, "id">) => REWARD[r.id];

export const STILL_POOL = [P("cin4"), P("cin5"), P("post2"), P("scene1"), P("cin1")];
