import { useHistory } from 'react-router-dom';
import { ExercisePickerPage } from '../components/ExercisePickerPage';
import { AuthenticatedLayout, useCurrentNavPage } from './AuthenticatedLayout';

export default function ExerciseCatalogPageWrapper() {
  const history = useHistory();
  const currentPage = useCurrentNavPage();

  return (
    <AuthenticatedLayout currentPage={currentPage}>
      <ExercisePickerPage
        mode="browse"
        onClose={() => history.goBack()}
        onViewExercise={(name) => history.push(`/exercises/${encodeURIComponent(name)}`)}
      />
    </AuthenticatedLayout>
  );
}
