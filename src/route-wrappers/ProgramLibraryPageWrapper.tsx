import { useHistory } from 'react-router-dom';
import { ProgramLibraryPage } from '../components/plans/ProgramLibraryPage';
import { AuthenticatedLayout, useCurrentNavPage } from './AuthenticatedLayout';

// Program Library page wrapper
export default function ProgramLibraryPageWrapper() {
  const history = useHistory();
  const currentPage = useCurrentNavPage();

  const handleBack = () => {
    if (history.length > 1) {
      history.goBack();
    } else {
      history.replace('/plans?type=programs');
    }
  };

  return (
    <AuthenticatedLayout currentPage={currentPage}>
      <ProgramLibraryPage onBack={handleBack} />
    </AuthenticatedLayout>
  );
}
