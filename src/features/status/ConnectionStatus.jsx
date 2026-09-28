import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import styles from "./ConnectionStatus.module.css";

const SESSION_STARTED_AT = Date.now();

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const queries = useSelector((state) => state.pokeApi.queries);

  useEffect(() => {
    function updateConnection() {
      setIsOnline(navigator.onLine);
    }

    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);

    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);

  const savedQueries = Object.values(queries).filter(
    (query) =>
      query.data !== undefined && Number.isFinite(query.fulfilledTimeStamp),
  );

  const hasPreviousData = savedQueries.some(
    (query) => query.fulfilledTimeStamp < SESSION_STARTED_AT,
  );

  const hasSessionData = savedQueries.some(
    (query) => query.fulfilledTimeStamp >= SESSION_STARTED_AT,
  );

  let dataStatus = "Todavía no hay datos guardados.";

  if (hasPreviousData && hasSessionData) {
    dataStatus = "Caché anterior y datos consultados en esta sesión.";
  } else if (hasPreviousData) {
    dataStatus = "Datos recuperados de la caché anterior.";
  } else if (hasSessionData) {
    dataStatus = "Datos consultados en esta sesión.";
  }

  return (
    <div className={styles.status} aria-live="polite">
      <span>{isOnline ? "Conexión detectada" : "Sin conexión detectada"}</span>

      <span>{dataStatus}</span>
    </div>
  );
}
