import React, { useState, useEffect, useRef } from 'react';
import { 
  FlatList, Alert, Modal, SafeAreaView, Image, View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:3000'; 
const INITIAL_NOTIFS = [
  { id: '1', title: 'Route 12 - Evening Pickup', time: '16:30', status: 'Pending' },
  { id: '2', title: 'Route 07 - Maintenance Duty', time: '09:00', status: 'Pending' },
  { id: '3', title: 'Special Campus Shuttle', time: '12:00', status: 'Pending' },
];

const HOD_STATS = {
  total: 450,
  present: 412,
  absent: 38,
  qrMissed: 12,
  internalLeave: 5,
  busBreakdown: 3,
  medical: 2,
};

const ABSENTEE_DATA = [
  { id: 'STU-101', name: 'Arun Kumar', bus: 'BUS-07', reason: 'QR Missed', status: 'Unverified', phone: '9876543210' },
  { id: 'STU-105', name: 'Sanjana Singh', bus: 'BUS-12', reason: 'Bus Breakdown', status: 'Reported', phone: '9012345678' },
  { id: 'STU-112', name: 'Vikram Seth', bus: 'BUS-03', reason: 'Medical', status: 'Verified', phone: '8765432190' },
  { id: 'STU-128', name: 'Meera Nair', bus: 'BUS-07', reason: 'QR Missed', status: 'Unverified', phone: '7654321098' },
  { id: 'STU-135', name: 'Rahul Dravid', bus: 'BUS-01', reason: 'Internal Leave', status: 'Verified', phone: '9988776655' },
];

const DEPT_VEHICLES = [
  { id: 'BUS-07', route: 'Theni via City', status: 'LIVE', students: 42, driver: 'Rajan Kumar' },
  { id: 'BUS-12', route: 'Ambattur via Avadi', status: 'STATIONARY', students: 35, driver: 'Prakash R.' },
  { id: 'BUS-01', route: 'Koyambedu direct', status: 'BREAKDOWN', students: 28, driver: 'Murugan G.' },
];

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState('QR'); 
  const [qrStatus, setQrStatus] = useState('PENDING'); // PENDING, STARTED, CLOSED
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState('W'); // W, M, Y
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, DONE, PEND
  const [isSelfieConfirmOpen, setIsSelfieConfirmOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFS);
  const [tripStatus, setTripStatus] = useState('ACTIVE'); // ACTIVE, CLOSED
  const [isSosActive, setIsSosActive] = useState(false);
  const [blink, setBlink] = useState(true);
  const [role, setRole] = useState('driver'); // driver, hod, coordinator, maintenance
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isMaintLogModalOpen, setIsMaintLogModalOpen] = useState(false);
  const [isLogHistoryModalOpen, setIsLogHistoryModalOpen] = useState(false);
  const [maintChecklist, setMaintChecklist] = useState({});
  const [selfieStatus, setSelfieStatus] = useState('PENDING');
  const socketRef = useRef(null);
  const cameraRef = useRef(null);
  // Route Alert Notifications
  const [routeAlerts, setRouteAlerts] = useState([
    { id: 'demo-1', notificationType: 'RouteDelayed', routeName: 'Chennai Route 1', effectiveDate: new Date().toISOString().split('T')[0], effectiveTime: '08:30', customMessage: 'Bus is running 20 mins late due to traffic at Porur.', receivedAt: new Date().toISOString() },
  ]);
  const [showRouteAlertHistory, setShowRouteAlertHistory] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(1);

  useEffect(() => {
    let interval;
    if (isSosActive) {
      interval = setInterval(() => setBlink(b => !b), 600);
    } else {
      setBlink(true);
    }
    return () => clearInterval(interval);
  }, [isSosActive]);

  useEffect(() => {
    (async () => {
      // Explicit Confirmation for GPS
      Alert.alert(
        "Location Access Confirmation",
        "To provide live tracking for students and parents, this app needs to access your GPS location. You can toggle this anytime in Settings.",
        [
          { 
            text: "Decline", 
            style: "cancel", 
            onPress: () => setGpsEnabled(false) 
          },
          { 
            text: "Accept", 
            onPress: async () => {
              const cameraStatus = await Camera.requestCameraPermissionsAsync();
              setHasPermission(cameraStatus.status === 'granted');
              
              const locationStatus = await Location.requestForegroundPermissionsAsync();
              if (locationStatus.status === 'granted') {
                setGpsEnabled(true);
              } else {
                Alert.alert('Permission Denied', 'GPS is required for full functionality.');
                setGpsEnabled(false);
              }
            }
          }
        ]
      );

      socketRef.current = io(API_BASE);

      // Listen for route alert notifications from admin
      socketRef.current.emit('joinRoom', 'driver'); // join role room (role is dynamic)
      socketRef.current.on('routeAlert', (alert) => {
        setRouteAlerts(prev => [{ ...alert, receivedAt: alert.receivedAt || new Date().toISOString() }, ...prev]);
        setUnreadAlerts(prev => prev + 1);
      });
    })();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    let locationWatcher = null;
    if (qrStatus === 'STARTED' && gpsEnabled) {
      (async () => {
        locationWatcher = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 10 },
          (loc) => {
            socketRef.current?.emit('driverLocationUpdate', {
              vehicleId: 'MGR-DS-782',
              lat: loc.coords.latitude,
              lng: loc.coords.longitude,
              timestamp: new Date().toISOString()
            });
          }
        );
      })();
    }
    return () => locationWatcher?.remove();
  }, [qrStatus, gpsEnabled]);

  const handleQRScan = async () => {
    try {
      let loc = await Location.getCurrentPositionAsync({});
      await fetch(`${API_BASE}/api/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'rajan_kumar_782',
          vehicleId: 'MGR-BUS-07',
          type: isLive ? 'check_out' : 'check_in',
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        })
      });
      if (qrStatus !== 'STARTED') {
        setQrStatus('STARTED');
        Alert.alert("Attendance Recorded", "Work started record sent to DB successfully.");
      } else {
        setQrStatus('CLOSED');
        setSelfieStatus('CLOSED');
        Alert.alert("Work Closed", "Closure scan recorded to DB successfully. Connection: IDLE.");
      }
    } catch (err) {
      if (qrStatus !== 'STARTED') {
        setQrStatus('STARTED');
        Alert.alert("Notice", "Status set to LIVE (Connection Offline).");
      } else {
        setQrStatus('CLOSED');
        setSelfieStatus('CLOSED');
        Alert.alert("Notice", "Status set to IDLE (Connection Offline).");
      }
    }
  };

  const handleIssueApi = async (type, desc) => {
    setIsIssueModalOpen(false);
    try {
      await fetch(`${API_BASE}/api/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: type,
          description: desc || `Reported by Driver: Rajan Kumar`,
          vehicleId: 'MGR-BUS-07',
          reportedBy: 'rajan_kumar_782'
        })
      });
      Alert.alert('Reported', `${type} issue logged to Hub.`);
    } catch (err) {
      Alert.alert('Reported', `${type} submitted.`);
    }
  };

  const onShutterPress = () => {
    setIsCameraOpen(false);
    if (cameraMode === 'QR') {
        handleQRScan();
    } else {
        setSelfieStatus(prev => prev === 'VERIFIED' ? 'CLOSED' : 'VERIFIED');
        setIsSelfieConfirmOpen(true);
    }
  };


  // --- HOD DASHBOARD VIEW ---
  if (role === 'hod') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        {/* HOD Header */}
        <View style={[styles.homeHdr, { backgroundColor: '#7C3AED', height: 120 }]}>
          <View style={[styles.profileImgWrap, { borderColor: '#DDD6FE' }]}>
            <Text style={{ fontSize: 28 }}>👨‍🏫</Text>
          </View>
          <View style={styles.hdrMainInfo}>
            <Text style={styles.hdrRole}>Head of Department</Text>
            <Text style={styles.hdrName}>Dr. Ramesh Kumar</Text>
            <Text style={{ fontSize: 10, color: '#DDD6FE', fontWeight: '700', marginTop: 2 }}>CSE DEPARTMENT | ID: HOD-882</Text>
          </View>
          <TouchableOpacity 
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 8 }}
            onPress={() => setRole('driver')}
          >
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>SWITCH ROLE</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ListHeaderComponent={() => (
            <>
              {/* Analytics Cards */}
              <View style={{ padding: 15 }}>
                <Text style={styles.sectionTitle}>ATTENDANCE ANALYTICS</Text>
                <View style={styles.statsGrid}>
                  <View style={[styles.statCard, { borderLeftColor: '#7C3AED', borderLeftWidth: 4 }]}>
                    <Text style={styles.statVal}>{HOD_STATS.present}/{HOD_STATS.total}</Text>
                    <Text style={styles.statLab}>Students Present</Text>
                  </View>
                  <View style={[styles.statCard, { borderLeftColor: '#EF4444', borderLeftWidth: 4 }]}>
                    <Text style={[styles.statVal, { color: '#EF4444' }]}>{HOD_STATS.absent}</Text>
                    <Text style={styles.statLab}>Reported Absent</Text>
                  </View>
                </View>
                
                <View style={styles.reasonRow}>
                  <ReasonPill label="QR Missed" count={HOD_STATS.qrMissed} color="#F59E0B" />
                  <ReasonPill label="Breakdown" count={HOD_STATS.busBreakdown} color="#EF4444" />
                  <ReasonPill label="Medical" count={HOD_STATS.medical} color="#10B981" />
                </View>
              </View>

              {/* Absentee List Header */}
              <View style={{ paddingHorizontal: 15, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.sectionTitle}>GRANULAR ABSENTEE LIST</Text>
                <TouchableOpacity><Text style={{ color: '#7C3AED', fontSize: 11, fontWeight: '800' }}>EXPORT PDF</Text></TouchableOpacity>
              </View>
            </>
          )}
          data={ABSENTEE_DATA}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.absenteeTile}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.absName}>{item.name}</Text>
                  <Text style={styles.absId}>({item.id})</Text>
                </View>
                <Text style={styles.absBus}>Assigned: {item.bus}</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                   <Text style={[styles.absReason, { color: item.reason === 'Bus Breakdown' ? '#EF4444' : '#F59E0B' }]}>{item.reason}</Text>
                   <Text style={styles.absStatus}>{item.status}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.callBtn} 
                onPress={() => Alert.alert('Calling Parent', `Connecting to ${item.phone}...`)}
              >
                <Text style={{ fontSize: 18 }}>📞</Text>
              </TouchableOpacity>
            </View>
          )}
          ListFooterComponent={() => (
            <View style={{ padding: 15, paddingBottom: 40 }}>
              <Text style={styles.sectionTitle}>DEPARTMENT VEHICLE TRACKING</Text>
              {DEPT_VEHICLES.map((v) => (
                <View key={v.id} style={styles.vehicleTrackCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vNum}>{v.id} - {v.route}</Text>
                    <Text style={styles.vDetail}>Driver: {v.driver} | {v.students} Students</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={[styles.vStatusPill, { backgroundColor: v.status === 'LIVE' ? '#D1FAE5' : (v.status === 'BREAKDOWN' ? '#FEE2E2' : '#F3F4F6') }]}>
                      <Text style={[styles.vStatusText, { color: v.status === 'LIVE' ? '#065F46' : (v.status === 'BREAKDOWN' ? '#B91C1C' : '#374151') }]}>{v.status}</Text>
                    </View>
                    <TouchableOpacity style={{ marginTop: 4 }}><Text style={{ fontSize: 10, color: '#7C3AED', fontWeight: '800' }}>VIEW MAP</Text></TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      {/* Header Section */}
      <View style={styles.homeHdr}>
        <View style={styles.profileImgWrap}>
          <Text style={{ fontSize: 28 }}>👨‍✈️</Text>
        </View>
        <View style={styles.hdrMainInfo}>
          <View style={styles.hdrCatRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.hdrRole}>OFFICIAL DRIVER</Text>
              <Text style={styles.hdrName}>Rajan Kumar</Text>
              <Text style={{ fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>EMP: STF-8930</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={{ 
                  fontSize: 9, fontWeight: '900', 
                  backgroundColor: qrStatus === 'STARTED' ? '#10B981' : '#EF4444', 
                  paddingVertical: 4, paddingHorizontal: 10, borderRadius: 4, color: '#fff', 
                  minWidth: 80, textAlign: 'center', overflow: 'hidden'
                }}>
                    {qrStatus === 'STARTED' ? 'QR: START' : 'QR: CLOSE'}
                </Text>
                <Text style={{ 
                  fontSize: 9, fontWeight: '900', 
                  backgroundColor: selfieStatus === 'VERIFIED' ? '#10B981' : '#EF4444', 
                  paddingVertical: 4, paddingHorizontal: 10, borderRadius: 4, color: '#fff', 
                  minWidth: 80, textAlign: 'center', overflow: 'hidden'
                }}>
                    {selfieStatus === 'VERIFIED' ? 'SELFIE: START' : 'SELFIE: CLOSE'}
                </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Main Dashboard Layout */}
      <View style={styles.dashboard}>
        {/* Left Column: Actions */}
        <View style={styles.actionColumn}>
          {role !== 'maintenance' && (
            <ActionButton icon="📷" title={"SCAN QR\nATTENDANCE"} onPress={() => { setCameraMode('QR'); setIsCameraOpen(true); }} />
          )}
          {role !== 'maintenance' && (
            <ActionButton icon="⚠️" title={"RAISE\nISSUE"} onPress={() => setIsIssueModalOpen(true)} />
          )}
          {role === 'driver' && (
            <ActionButton icon="🤳" title={"START / HALT\nRECORD"} onPress={() => { setCameraMode('SELFIE'); setIsCameraOpen(true); }} />
          )}
          {role === 'maintenance' && (
            <ActionButton icon="📝" title={"CREATE\nMAINT. LOG"} onPress={() => setIsMaintLogModalOpen(true)} />
          )}
          {role === 'maintenance' && (
            <ActionButton icon="📜" title={"LOG\nHISTORY"} onPress={() => setIsLogHistoryModalOpen(true)} />
          )}
          {role !== 'maintenance' && (
            <ActionButton icon="📜" title={"MY\nHISTORY"} onPress={() => setIsHistoryModalOpen(true)} />
          )}
          {/* Route Alert Notifications Button */}
          {role !== 'maintenance' && (
            <View style={{ position: 'relative' }}>
              <ActionButton icon="🔔" title={"ROUTE\nALERTS"} onPress={() => { setShowRouteAlertHistory(true); setUnreadAlerts(0); }} />
              {unreadAlerts > 0 && (
                <View style={{ position: 'absolute', top: 6, right: 6, backgroundColor: '#EF4444', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>{unreadAlerts > 9 ? '9+' : unreadAlerts}</Text>
                </View>
              )}
            </View>
          )}
          <ActionButton icon="⚙️" title={"APP\nSETTINGS"} onPress={() => setIsSettingsModalOpen(true)} />
        </View>

        {/* Right Column: Notifications */}
        <View style={styles.notifColumn}>
          <Text style={styles.notifTitle}>Notification</Text>
          <FlatList
            data={notifications}
            renderItem={({ item }) => (
              <View style={styles.notifTile}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 6 }}>
                    <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2850/2850388.png' }} style={{ width: 14, height: 14, marginRight: 5 }} />
                    <Text style={{ fontSize: 8, fontWeight: '900', color: '#2563EB', letterSpacing: 0.5 }}>DR. MGR TRANSPORT</Text>
                </View>
                <Text style={styles.notifText}>{item.title}</Text>
                <View style={styles.notifBtns}>
                  <TouchableOpacity style={[styles.smallBtn, styles.btnBlue]} onPress={() => Alert.alert('Accepted', `You have accepted: ${item.title}`)}>
                    <Text style={styles.smallBtnText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.smallBtn, styles.btnGray]} onPress={() => Alert.alert('Declined', `Assignment declined.`)}>
                    <Text style={styles.smallBtnText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            keyExtractor={item => item.id}
          />
        </View>
      </View>

      {/* Footer Panel */}
      <View style={styles.bottomArea}>
        <View style={[styles.tripStatusCard, tripStatus === 'CLOSED' && { backgroundColor: '#DCFCE7', borderColor: '#22C55E', borderWidth: 1 }]}>
          <Text style={styles.tripLabel}>1. Current trip:</Text>
          <Text style={[styles.tripValue, tripStatus === 'CLOSED' && { color: '#15803D' }]}>
            {tripStatus === 'CLOSED' ? 'No Current Trip' : 'Morning Shift (Route 07)'}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.closeTripBtn, tripStatus === 'CLOSED' && { backgroundColor: '#22C55E' }]} 
          onPress={() => { 
            if (tripStatus === 'CLOSED') return;
            Alert.alert("Close Trip", "Confirm and close current session?", [
              { text: "Cancel", style: "cancel" },
              { text: "CLOSE TRIP", onPress: () => {
                setQrStatus('CLOSED'); 
                setSelfieStatus('CLOSED');
                setTripStatus('CLOSED');
              }}
            ]);
          }}
        >
          <Text style={styles.btnMainText}>
            {tripStatus === 'CLOSED' 
              ? (role === 'driver' ? "Waiting for New Trip" : "Waiting for new task") 
              : "CLOSE CURRENT TRIP"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.sosBtn, 
            isSosActive && blink && { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }
          ]} 
          onPress={() => {
            if (isSosActive) {
              setIsSosActive(false);
            } else {
              Alert.alert("TRIGGER SOS", "This will alert the University Hub immediately.", [
                { text: "Cancel", style: "cancel" },
                { text: "TRIGGER NOW", style: 'destructive', onPress: () => {
                  setIsSosActive(true);
                  socketRef.current?.emit('studentSOS', { studentId: 'DRIVER_RAJAN', busId: '07' });
                }}
              ]);
            }
          }}
        >
          <Text style={[styles.sosText, isSosActive && { color: '#EF4444' }]}>
            <Text style={[styles.sosIcon, isSosActive && { backgroundColor: '#EF4444', color: 'white' }]}>
              {isSosActive ? 'ACTIVE' : 'SOS'}
            </Text> 
            {isSosActive ? ' STOP EMERGENCY' : ' TRIGGER SOS'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <Modal visible={isCameraOpen} animationType="slide">
        <View style={styles.cameraContainer}>
          <Camera style={styles.camera} ref={cameraRef}>
            <View style={styles.cameraFrame}>
              <Text style={styles.cameraTitle}>
                {cameraMode === 'QR' 
                  ? (qrStatus === 'STARTED' ? "Close Attendance (QR Scan)" : "Initial Scan (Start Work)") 
                  : (selfieStatus === 'VERIFIED' ? "Close/Hault Vehicle Verification" : "Vehicle Verification Selfie (Start)")}
              </Text>
              <View style={cameraMode === 'QR' ? styles.wrapperQR : styles.wrapperFace} />
              <Text style={styles.cameraHint}>{cameraMode === 'QR' ? 'Align QR Code' : 'Include yourself & vehicle in frame'}</Text>
            </View>
          </Camera>
          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.shutter} onPress={onShutterPress}><View style={styles.shutterInner} /></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isIssueModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.issueCard}>
            <Text style={styles.modalTitle}>Report Issue</Text>
            <View style={styles.issueGrid}>
              <IssueTile icon="🚗" label="Breakdown" onPress={() => handleIssueApi('BREAKDOWN')} />
              <IssueTile icon="🚑" label="Accident" onPress={() => handleIssueApi('ACCIDENT', 'CRITICAL ALERT')} />
              <IssueTile icon="🗺️" label="Route" onPress={() => handleIssueApi('ROUTE')} />
              <IssueTile icon="📝" label="Others" onPress={() => handleIssueApi('OTHERS')} />
            </View>
            <TouchableOpacity onPress={() => setIsIssueModalOpen(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isSelfieConfirmOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.issueCard}>
            <Text style={styles.modalTitle}>Selfie Recorded</Text>
            <View style={{ width: '100%', marginBottom: 15, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: '#E5E7EB' }}>
                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=300&q=80' }} 
                  style={{ width: '100%', height: 160 }} 
                />
            </View>
            <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 20, textAlign: 'center', marginBottom: 20 }}>
              Image & GPS Location (13.06, 80.21) successfully logged to server and verified.
            </Text>
            <TouchableOpacity style={[styles.actionBtn, { height: 45, width: '100%', backgroundColor: '#2563EB' }]} onPress={() => setIsSelfieConfirmOpen(false)}>
                <Text style={{ color: 'white', fontWeight: '800', fontSize: 14 }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isSettingsModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.issueCard}>
            <Text style={styles.modalTitle}>App Settings</Text>
            
            <View style={{ width: '100%', marginBottom: 20 }}>
              <Text style={{ fontSize: 13, color: '#4B5563', fontWeight: '700', marginBottom: 10 }}>GPS Tracking Control</Text>
              <TouchableOpacity 
                style={[
                  styles.actionBtn, 
                  { 
                    height: 55, width: '100%', 
                    backgroundColor: gpsEnabled ? '#10B981' : '#EF4444',
                    borderWidth: 0,
                    marginBottom: 5
                  }
                ]} 
                onPress={() => setGpsEnabled(!gpsEnabled)}
              >
                <Text style={{ color: 'white', fontWeight: '900', fontSize: 14 }}>
                  {gpsEnabled ? 'GPS ACCESS: PROVIDED' : 'GPS ACCESS: DECLINED'}
                </Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'center' }}>
                Toggle this to manually stop or start live GPS sharing with the university hub.
              </Text>
            </View>

            <View style={{ width: '100%', marginBottom: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 20 }}>
               <Text style={{ fontSize: 13, color: '#4B5563', fontWeight: '700', marginBottom: 10 }}>Notification Alerts</Text>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>Sound & Vibration</Text>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#2563EB' }}>ENABLED</Text>
               </View>
            </View>

            <TouchableOpacity 
              style={{ padding: 15, width: '100%', alignItems: 'center' }} 
              onPress={() => setIsSettingsModalOpen(false)}
            >
                <Text style={{ color: '#2563EB', fontWeight: '800' }}>Close Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isHistoryModalOpen} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View style={[styles.blueHeader, { minHeight: 70, paddingTop: 20 }]}>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '800' }}>My History</Text>
          </View>
          
          <View style={{ padding: 10, flex: 1 }}>
            {/* Filter Tier 1 */}
            <View style={{ flexDirection: 'row', backgroundColor: '#E2E8F0', padding: 2, borderRadius: 8, marginBottom: 8 }}>
              {[
                { l: 'FULL', v: 'ALL' },
                { l: 'DONE', v: 'DONE' },
                { l: 'PEND', v: 'PEND' }
              ].map((t) => (
                <TouchableOpacity 
                  key={t.v} 
                  onPress={() => setStatusFilter(t.v)}
                  style={{ flex: 1, padding: 5, backgroundColor: statusFilter === t.v ? 'white' : 'transparent', borderRadius: 6, alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 8, fontWeight: '900', color: statusFilter === t.v ? '#2563EB' : '#64748B' }}>{t.l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Filter Tier 2 + Selection */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {['W', 'M', 'Y'].map((t) => (
                  <TouchableOpacity 
                    key={t} 
                    onPress={() => setTimeFilter(t)}
                    style={{ 
                      width: 22, height: 22, borderRadius: 11, borderWidth: 1, 
                      borderColor: timeFilter === t ? '#2563EB' : '#CBD5E1', 
                      backgroundColor: timeFilter === t ? '#EFF6FF' : 'white', 
                      justifyContent: 'center', alignItems: 'center' 
                    }}
                  >
                    <Text style={{ fontSize: 8, fontWeight: '900', color: timeFilter === t ? '#2563EB' : '#64748B' }}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ flex: 1, padding: 5, borderStyle: 'solid', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 20, backgroundColor: 'white' }}>
                <Text style={{ fontSize: 8, fontWeight: '800', color: '#64748B', textAlign: 'center' }}>
                  {timeFilter === 'W' ? 'Week: Oct 20-26, 2023 ▼' : (timeFilter === 'M' ? 'Month: October 2023 ▼' : 'Year: 2023-24 ▼')}
                </Text>
              </View>
            </View>

            {/* Table Header */}
            <View style={{ flexDirection: 'row', backgroundColor: '#F1F5F9', padding: 6, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
              <Text style={{ flex: 1.5, fontSize: 8, fontWeight: '900', color: '#475569' }}>Route/Duty</Text>
              <Text style={{ flex: 1.2, fontSize: 8, fontWeight: '900', color: '#475569' }}>Date/Time</Text>
              <Text style={{ flex: 0.6, fontSize: 8, fontWeight: '900', color: '#475569', textAlign: 'right' }}>Stat</Text>
            </View>

            {/* Max Table Body */}
            <View style={{ backgroundColor: 'white', borderBottomLeftRadius: 8, borderBottomRightRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', flex: 1 }}>
              {[
                { r: 'RT-07 (Theni)', d: '24 Oct 08:30', s: 'DONE', c: '#10B981' },
                { r: 'RT-12 (Amb)',   d: '22 Oct 17:15', s: 'DONE', c: '#2563EB' },
                { r: 'RT-05 (City)',  d: '21 Oct 08:45', s: 'DONE', c: '#10B981' },
                { r: 'RT-02 (Koy)',   d: '18 Oct 08:30', s: 'DONE', c: '#10B981' },
                { r: 'RT-07 (Theni)', d: '16 Oct 08:15', s: 'PEND', c: '#EF4444' },
                { r: 'RT-05 (City)',  d: '15 Oct 08:45', s: 'DONE', c: '#10B981' },
                { r: 'RT-02 (Koy)',   d: '12 Oct 08:30', s: 'DONE', c: '#10B981' },
                { r: 'RT-07 (Theni)', d: '10 Oct 08:15', s: 'DONE', c: '#10B981' },
                { r: 'RT-01 (Main)',  d: '08 Oct 08:00', s: 'DONE', c: '#10B981' },
                { r: 'RT-07 (Theni)', d: '05 Oct 08:15', s: 'DONE', c: '#10B981' },
                { r: 'RT-12 (Amb)',   d: '02 Oct 17:15', s: 'PEND', c: '#EF4444' }
              ]
              .filter(row => statusFilter === 'ALL' || row.s === statusFilter)
              .map((row, i, filtered) => (
                <View key={i} style={{ flexDirection: 'row', padding: 6, borderBottomWidth: i === filtered.length - 1 ? 0 : 1, borderBottomColor: '#F8FAFC' }}>
                  <Text style={{ flex: 1.5, fontSize: 9, fontWeight: '700', color: '#1E293B' }}>{row.r}</Text>
                  <Text style={{ flex: 1.2, fontSize: 8, fontWeight: '600', color: '#64748B' }}>{row.d}</Text>
                  <Text style={{ flex: 0.6, fontSize: 9, fontWeight: '900', color: row.c, textAlign: 'right' }}>{row.s}</Text>
                </View>
              ))}
            </View>

            {/* Compact PDF Tile */}
            <TouchableOpacity 
              style={{ marginTop: 15, backgroundColor: 'white', borderRadius: 12, borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#CBD5E1', padding: 10, alignItems: 'center' }}
              onPress={() => {
                Alert.alert('Generating PDF...', 'Please wait while we compile your history.');
                setTimeout(() => Alert.alert('Success', 'PDF Report exported to downloads.'), 1500);
              }}
            >
              <Text style={{ fontSize: 18, marginBottom: 2 }}>📄</Text>
              <Text style={{ fontSize: 10, fontWeight: '900', color: '#2563EB' }}>DOWNLOAD PDF REPORT</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ marginTop: 10, backgroundColor: '#334155', padding: 12, borderRadius: 10, alignItems: 'center' }}
              onPress={() => setIsHistoryModalOpen(false)}
            >
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 13 }}>Back Home</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Route Alert Notification History Modal */}
      <Modal visible={showRouteAlertHistory} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View style={styles.modalHdr}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 18 }}>🔔</Text>
              <Text style={styles.modalTitle}>Route Alerts</Text>
            </View>
            <TouchableOpacity onPress={() => setShowRouteAlertHistory(false)}>
              <Text style={styles.modalCloseText}>CLOSE</Text>
            </TouchableOpacity>
          </View>

          {routeAlerts.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🔕</Text>
              <Text style={{ fontWeight: '800', color: '#6B7280', fontSize: 14 }}>No route alerts yet</Text>
              <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>Alerts from admin will appear here</Text>
            </View>
          ) : (
            <ScrollView style={{ flex: 1, padding: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' }}>
                {routeAlerts.length} Alert{routeAlerts.length !== 1 ? 's' : ''}
              </Text>
              {routeAlerts.map((alert, idx) => {
                const typeMap = {
                  RouteDelayed:   { emoji: '⏰', label: 'Route Delayed',      color: '#D97706', bg: '#FFFBEB', border: '#FCD34D' },
                  RouteCancelled: { emoji: '❌', label: 'Route Cancelled',     color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5' },
                  NewPath:        { emoji: '🔀', label: 'New Path / Diversion', color: '#2563EB', bg: '#EFF6FF', border: '#93C5FD' },
                };
                const t = typeMap[alert.notificationType] || { emoji: '📢', label: alert.notificationType, color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' };
                const dt = new Date(alert.receivedAt || alert.timestamp);
                const timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateStr = dt.toLocaleDateString([], { day: 'numeric', month: 'short' });
                return (
                  <View key={alert.id || idx} style={{
                    backgroundColor: t.bg, borderRadius: 14, padding: 14, marginBottom: 12,
                    borderLeftWidth: 4, borderLeftColor: t.color, borderWidth: 1, borderColor: t.border,
                    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 20 }}>{t.emoji}</Text>
                        <Text style={{ fontWeight: '900', fontSize: 13, color: t.color }}>{t.label}</Text>
                      </View>
                      <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '600' }}>{dateStr} {timeStr}</Text>
                    </View>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: 8, marginBottom: 6 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#1F2937', marginBottom: 2 }}>{alert.routeName}</Text>
                      <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '600' }}>
                        {alert.effectiveDate} at {alert.effectiveTime}
                        {alert.vehicleNumbers?.length ? ` · Vehicles: ${alert.vehicleNumbers.join(', ')}` : ''}
                      </Text>
                    </View>
                    {(alert.customMessage || alert.updatedRoute) ? (
                      <Text style={{ fontSize: 12, color: '#374151', fontStyle: 'italic', lineHeight: 18 }}>
                        "{alert.customMessage || alert.updatedRoute}"
                      </Text>
                    ) : null}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
                      <Text style={{ fontSize: 10, color: '#10B981', fontWeight: '700' }}>
                        Dispatched by Admin · {alert.totalAffected ? `${alert.totalAffected} notified` : 'All stakeholders notified'}
                      </Text>
                    </View>
                  </View>
                );
              })}
              <View style={{ height: 20 }} />
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>


      <Modal visible={isMaintLogModalOpen} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View style={styles.modalHdr}>
            <Text style={styles.modalTitle}>Create Maint. Log</Text>
            <TouchableOpacity onPress={() => setIsMaintLogModalOpen(false)}>
              <Text style={styles.modalCloseText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 20, flex: 1 }}>
            <Text style={{ fontWeight: '800', marginBottom: 5 }}>Vehicle ID</Text>
            <TextInput style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 20, backgroundColor: 'white' }} placeholder="e.g. BUS-07" />
            
            <Text style={{ fontWeight: '900', marginBottom: 10, color: '#1e293b' }}>⚙️ Engine Section</Text>
            <View style={{ backgroundColor: 'white', borderRadius: 10, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', flexWrap: 'wrap' }}>
              {['oil', 'filters', 'belts', 'coolant'].map(item => (
                <TouchableOpacity key={item} style={{ width: '50%', flexDirection: 'row', alignItems: 'center', marginBottom: 10 }} onPress={() => setMaintChecklist(prev => ({...prev, [item]: !prev[item]}))}>
                  <View style={{ width: 18, height: 18, borderWidth: 1, borderColor: '#94a3b8', borderRadius: 4, marginRight: 8, backgroundColor: maintChecklist[item] ? '#2563eb' : 'white', justifyContent: 'center', alignItems: 'center' }}>
                    {maintChecklist[item] && <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>✓</Text>}
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#475569', textTransform: 'capitalize' }}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontWeight: '900', marginBottom: 10, color: '#1e293b' }}>🛑 Brakes Section</Text>
            <View style={{ backgroundColor: 'white', borderRadius: 10, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', flexWrap: 'wrap' }}>
              {['frontPads', 'rearPads', 'fluid', 'rotors'].map(item => (
                <TouchableOpacity key={item} style={{ width: '50%', flexDirection: 'row', alignItems: 'center', marginBottom: 10 }} onPress={() => setMaintChecklist(prev => ({...prev, [item]: !prev[item]}))}>
                  <View style={{ width: 18, height: 18, borderWidth: 1, borderColor: '#94a3b8', borderRadius: 4, marginRight: 8, backgroundColor: maintChecklist[item] ? '#2563eb' : 'white', justifyContent: 'center', alignItems: 'center' }}>
                    {maintChecklist[item] && <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>✓</Text>}
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#475569' }}>
                    {item === 'frontPads' ? 'Front Pads' : item === 'rearPads' ? 'Rear Pads' : item === 'fluid' ? 'Fluid Level' : 'Rotors'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontWeight: '800', marginBottom: 5 }}>Manual Issue Entry</Text>
            <TextInput 
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 20, backgroundColor: 'white', minHeight: 80, textAlignVertical: 'top' }} 
              placeholder="Describe any additional manual issues..." 
              multiline 
            />

            <TouchableOpacity 
              style={{ backgroundColor: '#F0FDFA', padding: 20, borderRadius: 12, alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: '#99F6E4', borderStyle: 'dashed' }}
              onPress={() => Alert.alert("Upload", "Paper log uploaded successfully (Mock)")}
            >
              <Text style={{ fontSize: 24, marginBottom: 5 }}>📄</Text>
              <Text style={{ color: '#0F766E', fontWeight: '900', fontSize: 14 }}>UPLOAD PAPER LOG</Text>
              <Text style={{ color: '#14B8A6', fontWeight: '600', fontSize: 10, marginTop: 3 }}>Tap to scan or select photo</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ backgroundColor: '#2563EB', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 40 }}
              onPress={() => {
                Alert.alert("Success", "Maintenance Log Created");
                setMaintChecklist({});
                setIsMaintLogModalOpen(false);
              }}
            >
              <Text style={{ color: 'white', fontWeight: '900', fontSize: 14 }}>SUBMIT MAINTENANCE LOG</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Log History Modal */}
      <Modal visible={isLogHistoryModalOpen} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View style={styles.modalHdr}>
            <Text style={styles.modalTitle}>Maintenance Logs</Text>
            <TouchableOpacity onPress={() => setIsLogHistoryModalOpen(false)}>
              <Text style={styles.modalCloseText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
          <View style={{ padding: 15, flex: 1 }}>
            {/* Period Tabs */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
              {['Day', 'Week', 'Month', 'Year'].map(t => (
                <TouchableOpacity 
                  key={t}
                  style={{ flex: 1, padding: 8, backgroundColor: timeFilter === t ? '#2563EB' : 'white', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' }}
                  onPress={() => setTimeFilter(t)}
                >
                  <Text style={{ fontSize: 10, fontWeight: '800', color: timeFilter === t ? 'white' : '#64748B' }}>{t.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Status Tabs */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
              {['Ongoing', 'Completed'].map(s => (
                <TouchableOpacity 
                  key={s}
                  style={{ flex: 1, padding: 10, backgroundColor: statusFilter === s ? '#10B981' : '#F3F4F6', borderRadius: 8, alignItems: 'center' }}
                  onPress={() => setStatusFilter(s)}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: statusFilter === s ? 'white' : '#64748B' }}>{s.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView>
              <View style={{ backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ fontWeight: '800', fontSize: 14 }}>
                    BUS-12 Engine Oil <Text style={{ fontSize: 9, backgroundColor: '#e0e7ff', color: '#4338ca', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' }}>Maintenance ID Member Raised</Text>
                  </Text>
                  <Text style={{ fontSize: 10, color: '#F59E0B', fontWeight: '800', backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' }}>ONGOING</Text>
                </View>
                <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 10 }}>Routine oil change and filter replacement.</Text>
                <TouchableOpacity onPress={() => Alert.alert('View', 'Viewing paper log attachment')}>
                  <Text style={{ fontSize: 11, color: '#2563EB', fontWeight: '800' }}>📎 View Paper Log</Text>
                </TouchableOpacity>
              </View>

              <View style={{ backgroundColor: '#FEF2F2', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#EF4444' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ fontWeight: '800', fontSize: 14 }}>
                    BUS-01 Engine Overheat <Text style={{ fontSize: 9, backgroundColor: '#ef4444', color: 'white', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' }}>Admin Raised</Text>
                  </Text>
                  <Text style={{ fontSize: 10, color: '#EF4444', fontWeight: '800', backgroundColor: '#FEF2F2', borderColor: '#EF4444', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' }}>CRITICAL</Text>
                </View>
                <Text style={{ fontSize: 11, color: '#B91C1C', marginBottom: 10 }}>Immediate check required. Check coolant and belts.</Text>
                <TouchableOpacity onPress={() => Alert.alert('View', 'Viewing paper log attachment')}>
                  <Text style={{ fontSize: 11, color: '#2563EB', fontWeight: '800' }}>📎 View Paper Log</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const ActionButton = ({ title, icon, onPress }) => (
  <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
    <Text style={{ fontSize: 22, marginBottom: 5 }}>{icon}</Text>
    <Text style={styles.actionBtnText}>{title}</Text>
  </TouchableOpacity>
);

const IssueTile = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.issueTile} onPress={onPress}>
    <Text style={{ fontSize: 24 }}>{icon}</Text>
    <Text style={styles.issueTileLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
  
  homeHdr: {
    minHeight: 70,
    backgroundColor: '#2563EB',
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255,255,255,0.1)'
  },
  profileImgWrap: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    marginRight: 12
  },
  hdrMainInfo: { flex: 1, justifyContent: 'center' },
  hdrCatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  hdrRole: { fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  hdrName: { fontSize: 16, fontWeight: '800', color: '#fff', marginTop: 2 },
  hdrStatusPill: { fontSize: 9, fontWeight: '800', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 4, overflow: 'hidden' },

  dashboard: { flexDirection: 'row', padding: 15, flex: 1 },
  actionColumn: { width: 135, paddingRight: 10 },
  actionBtn: { 
    backgroundColor: 'white', borderColor: '#E5E7EB', borderWidth: 1.5, borderRadius: 12, 
    height: 75, justifyContent: 'center', alignItems: 'center', marginBottom: 10, padding: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1
  },
  actionBtnText: { fontSize: 8, fontWeight: '900', textAlign: 'center', color: '#374151', textTransform: 'uppercase' },
  notifColumn: { flex: 1, backgroundColor: 'white', borderRadius: 16, borderWidth: 1.5, borderColor: '#E5E7EB', padding: 8 },
  notifTitle: { fontSize: 11, color: '#9CA3AF', fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' },
  notifTile: { 
    backgroundColor: '#fff', padding: 10, borderRadius: 12, marginBottom: 10, 
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
  },
  notifText: { fontSize: 11, fontWeight: '700', color: '#1F2937', marginBottom: 8, lineHeight: 14 },
  notifBtns: { flexDirection: 'row', gap: 8 },
  smallBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  btnBlue: { backgroundColor: '#2563EB' },
  btnGray: { backgroundColor: '#F3F4F6' },
  smallBtnText: { color: 'white', fontSize: 10, fontWeight: '800' },
  bottomArea: { padding: 12 },
  tripStatusCard: { backgroundColor: '#E2E8F0', padding: 10, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  tripLabel: { fontSize: 10, color: '#6B7280', fontWeight: '800' },
  tripValue: { fontSize: 13, color: '#1F2937', fontWeight: '800' },
  closeTripBtn: { backgroundColor: '#EF4444', padding: 14, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, alignItems: 'center', marginBottom: 10 },
  btnMainText: { color: 'white', fontSize: 14, fontWeight: '800' },
  sosBtn: { backgroundColor: 'white', padding: 12, borderRadius: 8, borderWidth: 1.5, borderColor: '#F3F4F6', alignItems: 'center' },
  sosText: { color: '#374151', fontSize: 13, fontWeight: '800' },
  sosIcon: { color: '#EF4444', borderWidth: 1.5, borderColor: '#EF4444', paddingHorizontal: 4, borderRadius: 4 },
  cameraContainer: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1 },
  cameraFrame: { flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  cameraTitle: { position: 'absolute', top: 50, color: 'white', fontSize: 18, fontWeight: '900', textAlign: 'center', width: '100%', zIndex: 10 },
  wrapperQR: { width: 250, height: 250, borderWidth: 2, borderColor: 'white', borderRadius: 20 },
  wrapperFace: { width: 280, height: 350, borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)', borderRadius: 20, borderStyle: 'dashed' },
  cameraHint: { color: 'white', marginTop: 20, fontWeight: 'bold' },
  cameraControls: { position: 'absolute', bottom: 50, width: '100%', alignItems: 'center' },
  shutter: { width: 70, height: 70, borderRadius: 35, borderWidth: 5, borderColor: 'white', padding: 4 },
  shutterInner: { flex: 1, backgroundColor: 'white', borderRadius: 35 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 30 },
  issueCard: { backgroundColor: 'white', borderRadius: 24, padding: 30, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '900', marginBottom: 20 },
  issueGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' },
  issueTile: { width: '48%', backgroundColor: '#F9FAFB', padding: 15, borderRadius: 16, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#E5E7EB' },
  issueTileLabel: { fontSize: 11, fontWeight: '800', marginTop: 8 },
  cancelText: { color: '#6B7280', fontWeight: 'bold', marginTop: 10 },
  
  // HOD Styles
  sectionTitle: { fontSize: 11, fontWeight: '900', color: '#6B7280', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  statCard: { flex: 1, backgroundColor: 'white', padding: 15, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  statVal: { fontSize: 22, fontWeight: '900', color: '#1F2937' },
  statLab: { fontSize: 10, color: '#6B7280', fontWeight: '600', marginTop: 2 },
  reasonRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  pillText: { fontSize: 10, fontWeight: '800', color: 'white' },
  absenteeTile: { 
    backgroundColor: 'white', marginHorizontal: 15, marginBottom: 10, padding: 15, borderRadius: 16, 
    flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, borderLeftColor: '#7C3AED',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2
  },
  absName: { fontSize: 14, fontWeight: '800', color: '#1F2937' },
  absId: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  absBus: { fontSize: 11, color: '#6B7280', marginTop: 2, fontWeight: '600' },
  absReason: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  absStatus: { fontSize: 10, color: '#9CA3AF', fontWeight: '700' },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  vehicleTrackCard: { 
    backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, 
    flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' 
  },
  vNum: { fontSize: 13, fontWeight: '800', color: '#1F2937' },
  vDetail: { fontSize: 10, color: '#6B7280', marginTop: 2 },
  vStatusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  vStatusText: { fontSize: 9, fontWeight: '900' }
});

const ReasonPill = ({ label, count, color }) => (
  <View style={[styles.pill, { backgroundColor: color }]}>
    <Text style={styles.pillText}>{label}: {count}</Text>
  </View>
);
