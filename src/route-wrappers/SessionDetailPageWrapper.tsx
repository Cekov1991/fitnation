import { useHistory, useParams } from 'react-router-dom';
import { SessionDetailPage } from '../components/SessionDetailPage';
import { AuthenticatedLayout, useCurrentNavPage } from './AuthenticatedLayout';

export default function SessionDetailPageWrapper() {
  const history = useHistory();
  const { sessionId: sessionIdParam } = useParams<{ sessionId: string }>();
  const currentPage = useCurrentNavPage();
  const sessionId = parseInt(sessionIdParam, 10);

  const handleBack = () => {
    if (history.length > 1) {
      history.goBack();
    } else {
      history.replace('/');
    }
  };

  if (!Number.isFinite(sessionId) || sessionId < 1) {
    return (
      <AuthenticatedLayout currentPage={currentPage}>
        <div className="max-w-md mx-auto px-4 py-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
          Invalid session
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout currentPage={currentPage}>
      <SessionDetailPage sessionId={sessionId} onBack={handleBack} />
    </AuthenticatedLayout>
  );
}
