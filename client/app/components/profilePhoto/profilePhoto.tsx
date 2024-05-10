import Image from "next/image";
import { useEffect, useState } from "react";

interface Props {
    src: string;
    width: number | `${number}`;
    height: number | `${number}`;
    alt: string;
    className: string | undefined;
}

export default function ProfilePhoto(props: Props) {
    const [profilePath, setProfilePath] = useState(
        props.src,
    );
    useEffect(() => {
        setProfilePath(props.src);
    }, [props]);
    
    return (
        <Image
            src={profilePath}
            width={props.width}
            height={props.height}
            alt={props.alt}
            className={props.className}
            onError={() => setProfilePath("/avatars/defaultProfile.jpeg")}
        />
    );
}
