import { ReactElement, MouseEvent } from "react";


const colorVariants = {
    purple: "bg-[#735cdd] text-white font-bold",
    yellow: "bg-[#efcb68] text-black font-bold",
    white: "bg-[#eaf2ef] text-black font-bold"
}

const sizeVariants = {
    small: "p-1",
    medium: "p-2 text-lg",
    large: "p-2 text-xl"
}

const hoverVariants = {
    // purple hover effects variants:
    purple_1: "hover:text-[#735cdd] hover:bg-black border border-3 border-[#735cdd]",
    purple_2: "hover:scale-105",
    
    // yellow hover effects variants:
    yellow_1: "hover:text-[#efcb68] hover:bg-[#000411] border border-3 border-[#efcb68]",
    yellow_2: "hover:scale-105",

    // white hover effects variants:
    white_1: "hover:text-white hover:bg-black border border-3 border-white",
    white_2: "hover:scale-105"
}

const defaultButtonStyles = "flex items-center rounded-xl cursor-pointer transition-all duration-300";

const disabledStyles = "";

interface ButtonProps {
    colorVariant: keyof typeof colorVariants;
    sizeVariant: keyof typeof sizeVariants;
    hoverVariant?: keyof typeof hoverVariants;
    text: string;
    onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
    startIcon?: ReactElement;
    endIcon?: ReactElement;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    className?: string;
}

export const Button = ({
    colorVariant,
    sizeVariant,
    hoverVariant,
    text,
    onClick,
    startIcon,
    endIcon,
    disabled = false,
    type = "button",
    className = ""
}: ButtonProps) => {
    return (
        <button
            type={type}
            className={`
                ${defaultButtonStyles}
                ${colorVariants[colorVariant]}
                ${sizeVariants[sizeVariant]}
                ${hoverVariant ? hoverVariants[hoverVariant] : ''}
                ${disabled ? disabledStyles : ''}
                ${className}
            `}
            onClick={onClick}
            disabled={disabled}
        >
            {startIcon && (
                <div className="mr-1">
                    {startIcon}
                </div>
            )}
            {text}
            {endIcon && (
                <div className="ml-1">
                    {endIcon}
                </div>
            )}
        </button>
    );
};