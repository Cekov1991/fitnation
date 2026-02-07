import { useHistory } from 'react-router-dom';
import { ProgramLibraryPage } from '../components/plans/ProgramLibraryPage';
import { AuthenticatedLayout, useCurrentNavPage } from './AuthenticatedLayout';

// Program Library page wrapper
export default function ProgramLibraryPageWrapper() {
  const history = useHistory();
  const currentPage = useCurrentNavPage();

  const handleBack = () => {
    history.push('/plans');
  };

  return (
    <AuthenticatedLayout currentPage={currentPage}>
      <ProgramLibraryPage onBack={handleBack} />
    </AuthenticatedLayout>
  );
}
