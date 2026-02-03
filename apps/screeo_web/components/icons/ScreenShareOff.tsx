export const ScreenShareOff = ({ className }: { className?: string }) => {
    return (
        <svg
            className={`${className}`}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="3" y="7" width="18" height="12" rx="2" />
            <line x1="4" y1="20" x2="20" y2="4" />
        </svg>
    );
};