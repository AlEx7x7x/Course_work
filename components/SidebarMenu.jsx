// файл: components/SidebarMenu.jsx

import React, { useMemo } from 'react';
import { 
    Drawer, 
    Toolbar, 
    Divider, 
    List, 
    ListItem, 
    ListItemButton, 
    ListItemText, 
    Typography,
    Box,
    ListItemIcon,
    useTheme 
} from '@mui/material';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import TramIcon from '@mui/icons-material/Tram';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'; 
import TrainIcon from '@mui/icons-material/Train';

// ВИПРАВЛЕННЯ: vehicles = [] гарантує, що це завжди масив
const SidebarMenu = ({ drawerWidth, vehicles = [], onSelectRoute, activeRouteId }) => {
    const theme = useTheme();

    const uniqueRoutes = useMemo(() => {
        const map = {};
        
        vehicles.forEach(vehicle => { 
            // Використовуємо route_short_name (name) для унікальності, щоб не дублювати.
            if (!map[vehicle.name]) { 
                map[vehicle.name] = {
                    id: vehicle.id, // ID для фільтрації
                    name: vehicle.name, // ShortName для відображення
                    description: vehicle.longName || `Маршрут ${vehicle.name}`,
                    count: 0,
                    type: vehicle.type,
                };
            }
            map[vehicle.name].count++;
        });
        
        return Object.values(map).sort((a, b) => {
            const typeOrder = { 0: 1, 400: 2, 3: 3 }; 
            const typeA = typeOrder[a.type] || 99;
            const typeB = typeOrder[b.type] || 99;
            if (typeA !== typeB) return typeA - typeB;
            return a.name.localeCompare(b.name, 'uk', { numeric: true });
        });
    }, [vehicles]);

    const handleRouteClick = (routeId) => () => {
        onSelectRoute(routeId);
    };

    const renderIcon = (type, isActive = false) => {
        const color = isActive ? 'primary' : 'inherit';
        switch (type) {
            case 0: return <TramIcon color={color} />;
            case 400: return <DirectionsBusIcon color={color} />; // Тролейбус
            case 3: return <DirectionsBusIcon color={color} />; // Автобус
            default: return <DirectionsCarIcon color={color} />;
        }
    };

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: { 
                    width: drawerWidth, 
                    boxSizing: 'border-box',
                    backgroundColor: theme.palette.background.paper, 
                    borderRight: `1px solid ${theme.palette.divider}` 
                },
            }}
        >
            <Toolbar /> 
            <Box sx={{ overflow: 'auto' }}>
                <List dense>
                    {/* Кнопка "Всі маршрути" */}
                    <ListItem key="all" disablePadding>
                        <ListItemButton onClick={handleRouteClick(null)} selected={activeRouteId === null}>
                            <ListItemIcon>
                                <ClearAllIcon color={activeRouteId === null ? 'primary' : 'inherit'} />
                            </ListItemIcon>
                            <ListItemText 
                                primary="Показати всі маршрути" 
                                secondary={`Всього: ${uniqueRoutes.length}`}
                            />
                        </ListItemButton>
                    </ListItem>
                    <Divider />

                    {/* Список маршрутів */}
                    {uniqueRoutes.map((route) => (
                        <ListItem key={route.id} disablePadding>
                            <ListItemButton 
                                onClick={handleRouteClick(route.id)}
                                selected={activeRouteId === route.id}
                            >
                                <ListItemIcon>
                                    {renderIcon(route.type, activeRouteId === route.id)} 
                                </ListItemIcon>
                                <ListItemText
                                    primary={`№ ${route.name}`} 
                                    secondary={route.description}
                                    primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 600 }}
                                    secondaryTypographyProps={{ variant: 'caption', noWrap: true }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Box>
        </Drawer>
    );
};

export default SidebarMenu;