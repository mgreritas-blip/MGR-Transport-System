const currentRole = 'maintenance';
const btnScanQr = { style: {} };
const btnRaiseIssue = { style: {} };
const btnSelfie = { style: {} };
const btnMyHistory = { style: {} };
const btnMaintLog = { style: {} };
const btnLogHistory = { style: {} };

btnScanQr.style.display = currentRole === 'maintenance' ? 'none' : 'flex';
btnRaiseIssue.style.display = currentRole === 'maintenance' ? 'none' : 'flex';
btnSelfie.style.display = currentRole === 'driver' ? 'flex' : 'none';
btnMyHistory.style.display = currentRole === 'maintenance' ? 'none' : 'flex';
btnMaintLog.style.display = currentRole === 'maintenance' ? 'flex' : 'none';
btnLogHistory.style.display = currentRole === 'maintenance' ? 'flex' : 'none';

console.log('Maintenance:');
console.log('Scan QR:', btnScanQr.style.display);
console.log('Raise Issue:', btnRaiseIssue.style.display);
console.log('Start / Halt:', btnSelfie.style.display);
console.log('My History:', btnMyHistory.style.display);
console.log('Maint Log:', btnMaintLog.style.display);
console.log('Log History:', btnLogHistory.style.display);
