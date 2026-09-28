import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { toastRemoved } from './notificationsSlice';
import styles from './ToastViewport.module.css';

function Toast({ toast }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      dispatch(toastRemoved(toast.id));
    }, 8000);

    return () => window.clearTimeout(timeout);
  }, [dispatch, toast.id]);

  return (
    <li className={`${styles.toast} ${styles[toast.tone] ?? ''}`}>
      <p>{toast.message}</p>

      <button
        type="button"
        onClick={() => dispatch(toastRemoved(toast.id))}
        aria-label={`Cerrar aviso: ${toast.message}`}
      >
        <span aria-hidden="true">×</span>
      </button>
    </li>
  );
}

Toast.propTypes = {
  toast: PropTypes.shape({
    id: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    tone: PropTypes.string.isRequired,
  }).isRequired,
};

export default function ToastViewport() {
  const toasts = useSelector((state) => state.notifications);

  return (
    <div
      className={styles.viewport}
      role="status"
      aria-live="polite"
      aria-relevant="additions text"
      aria-label="Notificaciones"
    >
      <ol className={styles.list}>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </ol>
    </div>
  );
}