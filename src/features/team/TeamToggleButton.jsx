import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import {
  addPokemonToTeam,
  removePokemonFromTeam,
  selectTeamIds,
} from './teamSlice';
import styles from './Team.module.css';

export default function TeamToggleButton({ id, name }) {
  const dispatch = useDispatch();

  const isMember = useSelector((state) =>
    selectTeamIds(state).includes(id),
  );

  function handleClick() {
    const action = isMember
      ? removePokemonFromTeam
      : addPokemonToTeam;

    dispatch(action({ id, name }));
  }

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={handleClick}
      aria-label={`${
        isMember ? 'Quitar del equipo a' : 'Agregar al equipo a'
      } ${name.replaceAll('-', ' ')}`}
    >
      {isMember ? 'Quitar del equipo' : 'Agregar al equipo'}
    </button>
  );
}

TeamToggleButton.propTypes = {
  id: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
};