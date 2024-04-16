'use client'

import Link from 'next/link';
import { useState, useEffect, useContext } from 'react';
import { usePathname } from 'next/navigation';

import styles from './navbar.module.css';
import { AiOutlineMenu, AiOutlineHome } from "react-icons/ai";
import { SlSocialVkontakte } from "react-icons/sl";
import { LiaTelegram } from "react-icons/lia";
import { BsChatSquareHeart } from "react-icons/bs";
import { AuthStageContext } from '@/app/telegram/contexts/AuthContext';

// TODO: Time dependent drop-down
export default function SideNav() {
    let container = null;
    if (typeof window !== 'undefined') {
        container = document.getElementById('container');
      }
    let telegramIsLogged = false;
    const { authStage } = useContext(AuthStageContext);
    // console.log('Auth stage in SideNav:', authStage);


    const [sidebarActive, setSidebarActive] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const toggleBtn = document.querySelector('.toggleBtn');

        const handleClick = () => {
            setSidebarActive(!sidebarActive);
            if (sidebarActive === false && container) {
                container.style.marginLeft = '10%';
              } else if (container) {
                container.style.marginLeft = '0';
              }
        };

        if (toggleBtn) {
            toggleBtn.addEventListener('click', handleClick);
        }

        return () => {
            if (toggleBtn) {
                toggleBtn.removeEventListener('click', handleClick);
            }
        };
    }, [sidebarActive]);

    const getActiveClass = (path: string) => {
        authStage === 'telegramLogged' ? telegramIsLogged : true;
        return pathname === path ? styles.listItemActive : '';
    };

    return (
        <nav className={`${styles.sidebar} ${sidebarActive ? styles.active : ''}`}>
            <div className={styles.logoMenu}>
                <h2 className={styles.logo}> ChatHUB</h2>
                <AiOutlineMenu className={`${styles.menuToggleBtn} toggleBtn`} />
            </div>
            <ul className={styles.list}>

                <li className={`${styles.listItem} ${getActiveClass('/')}`}>
                    <Link href="/">
                        <AiOutlineHome className={styles.listItemIcon} />
                        <span className={styles.linkName}> Home</span>
                    </Link>
                </li>

                <li className={`${styles.listItem} ${getActiveClass(`/telegram/authorization/${authStage}`)} ${getActiveClass(`/telegram`)}`}>
                    {authStage === 'login' && (
                        <Link href='/telegram/authorization/login'>
                            <LiaTelegram className={styles.listItemIcon} />
                            <span className={styles.linkName}>Telegram Login</span>
                        </Link>
                    )}
                    {authStage === 'verification' && (
                        <Link href="/telegram/authorization/verification">
                            <LiaTelegram className={styles.listItemIcon} />
                            <span className={styles.linkName}>Telegram Verification</span>
                        </Link>
                    )}
                    {authStage === 'password' && (
                        <Link href="/telegram/authorization/password">
                            <LiaTelegram className={styles.listItemIcon} />
                            <span className={styles.linkName}>Telegram Password</span>
                        </Link>
                    )}
                    {authStage === 'telegramLogged' && (
                        <Link href="/telegram">
                            <LiaTelegram className={styles.listItemIcon} />
                            <span className={styles.linkName}>Telegram Dialogs</span>
                        </Link>
                    )}
                </li>

                <li className={`${styles.listItem} ${getActiveClass('/vkontakte')}`}>
                    <Link href="/vkontakte">
                        <SlSocialVkontakte className={styles.listItemIcon} />
                        <span className={styles.linkName}>VK</span>
                    </Link>
                </li>

                <li className={`${styles.listItem} ${getActiveClass('/vkontakte')}`}>
                    <Link href="/vkontakte">
                        <SlSocialVkontakte className={styles.listItemIcon} />
                        <span className={styles.linkName}>VK Login</span>
                    </Link>
                </li>

                <li className={`${styles.listItem} ${getActiveClass('/vkontakte')}`}>
                    <Link href="/vkontakte">
                        <SlSocialVkontakte className={styles.listItemIcon} />
                        <span className={styles.linkName}>VK Verification</span>
                    </Link>
                </li>

                <li className={`${styles.listItem} ${getActiveClass('/realTimeChat')}`}>
                    <Link href="/realTimeChat">
                        <BsChatSquareHeart className={styles.listItemIcon} />
                        <span className={styles.linkName}> Real Time Chat</span>
                    </Link>
                </li>
            </ul>
        </nav>

    );

};
