import io from 'socket.io-client';

const API_BASE_URL = 'http://localhost:3000';

export const socket = io(API_BASE_URL);

export const fetchVehicles = async () => {
  const response = await fetch(`${API_BASE_URL}/api/vehicles`);
  if (!response.ok) throw new Error('Failed to fetch vehicles');
  return response.json();
};

export const fetchUsers = async (role) => {
  const url = role ? `${API_BASE_URL}/api/users?role=${role}` : `${API_BASE_URL}/api/users`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
};

export const fetchIssues = async () => {
  const response = await fetch(`${API_BASE_URL}/api/issues`);
  if (!response.ok) throw new Error('Failed to fetch issues');
  return response.json();
};

export const createVehicle = async (data) => {
  const response = await fetch(`${API_BASE_URL}/api/vehicles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const createUser = async (data) => {
  const response = await fetch(`${API_BASE_URL}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

// ── Vehicle Member Management ─────────────────────────────────────────────────

export const fetchVehicleMembers = async (vehicleId) => {
  const res = await fetch(`${API_BASE_URL}/api/vehicles/${vehicleId}/members`);
  if (!res.ok) throw new Error('Failed to fetch vehicle members');
  return res.json();
};

export const assignVehicleMembers = async (vehicleId, { studentIds, coordinatorIds, driverId, adminName }) => {
  const res = await fetch(`${API_BASE_URL}/api/vehicles/${vehicleId}/assign-members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentIds, coordinatorIds, driverId, adminName: adminName || 'Super Admin' }),
  });
  return res.json();
};

export const removeVehicleMember = async (vehicleId, type, memberId) => {
  const res = await fetch(`${API_BASE_URL}/api/vehicles/${vehicleId}/members/${type}/${memberId}`, {
    method: 'DELETE',
  });
  return res.json();
};

export const fetchVehicleMemberAudit = async (vehicleId) => {
  const res = await fetch(`${API_BASE_URL}/api/vehicles/${vehicleId}/audit`);
  if (!res.ok) throw new Error('Failed to fetch audit log');
  return res.json();
};

export const updateVehicle = async (vehicleId, data) => {
  const res = await fetch(`${API_BASE_URL}/api/vehicles/${vehicleId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
};

