import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PolicyNavigationProps {
  currentPage?: string;
}

export function PolicyNavigation({ currentPage = 'Policy Management' }: PolicyNavigationProps) {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center gap-2 text-sm mb-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/')}
      >
        <Home className="h-4 w-4 mr-1" />
        Dashboard
      </Button>
      <span className="text-muted-foreground">/</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/policies')}
      >
        <FileText className="h-4 w-4 mr-1" />
        Policy Management
      </Button>
      {currentPage !== 'Policy Management' && (
        <>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium text-foreground">{currentPage}</span>
        </>
      )}
    </div>
  );
}
