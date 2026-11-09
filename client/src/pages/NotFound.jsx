import useDocumentTitle from '../hooks/useDocumentTitle';
import { ErrorState } from '../components/States';

export default function NotFound() {
  useDocumentTitle('Page not found');
  return <ErrorState error={{ response: { status: 404 } }} />;
}
