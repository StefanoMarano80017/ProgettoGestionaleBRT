import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Stack, Typography, Paper, Chip, Divider, ButtonGroup, Button, IconButton, Tabs, Tab } from '@mui/material';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ScheduleIcon from '@mui/icons-material/Schedule';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { parseKeyToDate, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, inRange } from '@/shared/utils/dateRangeUtils';
import { PieChart } from '@mui/x-charts/PieChart';
import { getCommessaColor, getCommessaColorLight } from '@shared/utils/commessaColors';

export default function CommesseDashboard({ assignedCommesse = [], data = {}, period = 'month', refDate = new Date(), onPeriodChange, onCommessaSelect }) {
	const [selectedCommessa, setSelectedCommessa] = useState(null);
	const [commesseFilter, setCommesseFilter] = useState('active'); // 'active' or 'closed'
	const range = useMemo(() => {
		if (period === 'week') return { start: startOfWeek(refDate), end: endOfWeek(refDate) };
		if (period === 'year') return { start: startOfYear(refDate), end: endOfYear(refDate) };
		return { start: startOfMonth(refDate), end: endOfMonth(refDate) };
	}, [period, refDate]);
	const listStats = useMemo(() => {
		const map = new Map();
		(assignedCommesse || []).forEach((c) => map.set(c, { commessa: c, total: 0, days: 0, lastDate: null }));
		Object.entries(data || {}).forEach(([key, records]) => {
			if (key.endsWith('_segnalazione')) return;
			const dayDate = parseKeyToDate(key);
			if (!inRange(dayDate, range.start, range.end)) return;
			const perDay = new Set();
			(records || []).forEach((rec) => {
				const comm = rec && rec.commessa;
				if (!comm || !map.has(comm)) return;
				const stat = map.get(comm);
				stat.total += Number(rec.ore || 0);
				if (!perDay.has(comm)) { stat.days += 1; perDay.add(comm); }
				if (!stat.lastDate || dayDate > stat.lastDate) stat.lastDate = dayDate;
			});
		});
		const allStats = Array.from(map.values()).sort((a, b) => String(a.commessa).localeCompare(String(b.commessa)));
		// Filter based on commesseFilter
		return allStats.filter((s) => {
			if (commesseFilter === 'active') return s.total > 0;
			if (commesseFilter === 'closed') return s.total === 0;
			return true;
		});
	}, [assignedCommesse, data, range, commesseFilter]);
	const chartData = useMemo(() => {
		const sums = new Map((assignedCommesse || []).map((c) => [c, 0]));
		Object.entries(data || {}).forEach(([key, records]) => {
			if (key.endsWith('_segnalazione')) return;
			const d = parseKeyToDate(key);
			if (!inRange(d, range.start, range.end)) return;
			(records || []).forEach((rec) => {
				if (!rec || !rec.commessa) return;
				if (!sums.has(rec.commessa)) return;
				sums.set(rec.commessa, sums.get(rec.commessa) + Number(rec.ore || 0));
			});
		});
		// Filter out commesse with 0 hours for cleaner pie chart
		const filteredEntries = Array.from(sums.entries()).filter(([_, value]) => value > 0);
		const pieData = filteredEntries.map(([label, value], i) => ({
			id: i,
			value,
			label,
			color: getCommessaColor(label) // Use hash-based color
		}));
		return { pieData, labels: filteredEntries.map(([label]) => label), values: filteredEntries.map(([_, value]) => value) };
	}, [assignedCommesse, data, range]);
	const riepilogo = useMemo(() => {
		if (data && data.__monthlySummary) return {
			ferie: data.__monthlySummary.ferie || { days: 0, hours: 0 },
			malattia: data.__monthlySummary.malattia || { days: 0, hours: 0 },
			permesso: data.__monthlySummary.permesso || { days: 0, hours: 0 },
			rol: data.__monthlySummary.rol || { days: 0, hours: 0 },
		};
		const acc = { ferie: { days: 0, hours: 0 }, malattia: { days: 0, hours: 0 }, permesso: { days: 0, hours: 0 }, rol: { days: 0, hours: 0 } };
		Object.entries(data || {}).forEach(([key, records]) => {
			if (key.endsWith('_segnalazione')) return;
			const d = parseKeyToDate(key);
			if (!inRange(d, range.start, range.end)) return;
			const seen = { ferie: false, malattia: false, permesso: false, rol: false };
			(records || []).forEach((r) => {
				const ore = Number(r.ore || 0);
				const c = String(r.commessa || '').toUpperCase();
				if (c === 'FERIE') { acc.ferie.hours += ore; if (!seen.ferie) { acc.ferie.days += 1; seen.ferie = true; } }
				else if (c === 'MALATTIA') { acc.malattia.hours += ore; if (!seen.malattia) { acc.malattia.days += 1; seen.malattia = true; } }
				else if (c === 'PERMESSO') { acc.permesso.hours += ore; if (!seen.permesso) { acc.permesso.days += 1; seen.permesso = true; } }
				else if (c === 'ROL') { acc.rol.hours += ore; if (!seen.rol) { acc.rol.days += 1; seen.rol = true; } }
			});
		});
		return acc;
	}, [data, range]);
	const periodDisplay = useMemo(() => {
		if (period === 'week') {
			const start = range.start.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
			const end = range.end.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
			return `${start} - ${end}`;
		}
		if (period === 'month') {
			return range.start.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
		}
		if (period === 'year') {
			return range.start.getFullYear().toString();
		}
		return '';
	}, [period, range]);
	const handleSelectCommessa = (comm) => {
		const next = selectedCommessa === comm ? null : comm;
		setSelectedCommessa(next);
		if (typeof onCommessaSelect === 'function') onCommessaSelect(next);
	};
	return (
		<Paper sx={{ p: 2, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
			<Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontStyle: 'italic' }}>
				Dashboard delle commesse: visualizza il grafico a torta delle ore lavorate, il riepilogo con ferie/malattie/permessi/ROL, 
				i controlli per cambiare periodo (settimana/mese/anno), e l'elenco delle commesse assegnate con statistiche dettagliate.
			</Typography>
			<Stack spacing={1} sx={{ height: '100%' }}>
				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
					<Box sx={{ flex: '1 1 280px', minWidth: 0, minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						{chartData.pieData && chartData.pieData.length ? (
							<PieChart
								series={[
									{
										data: chartData.pieData,
										highlightScope: { fade: 'global', highlight: 'item' },
										faded: { 
											innerRadius: 70, 
											additionalRadius: -15, 
											color: '#999',
										},
										highlighted: {
											additionalRadius: 10,
										},
										paddingAngle: 3,
										cornerRadius: 0,
										innerRadius: 70,
										outerRadius: 110,
										arcLabel: (item) => `${item.value}h`,
										arcLabelMinAngle: 45,
									},
								]}
								width={400}
								height={280}
								margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
								sx={{
									'& .MuiPieArc-root': {
										stroke: 'none',
										transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
										'&:hover': {
											filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
											opacity: 1,
										},
										'&[data-highlighting="faded"]': {
											opacity: 0.4,
										},
										'&[data-highlighting="highlighted"]': {
											opacity: 1,
										},
									},
									'& .MuiChartsLegend-root': {
										display: 'none !important',
									},
								}}
							/>
						) : (
							<Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
								<Typography variant="body2">Nessun dato nel periodo selezionato.</Typography>
							</Box>
						)}
					</Box>
					<Box sx={{ 
						width: { xs: '100%', sm: 320 }, 
						bgcolor: 'background.paper', 
						borderRadius: 2,
						overflow: 'hidden',
						border: '1px solid',
						borderColor: 'divider'
					}}>
						<Stack spacing={0}>
							{/* Header with gradient - Compact */}
							<Box sx={{ 
								background: (theme) => `linear-gradient(135deg, ${theme.palette.customBlue3?.main || theme.palette.primary.main} 0%, ${theme.palette.customBlue2?.main || '#006494'} 50%, ${theme.palette.customBlue1?.main || '#00A6FB'} 100%)`,
								px: 2,
								py: 1.5,
								position: 'relative',
								'&::before': {
									content: '""',
									position: 'absolute',
									top: 0,
									right: 0,
									width: '40%',
									height: '100%',
									background: 'radial-gradient(circle at top right, rgba(255,255,255,0.15) 0%, transparent 70%)',
									pointerEvents: 'none'
								}
							}}>
								<Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
									<Box>
										<Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>
											Riepilogo
										</Typography>
										<Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.65rem' }}>
											{periodDisplay}
										</Typography>
									</Box>
									<ButtonGroup size="small" variant="outlined" sx={{ 
										'& .MuiButton-root': { 
											fontSize: '0.65rem', 
											padding: '2px 6px',
											minWidth: 'auto',
											fontWeight: 600,
											borderRadius: 1,
											color: 'white',
											borderColor: 'rgba(255,255,255,0.3)',
											'&:hover': {
												borderColor: 'rgba(255,255,255,0.5)',
												bgcolor: 'rgba(255,255,255,0.1)'
											},
											'&.MuiButton-contained': {
												bgcolor: 'rgba(255,255,255,0.2)',
												borderColor: 'rgba(255,255,255,0.4)'
											}
										}
									}}>
										<Button onClick={() => onPeriodChange && onPeriodChange('week')} variant={period === 'week' ? 'contained' : 'outlined'}>Sett</Button>
										<Button onClick={() => onPeriodChange && onPeriodChange('month')} variant={period === 'month' ? 'contained' : 'outlined'}>Mese</Button>
										<Button onClick={() => onPeriodChange && onPeriodChange('year')} variant={period === 'year' ? 'contained' : 'outlined'}>Anno</Button>
									</ButtonGroup>
								</Stack>
							</Box>

							<Divider />

							{/* Absence Stats - Compact */}
							<Box sx={{ px: 2, py: 1.5 }}>
								<Typography variant="caption" sx={{ 
									color: 'text.secondary', 
									fontWeight: 600, 
									textTransform: 'uppercase',
									fontSize: '0.65rem',
									letterSpacing: 0.5,
									mb: 1,
									display: 'block'
								}}>
									Assenze
								</Typography>
								<Stack spacing={0.75}>
									{/* Ferie */}
									<Box sx={{ 
										display: 'flex', 
										alignItems: 'center', 
										gap: 1,
										p: 0.75,
										borderRadius: 1,
										bgcolor: 'rgba(216, 49, 91, 0.05)',
										border: '1px solid rgba(216, 49, 91, 0.15)',
										transition: 'all 0.2s',
										'&:hover': {
											bgcolor: 'rgba(216, 49, 91, 0.1)',
											transform: 'translateX(4px)'
										}
									}}>
										<Box sx={{ 
											display: 'flex', 
											alignItems: 'center', 
											justifyContent: 'center',
											width: 24,
											height: 24,
											borderRadius: 1,
											bgcolor: '#D8315B',
											color: 'white',
											flexShrink: 0
										}}>
											<BeachAccessIcon sx={{ fontSize: 14 }} />
										</Box>
										<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', minWidth: 60 }}>
											Ferie
										</Typography>
										<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', ml: 'auto' }}>
											{riepilogo.ferie.days || 0}g • {riepilogo.ferie.hours || 0}h
										</Typography>
									</Box>

									{/* Malattia */}
									<Box sx={{ 
										display: 'flex', 
										alignItems: 'center', 
										gap: 1,
										p: 0.75,
										borderRadius: 1,
										bgcolor: 'rgba(52, 199, 89, 0.05)',
										border: '1px solid rgba(52, 199, 89, 0.15)',
										transition: 'all 0.2s',
										'&:hover': {
											bgcolor: 'rgba(52, 199, 89, 0.1)',
											transform: 'translateX(4px)'
										}
									}}>
										<Box sx={{ 
											display: 'flex', 
											alignItems: 'center', 
											justifyContent: 'center',
											width: 24,
											height: 24,
											borderRadius: 1,
											bgcolor: '#34C759',
											color: 'white',
											flexShrink: 0
										}}>
											<LocalHospitalIcon sx={{ fontSize: 14 }} />
										</Box>
										<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', minWidth: 60 }}>
											Malattia
										</Typography>
										<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', ml: 'auto' }}>
											{riepilogo.malattia.days || 0}g • {riepilogo.malattia.hours || 0}h
										</Typography>
									</Box>

									{/* Permesso */}
									<Box sx={{ 
										display: 'flex', 
										alignItems: 'center', 
										gap: 1,
										p: 0.75,
										borderRadius: 1,
										bgcolor: 'rgba(2, 136, 209, 0.05)',
										border: '1px solid rgba(2, 136, 209, 0.15)',
										transition: 'all 0.2s',
										'&:hover': {
											bgcolor: 'rgba(2, 136, 209, 0.1)',
											transform: 'translateX(4px)'
										}
									}}>
										<Box sx={{ 
											display: 'flex', 
											alignItems: 'center', 
											justifyContent: 'center',
											width: 24,
											height: 24,
											borderRadius: 1,
											bgcolor: '#0288d1',
											color: 'white',
											flexShrink: 0
										}}>
											<ScheduleIcon sx={{ fontSize: 14 }} />
										</Box>
										<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', minWidth: 60 }}>
											Permesso
										</Typography>
										<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', ml: 'auto' }}>
											{riepilogo.permesso.days || 0}g • {riepilogo.permesso.hours || 0}h
										</Typography>
									</Box>

									{/* ROL */}
									<Box sx={{ 
										display: 'flex', 
										alignItems: 'center', 
										gap: 1,
										p: 0.75,
										borderRadius: 1,
										bgcolor: 'rgba(2, 136, 209, 0.05)',
										border: '1px solid rgba(2, 136, 209, 0.15)',
										transition: 'all 0.2s',
										'&:hover': {
											bgcolor: 'rgba(2, 136, 209, 0.1)',
											transform: 'translateX(4px)'
										}
									}}>
										<Box sx={{ 
											display: 'flex', 
											alignItems: 'center', 
											justifyContent: 'center',
											width: 24,
											height: 24,
											borderRadius: 1,
											bgcolor: '#0288d1',
											color: 'white',
											flexShrink: 0
										}}>
											<EventBusyIcon sx={{ fontSize: 14 }} />
										</Box>
										<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', minWidth: 60 }}>
											ROL
										</Typography>
										<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', ml: 'auto' }}>
											{riepilogo.rol.days || 0}g • {riepilogo.rol.hours || 0}h
										</Typography>
									</Box>
								</Stack>
							</Box>

							{chartData.pieData && chartData.pieData.length > 0 && (
								<>
									<Divider />
									<Box sx={{ px: 2, py: 1.5 }}>
										<Typography variant="caption" sx={{ 
											color: 'text.secondary', 
											fontWeight: 600, 
											textTransform: 'uppercase',
											fontSize: '0.65rem',
											letterSpacing: 0.5,
											mb: 1,
											display: 'block'
										}}>
											Legenda Grafico
										</Typography>
										<Box sx={{
											display: 'flex',
											flexDirection: 'column',
											gap: 0.5,
											maxHeight: '120px',
											overflowY: 'auto',
											pr: 0.5,
											'&::-webkit-scrollbar': {
												width: '3px',
											},
											'&::-webkit-scrollbar-track': {
												backgroundColor: 'rgba(0,0,0,0.05)',
												borderRadius: '2px',
											},
											'&::-webkit-scrollbar-thumb': {
												backgroundColor: 'rgba(0,0,0,0.2)',
												borderRadius: '2px',
												'&:hover': {
													backgroundColor: 'rgba(0,0,0,0.3)',
												}
											}
										}}>
											{chartData.pieData.map((item) => (
												<Box 
													key={item.id}
													sx={{ 
														display: 'flex', 
														alignItems: 'center', 
														gap: 0.75,
														p: 0.5,
														borderRadius: 0.75,
														border: '1px solid',
														borderColor: 'divider',
														bgcolor: 'background.default',
														transition: 'all 0.2s',
														'&:hover': {
															borderColor: item.color,
															bgcolor: `${item.color}10`,
															transform: 'translateX(4px)'
														}
													}}
												>
													<Box sx={{ 
														width: 8, 
														height: 8, 
														borderRadius: '50%', 
														bgcolor: item.color,
														flexShrink: 0,
														boxShadow: `0 0 0 2px ${item.color}30`
													}} />
													<Typography 
														variant="caption" 
														sx={{ 
															flex: 1,
															fontSize: '0.7rem',
															fontWeight: 500,
															overflow: 'hidden',
															textOverflow: 'ellipsis',
															whiteSpace: 'nowrap'
														}}
														title={item.label}
													>
														{item.label}
													</Typography>
													<Typography 
														variant="caption" 
														sx={{ 
															fontSize: '0.65rem',
															fontWeight: 700,
															color: item.color,
															flexShrink: 0
														}}
													>
														{item.value}h
													</Typography>
												</Box>
											))}
										</Box>
									</Box>
								</>
							)}
						</Stack>
					</Box>
				</Stack>
				<Divider />
				<Box sx={{ mb: 2 }}>
					<Typography variant="subtitle2" sx={{ mb: 1 }}>Lista Commesse</Typography>
					<Tabs
						value={commesseFilter}
						onChange={(e, newValue) => setCommesseFilter(newValue)}
						variant="fullWidth"
						sx={{
							minHeight: 40,
							'& .MuiTabs-indicator': {
								height: 3,
								borderRadius: '3px 3px 0 0',
							},
							'& .MuiTab-root': {
								fontSize: '0.875rem',
								textTransform: 'none',
								minHeight: 40,
								fontWeight: 500,
								color: 'text.secondary',
								transition: 'all 0.3s ease-in-out',
								'&:hover': {
									color: 'primary.main',
									backgroundColor: 'action.hover',
								},
								'&.Mui-selected': {
									color: 'primary.main',
									fontWeight: 600,
								},
							},
						}}
					>
						<Tab label="Attive" value="active" />
						<Tab label="Chiuse" value="closed" />
					</Tabs>
				</Box>
				<Box sx={{ overflowY: 'auto' }}>
					<Stack spacing={1}>
						{(listStats || []).map((s) => {
							const commessaColor = getCommessaColor(s.commessa);
							const commessaBgColor = getCommessaColorLight(s.commessa, 0.08);
							
							return (
							<React.Fragment key={s.commessa}>
								<Paper 
									elevation={0} 
									onClick={() => handleSelectCommessa(s.commessa)} 
									tabIndex={0} 
									role="button" 
									aria-pressed={selectedCommessa === s.commessa} 
									sx={{ 
										p: 1, 
										display: 'flex', 
										alignItems: 'center', 
										justifyContent: 'space-between', 
										cursor: 'pointer',
										borderLeft: `4px solid ${commessaColor}`,
										backgroundColor: selectedCommessa === s.commessa ? commessaBgColor : 'transparent',
										transition: 'all 0.2s ease-in-out',
										'&:hover': {
											backgroundColor: commessaBgColor,
											transform: 'translateX(4px)'
										}
									}}
								>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
										{/* Color Dot */}
										<Box 
											sx={{ 
												width: 12, 
												height: 12, 
												borderRadius: '50%', 
												backgroundColor: commessaColor,
												flexShrink: 0,
												boxShadow: `0 0 0 2px ${commessaBgColor}`
											}} 
										/>
										<Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
											<Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{s.commessa}</Typography>
											<Typography variant="caption" sx={{ color: 'text.secondary' }}>{`${s.days} giorni — ultimo: ${s.lastDate ? new Date(s.lastDate).toLocaleDateString() : '—'}`}</Typography>
										</Box>
									</Box>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
										<Chip size="small" variant="outlined" label={`${s.total}h`} />
										{s.total > 0 ? (<Chip size="small" label="Attiva" color="success" />) : (<Chip size="small" label="Chiusa" color="default" />)}
										<IconButton 
											size="small" 
											onClick={(e) => {
												e.stopPropagation();
												// TODO: Navigate to commessa detail page
												console.log('Navigate to commessa:', s.commessa);
											}}
											sx={{ ml: 1 }}
											aria-label={`Apri pagina della commessa ${s.commessa}`}
										>
											<OpenInNewIcon fontSize="small" />
										</IconButton>
									</Box>
								</Paper>
								<Divider />
							</React.Fragment>
							);
						})}
						{(listStats || []).length === 0 && (
							<Box sx={{ py: 3, textAlign: 'center' }}>
								<Typography variant="body2">
									{commesseFilter === 'active' ? 'Nessuna commessa attiva nel periodo selezionato.' : 'Nessuna commessa chiusa.'}
								</Typography>
							</Box>
						)}
					</Stack>
				</Box>
			</Stack>
		</Paper>
	);
}

CommesseDashboard.propTypes = {
	assignedCommesse: PropTypes.array,
	data: PropTypes.object,
	period: PropTypes.oneOf(['week', 'month', 'year']),
	refDate: PropTypes.instanceOf(Date),
	onPeriodChange: PropTypes.func,
	onCommessaSelect: PropTypes.func,
};