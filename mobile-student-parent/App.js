import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Image, Modal, SafeAreaView, ScrollView, TextInput } from 'react-native';
import * as Location from 'expo-location';
import { io } from 'socket.io-client';

const API_BASE = 'http://192.168.1.100:3000'; // Change to your backend IP

export default function App() {
  const [boardStatus, setBoardStatus] = useState('NOT_BOARDED');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [stuTimeFilter, setStuTimeFilter] = useState('W');
  const [stuStatusFilter, setStuStatusFilter] = useState('ALL'); // ALL, DONE, MISS
  const [userRole, setUserRole] = useState('student'); // student, parent, hod
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [showAbsentModal, setShowAbsentModal] = useState(false);
  const [hodTimeFilter, setHodTimeFilter] = useState('W');

  // Route Alert Notifications
  const socketRef = useRef(null);
  const [routeAlerts, setRouteAlerts] = useState([
    { id: 'demo-1', notificationType: 'RouteCancelled', routeName: 'Chennai Route 3', effectiveDate: new Date().toISOString().split('T')[0], effectiveTime: '07:00', customMessage: 'Route 3 is cancelled today due to vehicle maintenance. Please arrange alternate transport.', receivedAt: new Date(Date.now() - 600000).toISOString() },
    { id: 'demo-2', notificationType: 'RouteDelayed', routeName: 'Chennai Route 1', effectiveDate: new Date().toISOString().split('T')[0], effectiveTime: '08:30', customMessage: 'Bus running 15 mins late.', receivedAt: new Date(Date.now() - 1800000).toISOString() },
  ]);
  const [showRouteAlertsModal, setShowRouteAlertsModal] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(2);


  React.useEffect(() => {
    (async () => {
      // Confirmation for GPS Access
      Alert.alert(
        "Location Access Permission",
        "We need your GPS location to help you find your bus in real-time. You can toggle this access in Settings.",
        [
          { text: "Decline", style: "cancel", onPress: () => setGpsEnabled(false) },
          { text: "Accept", onPress: async () => {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status === 'granted') {
                setGpsEnabled(true);
              } else {
                setGpsEnabled(false);
                Alert.alert("Permission Denied", "Live tracking will be unavailable.");
              }
            } 
          }
        ]
      );
    })();
  }, []);

  // Socket.IO — connect and listen for route alerts from admin
  useEffect(() => {
    try {
      socketRef.current = io(API_BASE);
      // join role-specific room
      socketRef.current.emit('joinRoom', userRole);
      socketRef.current.on('routeAlert', (alert) => {
        setRouteAlerts(prev => [{ ...alert, receivedAt: alert.receivedAt || new Date().toISOString() }, ...prev]);
        setUnreadAlerts(prev => prev + 1);
      });
    } catch {}
    return () => { try { socketRef.current?.disconnect(); } catch {} };
  }, [userRole]);

  const handleScanQR = () => {
    if (boardStatus === 'NOT_BOARDED') {
      setBoardStatus('IN_ATTENDANCE');
      Alert.alert("In Attendance", "You have boarded the bus. Your parents have been notified.");
    } else if (boardStatus === 'IN_ATTENDANCE') {
      setBoardStatus('CLOSED');
      Alert.alert("Attendance Closed", "You have successfully closed attendance (Dropped Off).");
    }
  };


  const viewLiveLocation = () => {
    Alert.alert("Live Map", "Opens map view focusing on currently assigned bus route.");
  };

  // Mock absent students data for HoD
  const absentStudents = [
    { name: 'Karthik S.', roll: 'CS2026-012', dept: 'CSE 3rd Year', route: 'RT-07', type: 'ABSENT' },
    { name: 'Meena R.', roll: 'CS2026-045', dept: 'CSE 2nd Year', route: 'RT-12', type: 'ABSENT' },
    { name: 'Vijay K.', roll: 'CS2026-023', dept: 'CSE 3rd Year', route: 'RT-05', type: 'LATE' },
    { name: 'Divya M.', roll: 'CS2026-078', dept: 'CSE 1st Year', route: 'RT-02', type: 'ABSENT' },
    { name: 'Ravi P.', roll: 'CS2026-091', dept: 'CSE 4th Year', route: 'RT-07', type: 'ABSENT' },
    { name: 'Anitha V.', roll: 'CS2026-034', dept: 'CSE 2nd Year', route: 'RT-01', type: 'LATE' },
    { name: 'Suresh N.', roll: 'CS2026-056', dept: 'CSE 3rd Year', route: 'RT-12', type: 'ABSENT' },
    { name: 'Preethi L.', roll: 'CS2026-067', dept: 'CSE 1st Year', route: 'RT-05', type: 'ABSENT' },
  ];

  const isHoD = userRole === 'hod';

  return (
    <View style={styles.container}>
      <Text style={[styles.title, isHoD && { color: '#7C3AED' }]}>
        {isHoD ? 'Welcome HoD' : 'Welcome Student/Parent'}
      </Text>

      {/* Modernized Dashboard Buttons (Moved to Top) */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: 20 }}>
        {userRole === 'student' && (
          <TouchableOpacity style={styles.sqBtn} onPress={handleScanQR}>
            <Text style={styles.sqBtnIcon}>📷</Text>
            <Text style={styles.sqBtnText}>QR{'\n'}Boarding</Text>
          </TouchableOpacity>
        )}

        {!isHoD && (
          <TouchableOpacity style={styles.sqBtn} onPress={() => setShowHistoryModal(true)}>
            <Text style={styles.sqBtnIcon}>📜</Text>
            <Text style={styles.sqBtnText}>Travel{'\n'}History</Text>
          </TouchableOpacity>
        )}

        {!isHoD && (
          <TouchableOpacity style={[styles.sqBtn, { opacity: boardStatus === 'IN_ATTENDANCE' ? 1 : 0.6 }]} onPress={viewLiveLocation}>
            <Text style={styles.sqBtnIcon}>📍</Text>
            <Text style={styles.sqBtnText}>Live Bus{'\n'}Tracking</Text>
          </TouchableOpacity>
        )}

        {userRole === 'parent' && (
          <TouchableOpacity 
            style={[
              styles.sqBtn, 
              { borderColor: '#2563EB', opacity: boardStatus === 'IN_ATTENDANCE' ? 1 : 0.4 }
            ]} 
            onPress={() => {
              if (boardStatus === 'IN_ATTENDANCE') {
                Alert.alert("Boarding Update", `Student Boarded at ${new Date().toLocaleTimeString()}.`);
              } else {
                Alert.alert("Status", "Waiting for student boarding QR scan...");
              }
            }}
          >
            <Text style={styles.sqBtnIcon}>🔔</Text>
            <Text style={[styles.sqBtnText, { color: '#2563EB' }]}>Boarding{'\n'}Alerts</Text>
          </TouchableOpacity>
        )}

        {/* HoD-specific buttons */}
        {isHoD && (
          <>
            <TouchableOpacity style={[styles.sqBtn, { borderColor: '#fecaca' }]} onPress={() => setShowAbsentModal(true)}>
              <Text style={styles.sqBtnIcon}>🚫</Text>
              <Text style={[styles.sqBtnText, { color: '#EF4444' }]}>Absent{'\n'}Students</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sqBtn} onPress={() => setShowHistoryModal(true)}>
              <Text style={styles.sqBtnIcon}>📊</Text>
              <Text style={styles.sqBtnText}>Attendance{'\n'}History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sqBtn} onPress={() => setShowAbsentModal(true)}>
              <Text style={styles.sqBtnIcon}>🚌</Text>
              <Text style={styles.sqBtnText}>Bus Att.{'\n'}Report</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.sqBtn} onPress={() => setIsSettingsModalOpen(true)}>
          <Text style={styles.sqBtnIcon}>⚙️</Text>
          <Text style={styles.sqBtnText}>App{'\n'}Settings</Text>
        </TouchableOpacity>

        {/* Route Alerts Button with badge */}
        <View style={{ position: 'relative' }}>
          <TouchableOpacity style={[styles.sqBtn, { borderColor: unreadAlerts > 0 ? '#FCA5A5' : '#E5E7EB', backgroundColor: unreadAlerts > 0 ? '#FEF2F2' : '#fff' }]}
            onPress={() => { setShowRouteAlertsModal(true); setUnreadAlerts(0); }}
          >
            <Text style={styles.sqBtnIcon}>🚨</Text>
            <Text style={[styles.sqBtnText, { color: unreadAlerts > 0 ? '#DC2626' : '#374151' }]}>Route{'\n'}Alerts</Text>
          </TouchableOpacity>
          {unreadAlerts > 0 && (
            <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: '#EF4444', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>{unreadAlerts > 9 ? '9+' : unreadAlerts}</Text>
            </View>
          )}
        </View>
      </View>

      {/* HoD Stats */}
      {isHoD && (
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 15 }}>
          <View style={[styles.hodStat, { borderColor: '#fecaca' }]}>
            <Text style={[styles.hodStatNum, { color: '#EF4444' }]}>
              {absentStudents.filter(s => s.type === 'ABSENT').length}
            </Text>
            <Text style={styles.hodStatLabel}>Absent</Text>
          </View>
          <View style={[styles.hodStat, { borderColor: '#dcfce7' }]}>
            <Text style={[styles.hodStatNum, { color: '#10B981' }]}>142</Text>
            <Text style={styles.hodStatLabel}>Present</Text>
          </View>
          <View style={[styles.hodStat, { borderColor: '#ddd6fe' }]}>
            <Text style={[styles.hodStatNum, { color: '#7C3AED' }]}>150</Text>
            <Text style={styles.hodStatLabel}>Total</Text>
          </View>
        </View>
      )}

      {boardStatus === 'NOT_BOARDED' && !isHoD && (
        <TouchableOpacity style={styles.btnScan} onPress={handleScanQR}>
          <Text style={styles.btnText}>Boarding Attendance (Scan QR)</Text>
        </TouchableOpacity>
      )}

      {boardStatus === 'IN_ATTENDANCE' && !isHoD && (
        <View style={{ width: '100%', paddingHorizontal: 20 }}>
          <View style={styles.successBox}>
            <Text style={styles.successText}>Status: IN ATTENDANCE</Text>
          </View>
        </View>
      )}

      {/* Map Modal */}
      <Modal visible={showRouteModal} animationType="slide" onRequestClose={() => setShowRouteModal(false)}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Bus Route Map</Text>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800' }} 
            style={styles.mapImage}
            resizeMode="cover"
          />
          <View style={styles.routeDetails}>
            <Text style={styles.routeText}><Text style={{fontWeight: 'bold'}}>Route Number:</Text> R1</Text>
            <Text style={styles.routeText}><Text style={{fontWeight: 'bold'}}>Starting Point:</Text> Main Campus</Text>
            <Text style={styles.routeText}><Text style={{fontWeight: 'bold'}}>Destination:</Text> Downtown Central</Text>
          </View>
          <TouchableOpacity style={styles.btnClose} onPress={() => setShowRouteModal(false)}>
            <Text style={styles.btnText}>Close Map</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal visible={isSettingsModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.issueCard}>
            <Text style={styles.modalTitle}>App Settings</Text>
            
            <View style={{ width: '100%', marginBottom: 20 }}>
              <Text style={{ fontSize: 13, color: '#4B5563', fontWeight: '700', marginBottom: 10 }}>GPS Tracking Status</Text>
              <TouchableOpacity 
                style={[
                  styles.btnPrimary, 
                  { 
                    backgroundColor: gpsEnabled ? '#10B981' : '#EF4444',
                    borderWidth: 0,
                    marginBottom: 5
                  }
                ]} 
                onPress={() => setGpsEnabled(!gpsEnabled)}
              >
                <Text style={styles.btnText}>
                  {gpsEnabled ? 'GPS ACCESS: PROVIDED' : 'GPS ACCESS: DECLINED'}
                </Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'center' }}>
                Manually control whether your location is used for live bus tracking.
              </Text>
            </View>

            <TouchableOpacity 
              style={{ marginTop: 10, padding: 15, width: '100%', alignItems: 'center' }} 
              onPress={() => setIsSettingsModalOpen(false)}
            >
                <Text style={{ color: '#2563EB', fontWeight: '800' }}>Close Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Route Alert Notification History Modal */}
      <Modal visible={showRouteAlertsModal} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View style={{ backgroundColor: '#DC2626', padding: 10, paddingTop: 40, minHeight: 60, justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 20 }}>🚨</Text>
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '900' }}>Route Alerts</Text>
            </View>
            <TouchableOpacity onPress={() => setShowRouteAlertsModal(false)}>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '800', fontSize: 12 }}>CLOSE</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1, padding: 16 }}>
            {routeAlerts.length === 0 ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
                <Text style={{ fontSize: 50, marginBottom: 16 }}>🔕</Text>
                <Text style={{ fontWeight: '800', color: '#6B7280', fontSize: 15 }}>No alerts for your route</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 13, marginTop: 6, textAlign: 'center' }}>
                  When admin sends a route alert, it will{'\n'}appear here instantly
                </Text>
              </View>
            ) : (
              <>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1, marginBottom: 14, textTransform: 'uppercase' }}>
                  {routeAlerts.length} Alert{routeAlerts.length !== 1 ? 's' : ''} — Most Recent First
                </Text>
                {routeAlerts.map((alert, idx) => {
                  const typeMap = {
                    RouteDelayed:   { emoji: '⏰', label: 'Route Delayed',      bgColor: '#FFFBEB', leftColor: '#D97706', tagBg: '#FEF3C7', tagText: '#92400E' },
                    RouteCancelled: { emoji: '❌', label: 'Route Cancelled',     bgColor: '#FEF2F2', leftColor: '#DC2626', tagBg: '#FEE2E2', tagText: '#991B1B' },
                    NewPath:        { emoji: '🔀', label: 'New Path / Diversion', bgColor: '#EFF6FF', leftColor: '#2563EB', tagBg: '#DBEAFE', tagText: '#1D4ED8' },
                  };
                  const t = typeMap[alert.notificationType] || { emoji: '📢', label: alert.notificationType, bgColor: '#F9FAFB', leftColor: '#6B7280', tagBg: '#F3F4F6', tagText: '#374151' };
                  const dt = new Date(alert.receivedAt || alert.timestamp);
                  const isToday = dt.toDateString() === new Date().toDateString();
                  const timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateStr = isToday ? 'Today' : dt.toLocaleDateString([], { day: 'numeric', month: 'short' });
                  return (
                    <View key={alert.id || idx} style={{
                      backgroundColor: t.bgColor, borderRadius: 16, marginBottom: 14,
                      borderLeftWidth: 5, borderLeftColor: t.leftColor,
                      shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
                      overflow: 'hidden',
                    }}>
                      <View style={{ padding: 14 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={{ backgroundColor: t.tagBg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                              <Text style={{ fontSize: 14 }}>{t.emoji}</Text>
                              <Text style={{ fontWeight: '900', fontSize: 12, color: t.tagText }}>{t.label}</Text>
                            </View>
                          </View>
                          <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '600' }}>{dateStr} {timeStr}</Text>
                        </View>
                        <Text style={{ fontSize: 15, fontWeight: '900', color: '#111827', marginBottom: 4 }}>{alert.routeName}</Text>
                        <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '600', marginBottom: 8 }}>
                          Effective: {alert.effectiveDate} at {alert.effectiveTime}
                          {alert.duration ? `  ·  ${alert.duration}` : ''}
                        </Text>
                        {(alert.customMessage || alert.updatedRoute) && (
                          <View style={{ backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 8, padding: 10, borderLeftWidth: 2, borderLeftColor: t.leftColor }}>
                            <Text style={{ fontSize: 13, color: '#374151', lineHeight: 20 }}>
                              {alert.customMessage || alert.updatedRoute}
                            </Text>
                          </View>
                        )}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 }}>
                          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981' }} />
                          <Text style={{ fontSize: 10, color: '#059669', fontWeight: '700' }}>
                            Sent by Transport Admin · {alert.totalAffected ? `${alert.totalAffected} notified` : 'All route members notified'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
                <View style={{ height: 20 }} />
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Travel History Modal (Student/Parent) */}
      <Modal visible={showHistoryModal && !isHoD} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View style={{ backgroundColor: '#2563EB', padding: 10, paddingTop: 40, minHeight: 60, justifyContent: 'center' }}>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '800', paddingLeft: 10 }}>Travel History</Text>
          </View>
          
          <View style={{ padding: 10, flex: 1 }}>
            <View style={{ flexDirection: 'row', backgroundColor: '#E2E8F0', padding: 2, borderRadius: 8, marginBottom: 8 }}>
              {[
                { l: 'FULL', v: 'ALL' },
                { l: 'DONE', v: 'DONE' },
                { l: 'MISS', v: 'MISS' }
              ].map((t) => (
                <TouchableOpacity 
                  key={t.v} 
                  onPress={() => setStuStatusFilter(t.v)}
                  style={{ flex: 1, padding: 5, backgroundColor: stuStatusFilter === t.v ? 'white' : 'transparent', borderRadius: 6, alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 8, fontWeight: '900', color: stuStatusFilter === t.v ? '#2563EB' : '#64748B' }}>{t.l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {['W', 'M', 'Y'].map((t) => (
                  <TouchableOpacity 
                    key={t} 
                    onPress={() => setStuTimeFilter(t)}
                    style={{ 
                      width: 22, height: 22, borderRadius: 11, borderWidth: 1, 
                      borderColor: stuTimeFilter === t ? '#2563EB' : '#CBD5E1', 
                      backgroundColor: stuTimeFilter === t ? '#EFF6FF' : 'white', 
                      justifyContent: 'center', alignItems: 'center' 
                    }}
                  >
                    <Text style={{ fontSize: 8, fontWeight: '900', color: stuTimeFilter === t ? '#2563EB' : '#64748B' }}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ flex: 1, padding: 5, borderStyle: 'solid', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 20, backgroundColor: 'white' }}>
                <Text style={{ fontSize: 8, fontWeight: '800', color: '#64748B', textAlign: 'center' }}>
                  {stuTimeFilter === 'W' ? 'Week: Current ▼' : (stuTimeFilter === 'M' ? 'Month: October 2023 ▼' : 'Year: 2023-24 ▼')}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', backgroundColor: '#F1F5F9', padding: 6, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
              <Text style={{ flex: 1.2, fontSize: 8, fontWeight: '900', color: '#475569' }}>Bus ID</Text>
              <Text style={{ flex: 1.5, fontSize: 8, fontWeight: '900', color: '#475569' }}>Date/Time</Text>
              <Text style={{ flex: 0.6, fontSize: 8, fontWeight: '900', color: '#475569', textAlign: 'right' }}>Stat</Text>
            </View>

            <View style={{ backgroundColor: 'white', borderBottomLeftRadius: 8, borderBottomRightRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', flex: 1 }}>
              {[
                { b: 'BUS-07', d: '24 Oct 08:30', s: 'DONE', c: '#10B981' },
                { b: 'BUS-07', d: '22 Oct 17:15', s: 'DONE', c: '#10B981' },
                { b: 'BUS-12', d: '21 Oct 08:45', s: 'MISS', c: '#EF4444' },
                { b: 'BUS-07', d: '18 Oct 08:30', s: 'DONE', c: '#10B981' },
                { b: 'BUS-07', d: '16 Oct 08:15', s: 'DONE', c: '#10B981' },
                { b: 'BUS-05', d: '14 Oct 08:45', s: 'DONE', c: '#10B981' },
                { b: 'BUS-01', d: '12 Oct 08:00', s: 'DONE', c: '#10B981' },
                { b: 'BUS-12', d: '10 Oct 17:15', s: 'DONE', c: '#10B981' },
                { b: 'BUS-07', d: '08 Oct 08:30', s: 'DONE', c: '#10B981' },
                { b: 'BUS-02', d: '05 Oct 08:45', s: 'MISS', c: '#EF4444' }
              ]
              .filter(row => stuStatusFilter === 'ALL' || row.s === stuStatusFilter)
              .map((row, i, filtered) => (
                <View key={i} style={{ flexDirection: 'row', padding: 6, borderBottomWidth: i === filtered.length - 1 ? 0 : 1, borderBottomColor: '#F8FAFC' }}>
                  <Text style={{ flex: 1.2, fontSize: 9, fontWeight: '700', color: '#1E293B' }}>{row.b}</Text>
                  <Text style={{ flex: 1.5, fontSize: 8, fontWeight: '600', color: '#64748B' }}>{row.d}</Text>
                  <Text style={{ flex: 0.6, fontSize: 9, fontWeight: '900', color: row.c, textAlign: 'right' }}>{row.s}</Text>
                </View>
              ))}
            </View>

            {/* Compact PDF Tile */}
            <TouchableOpacity 
              style={{ marginTop: 15, backgroundColor: 'white', borderRadius: 12, borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#CBD5E1', padding: 10, alignItems: 'center' }}
              onPress={() => {
                Alert.alert('Generating PDF...', 'Preparing your travel history...');
                setTimeout(() => Alert.alert('Export Success', 'PDF Travel Report saved.'), 1500);
              }}
            >
              <Text style={{ fontSize: 18, marginBottom: 2 }}>📄</Text>
              <Text style={{ fontSize: 10, fontWeight: '900', color: '#2563EB' }}>GENERATE PDF REPORT</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ marginTop: 10, backgroundColor: '#334155', padding: 12, borderRadius: 10, alignItems: 'center' }}
              onPress={() => setShowHistoryModal(false)}
            >
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 13 }}>Back Home</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* HoD Attendance History Modal */}
      <Modal visible={showHistoryModal && isHoD} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View style={{ backgroundColor: '#7C3AED', padding: 10, paddingTop: 40, minHeight: 60, justifyContent: 'center' }}>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '800', paddingLeft: 10, textTransform: 'uppercase', letterSpacing: 1 }}>HoD Analytics</Text>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '800', paddingLeft: 10 }}>Attendance History</Text>
          </View>
          
          <ScrollView style={{ padding: 10, flex: 1 }}>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
              {['W', 'M', 'Y'].map((t) => (
                <TouchableOpacity 
                  key={t} 
                  onPress={() => setHodTimeFilter(t)}
                  style={{ 
                    width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, 
                    borderColor: hodTimeFilter === t ? '#7C3AED' : '#CBD5E1', 
                    backgroundColor: hodTimeFilter === t ? '#F5F3FF' : 'white', 
                    justifyContent: 'center', alignItems: 'center' 
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '900', color: hodTimeFilter === t ? '#7C3AED' : '#64748B' }}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Stats */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <View style={[styles.hodStat, { borderColor: '#dcfce7' }]}>
                <Text style={[styles.hodStatNum, { color: '#10B981', fontSize: 18 }]}>94.9%</Text>
                <Text style={styles.hodStatLabel}>Avg Att.</Text>
              </View>
              <View style={[styles.hodStat, { borderColor: '#fecaca' }]}>
                <Text style={[styles.hodStatNum, { color: '#EF4444', fontSize: 18 }]}>38</Text>
                <Text style={styles.hodStatLabel}>Total Absent</Text>
              </View>
              <View style={[styles.hodStat, { borderColor: '#ddd6fe' }]}>
                <Text style={[styles.hodStatNum, { color: '#7C3AED', fontSize: 18 }]}>5</Text>
                <Text style={styles.hodStatLabel}>Days</Text>
              </View>
            </View>

            {/* Day-wise Table */}
            <View style={{ backgroundColor: '#F8FAFC', padding: 8, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
              <Text style={{ fontSize: 10, fontWeight: '900', color: '#475569' }}>📊 Day-Wise Absence Log</Text>
            </View>
            <View style={{ flexDirection: 'row', backgroundColor: '#FAF5FF', padding: 6, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
              <Text style={{ flex: 1.5, fontSize: 8, fontWeight: '900', color: '#7C3AED' }}>Date</Text>
              <Text style={{ flex: 0.8, fontSize: 8, fontWeight: '900', color: '#10B981', textAlign: 'center' }}>Present</Text>
              <Text style={{ flex: 0.8, fontSize: 8, fontWeight: '900', color: '#EF4444', textAlign: 'center' }}>Absent</Text>
              <Text style={{ flex: 0.6, fontSize: 8, fontWeight: '900', color: '#64748B', textAlign: 'right' }}>Rate</Text>
            </View>
            <View style={{ backgroundColor: 'white', borderBottomLeftRadius: 8, borderBottomRightRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 15 }}>
              {[
                { d: 'Mon, 07 Apr', p: 145, a: 5, r: '96.7%' },
                { d: 'Tue, 08 Apr', p: 140, a: 10, r: '93.3%' },
                { d: 'Wed, 09 Apr', p: 142, a: 8, r: '94.7%' },
                { d: 'Thu, 10 Apr', p: 138, a: 12, r: '92.0%' },
                { d: 'Fri, 11 Apr', p: 147, a: 3, r: '98.0%' },
              ].map((row, i) => (
                <View key={i} style={{ flexDirection: 'row', padding: 6, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' }}>
                  <Text style={{ flex: 1.5, fontSize: 9, fontWeight: '800', color: '#1E293B' }}>{row.d}</Text>
                  <Text style={{ flex: 0.8, fontSize: 10, fontWeight: '800', color: '#10B981', textAlign: 'center' }}>{row.p}</Text>
                  <Text style={{ flex: 0.8, fontSize: 10, fontWeight: '800', color: '#EF4444', textAlign: 'center' }}>{row.a}</Text>
                  <Text style={{ flex: 0.6, fontSize: 9, fontWeight: '800', color: '#64748B', textAlign: 'right' }}>{row.r}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={{ marginTop: 5, backgroundColor: 'white', borderRadius: 12, borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#DDD6FE', padding: 10, alignItems: 'center' }}
              onPress={() => Alert.alert('Export', 'Generating HoD Attendance Report PDF...')}
            >
              <Text style={{ fontSize: 18, marginBottom: 2 }}>📄</Text>
              <Text style={{ fontSize: 10, fontWeight: '900', color: '#7C3AED' }}>EXPORT ATTENDANCE REPORT</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ marginTop: 10, marginBottom: 30, backgroundColor: '#334155', padding: 12, borderRadius: 10, alignItems: 'center' }}
              onPress={() => setShowHistoryModal(false)}
            >
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 13 }}>Back to Dashboard</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* HoD Absent Students Modal */}
      <Modal visible={showAbsentModal} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View style={{ backgroundColor: '#7C3AED', padding: 10, paddingTop: 40, minHeight: 60, justifyContent: 'center' }}>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '800', paddingLeft: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Department Report</Text>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '800', paddingLeft: 10 }}>Students Absent on Bus</Text>
          </View>
          
          <ScrollView style={{ padding: 10, flex: 1 }}>
            {absentStudents.map((s, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 12, marginBottom: 6, borderRadius: 10, borderWidth: 1, borderColor: '#f1f5f9' }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: s.type === 'ABSENT' ? '#FEF2F2' : '#FFFBEB', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                  <Text style={{ fontSize: 14 }}>{s.type === 'ABSENT' ? '🚫' : '⏰'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#1E293B' }}>{s.name} <Text style={{ color: '#94A3AF', fontWeight: '600' }}>({s.roll})</Text></Text>
                  <Text style={{ fontSize: 9, color: '#64748B', fontWeight: '600' }}>{s.dept} • {s.route}</Text>
                </View>
                <View style={{ backgroundColor: s.type === 'ABSENT' ? '#FEE2E2' : '#FEF3C7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 8, fontWeight: '800', color: s.type === 'ABSENT' ? '#B91C1C' : '#92400E' }}>{s.type}</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity 
              style={{ marginTop: 15, marginBottom: 30, backgroundColor: '#334155', padding: 12, borderRadius: 10, alignItems: 'center' }}
              onPress={() => setShowAbsentModal(false)}
            >
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 13 }}>Back to Dashboard</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#111827',
  },
  btnPrimary: {
    backgroundColor: '#2563EB',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    marginBottom: 15,
    alignItems: 'center',
  },
  btnScan: {
    backgroundColor: '#10B981',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    marginBottom: 15,
    alignItems: 'center',
  },
  danger: {
    backgroundColor: '#EF4444',
    marginTop: 30,
  },
  btnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  successBox: {
    padding: 15,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    width: '100%',
    marginBottom: 15,
    alignItems: 'center',
  },
  successText: {
    color: '#047857',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1f2937'
  },
  mapImage: {
    width: '100%',
    height: 350,
    borderRadius: 12,
    marginBottom: 20,
  },
  routeDetails: {
    width: '100%',
    padding: 15,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginBottom: 30,
  },
  routeText: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 5,
  },
  btnClose: {
    backgroundColor: '#4b5563',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  sqBtn: { width: '48%', backgroundColor: 'white', borderRadius: 15, padding: 15, marginBottom: 15, alignItems: 'center', borderWidth: 1.5, borderColor: '#F1F5F9', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  sqBtnIcon: { fontSize: 28, marginBottom: 8 },
  sqBtnText: { fontSize: 11, fontWeight: '800', color: '#475569', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 30 },
  issueCard: { backgroundColor: 'white', borderRadius: 24, padding: 30, alignItems: 'center' },
  hodStat: { flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#F1F5F9' },
  hodStatNum: { fontSize: 22, fontWeight: '900' },
  hodStatLabel: { fontSize: 8, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginTop: 4 },
});
