import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import ConnectionStatus from './features/status/ConnectionStatus';
import CatalogPage from './features/pokemon/CatalogPage';
import PokemonDetailPage from './features/pokemon/PokemonDetailPage';
import { EmptyState } from './features/pokemon/PokemonUI';
import styles from './App.module.css';

export default function App() {
  const location = useLocation();

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
              to={{ pathname: '/', search: location.search }}
              end
              className={getNavClass}
            >
              Explorar
            </NavLink>

            <NavLink to="/equipo" className={getNavClass}>
              Mi equipo
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

          <Route
            path="/pokemon/:id"
            element={<PokemonDetailPage />}
          />
          
          <Route
            path="/equipo"
            element={
              <section>
                <h1>Mi equipo</h1>
                <p>Esta sección está en preparación.</p>
              </section>
            }
          />

          <Route
            path="/comparar"
            element={
              <section>
                <h1>Comparar Pokémon</h1>
                <p>Esta sección está en preparación.</p>
              </section>
            }
          />

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
    </>
  );
}