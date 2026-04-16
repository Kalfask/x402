import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({children})
{
    const {accessToken, loading} = useAuth();

    if(loading) return <div className="loading">Loading...</div>;
    if(!accessToken) return <Navigate to='/' replace />;

    return children;
}