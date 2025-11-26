// components/MapContainerWrapper.jsx

import React from 'react';
import Map from './Map';
import { Box } from '@mui/material';

export default function MapContainerWrapper({ vehicles }) {
    return (
        <Box sx={{ flexGrow: 1, height: '100%' }}>
            {/* Map.jsx повинен мати відносний розмір 100% */}
            <Map vehicles={vehicles} /> 
        </Box>
    );
}