import React, { useState, useEffect } from 'react';
import { CircularProgress, Box } from '@mui/material';

export default function ClientOnly({ children, fallback = <CircularProgress /> }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
        <Box sx={{ width: 300, display: 'flex', justifyContent: 'center', pt: 4 }}>
            {fallback}
        </Box>
    );
  }

  return <>{children}</>;
}