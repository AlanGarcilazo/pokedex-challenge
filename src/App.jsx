import { useSelector } from "react-redux";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import ConnectionStatus from "./features/status/ConnectionStatus";
import CatalogPage from "./features/pokemon/CatalogPage";
import PokemonDetailPage from "./features/pokemon/PokemonDetailPage";
import { EmptyState } from "./features/pokemon/PokemonUI";
import TeamPage from "./features/team/TeamPage";
import { selectTeamIds, TEAM_LIMIT } from "./features/team/teamSlice";
import ToastViewport from "./features/notifications/ToastViewport";
import styles from "./App.module.css";
import ComparisonPage from "./features/comparison/ComparisonPage";

export default function App() {
  const location = useLocation();
  const teamIds = useSelector(selectTeamIds);

  function getNavClass({ isActive }) {
    return isActive ? styles.active : undefined;
  }

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link className={styles.brand} to="/">
            Pokédex
          </Link>

          <nav className={styles.nav} aria-label="Navegación principal">
            <NavLink
              to={{ pathname: "/", search: location.search }}
              end
              className={getNavClass}
            >
              Explorar
            </NavLink>

            <NavLink to="/equipo" className={getNavClass}>
              Mi equipo ({teamIds.length}/{TEAM_LIMIT})
            </NavLink>

            <NavLink to="/comparar" className={getNavClass}>
              Comparar
            </NavLink>
          </nav>
        </div>

        <ConnectionStatus />
      </header>

      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<CatalogPage />} />

          <Route path="/pokemon/:id" element={<PokemonDetailPage />} />

          <Route path="/equipo" element={<TeamPage />} />

          <Route path="/comparar" element={<ComparisonPage />} />

          <Route
            path="*"
            element={
              <EmptyState
                title="Esta página no existe"
                message="Podés volver al catálogo para seguir explorando."
              >
                <Link to="/">Ir al catálogo</Link>
              </EmptyState>
            }
          />
        </Routes>
      </main>

      <ToastViewport />
    </>
  );
}
