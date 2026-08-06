import { useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const { user, googleLogin } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate("/");
        }
    }, [user, navigate]);

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            // credentialResponse.credential contains the ID Token
            await googleLogin(credentialResponse.credential);
            navigate("/");
        } catch (error) {
            console.error("Google authentication failed", error);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '70vh',
        }}>
            <div style={{
                background: '#121214',
                border: '1px solid #2a2a2e',
                borderRadius: '16px',
                padding: '40px',
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
                <h2 style={{ color: '#fff', marginBottom: '8px' }}>Welcome Back</h2>
                <p style={{ color: '#888', marginBottom: '24px' }}>Sign in to continue to Anime Tracker</p>
                
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => console.log('Login Failed')}
                        theme="filled_black"
                        shape="pill"
                        size="large"
                        width="250"
                    />
                </div>
            </div>
        </div>
    );
}