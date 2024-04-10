import "./LoginForm.css"
import { BsFillTelephoneFill } from "react-icons/bs";
import { info } from "console";
import { useState } from 'react';

const LoginForm = () => {
    const [phoneNumber, setPhoneNumber] = useState('');

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        try {
            const response = await fetch(`http://localhost:5041/api/v1.0/telegram/login?info=${phoneNumber}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });
    
            if (!response.ok) {
                throw new Error("Unable to login");
            }
    
            const data = await response.json();
            console.log(data);
        } catch (error) {
            console.log(error);
        }
    }
    
    
    return (
        <div className="wrapper" >
            <form action="" onSubmit={handleSubmit}>
                <h1>Login</h1>
                <div className="input-box">
                    <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder='Phone-Number' required />
                    <BsFillTelephoneFill className="icon" />
                </div>
                <div className="remember-forgot">
                    <label><input type="checkbox" />Remember me</label>
                    <a href="#">Forgot phone?</a>
                </div>

                <button type="submit">NEXT</button>

                <div className="register-link">
                    <p>Don&apos;t have Telegram account? <a href="#">Registration</a></p>
                </div>
            </form>
        </div>
    )
}

export default LoginForm;
