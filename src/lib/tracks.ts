import type { DbTrack } from "@/db/schema";

export type Singer = "A" | "B" | "BOTH";

export type LyricLine = {
  at: number;
  end: number;
  singer: Singer;
  text: string;
};

export type Track = {
  id: string;
  title: string;
  artist: string;
  genre: string;
  duration: number;
  durationLabel: string;
  bpm: number;
  key: string;
  cover: string;
  audioUrl?: string;
  color: string;
  accent: string;
  lyrics: LyricLine[];
};

export function dbTrackToTrack(dbTrack: DbTrack): Track {
  return {
    id: dbTrack.id,
    title: dbTrack.title,
    artist: dbTrack.artist,
    genre: dbTrack.genre,
    duration: dbTrack.duration,
    durationLabel: dbTrack.durationLabel,
    bpm: dbTrack.bpm,
    key: dbTrack.key,
    cover: dbTrack.coverUrl,
    audioUrl: dbTrack.audioUrl || undefined,
    color: dbTrack.color,
    accent: dbTrack.accent,
    lyrics: (dbTrack.lyrics as LyricLine[]) || [],
  };
}

export const tracks: Track[] = [
  {
    id: "est-ce-que-tu-maimes",
    title: "Est-ce que tu m'aimes ?",
    artist: "Gims",
    genre: "Pop urbaine",
    duration: 235,
    durationLabel: "3:55",
    bpm: 115,
    key: "E min",
    cover: "/covers/est-ce-que-tu-maimes.jpg",
    audioUrl: "/audio/est-ce-que-tu-maimes.mp3",
    color: "#2563eb",
    accent: "#93c5fd",
    lyrics: [
      { at: 8.9, end: 13.1, singer: "A", text: "J'ai retrouvé le sourire quand j'ai vu le bout du tunnel" },
      { at: 13.1, end: 18.8, singer: "A", text: "Où nous mènera ce jeu du mâle et de la femelle?" },
      { at: 18.8, end: 21.1, singer: "A", text: "Du mâle et de la femelle" },
      { at: 21.1, end: 25.1, singer: "A", text: "On était tellement complices, on a brisé nos complexes" },
      { at: 25.1, end: 30.7, singer: "A", text: "Pour te faire comprendre, t'avais juste à lever le cil" },
      { at: 30.7, end: 32.1, singer: "A", text: "T'avais juste à lever le cil" },
      { at: 32.1, end: 37.3, singer: "A", text: "J'étais prêt à graver ton image à l'encre noire sous mes paupières" },
      { at: 37.3, end: 42.8, singer: "A", text: "Afin de te voir, même dans un sommeil éternel" },
      { at: 42.8, end: 46.9, singer: "A", text: "Même dans un sommeil éternel" },
      { at: 46.9, end: 49.2, singer: "A", text: "Même dans un sommeil éternel" },
      { at: 49.2, end: 53.3, singer: "BOTH", text: "J'étais censé t'aimer, mais j'ai vu l'averse" },
      { at: 53.3, end: 57.3, singer: "BOTH", text: "J'ai cligné des yeux, tu n'étais plus la même" },
      { at: 57.3, end: 60.9, singer: "BOTH", text: "Est-ce que je t'aime? J'sais pas si je t'aime" },
      { at: 60.9, end: 65.2, singer: "BOTH", text: "Est-ce que tu m'aimes? J'sais pas si je t'aime" },
      { at: 65.2, end: 69.2, singer: "BOTH", text: "J'étais censé t'aimer, mais j'ai vu l'averse" },
      { at: 69.2, end: 73.3, singer: "BOTH", text: "J'ai cligné des yeux, tu n'étais plus la même" },
      { at: 73.3, end: 77.1, singer: "BOTH", text: "Est-ce que je t'aime? J'sais pas si je t'aime" },
      { at: 77.1, end: 81.0, singer: "BOTH", text: "Est-ce que tu m'aimes? J'sais pas si je t'aime" },
      { at: 81.0, end: 85.0, singer: "B", text: "Pour t'éviter de souffrir, j'n'avais qu'à te dire \"je t'aime\"" },
      { at: 85.0, end: 90.9, singer: "B", text: "Ça m'a fait mal de t'faire mal, je n'ai jamais autant souffert" },
      { at: 90.9, end: 92.9, singer: "B", text: "Je n'ai jamais autant souffert" },
      { at: 92.9, end: 97.5, singer: "B", text: "Quand j't'ai mis la bague au doigt, j'me suis passé les bracelets" },
      { at: 97.5, end: 102.6, singer: "B", text: "Pendant ce temps, le temps passe, et je subis tes balivernes" },
      { at: 102.6, end: 104.3, singer: "B", text: "Et je subis tes balivernes" },
      { at: 104.3, end: 109.3, singer: "B", text: "J'étais prêt à graver ton image à l'encre noire sous mes paupières" },
      { at: 109.3, end: 114.9, singer: "B", text: "Afin de te voir, même dans un sommeil éternel" },
      { at: 114.9, end: 119.1, singer: "A", text: "Même dans un sommeil éternel" },
      { at: 119.1, end: 121.4, singer: "A", text: "Même dans un sommeil éternel" },
      { at: 121.4, end: 125.7, singer: "BOTH", text: "J'étais censé t'aimer, mais j'ai vu l'averse" },
      { at: 125.7, end: 129.6, singer: "BOTH", text: "J'ai cligné des yeux, tu n'étais plus la même" },
      { at: 129.6, end: 133.0, singer: "BOTH", text: "Est-ce que je t'aime? J'sais pas si je t'aime" },
      { at: 133.0, end: 137.5, singer: "BOTH", text: "Est-ce que tu m'aimes? J'sais pas si je t'aime" },
      { at: 137.5, end: 141.8, singer: "BOTH", text: "J'étais censé t'aimer, mais j'ai vu l'averse" },
      { at: 141.8, end: 145.5, singer: "BOTH", text: "J'ai cligné des yeux, tu n'étais plus la même" },
      { at: 145.5, end: 148.6, singer: "BOTH", text: "Est-ce que je t'aime? J'sais pas si je t'aime" },
      { at: 148.6, end: 158.8, singer: "BOTH", text: "Est-ce que tu m'aimes? J'sais pas si je t'aime" },
      { at: 158.8, end: 167.0, singer: "A", text: "J'sais pas si je t'aime" },
      { at: 167.0, end: 168.2, singer: "B", text: "J'sais pas si je t'aime" },
      { at: 168.2, end: 172.1, singer: "A", text: "Je m'suis fais mal en m'envolant, j'n'avais pas vu l'plafond de verre" },
      { at: 172.1, end: 178.1, singer: "B", text: "Tu me trouverais ennuyeux si je t'aimais à ta manière" },
      { at: 178.1, end: 181.9, singer: "A", text: "Si je t'aimais à ta manière" },
      { at: 181.9, end: 185.2, singer: "B", text: "Si je t'aimais à ta manière" },
      { at: 185.2, end: 190.0, singer: "BOTH", text: "J'étais censé t'aimer, mais j'ai vu l'averse" },
      { at: 190.0, end: 193.4, singer: "BOTH", text: "J'ai cligné des yeux, tu n'étais plus la même" },
      { at: 193.4, end: 197.1, singer: "BOTH", text: "Est-ce que je t'aime? J'sais pas si je t'aime" },
      { at: 197.1, end: 201.7, singer: "BOTH", text: "Est-ce que tu m'aimes? J'sais pas si je t'aime" },
      { at: 201.7, end: 205.7, singer: "BOTH", text: "J'étais censé t'aimer, mais j'ai vu l'averse" },
      { at: 205.7, end: 209.4, singer: "BOTH", text: "J'ai cligné des yeux, tu n'étais plus la même" },
      { at: 209.4, end: 212.6, singer: "BOTH", text: "Est-ce que je t'aime? J'sais pas si je t'aime" },
      { at: 212.6, end: 222.8, singer: "BOTH", text: "Est-ce que tu m'aimes? J'sais pas si je t'aime" },
      { at: 222.8, end: 230.7, singer: "A", text: "J'sais pas si je t'aime" },
      { at: 230.7, end: 234.7, singer: "B", text: "J'sais pas si je t'aime" },
    ],
  },
  {
    id: "minuit-zero",
    title: "Minuit Zéro",
    artist: "Nova & Sway",
    genre: "Pop urbaine",
    duration: 72,
    durationLabel: "1:12",
    bpm: 104,
    key: "F min",
    cover: "/covers/minuit-zero.svg",
    color: "#ef3f8f",
    accent: "#ffbfdc",
    lyrics: [
      { at: 0, end: 5, singer: "BOTH", text: "Respire… le duel commence" },
      { at: 5, end: 10, singer: "A", text: "J'ai laissé la ville allumée derrière moi" },
      { at: 10, end: 15, singer: "A", text: "Les néons me suivent mais je n'les entends pas" },
      { at: 15, end: 20, singer: "B", text: "Tu cours après l'heure, moi je danse avec elle" },
      { at: 20, end: 25, singer: "B", text: "Nos ombres se répondent sous la lune artificielle" },
      { at: 25, end: 30, singer: "A", text: "Si demain nous oublie, reste encore un peu" },
      { at: 30, end: 35, singer: "B", text: "On remet les compteurs à minuit zéro" },
      { at: 35, end: 40, singer: "A", text: "Plus rien à promettre, plus rien dans les poches" },
      { at: 40, end: 45, singer: "B", text: "Seulement cette musique qui nous rapproche" },
      { at: 45, end: 51, singer: "BOTH", text: "Minuit zéro — on recommence tout" },
      { at: 51, end: 57, singer: "A", text: "Ta voix dans le noir me ramène à nous" },
      { at: 57, end: 63, singer: "B", text: "Minuit zéro — le monde peut attendre" },
      { at: 63, end: 69, singer: "BOTH", text: "Encore une seconde avant de redescendre" },
      { at: 69, end: 72, singer: "BOTH", text: "Minuit… zéro" },
    ],
  },
  {
    id: "coeur-laser",
    title: "Cœur Laser",
    artist: "Léna K. feat. Milo",
    genre: "Électro pop",
    duration: 78,
    durationLabel: "1:18",
    bpm: 122,
    key: "C min",
    cover: "/covers/coeur-laser.svg",
    color: "#5046e5",
    accent: "#b8b4ff",
    lyrics: [
      { at: 0, end: 5, singer: "BOTH", text: "Trois, deux, un — lumière" },
      { at: 5, end: 11, singer: "A", text: "Tu me regardes en ultraviolet" },
      { at: 11, end: 17, singer: "B", text: "Je lis tes messages dans les reflets" },
      { at: 17, end: 23, singer: "A", text: "La nuit nous dessine en lignes parfaites" },
      { at: 23, end: 29, singer: "B", text: "Un battement de trop et tout s'arrête" },
      { at: 29, end: 35, singer: "BOTH", text: "Cœur laser, vise-moi encore" },
      { at: 35, end: 41, singer: "BOTH", text: "Fais monter la lumière plus fort" },
      { at: 41, end: 47, singer: "A", text: "Pas besoin de filtre, pas besoin de décor" },
      { at: 47, end: 53, singer: "B", text: "Quand le silence tombe, on danse encore" },
      { at: 53, end: 59, singer: "A", text: "Éclair rouge sur nos deux visages" },
      { at: 59, end: 65, singer: "B", text: "On se retrouve au milieu de l'orage" },
      { at: 65, end: 73, singer: "BOTH", text: "Cœur laser, cœur laser, traverse la nuit" },
      { at: 73, end: 78, singer: "BOTH", text: "Et ramène-moi ici" },
    ],
  },
  {
    id: "sans-reseau",
    title: "Sans Réseau",
    artist: "Yanis Blue",
    genre: "Pop solaire",
    duration: 76,
    durationLabel: "1:16",
    bpm: 112,
    key: "A maj",
    cover: "/covers/sans-reseau.svg",
    color: "#ff6d4a",
    accent: "#ffd25e",
    lyrics: [
      { at: 0, end: 5, singer: "BOTH", text: "Fenêtres ouvertes, volume à fond" },
      { at: 5, end: 11, singer: "A", text: "J'ai mis le téléphone en mode avion" },
      { at: 11, end: 17, singer: "B", text: "La route nous appelle, on change de direction" },
      { at: 17, end: 23, singer: "A", text: "Du soleil plein les yeux, du vent dans les chansons" },
      { at: 23, end: 29, singer: "B", text: "On n'a besoin de rien, juste un peu d'horizon" },
      { at: 29, end: 35, singer: "BOTH", text: "Sans réseau, sans regrets" },
      { at: 35, end: 41, singer: "A", text: "On roule jusqu'où la mer disparaît" },
      { at: 41, end: 47, singer: "B", text: "Sans réseau, promets-moi" },
      { at: 47, end: 53, singer: "BOTH", text: "Qu'on ne rentrera pas cette fois" },
      { at: 53, end: 59, singer: "A", text: "La nuit arrive mais personne ne freine" },
      { at: 59, end: 65, singer: "B", text: "On garde les souvenirs, on perd les antennes" },
      { at: 65, end: 71, singer: "BOTH", text: "Sans réseau, le monde est à nous" },
      { at: 71, end: 76, singer: "BOTH", text: "Chante plus fort jusqu'au bout" },
    ],
  },
  {
    id: "dernier-metro",
    title: "Dernier Métro",
    artist: "Kairo 18",
    genre: "Rap mélodique",
    duration: 80,
    durationLabel: "1:20",
    bpm: 92,
    key: "D min",
    cover: "/covers/dernier-metro.svg",
    color: "#b8e42d",
    accent: "#e8ff94",
    lyrics: [
      { at: 0, end: 5, singer: "BOTH", text: "Attention à la fermeture des portes" },
      { at: 5, end: 11, singer: "A", text: "J'ai raté le dernier métro pour écrire seize mesures" },
      { at: 11, end: 17, singer: "A", text: "La ville vide a des secrets sur chaque mur" },
      { at: 17, end: 23, singer: "B", text: "Tu parles de demain comme si tout était sûr" },
      { at: 23, end: 29, singer: "B", text: "Moi j'avance sans ticket, le regard un peu dur" },
      { at: 29, end: 35, singer: "A", text: "Quai désert, cœur plein, j'attends pas le signal" },
      { at: 35, end: 41, singer: "B", text: "Chaque détour me rapproche du point final" },
      { at: 41, end: 47, singer: "A", text: "Les tunnels font l'écho de tout ce qu'on vaut" },
      { at: 47, end: 53, singer: "B", text: "On remonte à la surface au dernier métro" },
      { at: 53, end: 59, singer: "A", text: "J'ai la cadence lourde et les idées claires" },
      { at: 59, end: 65, singer: "B", text: "Tu as le feu tranquille, j'ai l'étincelle en l'air" },
      { at: 65, end: 72, singer: "BOTH", text: "Dernier métro, personne sur le quai" },
      { at: 72, end: 80, singer: "BOTH", text: "Deux voix dans la rame, impossible d'arrêter" },
    ],
  },
];

export function getTrack(trackId: string) {
  return tracks.find((track) => track.id === trackId);
}
