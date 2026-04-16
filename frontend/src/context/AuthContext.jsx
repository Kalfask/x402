import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({children})
{
    const [accessToken, setAccessToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);

    const API = 'http://localhost:8080';

    const login =()=> 
    {
        window.location.href = `${API}/oauth2/authorization/github`;

    }

    const logout =() =>
    {
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
    }  
    const exchangeCode = async (code) =>{
        const res = await fetch(`${API}/api/auth/exchange`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({code})
        });
        const data = await res.json();
        if(data.success || data.data)
        {
            setAccessToken(data.data.accessToken);
            setRefreshToken(data.data.refreshToken);
            await fetchUser(data.data.accessToken);
        }
        return data;
    };

    const fetchUser = async (token) =>{
        const res = await fetch(`${API}/api/auth/me`, {
            headers: {'Authorization': `Bearer ${token}`},
    });
        const data = await res.json();
        if(data.data) setUser(data.data);
    };

    const refresh = useCallback(async () =>{
        if(!refreshToken) return null;
        const res = await fetch(`${API}/api/auth/refresh`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({refreshToken})
        });
        const data = await res.json();
        if(data.data?.accessToken)
        {
            setAccessToken(data.data.accessToken);
            return data.data.accessToken;
        }
        logout();
        return null;
    }, [refreshToken]);

    const value = {
        accessToken,
        refreshToken,
        user,
        loading,
        login,
        logout,
        exchangeCode,
        refresh,
        fetchUser,
        API,
    };
    return (<AuthContext.Provider value={value}>{children}</AuthContext.Provider>);
}

export function useAuth(){

    const context = useContext(AuthContext);
    if(!context) throw new Error('useAuth must be used within AuthProvider');
    return context;

} 