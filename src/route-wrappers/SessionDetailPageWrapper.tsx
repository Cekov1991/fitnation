import { useHistory, useParams } from 'react-router-dom';
import { SessionDetailPage } from '../components/SessionDetailPage';

export default function SessionDetailPageWrapper() {
  const history = useHistory();
  const { sessionId: sessionIdParam } = useParams<{ sessionId: string }>();
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
      <div className="max-w-md mx-auto px-4 py-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
        Invalid session
      </div>
    );
  }

  return <SessionDetailPage sessionId={sessionId} onBack={handleBack} />;
}
