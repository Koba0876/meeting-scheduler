import React from 'react';
import Image from 'next/image';

export default function Logo({ className = "h-12 w-auto" }: { className?: string }) {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <Image
                src="/Logo_Transp.png"
                alt="Bait Society Logo"
                width={200}
                height={48}
                className="object-contain h-full w-auto"
                priority
            />
        </div>
    );
}
