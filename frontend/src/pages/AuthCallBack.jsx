import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthCallback()
{
    const [searchParams] = useSearchParams();
    const {exchangeCode} = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    useEffect(() =>{
        const code = searchParams.get('code');
        if(code)
        {
            exchangeCode(code).then(()=>navigate('/')
            ).catch(()=> setError('Login failed. Please try again.'));
        }
        else setError('No code provided. Please try logging in again.');
    }, []);

    if (error) return <div style={{padding:'80px 40px',color:'var(--red)'}}>{error}</div>;
    return <div style={{padding:'80px 40px',color:'var(--fg2)'}}>Authenticating...</div>;

}