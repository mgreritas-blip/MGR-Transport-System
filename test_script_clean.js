    let currentCamMode = 'QR';
    let qrStatus = 'PENDING'; // PENDING, STARTED, CLOSED
    let selfieStatus = 'PENDING'; // PENDING, VERIFIED, CLOSED
    let currentRole = 'driver';
  
    function updateOverallStatus() {
      const qrEl = document.getElementById('status-qr');
      const slfEl = document.getElementById('status-selfie');
  
      // Update QR UI
      if (qrStatus === 'STARTED') { qrEl.textContent = 'QR: START'; qrEl.style.background = '#10B981'; } 
      else { qrEl.textContent = 'QR: CLOSE'; qrEl.style.background = '#EF4444'; }
  
      // Update Selfie UI
      if (selfieStatus === 'VERIFIED') { slfEl.textContent = 'SELFIE: START'; slfEl.style.background = '#10B981'; }
      else { slfEl.textContent = 'SELFIE: CLOSE'; slfEl.style.background = '#EF4444'; }
    }
  
    function selectRole(role) {
      currentRole = role;
      document.querySelectorAll('.role-card').forEach(c => c.classList.toggle('active', c.dataset.role === role));
      const users = { driver: 'Rajan Kumar', coordinator: 'Mani Ratnam', maintenance: 'Arvind Swamy' };
      document.getElementById('login-user').value = users[role];
    }
  
    function renderScreen(id) {
      document.querySelectorAll('.app-screen').forEach(s => s.classList.remove('active'));
      const scr = document.getElementById('screen-' + id);
      if(scr) scr.classList.add('active');
      if(id === 'history') loadHistory();
      
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      if(id === 'home') document.getElementById('nav-home')?.classList.add('active');
      if(id === 'profile') document.getElementById('nav-profile')?.classList.add('active');
      if(id === 'settings') document.getElementById('nav-settings')?.classList.add('active');
    }
  
    function confirmLogout() { 
      document.getElementById('logout-modal').style.display = 'flex'; 
    }
    
    function closeLogoutModal() { 
      document.getElementById('logout-modal').style.display = 'none'; 
    }
  
    function doLogin() {
      const userRoleText = { driver: 'Official DRIVER', coordinator: 'Transport COORDINATOR', maintenance: 'MAINTENANCE Staff' }[currentRole];
      const userName = document.getElementById('login-user').value;
      const userIcon = { driver: '👨‍✈️', coordinator: '📋', maintenance: '🔧' }[currentRole];
      
      document.getElementById('home-name').textContent = userName;
      document.getElementById('home-role').textContent = userRoleText;
      document.getElementById('home-icon').textContent = userIcon;
  
      // Button visibility based on role
      const btnScanQr = document.getElementById('btn-scan-qr');
      const btnRaiseIssue = document.getElementById('btn-raise-issue');
      const btnSelfie = document.getElementById('btn-selfie');
      const btnMyHistory = document.getElementById('btn-my-history');
      const btnMaintLog = document.getElementById('btn-maint-log');
      const btnLogHistory = document.getElementById('btn-log-history');
  
      if(btnScanQr) btnScanQr.style.display = currentRole === 'maintenance' ? 'none' : 'flex';
      if(btnRaiseIssue) btnRaiseIssue.style.display = currentRole === 'maintenance' ? 'none' : 'flex';
      if(btnSelfie) btnSelfie.style.display = currentRole === 'driver' ? 'flex' : 'none';
      if(btnMyHistory) btnMyHistory.style.display = currentRole === 'maintenance' ? 'none' : 'flex';
      if(btnMaintLog) btnMaintLog.style.display = currentRole === 'maintenance' ? 'flex' : 'none';
      if(btnLogHistory) btnLogHistory.style.display = currentRole === 'maintenance' ? 'flex' : 'none';
  
      if (document.getElementById('profile-name')) {
          document.getElementById('profile-name').textContent = userName;
          document.getElementById('profile-role').textContent = userRoleText;
          document.getElementById('settings-user-name').textContent = userName;
          document.getElementById('settings-role-badge').textContent = `CATEGORY: ${currentRole.toUpperCase()}`;
          renderProfileData(currentRole, userName);
      }
  
      document.getElementById('main-nav').classList.remove('hide');
      
      // Role detection UI changes
      const isDriver = currentRole === 'driver';
      
      const header = document.querySelector('.home-hdr');
      header.style.background = 'linear-gradient(135deg, #2563EB, #1E40AF)';
      document.getElementById('home-icon').style.borderColor = 'rgba(255,255,255,0.4)';
      document.getElementById('home-emp-id').textContent = 'EMP: STF-8930';
  
      // Toggle main columns
      document.querySelector('.dash-columns').classList.remove('hide');
      document.getElementById('driver-footer').classList.remove('hide');
      document.getElementById('hod-dashboard').classList.add('hide');
      
      // Hide Selfie/QR status for non-drivers
      document.getElementById('status-qr').classList.toggle('hide', !isDriver);
      document.getElementById('status-selfie').classList.toggle('hide', !isDriver);
      
      // renderHODData removed as role migrated
  
      renderScreen('home');
      initNotifs();
      
      // Ensure handlers are attached
      const closeBtn = document.getElementById('btn-close-trip');
      if(closeBtn) {
         closeBtn.onclick = (e) => { 
           console.log("Close Trip Clicked");
           e.preventDefault(); e.stopPropagation();
           closeTrip(); 
         };
      }
    }
  
    function initNotifs() {
      const list = document.getElementById('notif-list');
      const plans = [
        "1. Next Plan: Route 12 - Evening Pickup (16:30)",
        "2. Next Plan: Route 07 - Maintenance Duty",
        "3. Next Plan: Special Campus Shuttle - C Block"
      ];
      list.innerHTML = plans.map((p, idx) => `
        <div class="notif-card" style="pointer-events: auto;">
          <div class="notif-hdr">
            <img src="../MGR-ARI%20Logo%20,%20Letter%20Heads/Main%20logo.png" class="notif-logo">
            <span class="notif-brand">DR. MGR TRANSPORT</span>
          </div>
          <div class="notif-text">${p}</div>
          <div class="notif-actions">
            <button class="small-btn btn-acc" id="notif-acc-${idx}">Accept</button>
            <button class="small-btn btn-dec" id="notif-dec-${idx}">Decline</button>
          </div>
        </div>
      `).join('');
  
      // Attach listeners for notifications
      plans.forEach((p, idx) => {
         const acc = document.getElementById(`notif-acc-${idx}`);
         const dec = document.getElementById(`notif-dec-${idx}`);
         if(acc) acc.onclick = (e) => { 
            console.log("Accept Clicked:", p);
            e.preventDefault(); e.stopPropagation();
            notifAction('ACCEPTED', p); 
         };
         if(dec) dec.onclick = (e) => { 
            console.log("Decline Clicked:", p);
            e.preventDefault(); e.stopPropagation();
            notifAction('DECLINED', p); 
         };
      });
    }
  
    function notifAction(action, title) { 
      showModal(action, 'You have ' + action.toLowerCase() + ' the following assignment: "' + title + '". Details sent to coordinator.', [
        { lbl: 'CONTINUE', cls: 'btn-acc', fn: closeModal }
      ]);
    }
  
    function openCamera(mode) {
      currentCamMode = mode;
      document.getElementById('cam-overlay').style.display = 'flex';
      document.getElementById('cam-mask-qr').classList.toggle('hide', mode !== 'QR');
      document.getElementById('cam-mask-selfie').classList.toggle('hide', mode !== 'SELFIE');
      
      if (mode === 'QR') {
         document.getElementById('cam-title').textContent = (qrStatus === 'STARTED') ? "Close Attendance (QR Scan)" : "Initial Scan (Start Work)";
         document.getElementById('cam-hint').textContent = 'Align QR within frame';
      } else {
         document.getElementById('cam-title').textContent = (selfieStatus === 'VERIFIED') ? "Close/Hault Vehicle Verification" : "Vehicle Verification Selfie (Start)";
         document.getElementById('cam-hint').textContent = 'Include yourself & vehicle in frame';
      }
    }
  
    function closeCamera() { document.getElementById('cam-overlay').style.display = 'none'; }
  
    function shutterAction() {
      // Show scanning state
      document.getElementById('m-title').textContent = "Processing Record...";
      document.getElementById('m-body').innerHTML = `
        <div style="font-size:12px; text-align:left; color:var(--blue); font-weight:700;">
           <p>📍 Fetching live GPS...</p>
           <p>⏳ Encrypting Capture...</p>
           <p>📡 Syncing with Main DB & Admin...</p>
        </div>
      `;
      const box = document.getElementById('m-actions');
      box.innerHTML = '';
      document.getElementById('modal-wrap').style.display = 'flex';
      document.getElementById('cam-overlay').style.display = 'none';
  
      setTimeout(() => {
        let title = '';
        let isSelfie = currentCamMode === 'SELFIE';
        
        if (!isSelfie) {
          if (qrStatus !== 'STARTED') { qrStatus = 'STARTED'; title = 'Attendance Logged [START]'; } 
          else { qrStatus = 'CLOSED'; title = 'Duty Closed [END]'; }
        } else {
          if (selfieStatus !== 'VERIFIED') { selfieStatus = 'VERIFIED'; title = 'Selfie Verified [START]'; } 
          else { selfieStatus = 'CLOSED'; title = 'Selfie Verified [END]'; }
        }
        updateOverallStatus();
  
        showModal(title, '', [{ lbl: 'Acknowledge', cls: 'btn-acc', fn: closeModal }]);
        
        const bdy = document.getElementById('m-body');
        let detailsHTML = `
          <div style="text-align:left; font-size:11px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px; margin-bottom:15px; color:var(--gray-700);">
            <div style="display:grid; grid-template-columns:auto 1fr; gap:8px 12px; align-items:center;">
               <span style="font-size:16px;">📍</span> <div style="font-weight:700;">Geo-Coordinates:<br><span style="font-weight:500; font-family:monospace;">Lat: 13.0674 N, Lng: 80.2376 E</span></div>
               <span style="font-size:16px;">🕰️</span> <div style="font-weight:700;">Timestamp:<br><span style="font-weight:500;">${new Date().toLocaleString()}</span></div>
               <span style="font-size:16px;">📡</span> <div style="font-weight:700;">Data Sync:<br><span style="font-weight:500; color:var(--green);">✓ Saved to Central DB<br>✓ Sent to Route Coordinator<br>✓ Sent to Admin Dashboard</span></div>
            </div>
          </div>
        `;
  
        if (isSelfie) {
          detailsHTML = `
            <div style="margin-bottom:15px; border-radius:12px; overflow:hidden; border:2px solid #E5E7EB; max-height:140px;">
              <img src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=300&q=80" style="width:100%; height:160px; object-fit:cover; display:block;">
            </div>
          ` + detailsHTML;
        }
        
        bdy.innerHTML = detailsHTML;
  
      }, 2000);
    }
  
    function subIssue(type) {
      if(type === 'BREAKDOWN') {
        showModal('Vehicle Breakdown', 'Select specific issue type:', [
          { lbl: 'Puncture', cls: 'btn-dec', fn: () => sendIssue('Puncture') },
          { lbl: 'Low Pickup', cls: 'btn-dec', fn: () => sendIssue('Low Pickup') },
          { lbl: 'Others', cls: 'btn-acc', fn: () => promptOthers() }
        ]);
      } else if(type === 'ACCIDENT') {
        showModal('⚠️ ACCIDENT ALERT', 'Confirm Emergency Accident Alert? This will send your GPS location to Admin immediately.', [
          { lbl: 'CONFIRM & NOTIFY', cls: 'btn-acc', fn: () => { alert('GPS ALERT SENT TO ADMIN'); closeModal(); renderScreen('home'); } },
          { lbl: 'Cancel', cls: 'btn-dec', fn: closeModal }
        ]);
      } else if(type === 'OTHERS') {
        promptOthers();
      } else {
        sendIssue(type);
      }
    }
  
    function sendIssue(item) {
      closeModal();
      setTimeout(() => {
        showModal('Issue Reported', 'Issue "' + item + '" reported to admin successfully.', [
          { lbl: 'OK', cls: 'btn-acc', fn: () => { closeModal(); renderScreen('home'); } }
        ]);
      }, 50);
    }
  
    function promptOthers() {
      closeModal();
      setTimeout(() => {
        // In a real app this would be a text input, using a generic report for preview
        showModal('Other Issue', 'Report custom issue to the administration?', [
          { lbl: 'SEND REPORT', cls: 'btn-acc', fn: () => sendIssue('Custom Issue') },
          { lbl: 'Cancel', cls: 'btn-dec', fn: closeModal }
        ]);
      }, 50);
    }
  
    function triggerSOS() {
      const sosBtn = document.getElementById('btn-sos');
      showModal('SOS EMERGENCY', 'Are you sure you want to trigger the University Emergency Team?', [
        { lbl: 'TRIGGER NOW', cls: 'btn-acc', fn: () => { 
          closeModal();
          if(sosBtn) {
             sosBtn.classList.add('blinking');
             sosBtn.innerHTML = '<span class="sos-icon" style="background:var(--red); color:white;">ACTIVE</span> STOP EMERGENCY';
             sosBtn.onclick = stopSOS;
          }
          setTimeout(() => {
            showModal('SOS Sent', 'Emergency alert has been broadcasted to all admins and security personnel.', [
              { lbl: 'OK', cls: 'btn-dec', fn: closeModal }
            ]);
          }, 50);
        }},
        { lbl: 'Cancel', cls: 'btn-dec', fn: closeModal }
      ]);
    }
  
    function stopSOS() {
       const sosBtn = document.getElementById('btn-sos');
       if(sosBtn) {
          sosBtn.classList.remove('blinking');
          sosBtn.innerHTML = '<span class="sos-icon">SOS</span> TRIGGER SOS';
          sosBtn.onclick = triggerSOS;
       }
    }
  
    function closeTrip() {
      showModal('Close Trip', 'Are you sure you want to finalize and close the current session?', [
        { lbl: 'CLOSE TRIP', cls: 'btn-acc', fn: () => {
          qrStatus = 'CLOSED';
          selfieStatus = 'CLOSED';
          updateOverallStatus();
          
          // Update Trip Status UI after closing
          const tripBox = document.getElementById('trip-box');
          const tripName = document.getElementById('trip-name-text');
          const tripBtn = document.getElementById('btn-close-trip');
  
          if(tripBox) {
             tripBox.style.background = '#dcfce7'; // Light Green
             tripBox.style.borderColor = '#22c55e'; // Green
          }
          if(tripName) {
             tripName.textContent = "No Current Trip";
             tripName.style.color = "#15803d"; // Deep Green
          }
          if(tripBtn) {
             tripBtn.style.background = '#22c55e'; // Button to Green
             tripBtn.textContent = currentRole === 'driver' ? "Waiting for New Trip" : "Waiting for new task";
             tripBtn.style.fontSize = '12px';
             tripBtn.disabled = true; // Disable after closure for preview
             tripBtn.style.opacity = '1';
          }
          
          closeModal();
          setTimeout(() => {
            showModal('Trip Closed', 'The current trip and duty cycle have been closed successfully.', [
              { lbl: 'OK', cls: 'btn-dec', fn: closeModal }
            ]);
          }, 50);
        }},
        { lbl: 'Cancel', cls: 'btn-dec', fn: closeModal }
      ]);
    }
  
    function showModal(title, body, actions) {
      document.getElementById('m-title').textContent = title;
      document.getElementById('m-body').textContent = body;
      const box = document.getElementById('m-actions');
      box.innerHTML = '';
      actions.forEach(a => {
        const b = document.createElement('button');
        b.className = 'btn-main ' + a.cls;
        b.textContent = a.lbl;
        b.onclick = a.fn;
        b.style.marginBottom = '10px';
        box.appendChild(b);
      });
      document.getElementById('modal-wrap').style.display = 'flex';
    }
  
    function closeModal() { document.getElementById('modal-wrap').style.display = 'none'; }
  
    function renderProfileData(role, userName) {
      const container = document.getElementById('profile-details-container');
      const avatar = document.getElementById('profile-big-avatar');
      
      // Icons
      const icons = { driver: '👨‍✈️', coordinator: '📋', maintenance: '🔧' };
      if (avatar) avatar.textContent = icons[role];
      
      let html = '';
      
      // 1. Personal / Employee Info
      html += `
        <div style="background:white; border-radius:16px; padding:15px; box-shadow:0 2px 10px rgba(0,0,0,0.03); border:1px solid #f1f5f9;">
          <div style="font-size:11px; font-weight:800; color:var(--blue); margin-bottom:12px; display:flex; align-items:center; gap:6px;">
            <i style="opacity:0.8;">📋</i> EMPLOYEE DETAILS
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div><div style="font-size:9px; color:#64748b; font-weight:700; margin-bottom:2px;">EMP ID</div><div style="font-size:12px; font-weight:800; color:#1e293b;">STF-92${role === 'driver' ? '30' : role === 'coordinator' ? '41' : '55'}</div></div>
            <div><div style="font-size:9px; color:#64748b; font-weight:700; margin-bottom:2px;">NAME</div><div style="font-size:12px; font-weight:800; color:#1e293b;">${userName}</div></div>
            <div><div style="font-size:9px; color:#64748b; font-weight:700; margin-bottom:2px;">DEPARTMENT</div><div style="font-size:12px; font-weight:800; color:#1e293b;">Transport Ops</div></div>
            <div><div style="font-size:9px; color:#64748b; font-weight:700; margin-bottom:2px;">BLOOD GROUP</div><div style="font-size:12px; font-weight:800; color:#EF4444;">${role === 'driver' ? 'B+ Pos' : 'O- Neg'}</div></div>
          </div>
        </div>
      `;
  
      // 2. Role Specific Assignment Info
      if (role === 'driver') {
          html += `
            <div style="background:white; border-radius:16px; padding:15px; box-shadow:0 2px 10px rgba(0,0,0,0.03); border:1px solid #f1f5f9;">
              <div style="font-size:11px; font-weight:800; color:var(--blue); margin-bottom:12px; display:flex; align-items:center; gap:6px;">
                <i style="opacity:0.8;">🚌</i> CURRENT ASSIGNMENTS
              </div>
              <div style="background:#f8fafc; border-radius:8px; padding:10px; margin-bottom:12px; border:1px solid #e2e8f0;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                   <div style="font-size:9px; color:#64748b; font-weight:700;">DEFAULT ROUTE</div>
                   <div style="font-size:10px; font-weight:800; color:#10B981; background:#d1fae5; padding:2px 6px; border-radius:10px;">ACTIVE</div>
                </div>
                <div style="font-size:14px; font-weight:900; color:#1e293b; margin-top:4px;">Route 07 (Theni - Campus)</div>
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div><div style="font-size:9px; color:#64748b; font-weight:700; margin-bottom:2px;">VEHICLE REG</div><div style="font-size:12px; font-weight:800; color:#1e293b;">TN 45 XX 1234</div></div>
                <div><div style="font-size:9px; color:#64748b; font-weight:700; margin-bottom:2px;">SHIFT TYPE</div><div style="font-size:12px; font-weight:800; color:#1e293b;">Morning/Evening</div></div>
              </div>
            </div>
          `;
      } else if (role === 'coordinator') {
          html += `
            <div style="background:white; border-radius:16px; padding:15px; box-shadow:0 2px 10px rgba(0,0,0,0.03); border:1px solid #f1f5f9;">
              <div style="font-size:11px; font-weight:800; color:var(--blue); margin-bottom:12px; display:flex; align-items:center; gap:6px;">
                <i style="opacity:0.8;">📍</i> JURISDICTION
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div><div style="font-size:9px; color:#64748b; font-weight:700; margin-bottom:2px;">FLEET MGMT</div><div style="font-size:12px; font-weight:800; color:#1e293b;">Zone C (24 Buses)</div></div>
                <div><div style="font-size:9px; color:#64748b; font-weight:700; margin-bottom:2px;">REPORTING MGR</div><div style="font-size:12px; font-weight:800; color:#1e293b;">Dr. Ramkumar</div></div>
              </div>
            </div>
          `;
      } else if (role === 'maintenance') {
          html += `
            <div style="background:white; border-radius:16px; padding:15px; box-shadow:0 2px 10px rgba(0,0,0,0.03); border:1px solid #f1f5f9;">
              <div style="font-size:11px; font-weight:800; color:var(--blue); margin-bottom:12px; display:flex; align-items:center; gap:6px;">
                <i style="opacity:0.8;">🔧</i> CLEARANCE LEVEL
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div><div style="font-size:9px; color:#64748b; font-weight:700; margin-bottom:2px;">CERTIFICATION</div><div style="font-size:12px; font-weight:800; color:#1e293b;">L3 Heavy Motors</div></div>
                <div><div style="font-size:9px; color:#64748b; font-weight:700; margin-bottom:2px;">SHIFT</div><div style="font-size:12px; font-weight:800; color:#1e293b;">Night / On-Call</div></div>
              </div>
            </div>
          `;
      }
  
      // 3. Emergency Contact (always show)
      html += `
        <div style="background:white; border-radius:16px; padding:15px; box-shadow:0 2px 10px rgba(0,0,0,0.03); border:1px solid #f1f5f9;">
          <div style="font-size:11px; font-weight:800; color:var(--blue); margin-bottom:12px; display:flex; align-items:center; gap:6px;">
            <i style="opacity:0.8;">📞</i> EMERGENCY CONTACT
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div><div style="font-size:9px; color:#64748b; font-weight:700; margin-bottom:2px;">PRIMARY KIN</div><div style="font-size:12px; font-weight:800; color:#1e293b;">${role === 'driver' ? 'Meera R.' : 'Suja M.'}</div></div>
            <div><div style="font-size:9px; color:#64748b; font-weight:700; margin-bottom:2px;">CONTACT NO.</div><div style="font-size:12px; font-weight:800; color:#1e293b;">+91 94321 09876</div></div>
          </div>
        </div>
      `;
  
      if (container) {
         container.innerHTML = html;
      }
    }
  
    function loadHistory() {
      const list = document.getElementById('hist-list');
      list.innerHTML = `
        <div style="background:white; border-radius:12px; padding:15px; border:1px solid #eee; margin-bottom:10px;">
          <div style="font-weight:800; font-size:13px; margin-bottom:5px;">Route 07: Theni - Campus</div>
          <div style="font-size:11px; color:var(--gray-500);">24 Oct 2023 | 08:30 AM</div>
          <div style="color:var(--green); font-size:10px; font-weight:900; background:var(--green-l); padding:2px 8px; border-radius:4px; display:inline-block; margin-top:8px;">COMPLETED</div>
        </div>
        <div style="background:white; border-radius:12px; padding:15px; border:1px solid #eee; margin-bottom:10px;">
          <div style="font-weight:800; font-size:13px; margin-bottom:5px;">Route 12: Ambattur - Dr.MGR</div>
          <div style="font-size:11px; color:var(--gray-500);">22 Oct 2023 | 05:15 PM</div>
          <div style="color:var(--blue); font-size:10px; font-weight:900; background:var(--blue-l); padding:2px 8px; border-radius:4px; display:inline-block; margin-top:8px;">ONGOING</div>
        </div>
      `;
    }
  
    function exportHistory() {
      const label = document.getElementById('export-btn-label');
      const oldText = label.textContent;
      label.textContent = "GENERATING PDF...";
      label.style.color = "var(--amber)";
      
      setTimeout(() => {
          label.textContent = oldText;
          label.style.color = "var(--blue)";
          
          if (!window.jspdf) {
              alert('PDF library error, please try again.');
              return;
          }
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF();
          doc.setFont("helvetica", "bold");
          doc.setFontSize(18);
          doc.text("Dr. MGR Transport - Transit Log Report", 20, 20);
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.text("Staff: Rajan Kumar | ID: STF-8930", 20, 30);
          doc.text("Generated on: " + new Date().toLocaleString(), 20, 35);
          doc.line(20, 38, 190, 38);
          
          doc.text("1. Route 07 - Oct 24 - COMPLETED", 20, 48);
          doc.text("2. Route 12 - Oct 22 - LIVE", 20, 56);
          doc.text("3. Route 05 - Oct 21 - COMPLETED", 20, 64);
          
          doc.save("CTMS_Staff_Report.pdf");
          
          showModal('Export Succesful', 'University Travel History Report for October has been generated and saved to your device.', [
            { lbl: 'OK', cls: 'btn-acc', fn: closeModal }
          ]);
      }, 1200);
    }
  
    function filterStat(el, status) {
      document.querySelectorAll('#staff-status-filters .hist-tab').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
      
      document.querySelectorAll('#staff-hist-body tr').forEach(row => {
          if (status === 'ALL' || row.dataset.status === status) {
              row.style.display = '';
          } else {
              row.style.display = 'none';
          }
      });
    }
  
    function selTimeTab(el, mode) {
      document.querySelectorAll('#staff-time-filters .date-tab').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
      
      const dd = document.getElementById('period-dropdown');
      if (mode === 'W') {
          dd.innerHTML = '<option>Select Week: Oct 20-26, 2023</option><option>Oct 13-19, 2023</option><option>Oct 06-12, 2023</option>';
      } else if (mode === 'M') {
          dd.innerHTML = '<option>Select Month: October 2023</option><option>September 2023</option><option>August 2023</option>';
      } else {
          dd.innerHTML = '<option>Select Year: 2023-24</option><option>2022-23</option><option>2021-22</option>';
      }
    }
  
    function renderHODData() {
      const list = document.getElementById('absentee-list');
      const absentData = [
        { id: 'STU-101', name: 'Arun Kumar', bus: 'BUS-07', reason: 'QR Missed', color: '#F59E0B' },
        { id: 'STU-105', name: 'Sanjana Singh', bus: 'BUS-12', reason: 'Bus Breakdown', color: '#EF4444' },
        { id: 'STU-112', name: 'Vikram Seth', bus: 'BUS-03', reason: 'Medical', color: '#10B981' },
        { id: 'STU-128', name: 'Meera Nair', bus: 'BUS-07', reason: 'QR Missed', color: '#F59E0B' },
      ];
      
      if (list) {
        list.innerHTML = absentData.map(item => `
          <div class="absentee-tile">
            <div class="abs-info">
              <h4>${item.name} (${item.id})</h4>
              <p>Assigned Bus: ${item.bus}</p>
              <div class="abs-reason" style="color: ${item.color}">${item.reason} | Verify</div>
            </div>
            <button class="call-btn" onclick="alert('Calling Parent: +91 900001XXXX')">📞</button>
          </div>
        `).join('');
      }
  
      const vList = document.getElementById('hod-vehicle-list');
      if (vList) {
        const vehicles = [
          { id: 'BUS-07', route: 'Theni direct', status: 'LIVE', color: '#065F46', bg: '#D1FAE5' },
          { id: 'BUS-12', route: 'Ambattur via Avadi', status: 'SIGNAL LOSS', color: '#B45309', bg: '#FFFBEB' },
          { id: 'BUS-01', route: 'Koyambedu direct', status: 'BREAKDOWN', color: '#B91C1C', bg: '#FEE2E2' },
        ];
  
        vList.innerHTML = vehicles.map(v => `
          <div class="v-track-card">
            <div class="v-meta">
              <div class="v-name">${v.id} - ${v.route}</div>
              <div>Driver: Rajan Kumar | 42 Students</div>
            </div>
            <div class="v-status" style="color:${v.color}; background:${v.bg}">${v.status}</div>
          </div>
        `).join('');
      }
    }
  
    // Handle Auto-Login from URL Params
    window.onload = () => {
      const params = new URLSearchParams(window.location.search);
      const auto = params.get('auto');
      if (auto) {
        currentRole = auto;
        doLogin();
      }
    };
  </body>
  </html>
