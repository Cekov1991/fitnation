import { useHistory } from 'react-router-dom';
import { ExercisePickerPage } from '../components/ExercisePickerPage';

export default function ExerciseCatalogPageWrapper() {
  const history = useHistory();

  return (
    <ExercisePickerPage
      mode="browse"
      onClose={() => history.goBack()}
      onViewExercise={(name) => history.push(`/exercises/${encodeURIComponent(name)}`)}
    />
  );
}
