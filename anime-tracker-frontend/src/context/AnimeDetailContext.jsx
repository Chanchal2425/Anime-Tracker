import { createContext, useContext, useState } from "react";
import AnimeDetailModal from "../pages/AnimeDetailModal";

const AnimeDetailContext = createContext();

export function AnimeDetailProvider({ children }) {
  const [selectedAnime, setSelectedAnime] = useState(null);

  const openAnimeDetail = (anime) => setSelectedAnime(anime);
  const closeAnimeDetail = () => setSelectedAnime(null);

  return (
    <AnimeDetailContext.Provider value={{ openAnimeDetail }}>
      {children}
      {selectedAnime && (
        <AnimeDetailModal
          anime={selectedAnime}
          onClose={closeAnimeDetail}
        />
      )}
    </AnimeDetailContext.Provider>
  );
}

export function useAnimeDetail() {
  const context = useContext(AnimeDetailContext);
  if (!context) {
    throw new Error("useAnimeDetail must be used within AnimeDetailProvider");
  }
  return context;
}