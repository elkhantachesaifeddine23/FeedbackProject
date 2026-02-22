import { usePage } from '@inertiajs/react';

export default function ApplicationLogo(props) {
    return (
        <img 
            src="/images/logo_Luminea2.png" 
            alt="Luminea" 
            className={props.className || 'h-10 w-auto'}
            {...props}
        />
    );
}
