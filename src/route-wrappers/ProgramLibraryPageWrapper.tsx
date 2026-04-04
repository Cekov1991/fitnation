import { useHistory } from 'react-router-dom';
import { ProgramLibraryPage } from '../components/plans/ProgramLibraryPage';

// Program Library page wrapper
export default function ProgramLibraryPageWrapper() {
  const history = useHistory();

  const handleBack = () => {
    if (history.length > 1) {
      history.goBack();
    } else {
      history.replace('/plans?type=programs');
    }
  };

  return <ProgramLibraryPage onBack={handleBack} />;
}
