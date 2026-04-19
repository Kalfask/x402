const API_BASE ='http://localhost:8080';

export async function apiFetch(path, option={}, accessToken, refreshFn)
{
    const headers = {
        'Content-Type': 'application/json',
        ...option.headers,
    };
    if(accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    let res = await fetch(`${API_BASE}${path}`, { ...option, headers });
    if(res.status ===401 && refreshFn)
    {
        const newToken = await refreshFn();
        if(newToken)
        {
            headers['Authorization'] = `Bearer ${newToken}`;
            res = await fetch(`${API_BASE}${path}`, { ...option, headers });
        }
    }
    return res.json();
}; 

export const getMarketplace = (search, category) =>{
    const params = new URLSearchParams();
    if(search) params.set('search', search);
    if(category) params.set('category', category);
    return apiFetch(`/api/marketplace?${params}`);
};

export const getApiDetail = (id) => apiFetch(`/api/marketplace/${id}`);

export const getMyApis = (accessToken, refreshFn) => apiFetch('/api/provider/apis/mine', {}, accessToken, refreshFn);

export const createApi = (apiData, accessToken, refreshFn) => apiFetch('/api/provider/apis', {
    method: 'POST',
    body: JSON.stringify(apiData)
}, accessToken, refreshFn);



export const updateApi = (apiId, data, token, refresh) =>
  apiFetch(`/api/provider/apis/${apiId}`, {
    method: 'PUT', body: JSON.stringify(data)
  }, token, refresh);

export const deleteEndpoint = ( endpointId, token, refresh) =>
  apiFetch(`/api/provider/endpoints/${endpointId}`, {
    method: 'DELETE'
  }, token, refresh);

export const addEndpoint = (apiId, endpointData, accessToken, refreshFn) => apiFetch(`/api/provider/apis/${apiId}/endpoints`, {
    method: 'POST',
    body: JSON.stringify(endpointData)
}, accessToken, refreshFn);

export const updateApiStatus = (apiId, status, accessToken, refreshFn) => apiFetch(`/api/provider/apis/${apiId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
}, accessToken, refreshFn);

// === Payment / Usage ===
export const getMyUsage = (token, refresh) =>
 apiFetch('/api/pay/usage/me', {}, token, refresh);
export const getMyEarnings = (token, refresh) =>
 apiFetch('/api/pay/earnings/me', {}, token, refresh);
// === Wallet ===
export const updateWallet = (walletAddress, token, refresh) =>
 apiFetch('/api/auth/wallet', {
 method: 'PATCH', body: JSON.stringify({ walletAddress })
 }, token, refresh);

 // Add these to your api.js

export const getMyKeys = (token, refresh) =>
  apiFetch('/api/auth/keys', {}, token, refresh);

export const createApiKey = (name, token, refresh) =>
  apiFetch('/api/auth/keys', {
    method: 'POST', body: JSON.stringify({ name })
  }, token, refresh);

export const deactivateKey = (keyId, token, refresh) =>
  apiFetch(`/api/auth/keys/${keyId}`, {
    method: 'DELETE'
  }, token, refresh);


