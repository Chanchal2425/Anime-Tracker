// import { useEffect, useState } from "react";
// import API from "../api/api";
// import { useAnimeDetail } from "../context/AnimeDetailContext";
// import "./AnimeDetailModal.css";

// function AnimeDetailModal({ anime, onClose, onAnimeUpdated }) {
//   const { openAnimeDetail } = useAnimeDetail();
//   const [details, setDetails] = useState(null);
//   const [staff, setStaff] = useState([]);
//   const [characters, setCharacters] = useState([]);
//   const [loadingInfo, setLoadingInfo] = useState(true);
//   const [loadingStaff, setLoadingStaff] = useState(true);
//   const [loadingChars, setLoadingChars] = useState(true);

//   const [localAnime, setLocalAnime] = useState({ ...anime });
//   useEffect(() => {
//     setLocalAnime({ ...anime });
//   }, [anime]);

//   const [note, setNote] = useState("");
//   const [timestamp, setTimestamp] = useState("");
//   const [saving, setSaving] = useState(false);
//   const [episodeNotes, setEpisodeNotes] = useState([]);

//   // Check if anime is in the user's personal tracking list
//   const validStatuses = ["plan_to_watch", "watching", "completed"];
//   const isTrackedInUserList = Boolean(
//     localAnime?.status && validStatuses.includes(localAnime.status)
//   );

//   // Target ID for local API notes: use database ID
//   const animeDbId = localAnime?.id || localAnime?.mal_id;

//   useEffect(() => {
//     if (!animeDbId || !isTrackedInUserList) return;
//     API.get(`/notes/?anime=${animeDbId}`)
//       .then((res) => setEpisodeNotes(res.data))
//       .catch((err) => console.error("Failed to load notes:", err));
//   }, [animeDbId, isTrackedInUserList]);

//   // Dynamically derive total episodes
//   const parsedDetailsEpisodes =
//     details?.episodes && !isNaN(parseInt(details.episodes, 10))
//       ? parseInt(details.episodes, 10)
//       : null;

//   const parsedDbEpisodes =
//     localAnime?.total_episodes && Number(localAnime.total_episodes) > 0
//       ? Number(localAnime.total_episodes)
//       : null;

//   const totalMaxEpisodes = parsedDetailsEpisodes || parsedDbEpisodes || null;

//   const currentEp = Number(localAnime?.current_episode) || 0;
//   const nextEpisode = currentEp + 1;
//   const isCompleted =
//     localAnime?.status === "completed" ||
//     (totalMaxEpisodes !== null && currentEp >= totalMaxEpisodes);

//  useEffect(() => {
//   let isMounted = true;
  
//   // Explicitly check for mal_id. Do not fall back to local database ID (localAnime.id)
//   const malId = anime?.mal_id;
//   const animeTitle = anime?.title || localAnime?.title;

//   if (!malId && !animeTitle) {
//     setLoadingInfo(false);
//     setLoadingStaff(false);
//     setLoadingChars(false);
//     return;
//   }

//   setLoadingInfo(true);
//   setLoadingStaff(true);
//   setLoadingChars(true);

//   const QUERY_BY_MAL_ID = `
//     query ($idMal: Int) {
//       Media(idMal: $idMal, type: ANIME) {
//         id
//         title { english romaji }
//         description(asHtml: false)
//         averageScore
//         meanScore
//         episodes
//         startDate { year month day }
//         coverImage { extraLarge }
//         staff(sort: RELEVANCE) {
//           edges {
//             role
//             node { id name { full } }
//           }
//         }
//         characters(sort: RELEVANCE, role: MAIN) {
//           edges {
//             node {
//               id
//               name { full }
//               image { large }
//             }
//             voiceActors(language: JAPANESE) {
//               id
//               name { full }
//               image { medium }
//             }
//           }
//         }
//       }
//     }
//   `;

//   const QUERY_BY_TITLE = `
//     query ($search: String) {
//       Media(search: $search, type: ANIME) {
//         id
//         title { english romaji }
//         description(asHtml: false)
//         averageScore
//         meanScore
//         episodes
//         startDate { year month day }
//         coverImage { extraLarge }
//         staff(sort: RELEVANCE) {
//           edges {
//             role
//             node { id name { full } }
//           }
//         }
//         characters(sort: RELEVANCE, role: MAIN) {
//           edges {
//             node {
//               id
//               name { full }
//               image { large }
//             }
//             voiceActors(language: JAPANESE) {
//               id
//               name { full }
//               image { medium }
//             }
//           }
//         }
//       }
//     }
//   `;

//   // Sanitizes titles by stripping trailing punctuation like '.' or '!' which break searches
//   const cleanTitle = (rawTitle) => {
//     if (!rawTitle) return "";
//     return rawTitle
//       .split("!")[0]
//       .split(":")[0]
//       .replace(/[^\w\s-]/gi, "")
//       .trim();
//   };

//   const fetchAniList = async (query, variables) => {
//     try {
//       const res = await fetch("https://graphql.anilist.co", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Accept: "application/json",
//         },
//         body: JSON.stringify({ query, variables }),
//       });

//       if (!res.ok) return null;

//       const json = await res.json();
//       if (json.errors) return null;
//       return json;
//     } catch (err) {
//       return null;
//     }
//   };

// const executeQuery = async () => {
//   const parsedMalId = parseInt(malId, 10);
//   // Only query Jikan if mal_id is valid and reasonably low
//   const isValidMalId = Boolean(
//     malId && !isNaN(parsedMalId) && parsedMalId > 0 && parsedMalId < 100000
//   );

//   let success = false;

//   // 1. Try Jikan (MAL API) with a 3-second timeout
//   if (isValidMalId) {
//     try {
//       const controller = new AbortController();
//       const timeoutId = setTimeout(() => controller.abort(), 3000);

//       const malRes = await fetch(
//         `https://api.jikan.moe/v4/anime/${parsedMalId}`,
//         { signal: controller.signal }
//       );
//       clearTimeout(timeoutId);

//       if (malRes.ok) {
//         const malJson = await malRes.json();
//         const data = malJson.data;

//         if (data && isMounted) {
//           setDetails({
//             title: data.title_english || data.title || animeTitle,
//             synopsis: data.synopsis || "No synopsis available.",
//             score: data.score ? data.score.toFixed(1) : "N/A",
//             episodes: data.episodes || "?",
//             aired: { string: data.aired?.string || "N/A" },
//             images: {
//               jpg: { large_image_url: data.images?.jpg?.large_image_url },
//             },
//           });
//           success = true;
//         }
//       }
//     } catch (err) {
//       console.warn("Jikan timed out or failed. Falling back to AniList...");
//     }
//   }

//   // 2. Secondary Source: AniList GraphQL (Fires if Jikan times out or fails)
//   if (!success && animeTitle) {
//     try {
//       const aniListResult = await fetchAniList(QUERY_BY_TITLE, {
//         search: cleanTitle(animeTitle),
//       });

//       if (aniListResult?.data?.Media && isMounted) {
//         const media = aniListResult.data.Media;
//         const score = media.averageScore || media.meanScore;

//         setDetails({
//           title: media.title?.english || media.title?.romaji || animeTitle,
//           synopsis: media.description
//             ? media.description.replace(/<[^>]*>?/gm, "")
//             : "No synopsis available.",
//           score: score ? (score / 10).toFixed(1) : "N/A",
//           episodes: media.episodes || "?",
//           aired: {
//             string: media.startDate?.year ? `${media.startDate.year}` : "N/A",
//           },
//           images: { jpg: { large_image_url: media.coverImage?.extraLarge } },
//         });

//         setStaff(
//           (media.staff?.edges || []).map((e) => ({
//             person: { mal_id: e.node.id, name: e.node.name.full },
//             positions: [e.role],
//           }))
//         );

//         setCharacters(
//           (media.characters?.edges || []).map((e) => ({
//             character: {
//               mal_id: e.node.id,
//               name: e.node.name.full,
//               images: { jpg: { image_url: e.node.image?.large } },
//             },
//             role: "Main",
//             voice_actors: e.voiceActors?.map((va) => ({
//               language: "Japanese",
//               person: {
//                 name: va.name.full,
//                 images: { jpg: { image_url: va.image?.medium } },
//               },
//             })),
//           }))
//         );

//         success = true;
//       }
//     } catch (err) {
//       console.error("AniList search failed:", err);
//     }
//   }

//   // 3. Ultimate Fallback: Local Database Record
//   if (!success && isMounted) {
//     setDetails({
//       title: animeTitle || "Unknown Title",
//       synopsis: localAnime?.synopsis || "No detailed info available.",
//       score: localAnime?.rating || localAnime?.score || "N/A",
//       episodes: localAnime?.total_episodes || "?",
//       aired: { string: localAnime?.release_date || "N/A" },
//     });
//   }

//   if (isMounted) {
//     setLoadingInfo(false);
//     setLoadingStaff(false);
//     setLoadingChars(false);
//   }
// };

//   executeQuery();

//   return () => {
//     isMounted = false;
//   };
// }, [anime?.mal_id, anime?.title]);

//   useEffect(() => {
//     const handleEsc = (e) => {
//       if (e.key === "Escape") onClose();
//     };
//     window.addEventListener("keydown", handleEsc);
//     return () => window.removeEventListener("keydown", handleEsc);
//   }, [onClose]);

//   const handleOverlayClick = (e) => {
//     if (e.target.classList.contains("detail-overlay")) onClose();
//   };

//   const isValidTimestamp = (ts) => /^(\d{1,2}:)?\d{1,2}:\d{2}$/.test(ts);

//   const markEpisodeWatched = async (animeId, episodeNumber) => {
//     if (!animeId || saving) return;

//     if (totalMaxEpisodes && episodeNumber > totalMaxEpisodes) {
//       alert(`This anime only has ${totalMaxEpisodes} episode(s).`);
//       return;
//     }

//     if (note.trim() && !timestamp.trim()) {
//       alert("Timestamp is required when adding a note! (e.g. 12:34)");
//       return;
//     }

//     if (timestamp.trim() && !isValidTimestamp(timestamp.trim())) {
//       alert("Invalid timestamp format. Use MM:SS or HH:MM:SS");
//       return;
//     }

//     setSaving(true);

//     const epNum = Number(episodeNumber);
//     const maxEps = totalMaxEpisodes ? Number(totalMaxEpisodes) : null;

//     const isFinished = maxEps && epNum >= maxEps;
//     const nextStatus = isFinished ? "completed" : "watching";

//     setLocalAnime((prev) => ({
//       ...prev,
//       current_episode: epNum,
//       status: nextStatus,
//     }));

//     try {
//       await API.post("/watchlogs/", {
//         anime: animeId,
//         episode: epNum,
//         minutes_watched: 24,
//         date: new Date().toISOString().slice(0, 10),
//       });

//       if (note.trim() && timestamp.trim()) {
//         const noteRes = await API.post("/notes/", {
//           anime: animeId,
//           episode_number: epNum,
//           note: note.trim(),
//           timestamp: timestamp.trim(),
//         });
//         setEpisodeNotes((prev) => [...prev, noteRes.data]);
//         setNote("");
//         setTimestamp("");
//       }

//       const payload = {
//         current_episode: epNum,
//         status: nextStatus,
//       };

//       const patchRes = await API.patch(`/anime/${animeId}/`, payload);

//       const updatedAnimeObj = {
//         ...localAnime,
//         ...patchRes.data,
//         current_episode: epNum,
//         status: nextStatus,
//       };

//       setLocalAnime(updatedAnimeObj);

//       if (typeof onAnimeUpdated === "function") {
//         onAnimeUpdated(updatedAnimeObj);
//       }
//     } catch (error) {
//       console.error("API call failed!", error);
//       alert(
//         `Failed to update progress: ${JSON.stringify(
//           error.response?.data || error.message
//         )}`
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleShareNote = async (noteItem) => {
//     const shareableUrl = `${window.location.origin}/note/${noteItem.share_id}`;
//     const title = localAnime?.title || "Anime Tracker";
//     const shareData = {
//       title: `${title} - Ep ${noteItem.episode_number} Note`,
//       text: `Check out my note for ${title} (Ep ${noteItem.episode_number}): "${noteItem.note}"`,
//       url: shareableUrl,
//     };

//     if (navigator.share) {
//       try {
//         await navigator.share(shareData);
//         return;
//       } catch (err) {
//         if (err.name !== "AbortError") console.error("Share failed:", err);
//       }
//     }

//     try {
//       await navigator.clipboard.writeText(shareableUrl);
//       alert("Shareable link copied to clipboard!\n" + shareableUrl);
//     } catch (err) {
//       console.error("Failed to copy link:", err);
//       alert("Could not copy link.");
//     }
//   };

//   if (!localAnime) return null;

//   const image =
//     localAnime.poster_url ||
//     localAnime.image ||
//     localAnime.image_url ||
//     details?.images?.jpg?.large_image_url ||
//     details?.images?.jpg?.image_url ||
//     "https://via.placeholder.com/1280x720/222/aaa?text=No+Image";

//   const directors = staff.filter((s) =>
//     s.positions?.some((p) => p.toLowerCase().includes("director"))
//   );
//   const mainCharacters = characters.filter((c) => c.role?.toLowerCase() === "main");

//   return (
//     <div className="detail-overlay" onClick={handleOverlayClick}>
//       <div className="detail-modal">
//         <button className="detail-close" onClick={onClose}>
//           ✕
//         </button>

//         {loadingInfo ? (
//           <div className="detail-loading">Loading details…</div>
//         ) : details ? (
//           <div className="detail-content">
//             <div className="detail-hero flex-container">
//               <img
//                 src={image}
//                 alt={details.title || localAnime.title}
//                 className="detail-poster"
//               />
//               <div className="detail-main-info">
//                 <h2>{details.title || localAnime.title}</h2>
//                 <div className="detail-meta">
//                   <span className="badge">⭐ {details.score || "N/A"}</span>
//                   <span className="badge">📺 {details.episodes || "?"} eps</span>
//                   <span className="badge">📅 {details.aired?.string || "?"}</span>
//                 </div>
//                 <p className="detail-synopsis">
//                   {details.synopsis || "No synopsis available."}
//                 </p>
//               </div>
//             </div>

//             {isTrackedInUserList && (
//               !isCompleted && (!totalMaxEpisodes || nextEpisode <= totalMaxEpisodes) ? (
//                 <div className="episode-action-card">
//                   <div className="action-header">
//                     <h3>Track Progress</h3>
//                     <span className="next-ep-badge">
//                       Next: Episode {nextEpisode} {totalMaxEpisodes ? `/ ${totalMaxEpisodes}` : ""}
//                     </span>
//                   </div>

//                   <div className="action-inputs">
//                     <div className="input-row">
//                       <input
//                         type="text"
//                         placeholder="Add episode note (optional)..."
//                         value={note}
//                         onChange={(e) => setNote(e.target.value)}
//                         disabled={saving}
//                         className="episode-note-input"
//                       />
//                       <input
//                         type="text"
//                         placeholder="Timestamp (e.g. 12:34)*"
//                         value={timestamp}
//                         onChange={(e) => setTimestamp(e.target.value)}
//                         disabled={saving}
//                         className={`timestamp-input ${
//                           note.trim() && !timestamp.trim() ? "input-required" : ""
//                         }`}
//                       />
//                     </div>

//                     <button
//                       onClick={() => markEpisodeWatched(animeDbId, nextEpisode)}
//                       disabled={saving}
//                       className="mark-episode-btn"
//                     >
//                       {saving ? "Saving…" : `Mark Ep ${nextEpisode} Watched`}
//                     </button>
//                   </div>
//                 </div>
//               ) : isCompleted ? (
//                 <div className="completed-banner">
//                   🎉 You've watched all {totalMaxEpisodes || currentEp} episode(s)!
//                 </div>
//               ) : null
//             )}

//             {isTrackedInUserList && episodeNotes.length > 0 && (
//               <div className="episode-notes-section">
//                 <h3>📝 Episode Notes</h3>
//                 <div className="notes-grid">
//                   {episodeNotes
//                     .sort((a, b) => a.episode_number - b.episode_number)
//                     .map((noteItem) => (
//                       <div key={noteItem.id || noteItem.created_at} className="note-card">
//                         <div className="note-header">
//                           <span className="note-episode">
//                             Ep {noteItem.episode_number}
//                           </span>
//                           {noteItem.timestamp && (
//                             <span className="note-timestamp">
//                               ⏱ {noteItem.timestamp}
//                             </span>
//                           )}
//                         </div>
//                         <p className="note-text">{noteItem.note}</p>
//                         <div className="note-footer">
//                           <span className="note-date">
//                             {new Date(noteItem.created_at || Date.now()).toLocaleDateString()}
//                           </span>
//                           <button
//                             className="share-note-btn"
//                             onClick={() => handleShareNote(noteItem)}
//                           >
//                             🔗 Share
//                           </button>
//                         </div>
//                       </div>
//                     ))}
//                 </div>
//               </div>
//             )}

//             <div className="detail-extra">
//               <div className="detail-section">
//                 <h3>🎬 Directors</h3>
//                 {loadingStaff ? (
//                   <p className="loading-text">Loading…</p>
//                 ) : directors.length > 0 ? (
//                   <ul className="director-list">
//                     {directors.slice(0, 3).map((s) => (
//                       <li key={s.person.mal_id}>
//                         <strong>{s.person.name}</strong>
//                         <span className="director-role">
//                           {s.positions.join(", ")}
//                         </span>
//                       </li>
//                     ))}
//                   </ul>
//                 ) : (
//                   <p className="no-data">No director info available</p>
//                 )}
//               </div>

//               <div className="detail-section">
//                 <h3>👥 Main Characters</h3>
//                 {loadingChars ? (
//                   <p className="loading-text">Loading…</p>
//                 ) : mainCharacters.length > 0 ? (
//                   <div className="character-grid">
//                     {mainCharacters.slice(0, 6).map((c) => {
//                       const charImage =
//                         c.character.images?.jpg?.image_url || null;
//                       const jpVA = c.voice_actors?.find(
//                         (va) => va.language === "Japanese"
//                       );
//                       const vaImage =
//                         jpVA?.person?.images?.jpg?.image_url || null;
//                       return (
//                         <div className="character-card" key={c.character.mal_id}>
//                           {charImage && (
//                             <div className="char-avatar-wrapper">
//                               <img
//                                 src={charImage}
//                                 alt={c.character.name}
//                                 className="char-avatar"
//                                 loading="lazy"
//                                 onError={(e) => {
//                                   e.target.style.display = "none";
//                                 }}
//                               />
//                             </div>
//                           )}
//                           <div className="character-name">
//                             {c.character.name}
//                           </div>
//                           {jpVA && (
//                             <div className="voice-actor">
//                               {vaImage ? (
//                                 <img
//                                   src={vaImage}
//                                   alt={jpVA.person.name}
//                                   className="va-avatar"
//                                   loading="lazy"
//                                   onError={(e) => {
//                                     e.target.src =
//                                       "https://via.placeholder.com/28x28/444/fff?text=VA";
//                                   }}
//                                 />
//                               ) : (
//                                 <div className="va-avatar-placeholder">
//                                   {jpVA.person.name.charAt(0)}
//                                 </div>
//                               )}
//                               <span className="va-name">{jpVA.person.name}</span>
//                             </div>
//                           )}
//                         </div>
//                       );
//                     })}
//                   </div>
//                 ) : (
//                   <p className="no-data">No main characters found</p>
//                 )}
//               </div>
//             </div>
//           </div>
//         ) : (
//           <div className="detail-error">Failed to load anime details.</div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default AnimeDetailModal;



import { useEffect, useState } from "react";
import API from "../api/api";
import { useAnimeDetail } from "../context/AnimeDetailContext";
import "./AnimeDetailModal.css";

function AnimeDetailModal({ anime, onClose, onAnimeUpdated }) {
  const { openAnimeDetail } = useAnimeDetail();
  const [details, setDetails] = useState(null);
  const [staff, setStaff] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [loadingChars, setLoadingChars] = useState(true);

  const [localAnime, setLocalAnime] = useState({ ...anime });
  useEffect(() => {
    setLocalAnime({ ...anime });
  }, [anime]);

  const [note, setNote] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [saving, setSaving] = useState(false);
  const [episodeNotes, setEpisodeNotes] = useState([]);

  // Check if anime is in the user's personal tracking list
  const validStatuses = ["plan_to_watch", "watching", "completed"];
  const isTrackedInUserList = Boolean(
    localAnime?.status && validStatuses.includes(localAnime.status)
  );

  // Target ID for local API notes: use database ID
  const animeDbId = localAnime?.id || localAnime?.mal_id;

  useEffect(() => {
    if (!animeDbId || !isTrackedInUserList) return;
    API.get(`/notes/?anime=${animeDbId}`)
      .then((res) => setEpisodeNotes(res.data))
      .catch((err) => console.error("Failed to load notes:", err));
  }, [animeDbId, isTrackedInUserList]);

  // Dynamically derive total episodes
  const parsedDetailsEpisodes =
    details?.episodes && !isNaN(parseInt(details.episodes, 10))
      ? parseInt(details.episodes, 10)
      : null;

  const parsedDbEpisodes =
    localAnime?.total_episodes && Number(localAnime.total_episodes) > 0
      ? Number(localAnime.total_episodes)
      : null;

  const totalMaxEpisodes = parsedDetailsEpisodes || parsedDbEpisodes || null;

  const currentEp = Number(localAnime?.current_episode) || 0;
  const nextEpisode = currentEp + 1;
  const isCompleted =
    localAnime?.status === "completed" ||
    (totalMaxEpisodes !== null && currentEp >= totalMaxEpisodes);

  useEffect(() => {
    let isMounted = true;

    const malId = anime?.mal_id || localAnime?.mal_id;
    const animeTitle = anime?.title || localAnime?.title;

    if (!malId && !animeTitle) {
      setLoadingInfo(false);
      setLoadingStaff(false);
      setLoadingChars(false);
      return;
    }

    setLoadingInfo(true);
    setLoadingStaff(true);
    setLoadingChars(true);

    const QUERY_ANILIST = `
      query ($idMal: Int, $search: String) {
        Media(idMal: $idMal, search: $search, type: ANIME) {
          id
          title { english romaji }
          description(asHtml: false)
          averageScore
          meanScore
          episodes
          startDate { year month day }
          coverImage { extraLarge }
          staff(sort: RELEVANCE) {
            edges {
              role
              node { id name { full } }
            }
          }
          characters(sort: RELEVANCE, role: MAIN) {
            edges {
              node {
                id
                name { full }
                image { large }
              }
              voiceActors(language: JAPANESE) {
                id
                name { full }
                image { medium }
              }
            }
          }
        }
      }
    `;

    const cleanTitle = (rawTitle) => {
      if (!rawTitle) return "";
      return rawTitle
        .split("!")[0]
        .split(":")[0]
        .replace(/[^\w\s-]/gi, "")
        .trim();
    };

    const fetchAniList = async (variables) => {
      try {
        const res = await fetch("https://graphql.anilist.co", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ query: QUERY_ANILIST, variables }),
        });

        if (!res.ok) return null;
        const json = await res.json();
        return json?.data?.Media || null;
      } catch (err) {
        return null;
      }
    };

    const executeQuery = async () => {
      const parsedMalId = parseInt(malId, 10);
      const isValidMalId = Boolean(
        malId && !isNaN(parsedMalId) && parsedMalId > 0
      );

      let fetchedDetails = null;
      let fetchedStaff = [];
      let fetchedChars = [];

      // ── 1. TRY ANILIST FIRST (Supports direct MAL ID mapping) ──
      const aniVariables = isValidMalId
        ? { idMal: parsedMalId }
        : { search: cleanTitle(animeTitle) };

      let media = await fetchAniList(aniVariables);

      // Fallback search by title string if idMal search failed
      if (!media && animeTitle && isValidMalId) {
        media = await fetchAniList({ search: cleanTitle(animeTitle) });
      }

      if (media && isMounted) {
        const score = media.averageScore || media.meanScore;
        fetchedDetails = {
          title: media.title?.english || media.title?.romaji || animeTitle,
          synopsis: media.description
            ? media.description.replace(/<[^>]*>?/gm, "")
            : "No synopsis available.",
          score: score ? (score / 10).toFixed(1) : "N/A",
          episodes: media.episodes || "?",
          aired: {
            string: media.startDate?.year ? `${media.startDate.year}` : "N/A",
          },
          images: { jpg: { large_image_url: media.coverImage?.extraLarge } },
        };

        fetchedStaff = (media.staff?.edges || []).map((e) => ({
          person: { mal_id: e.node.id, name: e.node.name.full },
          positions: [e.role],
        }));

        fetchedChars = (media.characters?.edges || []).map((e) => ({
          character: {
            mal_id: e.node.id,
            name: e.node.name.full,
            images: { jpg: { image_url: e.node.image?.large } },
          },
          role: "Main",
          voice_actors: e.voiceActors?.map((va) => ({
            language: "Japanese",
            person: {
              name: va.name.full,
              images: { jpg: { image_url: va.image?.medium } },
            },
          })),
        }));
      }

      // ── 2. FALLBACK TO JIKAN IF ANILIST FAILED ──
      if (!fetchedDetails && isValidMalId) {
        try {
          const malRes = await fetch(
            `https://api.jikan.moe/v4/anime/${parsedMalId}`
          );
          if (malRes.ok) {
            const malJson = await malRes.json();
            const data = malJson.data;

            if (data && isMounted) {
              fetchedDetails = {
                title: data.title_english || data.title || animeTitle,
                synopsis: data.synopsis || "No synopsis available.",
                score: data.score ? data.score.toFixed(1) : "N/A",
                episodes: data.episodes || "?",
                aired: { string: data.aired?.string || "N/A" },
                images: {
                  jpg: {
                    large_image_url: data.images?.jpg?.large_image_url,
                  },
                },
              };

              // Fetch Jikan Staff & Characters in parallel
              const [charRes, staffRes] = await Promise.all([
                fetch(`https://api.jikan.moe/v4/anime/${parsedMalId}/characters`),
                fetch(`https://api.jikan.moe/v4/anime/${parsedMalId}/staff`),
              ]);

              if (charRes.ok) {
                const charData = await charRes.json();
                fetchedChars = charData.data || [];
              }
              if (staffRes.ok) {
                const staffData = await staffRes.json();
                fetchedStaff = staffData.data || [];
              }
            }
          }
        } catch (err) {
          console.warn("Jikan fetch failed:", err);
        }
      }

      // ── 3. LOCAL DB FALLBACK ──
      if (isMounted) {
        setDetails(
          fetchedDetails || {
            title: animeTitle || "Unknown Title",
            synopsis: localAnime?.synopsis || "No detailed info available.",
            score: localAnime?.rating || localAnime?.score || "N/A",
            episodes: localAnime?.total_episodes || "?",
            aired: { string: localAnime?.release_date || "N/A" },
          }
        );
        setStaff(fetchedStaff);
        setCharacters(fetchedChars);

        setLoadingInfo(false);
        setLoadingStaff(false);
        setLoadingChars(false);
      }
    };

    executeQuery();

    return () => {
      isMounted = false;
    };
  }, [anime?.mal_id, anime?.title]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("detail-overlay")) onClose();
  };

  const isValidTimestamp = (ts) => /^(\d{1,2}:)?\d{1,2}:\d{2}$/.test(ts);

  const markEpisodeWatched = async (animeId, episodeNumber) => {
    if (!animeId || saving) return;

    if (totalMaxEpisodes && episodeNumber > totalMaxEpisodes) {
      alert(`This anime only has ${totalMaxEpisodes} episode(s).`);
      return;
    }

    if (note.trim() && !timestamp.trim()) {
      alert("Timestamp is required when adding a note! (e.g. 12:34)");
      return;
    }

    if (timestamp.trim() && !isValidTimestamp(timestamp.trim())) {
      alert("Invalid timestamp format. Use MM:SS or HH:MM:SS");
      return;
    }

    setSaving(true);

    const epNum = Number(episodeNumber);
    const maxEps = totalMaxEpisodes ? Number(totalMaxEpisodes) : null;

    const isFinished = maxEps && epNum >= maxEps;
    const nextStatus = isFinished ? "completed" : "watching";

    setLocalAnime((prev) => ({
      ...prev,
      current_episode: epNum,
      status: nextStatus,
    }));

    try {
      await API.post("/watchlogs/", {
        anime: animeId,
        episode: epNum,
        minutes_watched: 24,
        date: new Date().toISOString().slice(0, 10),
      });

      if (note.trim() && timestamp.trim()) {
        const noteRes = await API.post("/notes/", {
          anime: animeId,
          episode_number: epNum,
          note: note.trim(),
          timestamp: timestamp.trim(),
        });
        setEpisodeNotes((prev) => [...prev, noteRes.data]);
        setNote("");
        setTimestamp("");
      }

      const payload = {
        current_episode: epNum,
        status: nextStatus,
      };

      const patchRes = await API.patch(`/anime/${animeId}/`, payload);

      const updatedAnimeObj = {
        ...localAnime,
        ...patchRes.data,
        current_episode: epNum,
        status: nextStatus,
      };

      setLocalAnime(updatedAnimeObj);

      if (typeof onAnimeUpdated === "function") {
        onAnimeUpdated(updatedAnimeObj);
      }
    } catch (error) {
      console.error("API call failed!", error);
      alert(
        `Failed to update progress: ${JSON.stringify(
          error.response?.data || error.message
        )}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleShareNote = async (noteItem) => {
    const shareableUrl = `${window.location.origin}/note/${noteItem.share_id}`;
    const title = localAnime?.title || "Anime Tracker";
    const shareData = {
      title: `${title} - Ep ${noteItem.episode_number} Note`,
      text: `Check out my note for ${title} (Ep ${noteItem.episode_number}): "${noteItem.note}"`,
      url: shareableUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err.name !== "AbortError") console.error("Share failed:", err);
      }
    }

    try {
      await navigator.clipboard.writeText(shareableUrl);
      alert("Shareable link copied to clipboard!\n" + shareableUrl);
    } catch (err) {
      console.error("Failed to copy link:", err);
      alert("Could not copy link.");
    }
  };

  if (!localAnime) return null;

  const image =
    localAnime.poster_url ||
    localAnime.image ||
    localAnime.image_url ||
    details?.images?.jpg?.large_image_url ||
    details?.images?.jpg?.image_url ||
    "https://via.placeholder.com/1280x720/222/aaa?text=No+Image";

  const directors = staff.filter((s) =>
    s.positions?.some((p) => p.toLowerCase().includes("director"))
  );
  const mainCharacters = characters.filter(
    (c) => c.role?.toLowerCase() === "main"
  );

  return (
    <div className="detail-overlay" onClick={handleOverlayClick}>
      <div className="detail-modal">
        <button className="detail-close" onClick={onClose}>
          ✕
        </button>

        {loadingInfo ? (
          <div className="detail-loading">Loading details…</div>
        ) : details ? (
          <div className="detail-content">
            <div className="detail-hero flex-container">
              <img
                src={image}
                alt={details.title || localAnime.title}
                className="detail-poster"
              />
              <div className="detail-main-info">
                <h2>{details.title || localAnime.title}</h2>
                <div className="detail-meta">
                  <span className="badge">⭐ {details.score || "N/A"}</span>
                  <span className="badge">📺 {details.episodes || "?"} eps</span>
                  <span className="badge">📅 {details.aired?.string || "?"}</span>
                </div>
                <p className="detail-synopsis">
                  {details.synopsis || "No synopsis available."}
                </p>
              </div>
            </div>

            {isTrackedInUserList && (
              !isCompleted && (!totalMaxEpisodes || nextEpisode <= totalMaxEpisodes) ? (
                <div className="episode-action-card">
                  <div className="action-header">
                    <h3>Track Progress</h3>
                    <span className="next-ep-badge">
                      Next: Episode {nextEpisode}{" "}
                      {totalMaxEpisodes ? `/ ${totalMaxEpisodes}` : ""}
                    </span>
                  </div>

                  <div className="action-inputs">
                    <div className="input-row">
                      <input
                        type="text"
                        placeholder="Add episode note (optional)..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        disabled={saving}
                        className="episode-note-input"
                      />
                      <input
                        type="text"
                        placeholder="Timestamp (e.g. 12:34)*"
                        value={timestamp}
                        onChange={(e) => setTimestamp(e.target.value)}
                        disabled={saving}
                        className={`timestamp-input ${
                          note.trim() && !timestamp.trim() ? "input-required" : ""
                        }`}
                      />
                    </div>

                    <button
                      onClick={() => markEpisodeWatched(animeDbId, nextEpisode)}
                      disabled={saving}
                      className="mark-episode-btn"
                    >
                      {saving ? "Saving…" : `Mark Ep ${nextEpisode} Watched`}
                    </button>
                  </div>
                </div>
              ) : isCompleted ? (
                <div className="completed-banner">
                  🎉 You've watched all {totalMaxEpisodes || currentEp} episode(s)!
                </div>
              ) : null
            )}

            {isTrackedInUserList && episodeNotes.length > 0 && (
              <div className="episode-notes-section">
                <h3>📝 Episode Notes</h3>
                <div className="notes-grid">
                  {episodeNotes
                    .sort((a, b) => a.episode_number - b.episode_number)
                    .map((noteItem) => (
                      <div
                        key={noteItem.id || noteItem.created_at}
                        className="note-card"
                      >
                        <div className="note-header">
                          <span className="note-episode">
                            Ep {noteItem.episode_number}
                          </span>
                          {noteItem.timestamp && (
                            <span className="note-timestamp">
                              ⏱ {noteItem.timestamp}
                            </span>
                          )}
                        </div>
                        <p className="note-text">{noteItem.note}</p>
                        <div className="note-footer">
                          <span className="note-date">
                            {new Date(
                              noteItem.created_at || Date.now()
                            ).toLocaleDateString()}
                          </span>
                          <button
                            className="share-note-btn"
                            onClick={() => handleShareNote(noteItem)}
                          >
                            🔗 Share
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="detail-extra">
              <div className="detail-section">
                <h3>🎬 Directors</h3>
                {loadingStaff ? (
                  <p className="loading-text">Loading…</p>
                ) : directors.length > 0 ? (
                  <ul className="director-list">
                    {directors.slice(0, 3).map((s) => (
                      <li key={s.person.mal_id}>
                        <strong>{s.person.name}</strong>
                        <span className="director-role">
                          {s.positions.join(", ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-data">No director info available</p>
                )}
              </div>

              <div className="detail-section">
                <h3>👥 Main Characters</h3>
                {loadingChars ? (
                  <p className="loading-text">Loading…</p>
                ) : mainCharacters.length > 0 ? (
                  <div className="character-grid">
                    {mainCharacters.slice(0, 6).map((c) => {
                      const charImage =
                        c.character.images?.jpg?.image_url || null;
                      const jpVA = c.voice_actors?.find(
                        (va) => va.language === "Japanese"
                      );
                      const vaImage =
                        jpVA?.person?.images?.jpg?.image_url || null;
                      return (
                        <div
                          className="character-card"
                          key={c.character.mal_id}
                        >
                          {charImage && (
                            <div className="char-avatar-wrapper">
                              <img
                                src={charImage}
                                alt={c.character.name}
                                className="char-avatar"
                                loading="lazy"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            </div>
                          )}
                          <div className="character-name">
                            {c.character.name}
                          </div>
                          {jpVA && (
                            <div className="voice-actor">
                              {vaImage ? (
                                <img
                                  src={vaImage}
                                  alt={jpVA.person.name}
                                  className="va-avatar"
                                  loading="lazy"
                                  onError={(e) => {
                                    e.target.src =
                                      "https://via.placeholder.com/28x28/444/fff?text=VA";
                                  }}
                                />
                              ) : (
                                <div className="va-avatar-placeholder">
                                  {jpVA.person.name.charAt(0)}
                                </div>
                              )}
                              <span className="va-name">
                                {jpVA.person.name}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="no-data">No main characters found</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="detail-error">Failed to load anime details.</div>
        )}
      </div>
    </div>
  );
}

export default AnimeDetailModal;