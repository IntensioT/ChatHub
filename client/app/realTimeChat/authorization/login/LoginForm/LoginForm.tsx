import styles from './LoginForm.module.css'
import { MdOutlineAlternateEmail, MdOutlinePassword, MdOutlineVisibility, MdOutlineVisibilityOff } from "react-icons/md";
import { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/app/realTimeChat/lib/firebase';

import Link from 'next/link';



const LoginForm = () => {
    const passwordInputRef = useRef<HTMLInputElement>(null);
    const [passwordVisible, setPasswordVisible] = useState(false);

    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const { email, password } = Object.fromEntries(formData);

        try {
            await signInWithEmailAndPassword(auth, email.toString(), password.toString());
        } catch (err: any) {
            console.log(err);
            toast.error(err.message);
        } finally {
            setLoading(false);

        }
    }

    const togglePasswordVisibility = () => {
        console.log('Show password')
        setPasswordVisible(!passwordVisible);
        if (passwordInputRef.current) {
          passwordInputRef.current.type = passwordVisible ? "password" : "text";
        }
      };
      

    return (
        <div className={styles.wrapper}>

            <form onSubmit={handleLogin}>
                <h1>Login</h1>
                <div className={styles.inputBox}>
                    <input type="text" name='email' placeholder='Email' required />
                    <MdOutlineAlternateEmail className={styles.icon} />
                </div>

                <div className={styles.inputBox}>
                    <input type={passwordVisible ? "text" : "password" } name='password' placeholder='Password' required ref={passwordInputRef}/>
                    <MdOutlinePassword className={styles.icon} onClick={togglePasswordVisibility} />
                </div>

                <div className={styles.rememberForgot}>
                    <label><input type="checkbox" />Remember me</label>
                    <a href="#">Forgot password?</a>
                </div>

                <button className={styles.button} disabled={loading} type="submit"> {loading ? "Loading" : "Sign In"}</button>

                <div className={styles.registerLink}>
                    <p>Don&apos;t have account?
                        <Link href="/realTimeChat/authorization/password">
                            Registration
                        </Link>
                    </p>
                </div>
            </form>
        </div>
    )
}

export default LoginForm;
