
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  Typography, CircularProgress, Box, Button
} from '@mui/material';
import hooks from '../utils/hooks';

export default function ScheduleTable({ routeId, routeName }) {
  const { schedules, isLoading } = hooks.useSchedules(routeId); 

  if (!routeId) {
      return <Typography sx={{ mt: 2 }}>Виберіть маршрут для перегляду графіків.</Typography>;
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress size={24} />
        <Typography ml={2}>Завантаження графіків...</Typography>
      </Box>
    );
  }
  
  if (schedules.length === 0) {
    return <Typography sx={{ mt: 2 }}>Графіки не знайдено для **{routeName}**.</Typography>;
  }

  return (
    <TableContainer component={Paper} sx={{ mt: 3 }}>
      <Typography variant="h6" sx={{ p: 2, fontWeight: 'bold' }}>Графік для маршруту {routeName}</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Час Відправлення</TableCell>
            <TableCell>Дні Тижня</TableCell>
            <TableCell>ТЗ (ID)</TableCell>
            <TableCell align="center">Контроль</TableCell> 
          </TableRow>
        </TableHead>
        <TableBody>
          {schedules.map((s) => (
            <TableRow 
              key={s.id} 
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell>{s.id}</TableCell>
              <TableCell>**{s.departureTime}**</TableCell>
              <TableCell>{s.dayOfWeek}</TableCell>
              <TableCell>{s.vehicleId || 'Не призначено'}</TableCell>
              <TableCell align="center">
                <Button size="small" variant="outlined" color="primary">Редагувати</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}