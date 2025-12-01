// components/SidebarMenu.jsx

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
    useTheme // Використовуємо тему для кольорів
} from '@mui/material';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import TramIcon from '@mui/icons-material/Tram';
import ClearAllIcon from '@mui/icons-material/ClearAll'; // Іконка для скидання фільтра


const SidebarMenu = ({ drawerWidth, vehicles, onSelectRoute }) => {
    const theme = useTheme();

    // ⚠️ ГРУПУВАННЯ ТА СОРТУВАННЯ МАРШРУТІВ
    const uniqueRoutes = useMemo(() => {
        const map = {};
        vehicles.forEach(vehicle => {
            if (!map[vehicle.routeId]) {
                map[vehicle.routeId] = {
                    id: vehicle.routeId,
                    description: vehicle.routeDescription || `Маршрут ${vehicle.routeId}`,
                    count: 0,
                    type: vehicle.type,
                };
            }
            map[vehicle.routeId].count++;
        });
        
        // Сортування: Трамваї (Т) перед Автобусами (А), потім за номером
        return Object.values(map).sort((a, b) => {
            const isTramA = a.id.startsWith('Т');
            const isTramB = b.id.startsWith('Т');

            if (isTramA && !isTramB) return -1;
            if (!isTramA && isTramB) return 1;
            
            // Сортування за номером маршруту
            return a.id.localeCompare(b.id, 'uk', { numeric: true });
        });
    }, [vehicles]);

    const handleRouteClick = (routeId) => () => {
        onSelectRoute(routeId);
    };

    const renderIcon = (type, isReset = false) => {
        if (isReset) {
            return <ClearAllIcon color="action" />;
        }
        // Використовуємо кольори з теми MUI
        if (type === 'TRAM') {
            return <TramIcon sx={{ color: theme.palette.error.main }} />; 
        }
        return <DirectionsBusIcon sx={{ color: theme.palette.primary.main }} />; 
    };

    return (
        <Drawer
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    position: 'fixed', 
                    top: 0,
                    left: 0,
                    // Додаємо zIndex, щоб бути впевненим, що Drawer знаходиться над картою
                    zIndex: theme.zIndex.drawer + 2 
                },
            }}
            variant="permanent"
            anchor="left"
        >
            <Toolbar>
                <Typography variant="h6" noWrap sx={{ fontWeight: 'bold' }}>
                    Маршрути Львова
                </Typography>
            </Toolbar>
            <Divider />
            <Box sx={{ overflowY: 'auto', height: 'calc(100vh - 64px)' }}>
                <List dense>
                    {/* Кнопка Скинути фільтр */}
                    <ListItem disablePadding>
                        <ListItemButton onClick={handleRouteClick(null)}>
                            <ListItemIcon>
                                {renderIcon(null, true)} 
                            </ListItemIcon>
                            <ListItemText 
                                primary="Показати всі ТЗ" 
                                secondary={`Всього: ${vehicles.length} ТЗ`}
                            />
                        </ListItemButton>
                    </ListItem>
                    <Divider />

                    {/* Список маршрутів */}
                    {uniqueRoutes.map((route) => (
                        <ListItem key={route.id} disablePadding>
                            <ListItemButton onClick={handleRouteClick(route.id)}>
                                <ListItemIcon>
                                    {renderIcon(route.type)} 
                                </ListItemIcon>
                                <ListItemText
                                    primary={`№ ${route.id} (${route.count} ТЗ)`} 
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