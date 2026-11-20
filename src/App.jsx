import { useEffect, useState } from 'react';
import {
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle,
  Drawer, List, ListItem, ListItemButton, ListItemText, Stack, TextField, Typography,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { StaticTimePicker } from '@mui/x-date-pickers/StaticTimePicker';
import dayjs from 'dayjs';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

import FlameWrap from './FlameWrap';

import ema0 from './img/ema-0.png';
import ema1 from './img/ema-1.jpg';
import ema2 from './img/ema-2.jpg';
import ema3 from './img/ema-3.jpg';
import ema4 from './img/ema-4.jpg';
import ema5 from './img/ema-5.jpg';
import ema6 from './img/ema-6.jpg';

const IMAGES = [ema0, ema1, ema2, ema3, ema4, ema5];
const STEP = 100 / IMAGES.length;

const DURATION = 25 * 60;
const DRAWER_WIDTH = 220;
const LEVELS = [
  { label: 'Minimo', minutes: 150 },
  { label: 'Prioritario', minutes: 90 },
  { label: 'Emergencia', minutes: 60 },
];

const MAX_FUTURE_MIN = 60;
const RADIUS = 15.9155;

const minuteNow = () => {
  const d = new Date();
  d.setSeconds(0, 0);
  return d.getTime();
};

const hhmm = (ms) => {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const pad = (n) => String(n).padStart(2, '0');

const format = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
};

const formatMinutes = (min) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? (m ? `${h} h ${m} min` : `${h} h`) : `${m} min`;
};

export default function App() {
  const [duration, setDuration] = useState(DURATION);
  const [remaining, setRemaining] = useState(DURATION);
  const [level, setLevel] = useState(null);
  const [base, setBase] = useState(minuteNow());
  const [pick, setPick] = useState(dayjs());
  const pickMax = dayjs(base).add(MAX_FUTURE_MIN, 'minute');
  const pickMin = dayjs(base).subtract(level?.minutes ?? 0, 'minute');
  const [startAt, setStartAt] = useState(null);
  const [activation, setActivation] = useState(null);
  const [running, setRunning] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState({ h: '0', m: '25', s: '0' });

  useEffect(() => {
    if (!running) return;
    const tick = () =>
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    document.title = `${format(remaining)} - Pomodoro`;
  }, [remaining]);

  useEffect(() => {
    if (!startAt) return;
    const id = setTimeout(() => {
      setStartAt(null);
      setRunning(true);
    }, Math.max(0, startAt - Date.now()));
    return () => clearTimeout(id);
  }, [startAt]);

  const reset = () => {
    setRunning(false);
    setStartAt(null);
    setRemaining(duration);
  };

  const confirm = () => {
    let t = dayjs(base).hour(pick.hour()).minute(pick.minute());
    if (t.isAfter(pickMax)) t = t.subtract(1, 'day');
    else if (t.isBefore(pickMin)) t = t.add(1, 'day');
    const targetMs = t.valueOf();
    const target = new Date(targetMs);
    const secs = level.minutes * 60;
    const elapsed = Math.floor((Date.now() - target.getTime()) / 1000);
    setDuration(secs);
    setActivation({ label: level.label, time: hhmm(targetMs) });
    setLevel(null);
    if (elapsed <= 0) {
      setRemaining(secs);
      setRunning(false);
      setStartAt(target.getTime());
      return;
    }
    const left = Math.max(0, secs - elapsed);
    setStartAt(null);
    setRemaining(left);
    setRunning(left > 0);
  };

  const customSecs =
    Math.max(0, Number(custom.h) || 0) * 3600 +
    Math.max(0, Number(custom.m) || 0) * 60 +
    Math.max(0, Number(custom.s) || 0);

  const startCustom = () => {
    setDuration(customSecs);
    setRemaining(customSecs);
    setStartAt(null);
    setActivation(null);
    setCustomOpen(false);
    setRunning(true);
  };

  const percent = duration > 0 ? (remaining / duration) * 100 : 0;
  const image =
    percent <= 0
      ? ema6
      : IMAGES[Math.min(IMAGES.length - 1, Math.floor((100 - percent) / STEP))];

  const fire = 0.2 + 0.8 * Math.min(1, Math.max(0, ((100 - percent) / STEP - 4) / 2));

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', overflow: 'hidden', ml: `${DRAWER_WIDTH}px` }}>
      <Drawer
        variant="permanent"
        sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
      >
        <Typography variant="h6" sx={{ p: 2 }}>Gravedad</Typography>
        <List>
          {LEVELS.map((l) => (
            <ListItem key={l.label} disablePadding>
              <ListItemButton
                onClick={() => {
                  const now = minuteNow();
                  setBase(now);
                  setPick(dayjs(now));
                  setLevel(l);
                }}
              >
                <ListItemText primary={l.label} secondary={formatMinutes(l.minutes)} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Box sx={{ mt: 'auto', p: 2 }}>
          <Button fullWidth variant="outlined" onClick={() => setCustomOpen(true)}>Custom</Button>
        </Box>
      </Drawer>
      <Dialog open={customOpen} onClose={() => setCustomOpen(false)}>
        <DialogTitle>Tiempo personalizado</DialogTitle>
        <DialogContent>
          <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
            {[['h', 'Horas'], ['m', 'Min'], ['s', 'Seg']].map(([k, label]) => (
              <TextField
                key={k}
                label={label}
                type="number"
                value={custom[k]}
                onChange={(e) => setCustom({ ...custom, [k]: e.target.value })}
                slotProps={{ htmlInput: { min: 0 } }}
                sx={{ width: 90 }}
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomOpen(false)}>Cancelar</Button>
          <Button variant="contained" disabled={customSecs <= 0} onClick={startCustom}>Comenzar</Button>
        </DialogActions>
      </Dialog>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={!!level} onClose={() => setLevel(null)}>
        <DialogTitle>{level?.label}: horario de activacion</DialogTitle>
        <DialogContent>
          {level && (
            <StaticTimePicker
              displayStaticWrapperAs="mobile"
              ampm={false}
              value={pick}
              onChange={setPick}
              minTime={pickMin.isSame(base, 'day') ? pickMin : undefined}
              maxTime={pickMax.isSame(base, 'day') ? pickMax : undefined}
              slotProps={{ actionBar: { actions: [] } }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLevel(null)}>Cancelar</Button>
          <Button variant="contained" onClick={confirm}>Activar</Button>
        </DialogActions>
      </Dialog>
      </LocalizationProvider>
      <Box sx={{ width: 360, maxWidth: '100%' }}>
        <Box sx={{ position: 'relative', width: '100%', aspectRatio: '1', mb: 1 }}>
          <svg viewBox="0 0 36 36" width="100%" height="100%">
            <circle cx="18" cy="18" r={RADIUS} fill="none" stroke="#444" strokeWidth="2.5" />
            <circle
              cx="18"
              cy="18"
              r={RADIUS}
              fill="none"
              stroke="#90caf9"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${percent} ${100 - percent}`}
              pathLength="100"
              transform="rotate(-90 18 18)"
              style={{ transition: 'stroke-dasharray 1s linear' }}
            />
          </svg>
          <Box
            component="img"
            src={image}
            alt=""
            sx={{
              position: 'absolute', top: '50%', left: '50%', width: '78%', height: '78%',
              transform: 'translate(-50%, -50%)', borderRadius: '50%', objectFit: 'cover',
            }}
          />
        </Box>
      <FlameWrap style={{ width: '100%', height: 230, marginTop: 56 }} radius={4} height={40 + 80 * fire} intensity={0.8 * fire} sparks={1.5 * fire} smoke={1.5 * fire} rim={2.5 * fire} ember={2 * fire} melt={4.5 * fire} distortion={10 * fire}>
      <Card sx={{ width: '100%', height: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CardContent>
          <Typography variant="h1" component="div" sx={{ fontVariantNumeric: 'tabular-nums', my: 2 }}>
            {format(remaining)}
          </Typography>
          {activation && (
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {activation.label} Â· activado desde las {activation.time}
            </Typography>
          )}
          <Stack direction="row" spacing={1} justifyContent="center">
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              disabled={running || remaining === 0}
              onClick={() => setRunning(true)}
            >
              Start
            </Button>
            <Button
              variant="outlined"
              startIcon={<PauseIcon />}
              disabled={!running}
              onClick={() => setRunning(false)}
            >
              Pause
            </Button>
            <Button variant="outlined" sx={{ color: '#ef5350', borderColor: '#ef5350', '&:hover': { borderColor: '#ef5350', bgcolor: 'rgba(239,83,80,0.08)' } }} startIcon={<RestartAltIcon />} onClick={reset}>
              Reset
            </Button>
          </Stack>
        </CardContent>
      </Card>
      </FlameWrap>
      </Box>
    </Box>
  );
}
