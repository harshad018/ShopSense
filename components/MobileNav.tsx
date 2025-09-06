import React from 'react';

type Panel = 'images' | 'tools' | null;

interface MobileNavProps {
    onNavClick: (panel: Panel) => void;
    activePanel: Panel;
    highlightTools: boolean;
}

const NavButton: React.FC<{
    label: string;
    icon: string;
    isActive: boolean;
    onClick: () => void;
    highlight?: boolean;
}> = ({ label, icon, isActive, onClick, highlight = false }) => (
    <button
        onClick={onClick}
        className={`relative flex flex-col items-center justify-center gap-1 w-full h-full rounded-lg transition-colors ${
            isActive ? 'text-[var(--primary-color)]' : 'text-gray-400 hover:text-white'
        }`}
    >
        {highlight && (
            <span className="absolute top-2 right-1/2 translate-x-5 flex h-3 w-3 pointer-events-none">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary-color)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--primary-color)]"></span>
            </span>
        )}
        <span className="material-symbols-outlined">{icon}</span>
        <span className="text-xs font-medium">{label}</span>
    </button>
);

export const MobileNav: React.FC<MobileNavProps> = ({ onNavClick, activePanel, highlightTools }) => {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--dark-charcoal-gray)] border-t border-[var(--border-color)] flex items-center justify-around z-20 h-[calc(4.5rem+var(--safe-area-inset-bottom))] pb-[var(--safe-area-inset-bottom)]">
            <NavButton
                label="Images"
                icon="photo_library"
                isActive={activePanel === 'images'}
                onClick={() => onNavClick('images')}
            />
            <NavButton
                label="Workspace"
                icon="palette"
                isActive={activePanel === null}
                onClick={() => onNavClick(null)}
            />
            <NavButton
                label="Tools"
                icon="tune"
                isActive={activePanel === 'tools'}
                onClick={() => onNavClick('tools')}
                highlight={highlightTools}
            />
        </nav>
    );
};